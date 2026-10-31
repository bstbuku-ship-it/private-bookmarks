/*
 * 共享数据层（v3）：弹窗页、展开页、后台 service worker 都用它。
 *
 * 安全设计
 *   - 书签库整体用 AES-256-GCM 加密后才写入 chrome.storage.local（键名 vaultE），磁盘上看不到任何网址。
 *   - 加密密钥（DEK）是随机生成的 256 位；它被“密码派生出的密钥”（PBKDF2-SHA256，100 万次迭代，随机盐）再加密保存。
 *     只有输入正确密码才能解出 DEK，所以改密码不需要重新加密整个库。
 *   - 解锁后 DEK 只在页面内存里；如果设置了“解锁后 N 分钟再上锁”，DEK 会放进 chrome.storage.session
 *     （只存在内存，不写磁盘，浏览器关闭即清除，到时间也会被清掉）。
 *   - 备份文件就是这份加密数据的拷贝，同样需要“备份当时的密码”才能打开。
 *
 * 解密后的库：{ v:3, folders:[{id,name,parentId|null}], items:[{id,title,url,folderId|null,addedAt,legacy?}] }
 *   folderId / parentId 为 null 表示在最外层（不分类）。legacy 表示旧版从浏览器自动导入的书签。
 *
 * 旧版（1.0 / 2.x）的明文数据会在第一次输入正确密码时自动迁移成加密格式。
 */
