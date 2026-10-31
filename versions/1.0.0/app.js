/* 私密书签管家 —— 弹窗页和展开页共用的界面逻辑 */
(() => {
  'use strict';

  const V = VaultStore;
  const $ = (s) => document.querySelector(s);
  const FULL = document.body.classList.contains('mode-full');

  /* ================= 图标（Material Icons，Apache-2.0） ================= */
  const PATHS = {
    folder: 'M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
    newfolder: 'M20 6h-8l-2-2H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-1 8h-3v3h-2v-3h-3v-2h3V9h2v3h3v2z',
    add: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
    more: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
    expand: 'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z',
    lock: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z',
    search: 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    chevron: 'M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
    edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    close: 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    eye: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
    eyeoff: 'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z',
    sync: 'M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
    download: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
    tab: 'M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V8h14v10z',
    window: 'M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 14H5V8h14v10zM6 5.5h2v1H6zm3.5 0h2v1h-2z',
    link: 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
    open: 'M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z',
    upload: 'M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z',
    bulk: 'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z',
    timer: 'M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61 1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A8.962 8.962 0 0 0 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z',
    key: 'M12.65 10A5.99 5.99 0 0 0 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6a5.99 5.99 0 0 0 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
    home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    backup: 'M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z',
  };
  const icon = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${PATHS[n]}"/></svg>`;
  document.querySelectorAll('[data-i]').forEach((el) => { el.innerHTML = icon(el.dataset.i); });

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const short = (s, n = 18) => (s.length > n ? s.slice(0, n) + '…' : s);
  const favicon = (u) => `${chrome.runtime.getURL('/_favicon/')}?pageUrl=${encodeURIComponent(u)}&size=32`;

  /* ================= 状态 ================= */
  const state = { vault: null, ix: null, cur: null, q: '', expanded: new Set(), drag: null, settings: {} };

  function reindex() {
    const v = state.vault;
    const folders = new Map(v.folders.map((f) => [f.id, f]));
    const kids = new Map();
    const items = new Map();
    for (const f of v.folders) {
      const k = f.parentId || '';
      if (!kids.has(k)) kids.set(k, []);
      kids.get(k).push(f);
    }
    for (const it of v.items) {
      const k = it.folderId || '';
      if (!items.has(k)) items.set(k, []);
      items.get(k).push(it);
    }
    const counts = new Map();
    const count = (id) => {
      if (counts.has(id)) return counts.get(id);
      counts.set(id, 0); // 防止数据异常时无限递归
      let n = (items.get(id) || []).length;
      for (const c of kids.get(id) || []) n += count(c.id);
      counts.set(id, n);
      return n;
    };
    v.folders.forEach((f) => count(f.id));
    state.ix = { folders, kids, items, counts };
  }

  const pathOf = (id) => {
    const p = [];
    let f = state.ix.folders.get(id);
    while (f && p.length < 64) { p.unshift(f); f = state.ix.folders.get(f.parentId); }
    return p;
  };
  // id 是否就是 ancestorId，或在它的子树里
  const isUnder = (id, ancestorId) => pathOf(id).some((f) => f.id === ancestorId);
  const pathText = (id) => pathOf(id).map((f) => f.name).join(' › ');

  /* ================= 解锁 ================= */
  const R = '__root__'; // 界面里代表“最外层（不分类）”的 id
  const real = (id) => (!id || id === R ? null : id);
  const MIN_PW = 8;
  let setupMode = false;
  let busy = false;
  let lockTimer = null;

  function setupLock(isSetup) {
    setupMode = isSetup;
    $('#lock-sub').textContent = isSetup ? `首次使用，请先设置一个密码（至少 ${MIN_PW} 位）` : '输入密码解锁';
    $('#unlock').textContent = isSetup ? '设置密码并进入' : '解锁';
    $('#pin').placeholder = isSetup ? '设置密码' : '密码';
    $('#pin2-wrap').classList.toggle('hidden', !isSetup);
    $('#forgot').classList.toggle('hidden', isSetup);
    $('#restore').classList.toggle('hidden', !isSetup);
  }

  // 首次使用时，如果手上有备份文件，可以直接从备份恢复（设置好密码后才会真正写入）
  let pendingRestore = null;
  $('#restore').addEventListener('click', async () => {
    if (!FULL) { // 弹窗里打开系统文件选择框会让弹窗被关掉，所以到展开页里去选
      await chrome.tabs.create({ url: chrome.runtime.getURL('manager.html') });
      window.close();
      return;
    }
    const file = await pickFile();
    if (!file) return;
    try {
      pendingRestore = await readBackup(file);
      $('#lock-sub').textContent = `已选择备份：${pendingRestore.items.length} 个书签。设置好密码后即可恢复`;
      $('#restore').textContent = '换一个备份文件';
      $('#lock-err').textContent = '';
      $('#pin').focus();
    } catch (err) {
      pendingRestore = null;
      if (!err.cancelled) lockError(err.message || '读取备份失败');
    }
  });

  function lockError(msg, focusEl) {
    $('#lock-err').textContent = msg;
    const card = $('#lock-form');
    card.classList.remove('shake');
    void card.offsetWidth; // 重新触发动画
    card.classList.add('shake');
    if (focusEl) { focusEl.focus(); focusEl.select(); }
  }

  // 眼睛按钮：显示/隐藏密码
  document.querySelectorAll('[data-eye]').forEach((btn) => {
    const input = document.getElementById(btn.dataset.eye);
    const paint = () => { btn.innerHTML = icon(input.type === 'password' ? 'eye' : 'eyeoff'); };
    paint();
    btn.addEventListener('click', () => { input.type = input.type === 'password' ? 'text' : 'password'; paint(); input.focus(); });
  });

  // 回车：设置密码时，第一个框回车跳到第二个框；其余情况回车就是提交（<form> 原生支持）
  $('#pin').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && setupMode && $('#pin').value && !$('#pin2').value) {
      e.preventDefault();
      $('#pin2').focus();
    }
  });
  ['#pin', '#pin2'].forEach((s) => $(s).addEventListener('input', () => { $('#lock-err').textContent = ''; }));

  $('#lock-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    let pw = $('#pin').value;
    busy = true;
    const btn = $('#unlock');
    const label = btn.textContent;
    btn.disabled = true;
    try {
      if (setupMode) {
        if (pw.length < MIN_PW) return lockError(`密码至少 ${MIN_PW} 位，越长越安全（库是用它加密的）`, $('#pin'));
        if (pw !== $('#pin2').value) return lockError('两次输入的密码不一致', $('#pin2'));
        const init = { folders: [], items: [] };
        if (pendingRestore) V.applyBackup(init, pendingRestore, 'replace');
        btn.textContent = '正在加密…';
        await V.setup(pw, init);
        pendingRestore = null;
      } else {
        btn.textContent = '正在解锁…';
        if (!(await V.unlock(pw))) {
          $('#pin').value = '';
          return lockError('密码错误，请重试', $('#pin'));
        }
      }
      await afterUnlock();
    } catch (err) {
      console.error(err);
      lockError('出错了：' + (err && err.message ? err.message : err));
    } finally {
      // 密码只在解锁这一刻需要：用完立刻清掉输入框，并断开变量引用，
      // 缩短它留在页面内存/DOM 里的时间窗口。JS 字符串本身不可擦写，
      // 这只能缩短留存时间，不能保证内存里无残留（见审计报告）。
      $('#pin').value = '';
      const pin2El = $('#pin2');
      if (pin2El) pin2El.value = '';
      pw = null;
      busy = false;
      btn.disabled = false;
      btn.textContent = label;
    }
  });

  $('#forgot').addEventListener('click', async () => {
    const ok = confirm('忘记密码无法找回：书签库是用密码加密的，没有密码谁也打不开（包括我）。\n\n重置会清空私密库和密码，从空白重新开始。\n如果你有备份文件，重置后在设置密码的界面选“从备份恢复”，输入备份时的密码即可找回。\n\n确定要重置吗？');
    if (!ok) return;
    await V.wipe();
    location.reload();
  });

  async function afterUnlock() {
    const s = await V.getSettings();
    state.settings = s;
    const until = s.lockAfter > 0 ? await V.remember(s.lockAfter) : null;
    // 备份文件夹重启浏览器后可能需要重新授权；趁现在刚点过按钮顺便处理（已授权则无任何提示）
    if (FULL && s.backupDirName) V.backupDirState(true).then(() => renderStatus()).catch(() => {});
    await enterVault({ until });
  }

  async function lockNow() {
    await V.lock();
    location.reload();
  }

  async function enterVault(opts = {}) {
    state.vault = await V.load();
    reindex();
    let last = null;
    try { last = ((await chrome.storage.local.get('ui')).ui || {}).last || null; } catch (_) { /* 无所谓 */ }
    const pick = [opts.folder, last].find((id) => id && state.ix.folders.has(id));
    state.cur = pick || null;
    if (FULL) (state.ix.kids.get('') || []).forEach((f) => state.expanded.add(f.id));
    expandTo(state.cur);
    $('#lock').classList.add('hidden');
    $('#app').classList.remove('hidden');
    $('#btn-add-text').textContent = FULL ? '添加书签' : '添加当前页面';
    renderAll();

    // “解锁后 N 分钟再上锁”：到点这个页面也要锁上
    clearTimeout(lockTimer);
    if (opts.until) lockTimer = setTimeout(lockNow, Math.max(0, opts.until - Date.now()));

    // 不阻塞进入：首次询问是否开启自动备份，并补做到期的备份
    (async () => {
      state.settings = await V.getSettings();
      setVersionPill(updateState.release);
      // 静默检查更新：后台 6 小时只请求一次，有新版才弹更新窗口；失败不打扰。
      checkForUpdates({ force: false, showDialog: true }).catch((err) => console.error(err));
      await askAutoBackupOnce();
      await backupIfDue();
      renderStatus();
      const legacyN = state.vault.items.filter((i) => i.legacy).length;
      if (legacyN && !state.settings.legacyHinted) {
        state.settings = await V.setSettings({ legacyHinted: true });
        toast(`有 ${legacyN} 个书签是旧版自动从浏览器导入的`, () => removeLegacy(), { label: '查看并清理', ms: 12000 });
      } else if (!state.vault.items.length && !state.settings.restoreHinted) {
        state.settings = await V.setSettings({ restoreHinted: true });
        toast('这里只放你自己添加或导入的书签。如果之前有备份文件，点右上角 ⋮ → 导入备份文件 就能恢复', null, { ms: 9000 });
      }
    })().catch((err) => console.error(err));
  }

  async function removeLegacy() {
    const n = state.vault.items.filter((i) => i.legacy).length;
    if (!n) { toast('没有旧版自动导入的书签'); return; }
    const ok = await dialog({
      title: '清理旧版导入的书签',
      ok: `移出 ${n} 个`,
      message: `旧版会把浏览器自带书签自动导入到这里，共 ${n} 个。现在只管理你自己添加/导入的书签，这些可以移出。\n\n它们在浏览器自带的书签里仍然存在，不受影响。移出后 8 秒内可以撤销。`,
    });
    if (!ok) return;
    await mutate((v) => { v.items = v.items.filter((i) => !i.legacy); }, { msg: `已移出 ${n} 个旧版导入的书签`, undo: true });
  }

  /* ================= 渲染 ================= */
  function expandTo(id) {
    for (const f of pathOf(id)) state.expanded.add(f.id);
  }

  function renderAll() {
    renderTree();
    renderCrumbs();
    renderList();
    renderStatus();
  }

  function renderTree() {
    if (!FULL) return;
    const { kids } = state.ix;
    const out = [];
    out.push(
      `<div class="node${state.cur === null ? ' sel' : ''}" data-folder="${R}" style="--d:0" role="treeitem" aria-selected="${state.cur === null}">` +
      `<span class="twist none">${icon('chevron')}</span><span class="ficon">${icon('home')}</span><span class="name">所有书签</span></div>`
    );
    const walk = (f, d) => {
      const ch = kids.get(f.id) || [];
      const open = state.expanded.has(f.id);
      out.push(
        `<div class="node${state.cur === f.id ? ' sel' : ''}" data-folder="${esc(f.id)}" draggable="true" style="--d:${d}" role="treeitem" aria-selected="${state.cur === f.id}">` +
        `<span class="twist${ch.length ? '' : ' none'}${open ? ' open' : ''}" data-twist>${icon('chevron')}</span>` +
        `<span class="ficon">${icon('folder')}</span><span class="name" title="${esc(f.name)}">${esc(f.name)}</span></div>`
      );
      if (open) ch.forEach((c) => walk(c, d + 1));
    };
    (kids.get('') || []).forEach((f) => walk(f, 1));
    const tree = $('#tree');
    tree.innerHTML = out.join('');
    const sel = tree.querySelector('.sel');
    if (sel) sel.scrollIntoView({ block: 'nearest' });
  }

  function renderCrumbs() {
    const el = $('#crumbs');
    const q = state.q.trim();
    if (q) { el.innerHTML = `<span class="crumb cur">搜索“${esc(q)}”的结果</span>`; return; }
    const parts = [`<button class="crumb${state.cur === null ? ' cur' : ''}" data-go="" data-crumb="${R}">所有书签</button>`];
    for (const f of pathOf(state.cur)) {
      parts.push(`<span class="sep">${icon('chevron')}</span>`);
      parts.push(`<button class="crumb${f.id === state.cur ? ' cur' : ''}" data-go="${esc(f.id)}" data-crumb="${esc(f.id)}">${esc(f.name)}</button>`);
    }
    el.innerHTML = parts.join('');
  }

  function currentView() {
    const { kids, items } = state.ix;
    const v = state.vault;
    const q = state.q.trim().toLowerCase();
    if (q) {
      return {
        search: true,
        folders: v.folders.filter((f) => f.name.toLowerCase().includes(q)),
        items: v.items.filter((i) => i.title.toLowerCase().includes(q) || i.url.toLowerCase().includes(q)),
      };
    }
    const key = state.cur || '';
    return { folders: kids.get(key) || [], items: items.get(key) || [] };
  }

  function renderList() {
    const view = currentView();
    const rows = [];
    const ops = (what) =>
      `<button class="ibtn" data-act="edit" title="${what === 'folder' ? '重命名' : '编辑'}" aria-label="${what === 'folder' ? '重命名' : '编辑'}">${icon('edit')}</button>` +
      `<button class="ibtn rm" data-act="rm" title="删除" aria-label="删除">${icon('close')}</button>` +
      `<button class="ibtn" data-act="more" title="更多" aria-label="更多">${icon('more')}</button>`;

    for (const f of view.folders) {
      const path = view.search ? `<span class="path">${esc(pathText(f.parentId))}</span>` : '';
      rows.push(
        `<div class="row folder" role="listitem" tabindex="0" data-folder="${esc(f.id)}" draggable="true">` +
        `<span class="lead">${icon('folder')}</span>` +
        `<div class="txt"><div class="title">${esc(f.name)}</div><div class="sub">${path}${state.ix.counts.get(f.id) || 0} 个书签</div></div>` +
        `<div class="ops">${ops('folder')}</div></div>`
      );
    }
    for (const it of view.items) {
      const path = view.search ? `<span class="path">${esc(pathText(it.folderId))}</span>` : '';
      rows.push(
        `<div class="row item" role="listitem" tabindex="0" draggable="true" data-item="${esc(it.id)}" title="${esc(it.title + '\n' + it.url)}">` +
        `<span class="lead"><span class="fav"><img src="${esc(favicon(it.url))}" alt="" width="16" height="16" loading="lazy"></span></span>` +
        `<div class="txt"><div class="title">${esc(it.title)}</div><div class="sub">${path}${esc(it.url)}</div></div>` +
        `<div class="ops">${ops('item')}</div></div>`
      );
    }

    let html = rows.join('');
    if (!rows.length) {
      if (view.search) html = '<div class="empty"><b>没有找到匹配的书签</b>换个关键词试试</div>';
      else if (!state.vault.items.length && !state.vault.folders.length) html = '<div class="empty"><b>还没有书签</b>点“添加书签”手动添加，或用“批量添加”一次贴入很多链接<br>也可以先新建文件夹来分类</div>';
      else html = '<div class="empty"><b>这里还是空的</b>点“添加书签”，或把书签拖进来</div>';
    }
    $('#list').innerHTML = html;
  }

  function renderStatus() {
    if (!state.vault) return;
    const view = currentView();
    const total = state.vault.items.length;
    const here = view.search
      ? `找到 ${view.items.length} 个书签`
      : `${view.folders.length ? view.folders.length + ' 个文件夹，' : ''}${view.items.length} 个书签`;
    const s = state.settings || {};
    let backup = '';
    if (FULL) {
      if (!s.autoBackup) backup = '　·　⚠ 未开启自动备份';
      else {
        const where = s.lastBackupWhere === 'folder' ? '（备份文件夹）'
          : s.lastBackupWhere === 'downloads' ? (s.backupDirName ? '（备份文件夹未授权，已存到下载文件夹）' : '（下载文件夹）') : '';
        backup = `　·　上次备份 ${s.lastBackupAt ? fmtTime(s.lastBackupAt) : '—'}${where}`;
      }
    }
    $('#status-count').textContent = `${here}　·　共 ${total} 个书签${backup}`;
  }

  /* ================= 导航 ================= */
  function go(id) {
    state.cur = id || null;
    if (state.q) { state.q = ''; $('#search').value = ''; }
    if (state.cur) { expandTo(state.cur); }
    renderAll();
    $('#list').scrollTop = 0;
    try { chrome.storage.local.set({ ui: { last: state.cur } }); } catch (_) { /* 无所谓 */ }
  }

  $('#crumbs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (b && !b.classList.contains('cur')) go(b.dataset.go);
  });

  $('#tree').addEventListener('click', (e) => {
    const node = e.target.closest('.node');
    if (!node) return;
    const id = node.dataset.folder;
    if (e.target.closest('[data-twist]')) {
      if (state.expanded.has(id)) state.expanded.delete(id); else state.expanded.add(id);
      renderTree();
      return;
    }
    go(real(id));
  });

  $('#search').addEventListener('input', (e) => {
    state.q = e.target.value;
    renderCrumbs();
    renderList();
    renderStatus();
  });

  /* ================= 打开书签 ================= */
  // 只打开 http/https，且不带内嵌账号密码（与 normalizeUrl 同一白名单）。
  const canOpenUrl = (url) => {
    try {
      const u = new URL(String(url || '').trim());
      return (u.protocol === 'http:' || u.protocol === 'https:') && !u.username && !u.password;
    } catch (_) { return false; }
  };

  async function openItem(it, how) {
    // 纵深防御：哪怕已存数据里混进了危险 scheme，也不在这里打开。
    if (!canOpenUrl(it.url)) { toast('无法打开这个链接'); return; }
    try {
      if (how === 'window') await chrome.windows.create({ url: it.url });
      else await chrome.tabs.create({ url: it.url, active: how !== 'background' });
    } catch (err) {
      toast('无法打开这个链接');
    }
  }

  // 批量打开一个文件夹（含子文件夹）里的全部书签：先确认数量，逐个在后台打开，
  // 打开失败的最后统一提示一次，不逐条弹。打开后各网站会知道你访问了它们，
  // 这是正常浏览行为，不是插件泄露——未打开前，网址只在加密库里。
  async function openAllInFolder(folderId) {
    const seen = new Set();
    const items = [];
    const collect = (id, depth) => {
      if (depth > 64) return;
      for (const it of state.vault.items) {
        if ((it.folderId || null) === id && !seen.has(it.id)) { seen.add(it.id); items.push(it); }
      }
      for (const f of state.vault.folders) {
        if ((f.parentId || null) === id && !seen.has('f:' + f.id)) { seen.add('f:' + f.id); collect(f.id, depth + 1); }
      }
    };
    collect(folderId || null, 0);
    if (!items.length) { toast('这个文件夹里没有书签'); return; }
    const name = folderLabel(folderId);
    const res = await dialog({
      title: '打开全部书签',
      ok: `打开 ${items.length} 个`,
      message: `将打开“${name}”及子文件夹里的 ${items.length} 个书签（在后台标签页打开）。\n打开后，各网站会知道你访问了它们。${items.length > 20 ? '\n数量较多，打开时请稍等。' : ''}`,
    });
    if (!res) return;
    let failed = 0;
    for (const it of items) {
      if (!canOpenUrl(it.url)) { failed++; continue; }
      try {
        await chrome.tabs.create({ url: it.url, active: false });
      } catch (_) { failed++; }
      await new Promise((r) => setTimeout(r, 100));
    }
    toast(failed ? `已打开 ${items.length - failed} 个，${failed} 个打开失败` : `已打开 ${items.length} 个书签`, null, { ms: 3500 });
  }

  /* ================= 列表交互 ================= */
  const rowTarget = (row) => {
    if (row.dataset.item) {
      const obj = state.vault.items.find((i) => i.id === row.dataset.item);
      return obj && { kind: 'item', id: obj.id, obj };
    }
    const obj = state.ix.folders.get(row.dataset.folder);
    return obj && { kind: 'folder', id: obj.id, obj };
  };

  $('#list').addEventListener('click', (e) => {
    const row = e.target.closest('.row');
    if (!row) return;
    const t = rowTarget(row);
    if (!t) return;
    const op = e.target.closest('[data-act]');
    if (op) {
      e.stopPropagation();
      if (op.dataset.act === 'edit') return t.kind === 'folder' ? renameFolder(t.obj) : editItem(t.obj);
      if (op.dataset.act === 'rm') return t.kind === 'folder' ? removeFolder(t.obj) : removeItem(t.obj);
      const r = op.getBoundingClientRect();
      return showMenu(r.right - 4, r.bottom + 2, menuFor(t), true);
    }
    if (t.kind === 'folder') return go(t.id);
    openItem(t.obj, e.shiftKey ? 'window' : e.ctrlKey || e.metaKey ? 'background' : 'tab');
  });

  $('#list').addEventListener('auxclick', (e) => {
    if (e.button !== 1) return;
    const row = e.target.closest('.row.item');
    const t = row && rowTarget(row);
    if (t) { e.preventDefault(); openItem(t.obj, 'background'); }
  });

  // 图标加载失败 → 去掉 <img>，露出灰色地球占位图
  $('#list').addEventListener('error', (e) => { if (e.target.tagName === 'IMG') e.target.remove(); }, true);

  $('#list').addEventListener('keydown', (e) => {
    const row = e.target.closest('.row');
    if (!row || e.target !== row) return;
    if (e.key === 'Enter') { e.preventDefault(); row.click(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (row.nextElementSibling) row.nextElementSibling.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (row.previousElementSibling) row.previousElementSibling.focus(); }
    else if (e.key === 'Delete') {
      const t = rowTarget(row);
      if (!t) return;
      const done = t.kind === 'folder' ? removeFolder(t.obj) : removeItem(t.obj);
      if (done) done.then(() => { const n = document.querySelector('#list .row'); if (n) n.focus(); });
    }
  });

  /* ================= 右键 / 更多菜单 ================= */
  function menuFor(t) {
    if (t.kind === 'item') {
      const it = t.obj;
      return [
        { label: '在新标签页中打开', icon: 'tab', run: () => openItem(it, 'tab') },
        { label: '在新窗口中打开', icon: 'window', run: () => openItem(it, 'window') },
        '-',
        { label: '编辑…', icon: 'edit', run: () => editItem(it) },
        { label: '复制链接', icon: 'link', run: () => copyText(it.url) },
        '-',
        { label: '删除', icon: 'close', danger: true, run: () => removeItem(it) },
      ];
    }
    const f = t.obj;
    const allN = state.ix.counts.get(f.id) || 0;
    return [
      { label: '打开', icon: 'open', run: () => go(f.id) },
      { label: allN ? `打开全部书签（${allN} 个，含子文件夹）` : '打开全部书签', icon: 'tab', run: () => openAllInFolder(f.id) },
      '-',
      { label: '新建文件夹…', icon: 'newfolder', run: () => newFolder(f.id) },
      { label: '重命名…', icon: 'edit', run: () => renameFolder(f) },
      '-',
      { label: '删除文件夹', icon: 'close', danger: true, run: () => removeFolder(f) },
    ];
  }

  const blankMenu = () => [
    { label: FULL ? '添加书签…' : '添加当前页面…', icon: 'add', run: () => addBookmark() },
    { label: '批量添加书签…', icon: 'bulk', run: () => bulkAdd() },
    { label: '新建文件夹…', icon: 'newfolder', run: () => newFolder() },
  ];

  let menuReturnFocus = null;
  function showMenu(x, y, entries, keepFocus) {
    const m = $('#menu');
    menuReturnFocus = keepFocus ? document.activeElement : null;
    m._entries = entries;
    m.innerHTML = entries
      .map((e, i) => (e === '-'
        ? '<hr>'
        : `<button role="menuitem" data-k="${i}"${e.danger ? ' class="danger"' : ''}>${e.icon ? icon(e.icon) : ''}<span>${esc(e.label)}</span></button>`))
      .join('');
    m.classList.remove('hidden');
    const w = m.offsetWidth;
    const h = m.offsetHeight;
    // 靠右键点击位置展开；放不下就向左/向上翻转
    m.style.left = Math.max(4, Math.min(x - (x + w > innerWidth ? w : 0), innerWidth - w - 4)) + 'px';
    m.style.top = Math.max(4, Math.min(y - (y + h > innerHeight ? h : 0), innerHeight - h - 4)) + 'px';
    const first = m.querySelector('button');
    if (first) first.focus();
  }

  function hideMenu() {
    const m = $('#menu');
    if (m.classList.contains('hidden')) return;
    m.classList.add('hidden');
    m.innerHTML = '';
  }

  $('#menu').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-k]');
    if (!b) return;
    const entry = $('#menu')._entries[+b.dataset.k];
    hideMenu();
    if (entry && entry.run) entry.run();
  });
  $('#menu').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const btns = [...$('#menu').querySelectorAll('button')];
    const i = btns.indexOf(document.activeElement);
    btns[(i + (e.key === 'ArrowDown' ? 1 : -1) + btns.length) % btns.length].focus();
  });
  document.addEventListener('mousedown', (e) => { if (!e.target.closest('#menu')) hideMenu(); }, true);
  window.addEventListener('blur', hideMenu);
  $('#list').addEventListener('scroll', hideMenu);

  $('#app').addEventListener('contextmenu', (e) => {
    if (e.target.closest('input, .topbar')) return; // 输入框、顶栏保留浏览器默认菜单
    e.preventDefault();
    const row = e.target.closest('.row');
    const node = e.target.closest('.node');
    if (row) {
      const t = rowTarget(row);
      if (t) return showMenu(e.clientX, e.clientY, menuFor(t));
    }
    if (node) {
      const f = state.ix.folders.get(node.dataset.folder);
      if (f) return showMenu(e.clientX, e.clientY, menuFor({ kind: 'folder', id: f.id, obj: f }));
    }
    showMenu(e.clientX, e.clientY, blankMenu());
  });

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); toast('链接已复制'); } catch (_) { toast('复制失败'); }
  }

  /* ================= 提示条 / 对话框 ================= */
  let toastTimer = null;
  // undoFn 不为空时，右侧显示一个按钮（默认叫“撤销”，可用 opts.label 改名）
  function toast(msg, undoFn, opts = {}) {
    const t = $('#toast');
    clearTimeout(toastTimer);
    t.innerHTML = `<span>${esc(msg)}</span>` + (undoFn ? `<button type="button">${esc(opts.label || '撤销')}</button>` : '');
    t.classList.remove('hidden');
    if (undoFn) {
      t.querySelector('button').onclick = async () => {
        t.classList.add('hidden');
        try { await undoFn(); } catch (err) { console.error(err); toast('撤销失败：' + (err && err.message ? err.message : err)); }
      };
    }
    toastTimer = setTimeout(() => t.classList.add('hidden'), opts.ms || (undoFn ? 8000 : 2600));
  }

  // 对话框排队显示：同一时间只会出现一个，避免互相覆盖
  let dialogQueue = Promise.resolve();
  function dialog(opts) {
    const run = () => dialogNow(opts);
    const p = dialogQueue.then(run, run);
    dialogQueue = p.catch(() => {});
    return p;
  }

  function dialogNow({ title, message, fields = [], ok = '保存', cancel = '取消', validate, wide }) {
    return new Promise((resolve) => {
      const ov = $('#overlay');
      const returnTo = document.activeElement;
      const form = document.createElement('form');
      form.className = 'dialog' + (wide ? ' wide' : '');
      form.noValidate = true;
      form.setAttribute('role', 'dialog');
      form.setAttribute('aria-label', title);
      form.innerHTML =
        `<h2>${esc(title)}</h2>` +
        (message ? `<p class="msg">${esc(message)}</p>` : '') +
        fields.map((f) => {
          const control = f.type === 'select'
            ? `<select name="${esc(f.key)}">${f.options.map((o) => `<option value="${esc(o.value)}"${o.value === f.value ? ' selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`
            : f.type === 'textarea'
              ? `<textarea name="${esc(f.key)}" rows="${f.rows || 6}" spellcheck="false" autocomplete="off"${f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : ''}>${esc(f.value || '')}</textarea>`
              : `<input name="${esc(f.key)}" type="${f.type === 'password' ? 'password' : 'text'}" value="${esc(f.value || '')}" autocomplete="off" spellcheck="false"${f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : ''}>`;
          return `<label><span>${esc(f.label)}</span>${control}</label>`;
        }).join('') +
        '<p class="err" role="alert"></p>' +
        `<div class="btns"><button type="button" class="btn" data-cancel>${esc(cancel)}</button><button type="submit" class="btn primary">${esc(ok)}</button></div>`;

      const close = (val) => {
        ov.removeEventListener('keydown', onKey);
        ov.onmousedown = null;
        ov.classList.add('hidden');
        ov.innerHTML = '';
        if (returnTo && returnTo.focus && document.contains(returnTo)) returnTo.focus();
        resolve(val);
      };
      const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(null); } };

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const values = Object.fromEntries(new FormData(form).entries());
        const err = validate ? validate(values) : null;
        if (err) { form.querySelector('.err').textContent = err; return; }
        close(values);
      });
      form.querySelector('[data-cancel]').onclick = () => close(null);
      ov.onmousedown = (e) => { if (e.target === ov) close(null); };
      ov.addEventListener('keydown', onKey);

      ov.innerHTML = '';
      ov.appendChild(form);
      ov.classList.remove('hidden');
      form.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); form.requestSubmit(); } });
      const first = form.querySelector('input, select, textarea') || form.querySelector('button[type=submit]');
      first.focus();
      if (first.select) first.select();
    });
  }

  function folderOptions(exclude) {
    const out = [{ value: '', label: '（不分类，放在最外层）' }];
    const walk = (f, d) => {
      if (f.id === exclude) return;
      out.push({ value: f.id, label: '   '.repeat(d) + f.name });
      (state.ix.kids.get(f.id) || []).forEach((c) => walk(c, d + 1));
    };
    (state.ix.kids.get('') || []).forEach((f) => walk(f, 0));
    return out;
  }
  const folderLabel = (id) => (id ? state.ix.folders.get(id).name : '最外层');

  function normalizeUrl(raw) {
    let s = (raw || '').trim();
    if (!s || /\s/.test(s)) return null;
    // 没写 scheme 就补 https://；写了 scheme 的一律走下面的白名单校验，
    // javascript:/data:/file:/chrome:/mailto: 等都不再接受。
    if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = 'https://' + s;
    let u;
    try { u = new URL(s); } catch (_) { return null; }
    if ((u.protocol !== 'http:' && u.protocol !== 'https:') || u.username || u.password) return null;
    return s;
  }

  // 从网址本地推导一个可读名称：只解析网址本身，不联网、不打开页面。
  // 现在它是“兜底名”：批量添加时先用后台标签页读取真实标题，读不到（超时、
  // 被拦、没有标题）时才用它；用户写了名称或清空后重新编辑时也用它。
  function deriveTitle(rawUrl) {
    let u;
    try { u = new URL(rawUrl); } catch (_) { return rawUrl; }
    const host = u.hostname.replace(/^www\./i, '') || rawUrl;
    const decodeSeg = (s) => {
      try { return decodeURIComponent(s); } catch (_) { return s; }
    };
    const segs = u.pathname.split('/').filter(Boolean).map(decodeSeg);
    const meaningless = new Set(['index', 'home', 'page', 'pages', 'post', 'posts', 'article', 'articles', 'detail', 'details', 'view', 'p', 'id', 'search', 'results', 'tag', 'tags', 'category', 'categories']);
    for (let i = segs.length - 1; i >= 0; i--) {
      let seg = segs[i].replace(/\.(html?|php|aspx?|jsp|asp|pdf|docx?|xlsx?|pptx?|txt|md|json|xml|zip|mp[34]|jpe?g|png|gif|webp|svg)$/i, '').trim();
      if (!seg) continue;
      // 纯数字 / 纯哈希 ID 段没有名字意义，往上一级找；已是最后一段则退回域名。
      if (/^\d+$/.test(seg) || (/^[0-9a-f]{16,}$/i.test(seg) && !/[\u4e00-\u9fa5]/.test(seg))) continue;
      if (meaningless.has(seg.toLowerCase())) continue;
      let words = seg.replace(/[-_+]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\s+/g, ' ').trim();
      if (!words) continue;
      if (words.length > 60) words = words.slice(0, 60).trimEnd() + '…';
      // 无中文且尚无大写字母时做首字母大写；含中文/已有大写时原样保留。
      if (!/[\u4e00-\u9fa5]/.test(words) && !/[A-Z]/.test(words)) {
        words = words.replace(/\b[a-z]/g, (c) => c.toUpperCase());
      }
      return words;
    }
    return host;
  }

  const looksUrl = (s) => /^[a-z][a-z0-9+.-]*:\/\/\S+$/i.test(s) || /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?([/?#]\S*)?$/i.test(s);

  // 批量文本 → 书签。每行一个，支持：网址 / 名称 | 网址 / 名称 网址 / [名称](网址)
  function parseBulk(text) {
    const entries = [];
    const bad = [];
    for (const raw of String(text).split(/\r?\n/)) {
      const line = raw.trim();
      if (!line) continue;
      let title = '';
      let url = null;
      const md = line.match(/^\[(.*?)\]\((\S+?)\)$/);
      if (md) {
        title = md[1];
        url = looksUrl(md[2]) ? normalizeUrl(md[2]) : null;
      } else if (/[|\t]/.test(line)) {
        const parts = line.split(/\s*[|\t]\s*/).map((p) => p.trim()).filter(Boolean);
        let idx = -1;
        for (let i = parts.length - 1; i >= 0; i--) if (looksUrl(parts[i])) { idx = i; break; }
        if (idx >= 0) { url = normalizeUrl(parts[idx]); title = parts.filter((_, i) => i !== idx).join(' '); }
      } else {
        const toks = line.split(/\s+/);
        let idx = toks.findIndex((t) => /^[a-z][a-z0-9+.-]*:\/\/\S+$/i.test(t));
        if (idx < 0 && looksUrl(toks[toks.length - 1])) idx = toks.length - 1;
        if (idx >= 0) { url = normalizeUrl(toks[idx]); title = toks.filter((_, i) => i !== idx).join(' '); }
      }
      if (url) entries.push({ title: title.trim() || deriveTitle(url), url, explicit: !!title.trim() }); else bad.push(line);
    }
    return { entries, bad };
  }

  /* ================= 版本药丸与更新检查 ================= */
  // 更新源：GitHub 公开的最新 Release。实际请求由后台 service worker 发起
  // 并做缓存、节流与限流退避；这里只比较版本号、画药丸和弹更新窗口。
  const UPDATE_REPO_OWNER = 'bstbuku-ship-it';
  const UPDATE_REPO_NAME = 'private-bookmarks';
  const UPDATE_RELEASES_URL = `https://github.com/${UPDATE_REPO_OWNER}/${UPDATE_REPO_NAME}/releases`;
  const updateState = { release: null, dismissedTag: null, manualChecks: [] };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function parseVersionTag(tag) {
    if (typeof tag !== 'string') return null;
    const m = tag.trim().replace(/^v/i, '').match(/^(\d{1,9})\.(\d{1,9})(?:\.(\d{1,9}))?$/);
    return m ? [Number(m[1]), Number(m[2]), Number(m[3] || 0)] : null;
  }
  function compareVersions(a, b) {
    const pa = parseVersionTag(a);
    const pb = parseVersionTag(b);
    if (!pa || !pb) return 0;
    for (let i = 0; i < 3; i++) {
      if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
    }
    return 0;
  }
  function currentVersion() {
    try { return chrome.runtime.getManifest().version; } catch (_) { return '1.0.0'; }
  }
  function isNewerRelease(release) {
    return !!release && compareVersions(release.tag, `v${currentVersion()}`) > 0;
  }

  function setVersionPill(release) {
    const pill = $('#version-pill');
    if (!pill) return;
    const cur = currentVersion();
    pill.textContent = `v${cur}`;
    const ignored = state.settings && state.settings.ignoredUpdate;
    const showUpdate = release && isNewerRelease(release) && release.tag !== ignored;
    pill.classList.toggle('update-available', !!showUpdate);
    pill.title = showUpdate ? `有新版本 ${release.tag} 可用，点击查看更新` : '点击检查更新';
  }

  function requestUpdateCheck(force) {
    return new Promise((resolve, reject) => {
      // 20 秒超时兜底：后台请求挂起或 service worker 未唤醒时，不让界面永远等下去。
      const timer = setTimeout(() => reject(new Error('检查更新超时，请稍后再试')), 20000);
      try {
        chrome.runtime.sendMessage({ type: 'checkUpdate', force: !!force }, (res) => {
          clearTimeout(timer);
          const err = chrome.runtime.lastError;
          if (err) { reject(new Error(err.message || '无法联系后台')); return; }
          if (!res || !res.ok) { reject(new Error((res && res.error) || '检查更新失败')); return; }
          resolve(res.release || null);
        });
      } catch (err) {
        clearTimeout(timer);
        reject(err);
      }
    });
  }

  async function checkForUpdates({ force = false, showDialog = true, showLatestToast = false } = {}) {
    if (force) {
      const now = Date.now();
      updateState.manualChecks = updateState.manualChecks.filter((t) => now - t < 60000);
      if (updateState.manualChecks.length >= 3) {
        toast('操作频繁，请稍后再试。');
        return null;
      }
      updateState.manualChecks.push(now);
    }
    try {
      const release = await requestUpdateCheck(force);
      updateState.release = release;
      const ignored = state.settings && state.settings.ignoredUpdate;
      if (release && isNewerRelease(release)) {
        if (force) {
          updateState.dismissedTag = null; // 手动点药丸：本轮内重新提醒，不受之前关掉的影响
          if (release.tag === ignored) {
            // 手动点药丸：重新提醒一次，清除本次的“暂时忽略”。
            state.settings = await V.setSettings({ ignoredUpdate: null });
          }
        }
        setVersionPill(release);
        // 更新窗口不走对话框排队：遮罩正被别的对话框/进度占用时不抢，
        // 药丸保持橙色，用户点药丸可手动再看，避免顶掉正在进行的对话框导致其挂起。
        if (showDialog && release.tag !== updateState.dismissedTag && $('#overlay').classList.contains('hidden')) showUpdateDialog(release);
        return release;
      }
      setVersionPill(release);
      if (force && showLatestToast) toast(`当前已是最新版本（v${currentVersion()}）。`);
      return release;
    } catch (err) {
      if (force) toast(`检查更新失败：${err.message || err}`);
      else console.error(err);
      return null;
    }
  }

  function showUpdateDialog(release) {
    const ov = $('#overlay');
    const returnTo = document.activeElement;
    const box = document.createElement('div');
    box.className = 'dialog update-dialog';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', '发现新版本');
    box.innerHTML =
      `<div class="update-head"><h2>发现新版本</h2><button type="button" class="ibtn update-close" data-close aria-label="关闭">✕</button></div>` +
      `<div class="update-versions"><span class="cur">当前版本 v${esc(currentVersion())}</span><span class="arrow">→</span><span class="new">${esc(release.tag)}</span></div>` +
      (release.name ? `<p class="msg">${esc(release.name)}</p>` : '') +
      (release.body ? `<div class="update-notes">${esc(release.body)}</div>` : '') +
      '<p class="update-footnote">更新方式：从 GitHub Releases 下载新版 zip，解压覆盖插件文件夹后，在 chrome://extensions 里点“重新加载”。更新前请先导出一份加密备份。</p>' +
      '<div class="btns"><button type="button" class="btn" data-ignore>暂时忽略</button><button type="button" class="btn primary" data-go>前往 GitHub 更新</button></div>';
    const close = () => {
      updateState.dismissedTag = release.tag;
      ov.removeEventListener('keydown', onKey);
      ov.onmousedown = null;
      ov.classList.add('hidden');
      ov.innerHTML = '';
      if (returnTo && returnTo.focus && document.contains(returnTo)) returnTo.focus();
    };
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    box.querySelector('[data-close]').onclick = close;
    box.querySelector('[data-ignore]').onclick = async () => {
      state.settings = await V.setSettings({ ignoredUpdate: release.tag });
      setVersionPill(release);
      close();
    };
    box.querySelector('[data-go]').onclick = async () => {
      const url = safeReleaseUrl(release.html_url);
      try { await chrome.tabs.create({ url }); } catch (_) { /* 打开失败时用户可手动访问 Releases 页 */ }
      close();
    };
    ov.onmousedown = (e) => { if (e.target === ov) close(); };
    ov.addEventListener('keydown', onKey);
    ov.innerHTML = '';
    ov.appendChild(box);
    ov.classList.remove('hidden');
    box.querySelector('[data-go]').focus();
  }

  // 发布页链接只接受本仓库的 releases 地址，其余一律用固定 Releases 首页兜底。
  function safeReleaseUrl(raw) {
    try {
      const u = new URL(raw);
      if (u.origin === 'https://github.com' &&
          u.pathname.startsWith(`/${UPDATE_REPO_OWNER}/${UPDATE_REPO_NAME}/releases/`)) {
        return u.href.slice(0, 2048);
      }
    } catch (_) { /* 不是合法 URL，用兜底 */ }
    return UPDATE_RELEASES_URL;
  }

  /* ================= 批量读取网页真实标题 ================= */
  // 方案说明：只解析网址（deriveTitle）拿不到谷歌表格这类动态页面的名字，
  // fetch 抓 HTML 也一样（标题是 JS 渲染出来的）。所以逐个在后台标签页
  // 真实加载一次（active:false，不切换过去），读到 document.title 就立刻关闭。
  // 代价与边界：标签栏会短暂出现这些后台标签（Chrome 没有完全不可见的标签页），
  // 被打开的网站会知道你访问了它；只打开用户自己贴的网址，不注入任何脚本，
  // 每个标签页 8 秒超时、读到标题或超时都立即关闭，失败时用网址推导名兜底。
  async function fetchPageTitle(url, timeoutMs = 8000) {
    if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.create) return null;
    let tabId = null;
    try {
      const tab = await chrome.tabs.create({ url, active: false });
      tabId = tab.id;
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        await sleep(300);
        let cur;
        try { cur = await chrome.tabs.get(tabId); } catch (_) { return null; }
        const t = (cur.title || '').trim();
        if (t && t !== 'New Tab' && t !== '新标签页' && t !== url) {
          // 再等一拍，确认动态标题已稳定（谷歌表格等单页应用标题会改几次）。
          await sleep(400);
          try {
            const cur2 = await chrome.tabs.get(tabId);
            const t2 = (cur2.title || '').trim();
            return (t2 || t).slice(0, 200);
          } catch (_) {
            return t.slice(0, 200);
          }
        }
        if (cur.status === 'complete' && Date.now() - start > 3000) return null;
      }
      return null;
    } catch (_) {
      return null;
    } finally {
      if (tabId != null) {
        try { await chrome.tabs.remove(tabId); } catch (_) { /* 已关就不用再关 */ }
      }
    }
  }

  function showTitleProgress(total) {
    const ov = $('#overlay');
    const box = document.createElement('div');
    box.className = 'dialog';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', '正在读取网页标题');
    box.innerHTML =
      '<h2>正在静默读取网页标题…</h2>' +
      '<p class="msg">已在后台标签页打开网页读取标题，读完会立即关闭，不会切换到这些标签页。</p>' +
      '<div class="progress-bar"><i></i></div>' +
      '<p class="msg progress-text"></p>' +
      '<div class="btns"><button type="button" class="btn" data-cancel>取消读取，用推导名称添加</button></div>';
    let cancelled = false;
    box.querySelector('[data-cancel]').onclick = () => { cancelled = true; };
    ov.onmousedown = null; // 清掉上一个对话框残留的遮罩点击处理，避免点遮罩时把进度条顶掉
    ov.innerHTML = '';
    ov.appendChild(box);
    ov.classList.remove('hidden');
    const bar = box.querySelector('.progress-bar i');
    const text = box.querySelector('.progress-text');
    return {
      update(done, label) {
        bar.style.width = (total ? Math.round((done / total) * 100) : 0) + '%';
        text.textContent = `${done} / ${total}${label ? `　${label}` : ''}`;
      },
      isCancelled: () => cancelled,
      hide() { ov.onmousedown = null; ov.classList.add('hidden'); ov.innerHTML = ''; },
    };
  }

  // 批量添加的真正执行：先给没写名称的逐个读取真实标题，再一次性保存（可撤销）。
  async function addBulkEntries(text, folderId) {
    const { entries, bad } = parseBulk(text);
    if (!entries.length) {
      toast(bad.length ? '没有找到有效的网址，请检查格式' : '请先贴入至少一个链接');
      return;
    }
    const needsFetch = entries.filter((e) => !e.explicit);
    let fetched = 0;
    let failed = 0;
    if (needsFetch.length && typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      let goFetch = true;
      if (needsFetch.length > 15) {
        const go = await dialog({
          title: '读取网页标题',
          ok: '继续读取标题',
          cancel: '直接添加（推导名称）',
          message: `共 ${needsFetch.length} 个网址没有写名称，需要逐个在后台标签页打开读取真实标题，可能需要一段时间。\n取消则直接用网址推导的名称添加，之后仍可逐个编辑。`,
        });
        goFetch = !!go;
      }
      if (goFetch) {
        const prog = showTitleProgress(needsFetch.length);
        try {
          for (let i = 0; i < needsFetch.length; i++) {
            if (prog.isCancelled()) break;
            prog.update(i, needsFetch[i].url);
            const t = await fetchPageTitle(needsFetch[i].url);
            if (t) { needsFetch[i].title = t; fetched++; } else { failed++; }
            prog.update(i + 1, needsFetch[i].url);
          }
        } finally {
          prog.hide();
        }
        if (prog.isCancelled()) toast('已取消读取标题，剩余网址改用推导名称', null, { ms: 3500 });
      }
    }
    let added = 0;
    let dup = 0;
    await mutate((v) => {
      const seen = new Set(v.items.filter((i) => (i.folderId || null) === folderId).map((i) => i.url));
      const t = Date.now();
      for (const e of entries) {
        if (seen.has(e.url)) { dup++; continue; }
        seen.add(e.url);
        v.items.push({ id: V.uid(), title: e.title || e.url, url: e.url, folderId, addedAt: t + added });
        added++;
      }
    }, {
      undo: true,
      msg: () => `已添加 ${added} 个书签到“${folderLabel(folderId)}”${fetched ? `，其中 ${fetched} 个读取到真实标题` : ''}${failed ? `，${failed} 个读取失败改用推导名称` : ''}${dup ? `，跳过重复 ${dup} 个` : ''}${bad.length ? `，忽略 ${bad.length} 行` : ''}`,
    });
    if (folderId !== state.cur) go(folderId);
  }

  /* ================= 修改数据 ================= */
  async function mutate(fn, { msg, undo } = {}) {
    const before = undo ? structuredClone(state.vault) : null;
    await fn(state.vault);
    try {
      await V.save(state.vault);
    } catch (err) {
      // 保存失败（如存储配额）时不让界面显示“已保存”的假状态：
      // 尽量从磁盘读回旧数据同步界面，并明确告诉用户。
      try { state.vault = await V.load(); } catch (_) { if (before) state.vault = before; }
      reindex();
      if (state.cur && !state.ix.folders.has(state.cur)) state.cur = null;
      renderAll();
      toast('保存失败：' + (err && err.message ? err.message : err) + '，请导出备份后重试', null, { ms: 6000 });
      return;
    }
    reindex();
    if (state.cur && !state.ix.folders.has(state.cur)) state.cur = null;
    renderAll();
    markDirty();
    const text = typeof msg === 'function' ? msg() : msg;
    if (text) {
      toast(text, undo ? async () => {
        state.vault = before;
        await V.save(before);
        reindex();
        if (state.cur && !state.ix.folders.has(state.cur)) state.cur = null;
        renderAll();
        markDirty();
      } : null);
    }
  }

  async function activeTabInfo() {
    if (FULL) return {};
    try {
      const [t] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (t && /^https?:/i.test(t.url || '')) return { title: t.title || '', url: t.url };
    } catch (_) { /* 拿不到就留空 */ }
    return {};
  }

  async function addBookmark() {
    const pre = await activeTabInfo();
    const res = await dialog({
      title: '添加书签',
      ok: '添加',
      fields: [
        { key: 'title', label: '名称', value: pre.title || '' },
        { key: 'url', label: '网址', value: pre.url || '', placeholder: 'https://' },
        { key: 'folder', label: '文件夹', type: 'select', options: folderOptions(), value: state.cur || '' },
      ],
      validate: (v) => (normalizeUrl(v.url) ? null : '请输入有效的网址'),
    });
    if (!res) return;
    const url = normalizeUrl(res.url);
    const folderId = real(res.folder);
    await mutate((v) => {
      v.items.push({ id: V.uid(), title: res.title.trim() || deriveTitle(url), url, folderId, addedAt: Date.now() });
    }, { msg: `已添加到“${folderLabel(folderId)}”` });
    if (folderId !== state.cur) go(folderId);
  }

  // 批量添加：贴一堆链接，每行一个。没写名称的，在展开页用后台标签页
  // 读取真实标题；弹窗里做不到这一点（打开标签页会关掉弹窗），所以弹窗
  // 里贴好后会先转到展开页再读取——已写名称的则直接在弹窗里添加，不跳转。
  async function bulkAdd() {
    let warnedFor = null;
    const res = await dialog({
      title: '批量添加书签',
      ok: '添加',
      wide: true,
      message: '每行一个。只写网址也可以，会在后台标签页静默打开读取真实标题（读完立即关闭，不会切换过去，谷歌表格等动态页面也能读到名字）；也可以写成“名称 | 网址”指定名称，指定的名称优先，不会再打开网页。\n在弹窗里批量添加时，会先转到展开页再读取标题。\nCtrl+Enter 可直接提交。',
      fields: [
        { key: 'text', label: '链接列表', type: 'textarea', rows: 8, placeholder: 'https://example.com/how-to-cook\nhttps://example.org/notes\n我的笔记 | https://example.net/page' },
        { key: 'folder', label: '放进文件夹', type: 'select', options: folderOptions(), value: state.cur || '' },
      ],
      validate: (v) => {
        const { entries, bad } = parseBulk(v.text);
        if (!entries.length) return bad.length ? '没有找到有效的网址，请检查格式' : '请先贴入至少一个链接';
        if (bad.length && warnedFor !== v.text) {
          warnedFor = v.text;
          return `有 ${bad.length} 行无法识别（如：${short(bad[0], 24)}）。再点一次“添加”会忽略这些行。`;
        }
        return null;
      },
    });
    if (!res) return;
    const folderId = real(res.folder);
    const { entries } = parseBulk(res.text);
    const needsFetch = entries.some((e) => !e.explicit);
    if (!FULL && needsFetch && entries.length) {
      try { await V.giveHandoff({ folder: folderId, hint: 'bulk', bulkText: res.text }); } catch (_) { /* 交接失败就留在弹窗里直接添加 */ }
      try {
        await chrome.tabs.create({ url: chrome.runtime.getURL('manager.html') });
        window.close();
        return;
      } catch (_) {
        // 打不开展开页就退回弹窗里直接添加，并清掉未消费的交接记录，
        // 避免 15 秒内下一次打开展开页时误触发批量添加。
        try { await V.clearHandoff(); } catch (_) { /* 无所谓 */ }
      }
    }
    await addBulkEntries(res.text, folderId);
  }

  async function editItem(it) {
    const res = await dialog({
      title: '编辑书签',
      fields: [
        { key: 'title', label: '名称', value: it.title },
        { key: 'url', label: '网址', value: it.url },
        { key: 'folder', label: '文件夹', type: 'select', options: folderOptions(), value: it.folderId || '' },
      ],
      validate: (v) => (normalizeUrl(v.url) ? null : '请输入有效的网址'),
    });
    if (!res) return;
    const url = normalizeUrl(res.url);
    await mutate((v) => {
      const x = v.items.find((i) => i.id === it.id);
      if (!x) return;
      x.title = res.title.trim() || deriveTitle(url);
      x.url = url;
      x.folderId = real(res.folder);
    });
  }

  async function newFolder(parentId) {
    const res = await dialog({
      title: '新建文件夹',
      ok: '创建',
      fields: [
        { key: 'name', label: '名称', value: '' },
        { key: 'parent', label: '位置', type: 'select', options: folderOptions(), value: parentId || state.cur || '' },
      ],
      validate: (v) => (v.name.trim() ? null : '请输入文件夹名称'),
    });
    if (!res) return;
    const id = V.uid();
    await mutate((v) => { v.folders.push({ id, name: res.name.trim(), parentId: real(res.parent) }); });
    expandTo(id);
    renderAll();
  }

  async function renameFolder(f) {
    const res = await dialog({
      title: '重命名文件夹',
      fields: [{ key: 'name', label: '名称', value: f.name }],
      validate: (v) => (v.name.trim() ? null : '请输入文件夹名称'),
    });
    if (!res) return;
    await mutate((v) => {
      const x = v.folders.find((x) => x.id === f.id);
      if (x) x.name = res.name.trim();
    });
  }

  const removeItem = (it) => mutate((v) => {
    v.items = v.items.filter((x) => x.id !== it.id);
  }, { msg: `已删除“${short(it.title)}”`, undo: true });

  async function removeFolder(f) {
    const n = state.ix.counts.get(f.id) || 0;
    await mutate((v) => {
      const gone = new Set();
      const stack = [f.id];
      while (stack.length) {
        const id = stack.pop();
        if (gone.has(id)) continue;
        gone.add(id);
        v.folders.filter((x) => x.parentId === id).forEach((x) => stack.push(x.id));
      }
      v.items = v.items.filter((i) => !gone.has(i.folderId));
      v.folders = v.folders.filter((x) => !gone.has(x.id));
    }, { msg: `已删除文件夹“${short(f.name)}”${n ? `（含 ${n} 个书签）` : ''}`, undo: true });
  }

  async function moveTo(kind, id, targetDomId) {
    const targetId = real(targetDomId);
    if (targetId && !state.ix.folders.has(targetId)) return;
    const label = short(folderLabel(targetId));
    if (kind === 'folder') {
      const f = state.ix.folders.get(id);
      if (!f || (f.parentId || null) === targetId || (targetId && isUnder(targetId, id))) return;
      await mutate((v) => { v.folders.find((x) => x.id === id).parentId = targetId; }, { msg: `已移动到“${label}”`, undo: true });
    } else {
      const it = state.vault.items.find((i) => i.id === id);
      if (!it || (it.folderId || null) === targetId) return;
      await mutate((v) => { v.items.find((x) => x.id === id).folderId = targetId; }, { msg: `已移动到“${label}”`, undo: true });
    }
    if (targetId) state.expanded.add(targetId);
    renderTree();
  }

  /* ================= 拖拽移动 ================= */
  let lastDrop = null;
  const clearDrop = () => { if (lastDrop) lastDrop.classList.remove('drop'); lastDrop = null; };
  const dropTarget = (e) => {
    const el = e.target.closest && e.target.closest('[data-folder],[data-crumb]');
    return el ? { el, id: el.dataset.folder || el.dataset.crumb } : null;
  };
  const canDrop = (domId) => {
    const d = state.drag;
    const targetId = real(domId);
    if (!d || (targetId && !state.ix.folders.has(targetId))) return false;
    if (d.kind === 'folder') {
      const f = state.ix.folders.get(d.id);
      return !!f && (f.parentId || null) !== targetId && !(targetId && isUnder(targetId, d.id));
    }
    const it = state.vault.items.find((i) => i.id === d.id);
    return !!it && (it.folderId || null) !== targetId;
  };

  document.addEventListener('dragstart', (e) => {
    const el = e.target.closest && e.target.closest('[draggable="true"]');
    if (!el) return;
    state.drag = el.dataset.item ? { kind: 'item', id: el.dataset.item } : { kind: 'folder', id: el.dataset.folder };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'private-bookmark');
    el.classList.add('dragging');
  });
  document.addEventListener('dragend', () => {
    state.drag = null;
    clearDrop();
    document.querySelectorAll('.dragging').forEach((n) => n.classList.remove('dragging'));
  });
  document.addEventListener('dragover', (e) => {
    if (!state.drag) return;
    const t = dropTarget(e);
    if (t && canDrop(t.id)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (lastDrop !== t.el) { clearDrop(); lastDrop = t.el; t.el.classList.add('drop'); }
    } else {
      clearDrop();
    }
  });
  document.addEventListener('drop', (e) => {
    if (!state.drag) return;
    const t = dropTarget(e);
    if (!t || !canDrop(t.id)) return;
    e.preventDefault();
    const d = state.drag;
    state.drag = null;
    clearDrop();
    moveTo(d.kind, d.id, t.id);
  });

  /* ================= 顶栏按钮 ================= */
  $('#btn-add').addEventListener('click', addBookmark);
  $('#btn-bulk').addEventListener('click', bulkAdd);
  $('#version-pill').addEventListener('click', () => checkForUpdates({ force: true, showDialog: true, showLatestToast: true }));
  $('#btn-folder').addEventListener('click', () => newFolder());
  $('#btn-lock').addEventListener('click', lockNow);

  // 在新标签页打开展开页；带一次性令牌（含解锁密钥，15 秒内有效、读取即删），所以不用再输密码
  async function openExpanded(hint) {
    try { await V.giveHandoff({ folder: state.cur, hint }); } catch (_) { /* 展开后需要再输一次密码 */ }
    try {
      await chrome.tabs.create({ url: chrome.runtime.getURL('manager.html') });
    } catch (err) {
      try { await V.clearHandoff(); } catch (_) { /* 无所谓 */ }
      throw err;
    }
    window.close();
  }
  $('#btn-expand').addEventListener('click', () => openExpanded());

  const LOCK_LABEL = { 0: '立即上锁', 60000: '解锁后 1 分钟', 300000: '解锁后 5 分钟', 3600000: '解锁后 1 小时' };

  $('#btn-more').addEventListener('click', async () => {
    const r = $('#btn-more').getBoundingClientRect();
    const s = await V.getSettings();
    state.settings = s;
    const dirState = await V.backupDirState(false);
    const legacyN = state.vault.items.filter((i) => i.legacy).length;
    const last = s.lastBackupAt ? `（上次 ${fmtTime(s.lastBackupAt)}）` : '';
    const dirLabel = dirState === 'none' ? '备份文件夹：未设置（点击选择）'
      : dirState === 'granted' ? `备份文件夹：${s.backupDirName || ''}/备份`
        : `备份文件夹：${s.backupDirName || ''}（需要重新授权，点击）`;
    const entries = [
      { label: '批量添加书签…', icon: 'bulk', run: bulkAdd },
      ...(state.cur ? [{ label: `打开当前文件夹全部书签（${state.ix.counts.get(state.cur) || 0} 个，含子文件夹）`, icon: 'tab', run: () => openAllInFolder(state.cur) }] : []),
      '-',
      { label: '导入备份文件…', icon: 'upload', run: () => importBackup() },
      { label: '导出备份文件…', icon: 'download', run: exportBackup },
      { label: s.autoBackup ? `自动备份：已开启${last}` : '自动备份：已关闭（点击开启）', icon: 'backup', run: toggleAutoBackup },
      { label: dirLabel, icon: 'folder', run: () => (dirState === 'prompt' && FULL ? reauthorizeDir() : chooseBackupDir()) },
      '-',
      { label: `上锁时间：${LOCK_LABEL[s.lockAfter || 0] || '立即上锁'}`, icon: 'timer', run: setLockTime },
      { label: '修改密码…', icon: 'key', run: changePw },
    ];
    if (legacyN) entries.push('-', { label: `清理旧版导入的浏览器书签（${legacyN}）`, icon: 'close', run: removeLegacy });
    showMenu(r.right, r.bottom + 4, entries, true);
  });

  /* ================= 上锁时间 / 修改密码 ================= */
  async function setLockTime() {
    const cur = (state.settings || {}).lockAfter || 0;
    const res = await dialog({
      title: '上锁时间',
      message: '解锁后多久再要求输入密码。\n选“立即上锁”最安全：关掉弹窗/页面就要重新输入。\n选其它时间：在这段时间内，打开弹窗或展开页不用再输密码。',
      fields: [{
        key: 'ms', label: '解锁后', type: 'select', value: String(cur),
        options: Object.entries(LOCK_LABEL).map(([value, label]) => ({ value, label: value === '0' ? '立即上锁（默认，最安全）' : label.replace('解锁后 ', '') + '后上锁' })),
      }],
    });
    if (!res) return;
    const ms = Number(res.ms);
    if (!Object.prototype.hasOwnProperty.call(LOCK_LABEL, String(res.ms)) || !Number.isFinite(ms)) return;
    state.settings = await V.setSettings({ lockAfter: ms });
    if (ms === 0) await V.forget(); // 改成“立即”：马上清掉已经放行的密钥
    toast(ms === 0 ? '已改为立即上锁' : `已设置：下次解锁后 ${LOCK_LABEL[ms].replace('解锁后 ', '')} 内不用再输密码`, null, { ms: 3500 });
  }

  async function changePw() {
    const res = await dialog({
      title: '修改密码',
      ok: '修改',
      fields: [
        { key: 'old', label: '当前密码', type: 'password' },
        { key: 'n1', label: `新密码（至少 ${MIN_PW} 位）`, type: 'password' },
        { key: 'n2', label: '再次输入新密码', type: 'password' },
      ],
      validate: (v) => (!v.old ? '请输入当前密码' : v.n1.length < MIN_PW ? `新密码至少 ${MIN_PW} 位` : v.n1 !== v.n2 ? '两次输入的新密码不一致' : null),
    });
    if (!res) return;
    if (await V.changePassword(res.old, res.n1)) toast('密码已修改。之前的备份文件仍需要用“当时的密码”打开', null, { ms: 5000 });
    else toast('当前密码不对', null, { ms: 3500 });
  }

  /* ================= 备份：导出 / 导入 / 自动备份 ================= */

  const p2 = (n) => String(n).padStart(2, '0');
  const fmtTime = (ms, withYear) => {
    const d = new Date(ms);
    return `${withYear ? d.getFullYear() + '-' : ''}${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
  };
  const stamp = () => { const d = new Date(); return `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}_${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`; };

  function saveAs(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000); // 大文件下载启动可能较慢，与 store.js 的 downloadFile 一致
  }

  async function exportBackup() {
    const res = await dialog({
      title: '导出备份文件',
      ok: '导出',
      message: '加密备份：打开时需要备份当时的密码，丢了也不会泄露书签。\n明文备份：任何人拿到文件都能直接看到全部链接，只在要迁移到别处时用，用完请删除。',
      fields: [{ key: 'mode', label: '格式', type: 'select', value: 'enc', options: [{ value: 'enc', label: '加密备份（推荐）' }, { value: 'plain', label: '明文备份（不加密）' }] }],
    });
    if (!res) return;
    if (res.mode === 'plain') {
      saveAs(`私密书签明文备份_${stamp()}.json`, V.plainBackupText(state.vault));
      toast('明文备份已保存到下载文件夹，请妥善保管并尽快删除', null, { ms: 5000 });
      return;
    }
    saveAs(`私密书签备份_${stamp()}.json`, await V.encryptedBackupText());
    state.settings = await V.setSettings({ lastBackupAt: Date.now(), dirty: false });
    renderStatus();
    toast('加密备份文件已保存到下载文件夹');
  }

  function pickFile() {
    return new Promise((resolve) => {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = '.json,application/json';
      inp.style.display = 'none';
      const done = (f) => { inp.remove(); resolve(f); };
      inp.addEventListener('change', () => done(inp.files[0] || null));
      inp.addEventListener('cancel', () => done(null));
      document.body.appendChild(inp);
      inp.click();
    });
  }

  // 读取备份文件。加密备份会先试当前密钥，不行再让用户输入“备份当时的密码”
  async function readBackup(file) {
    if (file.size > 50 * 1024 * 1024) throw new Error('文件太大，不像是书签备份');
    const parsed = V.parseBackup(await file.text());
    if (!parsed.encrypted) return parsed;
    if (V.isUnlocked()) {
      const r = await V.openEncrypted(parsed.blob);
      if (r) return r;
    }
    for (let i = 0; i < 5; i++) {
      const res = await dialog({
        title: '输入备份密码',
        ok: '解密',
        message: (i ? '密码不对，请再试一次。\n\n' : '') + '这是加密备份。请输入创建这份备份时使用的密码（通常就是当时的解锁密码）。',
        fields: [{ key: 'pw', label: '备份密码', type: 'password' }],
        validate: (v) => (v.pw ? null : '请输入密码'),
      });
      if (!res) { const e = new Error('已取消'); e.cancelled = true; throw e; }
      const r = await V.openEncrypted(parsed.blob, res.pw);
      if (r) return r;
    }
    throw new Error('密码多次错误，已放弃');
  }

  async function importBackup(opts = {}) {
    // 弹窗里打开系统文件选择框会让弹窗被关掉，所以去展开页里选文件
    if (!FULL) return openExpanded('import');
    if (opts.askFirst) { // 从弹窗跳转过来：先弹一个对话框，用户点按钮才能打开文件选择框
      const ok = await dialog({
        title: '导入备份',
        ok: '选择备份文件…',
        message: '请选择之前导出或自动保存的备份文件（.json）。\n支持本版本的加密备份，也支持旧版（1.0 / 2.x）的备份。',
      });
      if (!ok) return;
    }
    const file = await pickFile();
    if (!file) return;

    let backup;
    try { backup = await readBackup(file); } catch (err) { if (!err.cancelled) toast(err.message || '读取备份失败', null, { ms: 5000 }); return; }

    const when = backup.exportedAt && !isNaN(new Date(backup.exportedAt)) ? fmtTime(new Date(backup.exportedAt).getTime(), true) : '未知时间';
    const res = await dialog({
      title: '导入备份',
      ok: '导入',
      message:
        `文件：${file.name}\n内容：${backup.items.length} 个书签、${backup.folders.length} 个文件夹（备份于 ${when}）\n\n` +
        '“合并”只会补上当前没有的书签，不会删除任何东西。\n“替换”会用备份覆盖当前私密库；替换前会先把当前内容另存一份加密备份。',
      fields: [{
        key: 'mode', label: '导入方式', type: 'select', value: 'merge',
        options: [{ value: 'merge', label: '合并到当前私密库（推荐）' }, { value: 'replace', label: '替换当前私密库' }],
      }],
    });
    if (!res) return;

    if (res.mode === 'replace' && state.vault.items.length) {
      try { await V.writeBackup(`替换前_${stamp()}.json`, await V.encryptedBackupText()); } catch (err) {
        console.error(err);
        toast('没能先备份当前内容，为安全起见已取消替换', null, { ms: 5000 });
        return;
      }
    }

    let n = 0;
    await mutate((v) => { n = V.applyBackup(v, backup, res.mode); }, {
      undo: true,
      msg: () => (res.mode === 'replace' ? `已用备份替换，共 ${n} 个书签` : n ? `已合并，新增 ${n} 个书签` : '备份里的书签当前都已经有了，没有新增'),
    });
    (state.ix.kids.get('') || []).forEach((f) => state.expanded.add(f.id));
    renderAll();
  }

  const BACKUP_QUIET = 45 * 1000;   // 改动之后安静这么久再备份：一次连续的整理只会产生一次备份
  const BACKUP_GAP = 2 * 60 * 1000; // 两次自动备份之间的最短间隔
  let backupTimer = null;

  function scheduleBackup(ms) {
    clearTimeout(backupTimer);
    backupTimer = setTimeout(() => backupIfDue().catch((err) => console.error(err)), ms);
  }

  // 每次改动后调用：记一笔“有没备份的改动”，并安排稍后备份
  async function markDirty() {
    try {
      const s = await V.getSettings();
      state.settings = s;
      if (!s.autoBackup || !state.vault) return;
      if (!s.dirty) state.settings = await V.setSettings({ dirty: true });
      scheduleBackup(BACKUP_QUIET);
    } catch (err) {
      console.error(err);
    }
  }

  // mode：'normal' 有改动且距上次够久才写；'now' 不管间隔（关闭页面时）；'force' 无条件写
  async function backupIfDue(mode = 'normal') {
    const s = await V.getSettings();
    state.settings = s;
    if (!s.autoBackup || !state.vault) return;
    if (mode !== 'force' && !(s.dirty || !s.lastBackupAt)) return;
    const wait = BACKUP_GAP - (Date.now() - (s.lastBackupAt || 0));
    if (mode === 'normal' && wait > 0) { scheduleBackup(wait + 500); return; }
    try {
      if (await V.autoBackupNow(state.vault)) {
        state.settings = await V.getSettings();
        renderStatus();
      }
    } catch (err) {
      console.error(err);
      toast('自动备份失败，请先用“导出备份文件”手动备份一份', null, { ms: 6000 });
    }
  }

  async function reauthorizeDir() {
    const st = await V.backupDirState(true);
    renderStatus();
    toast(st === 'granted' ? '备份文件夹已重新授权' : '没有授权，备份会先存到下载文件夹', null, { ms: 4000 });
    if (st === 'granted') backupIfDue('force');
  }

  // 选择备份文件夹：请选插件所在的文件夹，会在里面创建「备份」子文件夹
  async function chooseBackupDir() {
    if (!FULL) return openExpanded('backupdir'); // 选文件夹的系统窗口会让弹窗关闭，所以到展开页里选
    if (!window.showDirectoryPicker) { toast('当前浏览器不支持选择文件夹，备份会保存到「下载/私密书签备份」', null, { ms: 5000 }); return false; }
    const go = await dialog({
      title: '选择备份文件夹',
      ok: '选择文件夹…',
      message:
        '浏览器不允许扩展自己写入任意位置，所以需要你选一次。\n\n' +
        '请选择本插件所在的文件夹（加载“已解压的扩展程序”时选的那个，里面有 manifest.json）。会在里面创建「备份」文件夹，自动备份和替换前的备份都放那里。\n\n' +
        '提示：备份会跟着这个文件夹走；但如果把整个文件夹删掉，备份也会一起没了，所以重要备份建议再复制一份到别处。',
    });
    if (!go) return false;
    let h;
    try {
      h = await window.showDirectoryPicker({ id: 'pbv-backup', mode: 'readwrite' });
    } catch (err) {
      if (!err || err.name !== 'AbortError') { console.error(err); toast('无法使用这个文件夹：' + ((err && err.message) || err), null, { ms: 6000 }); }
      return false;
    }
    let isPlugin = true;
    try { await h.getFileHandle('manifest.json'); } catch (_) { isPlugin = false; }
    if (!isPlugin) {
      const ok = await dialog({
        title: '这不像插件所在的文件夹',
        ok: '仍然使用',
        message: `“${h.name}”里没有 manifest.json。\n仍然要把备份放在这个文件夹里的「备份」下吗？`,
      });
      if (!ok) return false;
    }
    try {
      await h.getDirectoryHandle(V.BACKUP_DIR, { create: true });
      await V.setBackupDir(h);
    } catch (err) {
      console.error(err);
      toast('这个文件夹没法写入，请换一个', null, { ms: 5000 });
      return false;
    }
    state.settings = await V.getSettings();
    toast(`备份文件夹已设置：${h.name}/${V.BACKUP_DIR}`, null, { ms: 4500 });
    if (state.settings.autoBackup) await backupIfDue('force');
    renderStatus();
    return true;
  }

  async function enableAutoBackup() {
    state.settings = await V.setSettings({ autoBackup: true });
    if (FULL && (await V.backupDirState(false)) === 'none') await chooseBackupDir();
    await backupIfDue('force');
    state.settings = await V.getSettings();
    renderStatus();
    const s = state.settings;
    if (s.lastBackupWhere === 'folder') toast('自动备份已开启，文件在备份文件夹里', null, { ms: 4500 });
    else toast('自动备份已开启：目前保存到「下载/私密书签备份」。想放到插件文件夹里，请在展开页 ⋮ → 备份文件夹', null, { ms: 6500 });
  }

  async function toggleAutoBackup() {
    const s = await V.getSettings();
    if (s.autoBackup) {
      state.settings = await V.setSettings({ autoBackup: false });
      renderStatus();
      toast('已关闭自动备份');
    } else {
      await enableAutoBackup();
    }
  }

  async function askAutoBackupOnce() {
    if (state.settings.autoBackup !== undefined) return;
    const yes = await dialog({
      title: '防止记录丢失',
      ok: '开启自动备份',
      cancel: '暂不开启',
      message:
        '卸载扩展、重装系统或换电脑后，扩展里保存的数据会一起消失。\n\n' +
        '建议开启自动备份：整理书签后，会自动保存一份加密备份（按星期轮换，最多 7 个文件）。' +
        (FULL ? '下一步可以选择放在插件所在文件夹的「备份」里。' : '默认存到「下载/私密书签备份」；想放到插件文件夹，请在展开页里设置。') +
        '\n\n备份是加密的，恢复时需要备份当时的密码。',
    });
    if (yes) await enableAutoBackup();
    else state.settings = await V.setSettings({ autoBackup: false });
  }

  // 关闭页面/弹窗时，补做还没备份的改动（尽力而为）
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && state.vault) backupIfDue('now').catch(() => {});
  });

  /* ================= 全局键盘 ================= */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!$('#menu').classList.contains('hidden')) { hideMenu(); if (menuReturnFocus && menuReturnFocus.focus) menuReturnFocus.focus(); return; }
      if (document.activeElement === $('#search') && state.q) { $('#search').value = ''; state.q = ''; renderAll(); }
      return;
    }
    const typing = /^(INPUT|SELECT|TEXTAREA)$/.test((document.activeElement || {}).tagName || '');
    if (typing || $('#app').classList.contains('hidden') || !$('#overlay').classList.contains('hidden')) return;
    if (e.key === '/') { e.preventDefault(); $('#search').focus(); }
    else if (e.key === 'Backspace' && !state.q && state.cur) {
      const f = state.ix.folders.get(state.cur);
      if (f) { e.preventDefault(); go(f.parentId); }
    }
  });

  /* ================= 启动 ================= */
  (async function boot() {
    setVersionPill(null);
    setupLock(!(await V.hasPassword()));
    $('#pin').focus();
    try {
      // 从弹窗点“展开”过来的：不用再输一次密码
      if (FULL) {
        const h = await V.takeHandoff();
        if (h) {
          await enterVault({ folder: h.folder, until: (await V.getSettings()).lockAfter > 0 ? await V.resume() : null });
          if (h.hint === 'import') importBackup({ askFirst: true });
          if (h.hint === 'backupdir') chooseBackupDir();
          if (h.hint === 'bulk' && h.bulkText) await addBulkEntries(h.bulkText, real(h.folder));
          return;
        }
      }
      // “解锁后 N 分钟再上锁”：时间没到就直接进
      const until = await V.resume();
      if (until) await enterVault({ until });
    } catch (err) {
      console.error(err); // 没有就走正常解锁
    }
  })();
})();