(function (root) {
  'use strict';

  const BLOB = 'vaultE';
  const SETTINGS = 'settings';
  const SESSION = 'unlock';
  const LEG_VAULT = 'vault';
  const LEG_LIST = 'privateBookmarks';
  const LEG_PIN = 'vaultPin';
  const LEG_AUTH = 'auth';
  const ITER = 1000000;
  // AAD 里的 /3 是加密库格式版本，与扩展版本号无关；扩展改版时不要改它，否则旧库解不开。
  const AAD = new TextEncoder().encode('private-bookmarks/3');

  const enc = new TextEncoder();
  const dec = new TextDecoder();
  // 优先用密码学安全的随机 UUID；旧环境退回原来的时间戳 + 随机后缀（ID 只是本地标识，不是密钥）。
  const uid = () => (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
  const get = (keys) => chrome.storage.local.get(keys);
  const set = (obj) => chrome.storage.local.set(obj);
  const rand = (n) => crypto.getRandomValues(new Uint8Array(n));

  function b64(buf) {
    const u = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return btoa(s);
  }
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

  // ---- 输入形状校验（防损坏/篡改数据导致长时间 PBKDF2 或崩溃）----
  // 迭代次数上限：本插件新数据用 100 万次；高于 200 万次一律拒绝，避免备份/存储里的
  // 恶意 iter 让解锁卡死。合法的旧版 iter 远低于此上限。
  const MAX_ITER = 2000000;
  const validIter = (iter) => Number.isFinite(iter) && iter >= 1 && iter <= MAX_ITER;
  // 严格 base64 解码：非法字符串 / 长度超出范围返回 null，不抛错。
  const decodeB64 = (s, minLen, maxLen) => {
    if (typeof s !== 'string' || !s) return null;
    try {
      const bytes = unb64(s);
      if (bytes.length < minLen || bytes.length > maxLen) return null;
      return bytes;
    } catch (_) { return null; }
  };
  // 只接受 http/https 书签：javascript:/data:/file:/chrome: 等一律不进库，
  // 避免导入的备份里藏一条点开就能执行/打开本地内容的记录。
  const isWebUrl = (url) => {
    if (typeof url !== 'string') return false;
    try {
      const u = new URL(url.trim());
      return (u.protocol === 'http:' || u.protocol === 'https:') && !u.username && !u.password && !/\s/.test(url);
    } catch (_) { return false; }
  };
  // 定长比较：长度不同也走完比较循环，不提前按首字符返回。
  const sameString = (a, b) => {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    let diff = a.length ^ b.length;
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    return diff === 0;
  };

  /* ---------------- 加密原语 ---------------- */

  async function kekFrom(pw, salt, iter) {
    const base = await crypto.subtle.importKey('raw', enc.encode(String(pw).normalize('NFKC')), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  const params = (iv) => ({ name: 'AES-GCM', iv, additionalData: AAD });
  const seal = async (key, bytes) => {
    const iv = rand(12);
    return { iv: b64(iv), ct: b64(await crypto.subtle.encrypt(params(iv), key, bytes)) };
  };
  const open = async (key, iv, ct) => new Uint8Array(await crypto.subtle.decrypt(params(unb64(iv)), key, unb64(ct)));
  const dekFrom = (raw) => crypto.subtle.importKey('raw', raw, 'AES-GCM', true, ['encrypt', 'decrypt']);

  // 用密码给 DEK 加一层壳
  async function wrapDek(pw, raw) {
    const salt = rand(16);
    const k = await kekFrom(pw, salt, ITER);
    const w = await seal(k, raw);
    return { iter: ITER, salt: b64(salt), wrapIv: w.iv, wrapped: w.ct };
  }

  /* ---------------- 当前会话里的密钥 ---------------- */

  let ctx = null; // { key, raw }

  const isUnlocked = () => !!ctx;

  async function adopt(raw) {
    ctx = { raw, key: await dekFrom(raw) };
  }

  /* ---------------- 状态 / 初始化 ---------------- */

  async function hasPassword() {
    const r = await get([BLOB, LEG_AUTH, LEG_PIN]);
    return !!(r[BLOB] || r[LEG_AUTH] || r[LEG_PIN]);
  }

  // 解密后的库只接受形状正确的记录：字段类型不对、ID 重复、父文件夹不存在或
  // 自指、非 http/https 的网址一律在读入时修掉/丢掉，避免损坏数据让界面崩溃，
  // 也避免旧的危险 scheme 记录在新版本里继续存在。只影响内存里的副本，磁盘
  // 上的加密数据要到下一次保存时才会被改写。
  function normalize(v) {
    const out = { v: 3, folders: [], items: [] };
    const folderIds = new Set();
    if (v && Array.isArray(v.folders)) {
      for (const f of v.folders) {
        if (!f || typeof f !== 'object' || typeof f.id !== 'string' || !f.id || folderIds.has(f.id)) continue;
        folderIds.add(f.id);
        out.folders.push({ id: f.id, name: typeof f.name === 'string' ? f.name : '', parentId: typeof f.parentId === 'string' ? f.parentId : null });
      }
      for (const f of out.folders) {
        if (f.parentId !== null && (!folderIds.has(f.parentId) || f.parentId === f.id)) f.parentId = null;
      }
      // 父链成环（A→B→A）时断开：只修内存副本，避免界面按父链回溯时陷入循环。
      for (const f of out.folders) {
        const seen = new Set([f.id]);
        let cur = f;
        while (cur.parentId !== null) {
          if (seen.has(cur.parentId)) { f.parentId = null; break; }
          seen.add(cur.parentId);
          const next = out.folders.find((x) => x.id === cur.parentId);
          if (!next) break;
          cur = next;
        }
      }
    }
    const itemIds = new Set();
    if (v && Array.isArray(v.items)) {
      for (const i of v.items) {
        if (!i || typeof i !== 'object' || typeof i.id !== 'string' || !i.id || itemIds.has(i.id)) continue;
        itemIds.add(i.id);
        const url = typeof i.url === 'string' ? i.url.trim() : '';
        if (!isWebUrl(url)) continue;
        const it = {
          id: i.id,
          title: typeof i.title === 'string' ? i.title : url,
          url,
          folderId: typeof i.folderId === 'string' && folderIds.has(i.folderId) ? i.folderId : null,
          addedAt: Number.isFinite(Number(i.addedAt)) ? Number(i.addedAt) : Date.now(),
        };
        if (i.legacy) it.legacy = true;
        out.items.push(it);
      }
    }
    return out;
  }

  async function writeBlob(wrap, vault) {
    const body = await seal(ctx.key, enc.encode(JSON.stringify(vault)));
    await set({ [BLOB]: { v: 3, ...wrap, iv: body.iv, ct: body.ct } });
  }

  /** 首次设置密码：生成随机 DEK，用密码包起来，写入（可带初始数据）。 */
  async function setup(pw, vault) {
    if (typeof pw !== 'string' || pw.length < 8) throw new Error('密码至少 8 位');
    const raw = rand(32);
    await adopt(raw);
    const wrap = await wrapDek(pw, raw);
    await writeBlob(wrap, normalize(vault || {}));
  }

  /* ---------------- 旧版迁移 ---------------- */

  async function legacyVerify(pw, r) {
    const a = r[LEG_AUTH];
    if (a) {
      // 旧版哈希的编码方式（不做 NFKC 归一）保持原样：改动会让旧密码无法迁移。
      // 只加形状校验，损坏/篡改的记录直接判为密码错误，不让它触发超大迭代。
      const salt = decodeB64(a.salt, 8, 64);
      if (!salt || !validIter(a.iter) || typeof a.hash !== 'string' || !a.hash) return false;
      const base = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: a.iter, hash: 'SHA-256' }, base, 256);
      return sameString(b64(bits), a.hash);
    }
    // 旧版明文 PIN：改用定长比较；迁移成功后这条记录会被删除。
    if (r[LEG_PIN]) return sameString(String(r[LEG_PIN]), String(pw));
    return false;
  }

  const DEFAULT_ROOTS = new Set(['书签栏', '其他书签', '移动设备书签', 'Bookmarks bar', 'Other bookmarks', 'Mobile bookmarks']);

  // 旧库 → v3：浏览器自动导入的书签打上 legacy 标记（之后可以一键移出）；空的默认顶层文件夹去掉。
  // 旧数据形状不可信：非对象条目直接跳过，避免损坏数据让迁移崩溃、密码正确却进不去。
  function fromLegacy(r) {
    const old = r[LEG_VAULT];
    const vault = { v: 3, folders: [], items: [] };
    if (old && Array.isArray(old.items)) {
      vault.folders = (old.folders || []).filter((f) => f && typeof f === 'object').map((f) => ({ id: typeof f.id === 'string' ? f.id : uid(), name: typeof f.name === 'string' ? f.name : '', parentId: typeof f.parentId === 'string' ? f.parentId : null, ...(f.chromeId ? { fromBrowser: true } : {}) }));
      vault.items = old.items.filter((i) => i && typeof i === 'object' && isWebUrl(i.url)).map((i) => {
        const it = { id: typeof i.id === 'string' && i.id ? i.id : uid(), title: typeof i.title === 'string' && i.title ? i.title : String(i.url).trim(), url: String(i.url).trim(), folderId: typeof i.folderId === 'string' ? i.folderId : null, addedAt: Number.isFinite(Number(i.addedAt)) ? Number(i.addedAt) : Date.now() };
        if (i.chromeId) it.legacy = true;
        return it;
      });
      const used = new Set(vault.items.map((i) => i.folderId));
      const kids = new Map();
      vault.folders.forEach((f) => { const k = f.parentId || ''; if (!kids.has(k)) kids.set(k, []); kids.get(k).push(f); });
      const hasItems = (id, depth = 0) => depth < 64 && (used.has(id) || (kids.get(id) || []).some((c) => hasItems(c.id, depth + 1)));
      vault.folders = vault.folders.filter((f) => !(f.parentId === null && f.fromBrowser && DEFAULT_ROOTS.has(f.name) && !hasItems(f.id)) && !(f.parentId === null && DEFAULT_ROOTS.has(f.name) && !hasItems(f.id) && !(kids.get(f.id) || []).length));
      vault.folders.forEach((f) => delete f.fromBrowser);
      const ids = new Set(vault.folders.map((f) => f.id));
      vault.folders.forEach((f) => { if (f.parentId && !ids.has(f.parentId)) f.parentId = null; });
      vault.items.forEach((i) => { if (i.folderId && !ids.has(i.folderId)) i.folderId = null; });
    } else if (Array.isArray(r[LEG_LIST])) {
      vault.items = r[LEG_LIST].filter((b) => b && isWebUrl(b.url)).map((b) => ({ id: uid(), title: b.title || b.url, url: String(b.url).trim(), folderId: null, addedAt: Date.now() }));
    }
    return vault;
  }

  /* ---------------- 解锁 / 上锁 ---------------- */

  /** 输入密码解锁。返回 true / false（密码错误）。旧版明文数据会在这里自动迁移加密。 */
  async function unlock(pw) {
    const r = await get([BLOB, LEG_VAULT, LEG_LIST, LEG_AUTH, LEG_PIN]);
    const b = r[BLOB];
    if (b) {
      try {
        const salt = decodeB64(b.salt, 8, 64);
        const wrapIv = decodeB64(b.wrapIv, 1, 32);
        const wrapped = decodeB64(b.wrapped, 1, 256);
        const iv = decodeB64(b.iv, 1, 32);
        const ct = decodeB64(b.ct, 1, 20000000);
        if (!salt || !wrapIv || !wrapped || !iv || !ct || !validIter(b.iter)) return false;
        const k = await kekFrom(pw, salt, b.iter);
        const raw = await open(k, b.wrapIv, b.wrapped);
        await adopt(raw);
        await open(ctx.key, b.iv, b.ct); // 确认数据确实能解开
        return true;
      } catch (_) {
        ctx = null;
        return false;
      }
    }
    if (!(await legacyVerify(pw, r))) return false;

    const vault = fromLegacy(r);
    await setup(pw, vault);
    const back = await load(); // 读回来核对，没问题才删除旧的明文数据
    if (back.items.length !== vault.items.length || back.folders.length !== vault.folders.length) {
      await chrome.storage.local.remove(BLOB);
      ctx = null;
      throw new Error('升级加密时校验失败，旧数据没有改动');
    }
    await chrome.storage.local.remove([LEG_VAULT, LEG_LIST, LEG_AUTH, LEG_PIN]);
    return true;
  }

  async function load() {
    if (!ctx) throw new Error('尚未解锁');
    const b = (await get(BLOB))[BLOB];
    if (!b) throw new Error('私密库不存在（可能已被重置）');
    return normalize(JSON.parse(dec.decode(await open(ctx.key, b.iv, b.ct))));
  }

  async function save(vault) {
    if (!ctx) throw new Error('尚未解锁');
    // 存储上限防御：chrome.storage.local 约 10MB，密文 base64 后比明文大约 1.37 倍。
    // 明文超过 6MB 就先拒绝，避免写一半失败、内存与磁盘不一致。
    if (enc.encode(JSON.stringify(vault)).length > 6000000) throw new Error('书签库已接近浏览器存储上限，请先导出备份并清理');
    const cur = (await get(BLOB))[BLOB];
    if (!cur) throw new Error('私密库不存在（可能已被重置），请重新打开');
    // 沿用磁盘上最新的密码外壳：别的页面刚改过密码时，不会被这里的旧数据盖回去
    const wrap = { iter: cur.iter, salt: cur.salt, wrapIv: cur.wrapIv, wrapped: cur.wrapped };
    await writeBlob(wrap, { v: 3, folders: vault.folders, items: vault.items });
  }

  async function changePassword(oldPw, newPw) {
    if (typeof newPw !== 'string' || newPw.length < 8) return false;
    const b = (await get(BLOB))[BLOB];
    if (!b || typeof b !== 'object') return false;
    const salt = decodeB64(b.salt, 8, 64);
    if (!salt || !validIter(b.iter) || typeof b.wrapIv !== 'string' || typeof b.wrapped !== 'string') return false;
    let raw;
    try {
      const k = await kekFrom(oldPw, salt, b.iter);
      raw = await open(k, b.wrapIv, b.wrapped);
    } catch (_) { return false; }
    const wrap = await wrapDek(newPw, raw);
    await set({ [BLOB]: { ...b, ...wrap } });
    // 改密码后，之前放进会话/交接里的密钥一律作废：其它已打开的页面需要重新输入新密码。
    // 当前页面靠内存里的 ctx 继续工作，不受影响。
    try { await chrome.storage.session.remove([SESSION, 'handoff']); } catch (_) { /* 无所谓 */ }
    try { await chrome.alarms.clear('relock'); } catch (_) { /* 无所谓 */ }
    return true;
  }

  // 忘记密码：只能清空（没有密码就无法解密，这是加密的代价）
  async function wipe() {
    ctx = null;
    await chrome.storage.local.remove([BLOB, LEG_VAULT, LEG_LIST, LEG_AUTH, LEG_PIN]);
    try { await chrome.storage.session.remove([SESSION, 'handoff']); } catch (_) { /* 无所谓 */ }
    try { await chrome.alarms.clear('relock'); } catch (_) { /* 无所谓 */ }
  }

  /* ---------------- 解锁有效期（会话密钥，只存内存） ---------------- */

  /** 把密钥放进会话存储，ms 毫秒内别的页面/弹窗可直接进入。 */
  async function remember(ms) {
    if (!ctx || !(ms > 0)) return;
    const until = Date.now() + ms;
    await chrome.storage.session.set({ [SESSION]: { k: b64(ctx.raw), until } });
    try { await chrome.alarms.create('relock', { when: until }); } catch (_) { /* 到期时读取会再检查一次 */ }
    return until;
  }

  /** 会话里有没过期的密钥就直接用，返回到期时间；否则返回 null。 */
  async function resume() {
    try {
      const s = (await chrome.storage.session.get(SESSION))[SESSION];
      if (!s || typeof s !== 'object') return null;
      const raw = decodeB64(s.k, 32, 32);
      if (!raw || typeof s.until !== 'number' || !(s.until > Date.now())) { await chrome.storage.session.remove(SESSION); return null; }
      const b = (await get(BLOB))[BLOB];
      if (!b) return null;
      await adopt(raw);
      await open(ctx.key, b.iv, b.ct);
      return s.until;
    } catch (_) {
      ctx = null;
      try { await chrome.storage.session.remove(SESSION); } catch (e) { /* 无所谓 */ }
      return null;
    }
  }

  // 只清掉会话里的“解锁有效期”（当前页面保持打开状态），用于把上锁时间改成“立即”时
  async function forget() {
    try { await chrome.storage.session.remove(SESSION); } catch (_) { /* 无所谓 */ }
    try { await chrome.alarms.clear('relock'); } catch (_) { /* 无所谓 */ }
  }

  async function lock() {
    ctx = null;
    try { await chrome.storage.session.remove([SESSION, 'handoff']); } catch (_) { /* 无所谓 */ }
    try { await chrome.alarms.clear('relock'); } catch (_) { /* 无所谓 */ }
  }

  // 从弹窗“展开”时，把密钥一次性交给新页面（15 秒内有效，读取即删）。
  // extra 只取白名单里的 folder/hint/bulkText：调用方传进来的字段不能覆盖时间戳和密钥。
  // bulkText 是用户在弹窗里贴的批量添加文本（一次性的待处理内容，15 秒过期、读取即删），
  // 只在 hint='bulk' 时才由展开页用来在后台标签页读取真实标题；其它情况不使用。
  async function giveHandoff(extra) {
    if (!ctx) return;
    const folder = extra && typeof extra.folder === 'string' ? extra.folder : null;
    const hint = extra && typeof extra.hint === 'string' ? extra.hint : null;
    const bulkText = extra && typeof extra.bulkText === 'string' && extra.bulkText.length > 0 && extra.bulkText.length <= 100000 ? extra.bulkText : null;
    await chrome.storage.session.set({ handoff: { folder, hint, bulkText, t: Date.now(), k: b64(ctx.raw) } });
  }
  async function takeHandoff() {
    const s = (await chrome.storage.session.get('handoff')).handoff;
    if (!s || typeof s !== 'object') return null;
    await chrome.storage.session.remove('handoff');
    const raw = decodeB64(s.k, 32, 32);
    if (!raw || typeof s.t !== 'number' || Date.now() - s.t >= 15000) return null;
    try {
      const b = (await get(BLOB))[BLOB];
      await adopt(raw);
      await open(ctx.key, b.iv, b.ct);
    } catch (_) { ctx = null; return null; }
    // 只返回调用方需要的字段：密钥（k）不外传，bulkText 按写入时的上限再校验一次，
    // folder/hint 只接受字符串，避免被篡改的会话记录带入意外类型。
    const bulkText = typeof s.bulkText === 'string' && s.bulkText.length > 0 && s.bulkText.length <= 100000 ? s.bulkText : null;
    return {
      folder: typeof s.folder === 'string' ? s.folder : null,
      hint: typeof s.hint === 'string' ? s.hint : null,
      bulkText,
    };
  }
  // 交接失败时（如打不开展开页）清掉未消费的交接记录，避免 15 秒内下一次
  // 打开展开页时误触发 import/backupdir/bulk。
  async function clearHandoff() {
    try { await chrome.storage.session.remove('handoff'); } catch (_) { /* 无所谓 */ }
  }

  /* ---------------- 设置 ---------------- */
  // settings: { autoBackup, lastBackupAt, dirty, lockAfter(毫秒，0=立即), backupDirName }
  async function getSettings() { return (await get(SETTINGS))[SETTINGS] || {}; }
  async function setSettings(patch) {
    const s = { ...(await getSettings()), ...patch };
    await set({ [SETTINGS]: s });
    return s;
  }

  /* ---------------- 备份 / 恢复 ---------------- */

  // 加密备份 = 当前这份加密数据的拷贝（外加几个说明字段）
  async function encryptedBackupText() {
    const b = (await get(BLOB))[BLOB];
    if (!b) throw new Error('没有可备份的数据');
    return JSON.stringify({ app: 'private-bookmarks', version: 3, enc: true, exportedAt: new Date().toISOString(), ...b });
  }

  // 明文备份：任何人拿到都能直接看，仅用于迁移到别处
  function plainBackupText(vault) {
    return JSON.stringify({ app: 'private-bookmarks', version: 3, enc: false, exportedAt: new Date().toISOString(), folders: vault.folders, items: vault.items }, null, 2);
  }

  const str = (x) => (typeof x === 'string' ? x : '');

  /**
   * 解析备份文件内容。返回：
   *   { encrypted: true, blob }                         加密备份，需要 openEncrypted() 解开
   *   { folders, items, exportedAt, ... }               明文备份（v3 明文 / 2.x / 1.0 平铺数组）
   * 会丢弃无效条目、修复丢失的父文件夹和循环引用。失败抛出带中文说明的 Error。
   */
  function parseBackup(text) {
    let data;
    try { data = JSON.parse(text); } catch (_) { throw new Error('这不是有效的备份文件（不是 JSON 格式）'); }

    if (data && typeof data === 'object' && !Array.isArray(data) && data.enc && typeof data.ct === 'string' && typeof data.wrapped === 'string') {
      return { encrypted: true, blob: data, exportedAt: str(data.exportedAt) || null };
    }

    if (Array.isArray(data)) { // 1.0 版备份
      const items = [];
      for (const b of data) {
        const url = str(b && b.url).trim();
        if (!isWebUrl(url)) continue;
        items.push({ id: uid(), title: str(b.title).trim() || url, url, folderId: null, addedAt: Date.now() });
      }
      if (!items.length) throw new Error('备份文件里没有找到书签');
      return { legacy: true, exportedAt: null, items, folders: [] };
    }

    if (!data || typeof data !== 'object' || !Array.isArray(data.folders) || !Array.isArray(data.items)) {
      throw new Error('无法识别这个文件：它不是“私密书签管家”导出的备份');
    }

    const folders = [];
    const byId = new Map();
    for (const f of data.folders) {
      const id = str(f && f.id);
      if (!id || byId.has(id)) continue;
      const nf = { id, name: str(f.name).trim() || '未命名文件夹', parentId: typeof f.parentId === 'string' ? f.parentId : null };
      folders.push(nf);
      byId.set(id, nf);
    }
    for (const f of folders) if (f.parentId !== null && !byId.has(f.parentId)) f.parentId = null;
    for (const f of folders) { // 有环 → 断开
      let p = byId.get(f.parentId);
      let hops = 0;
      while (p && hops < 500) {
        if (p.id === f.id) { f.parentId = null; break; }
        p = byId.get(p.parentId);
        hops++;
      }
      if (hops >= 500) f.parentId = null;
    }

    const items = [];
    for (const i of data.items) {
      const url = str(i && i.url).trim();
      if (!isWebUrl(url)) continue;
      const fid = str(i.folderId);
      const it = {
        id: str(i.id) || uid(),
        title: str(i.title).trim() || url,
        url,
        folderId: byId.has(fid) ? fid : null,
        addedAt: Number(i.addedAt) || Date.now(),
      };
      if (str(i.chromeId) || i.legacy) it.legacy = true; // 旧版从浏览器自动导入的
      items.push(it);
    }
    if (!items.length && !folders.length) throw new Error('备份文件里没有找到书签');
    return { legacy: false, exportedAt: str(data.exportedAt) || null, folders, items };
  }

  /**
   * 解开加密备份。pw 为 undefined 时先试当前已解锁的密钥（同一个库做的备份）；
   * 否则用 pw（备份当时的密码）。成功返回和 parseBackup 一样的明文结构，失败返回 null。
   */
  async function openEncrypted(blob, pw) {
    try {
      if (!blob || typeof blob !== 'object') return null;
      // 先按与解锁路径相同的上限校验密文字段形状：损坏/恶意的备份文件
      // 不能靠超大 base64 字段让解密前先分配巨量内存。
      const salt = pw === undefined ? null : decodeB64(blob.salt, 8, 64);
      const wrapIv = pw === undefined ? null : decodeB64(blob.wrapIv, 1, 32);
      const wrapped = pw === undefined ? null : decodeB64(blob.wrapped, 1, 256);
      const iv = decodeB64(blob.iv, 1, 32);
      const ct = decodeB64(blob.ct, 1, 20000000);
      if (!iv || !ct) return null;
      let key;
      if (pw === undefined) {
        if (!ctx) return null;
        if (typeof blob.iv !== 'string' || typeof blob.ct !== 'string') return null;
        key = ctx.key;
      } else {
        if (!salt || !wrapIv || !wrapped || !validIter(blob.iter) || typeof blob.wrapIv !== 'string' || typeof blob.wrapped !== 'string' || typeof blob.iv !== 'string' || typeof blob.ct !== 'string') return null;
        const k = await kekFrom(pw, salt, blob.iter);
        key = await dekFrom(await open(k, blob.wrapIv, blob.wrapped));
      }
      const text = dec.decode(await open(key, blob.iv, blob.ct));
      const parsed = parseBackup(JSON.stringify({ ...JSON.parse(text), enc: false }));
      parsed.exportedAt = str(blob.exportedAt) || parsed.exportedAt;
      return parsed;
    } catch (_) {
      return null;
    }
  }

  /** 把明文备份应用到库里。mode: 'merge'（只添加没有的）| 'replace'（用备份覆盖）。返回新增数量。 */
  function applyBackup(vault, backup, mode) {
    if (mode === 'replace') {
      vault.folders = backup.folders.map((f) => ({ ...f }));
      vault.items = backup.items.map((i) => ({ ...i }));
      return vault.items.length;
    }
    // merge：按“文件夹路径 + 网址”匹配，不依赖内部 id，所以不同安装之间的备份也能对上
    const bById = new Map(backup.folders.map((f) => [f.id, f]));
    const map = new Map();
    const resolving = new Set();
    const resolve = (id) => {
      if (id === null || id === undefined) return null;
      if (map.has(id)) return map.get(id);
      if (resolving.has(id)) return null; // 备份文件夹成环时断开，不递归死循环
      const bf = bById.get(id);
      if (!bf) return null;
      resolving.add(id);
      const parentId = resolve(bf.parentId);
      resolving.delete(id);
      let f = vault.folders.find((x) => (x.parentId || null) === parentId && x.name === bf.name);
      if (!f) { f = { id: uid(), name: bf.name, parentId }; vault.folders.push(f); }
      map.set(id, f.id);
      return f.id;
    };
    const seen = new Set(vault.items.map((i) => (i.folderId || '') + '\n' + i.url));
    let added = 0;
    for (const bi of backup.items) {
      const folderId = resolve(bi.folderId);
      const key = (folderId || '') + '\n' + bi.url;
      if (seen.has(key)) continue;
      seen.add(key);
      const it = { id: uid(), title: bi.title, url: bi.url, folderId, addedAt: bi.addedAt };
      if (bi.legacy) it.legacy = true;
      vault.items.push(it);
      added++;
    }
    for (const bf of backup.folders) resolve(bf.id); // 备份里的空文件夹也补上
    return added;
  }

  /* ---------------- 备份文件夹（File System Access） ---------------- */

  const BACKUP_DIR = '备份';          // 在用户选的文件夹（插件所在文件夹）里创建
  const FALLBACK_DIR = '私密书签备份'; // 没选文件夹 / 没授权时，退回「下载」里的这个文件夹
  const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  function idb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('pbv', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('kv');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function idbGet(k) {
    const db = await idb();
    return new Promise((resolve, reject) => {
      const r = db.transaction('kv').objectStore('kv').get(k);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  async function idbSet(k, v) {
    const db = await idb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('kv', 'readwrite');
      if (v === undefined) tx.objectStore('kv').delete(k); else tx.objectStore('kv').put(v, k);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  const getBackupDir = () => idbGet('backupDir').catch(() => undefined);
  async function setBackupDir(handle) {
    await idbSet('backupDir', handle || undefined);
    await setSettings({ backupDirName: handle ? handle.name : null });
  }
  // 'granted' | 'prompt' | 'denied' | 'none'；request=true 时会尝试弹出授权（必须在用户点击之后调用）
  async function backupDirState(request) {
    const h = await getBackupDir();
    if (!h) return 'none';
    try {
      let p = await h.queryPermission({ mode: 'readwrite' });
      if (p !== 'granted' && request) p = await h.requestPermission({ mode: 'readwrite' });
      return p;
    } catch (_) { return 'denied'; }
  }

  async function downloadFile(name, text) {
    // 文件名只允许调用方传入的固定模式：拒绝路径分隔符与 ..，防止备份文件名
    // 意外写到下载文件夹之外（chrome.downloads 本身也会限制在下载目录内，这里再加一层）。
    if (typeof name !== 'string' || !name || name.includes('/') || name.includes('\\') || name.includes('..')) throw new Error('备份文件名不合法');
    const bytes = enc.encode(text);
    let url;
    if (bytes.length <= 1400000) { // data: 地址自带内容，弹窗关闭也不会中断下载
      url = 'data:application/json;base64,' + b64(bytes);
    } else {
      url = URL.createObjectURL(new Blob([bytes], { type: 'application/json' }));
    }
    await chrome.downloads.download({ url, filename: FALLBACK_DIR + '/' + name, conflictAction: 'overwrite', saveAs: false });
    if (url.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  /**
   * 写入一个备份文件：优先写到用户选的文件夹里的「备份」子文件夹；
   * 没选 / 没授权 / 写失败时，退回到「下载/私密书签备份」。返回 { where: 'folder' | 'downloads', why? }
   */
  async function writeBackup(name, text) {
    const st = await backupDirState(false);
    if (st === 'granted') {
      try {
        const h = await getBackupDir();
        const sub = await h.getDirectoryHandle(BACKUP_DIR, { create: true });
        const fh = await sub.getFileHandle(name, { create: true });
        const w = await fh.createWritable();
        await w.write(text);
        await w.close();
        return { where: 'folder' };
      } catch (err) {
        console.error(err);
        await downloadFile(name, text);
        return { where: 'downloads', why: 'error' };
      }
    }
    await downloadFile(name, text);
    return { where: 'downloads', why: st };
  }

  // 自动备份：按星期轮换，最多保留 7 个文件。库是空的时候不写，避免用空数据覆盖掉好备份。
  async function autoBackupNow(vault) {
    if (!vault.items.length) return false;
    await setSettings({ dirty: false }); // 先清标记：写文件期间如果又有改动，会重新置位
    let res;
    try {
      res = await writeBackup(`自动备份_${WEEK[new Date().getDay()]}.json`, await encryptedBackupText());
    } catch (err) {
      await setSettings({ dirty: true });
      throw err;
    }
    await setSettings({ lastBackupAt: Date.now(), lastBackupWhere: res.where });
    return res;
  }

  root.VaultStore = {
    uid, hasPassword, setup, unlock, load, save, changePassword, wipe, isUnlocked,
    remember, resume, forget, lock, giveHandoff, takeHandoff, clearHandoff,
    getSettings, setSettings,
    encryptedBackupText, plainBackupText, parseBackup, openEncrypted, applyBackup,
    getBackupDir, setBackupDir, backupDirState, writeBackup, autoBackupNow,
    BACKUP_DIR, FALLBACK_DIR, ITER,
  };
})(typeof self !== 'undefined' ? self : this);
