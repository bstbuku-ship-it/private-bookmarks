// 后台做两件事：
// 1) 到了“上锁时间”就把内存里的解锁密钥清掉（页面读取时也会检查有效期，这里只是及时清理）。
// 2) 检查 GitHub Release，回答扩展页面的更新查询。只请求公开的 Release 信息，
//    不发送任何书签、密码或个人信息；返回的字段经过白名单与长度校验。
'use strict';

// ---------- 上锁定时器 ----------
chrome.alarms.onAlarm.addListener(async (a) => {
  if (a.name !== 'relock') return;
  try {
    const s = (await chrome.storage.session.get('unlock')).unlock;
    // 只接受形状正确的会话记录；被篡改/损坏的记录直接清掉，不按它续期。
    if (!s || typeof s !== 'object' || typeof s.until !== 'number' || !(s.until > Date.now() + 500)) await chrome.storage.session.remove('unlock');
  } catch (err) {
    console.error(err);
  }
});

// ---------- 更新检查 ----------
const UPDATE_REPO_OWNER = 'bstbuku-ship-it';
const UPDATE_REPO_NAME = 'private-bookmarks';
const UPDATE_API_URL = `https://api.github.com/repos/${UPDATE_REPO_OWNER}/${UPDATE_REPO_NAME}/releases/latest`;
const UPDATE_RELEASES_URL = `https://github.com/${UPDATE_REPO_OWNER}/${UPDATE_REPO_NAME}/releases`;
const CACHE_KEY = 'pb_update_cache';
const RATELIMIT_KEY = 'pb_update_ratelimit_until';
const CACHE_TTL_MS = 6 * 3600 * 1000; // 6 小时
const FORCE_THROTTLE_MS = 10000; // 手动检查至少间隔 10 秒
const MAX_BACKOFF_MS = 3600 * 1000; // 限流退避最多 1 小时
const MAX_TAG_LEN = 100;
const MAX_NAME_LEN = 500;
const MAX_BODY_LEN = 20000;
const MAX_URL_LEN = 2048;

let lastForceAt = 0;

// "v1.2.3" / "1.2.3" -> [1,2,3]；非法返回 null。每段最多 9 位数字，
// 锚定整串匹配，避免 "1.2.3abc"、"1.2.3.4" 之类被当成合法版本号。
function parseVersion(tag) {
  if (typeof tag !== 'string') return null;
  const m = tag.trim().replace(/^v/i, '').match(/^(\d{1,9})\.(\d{1,9})(?:\.(\d{1,9}))?$/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3] || 0)];
}

// 发布页链接只接受本仓库的 releases 地址，其余一律用固定 Releases 首页兜底。
function safeReleaseUrl(raw) {
  try {
    const u = new URL(raw);
    if (u.origin === 'https://github.com' &&
        u.pathname.startsWith(`/${UPDATE_REPO_OWNER}/${UPDATE_REPO_NAME}/releases/`)) {
      return u.href.slice(0, MAX_URL_LEN);
    }
  } catch (_) { /* 不是合法 URL，用兜底 */ }
  return UPDATE_RELEASES_URL;
}

function sanitizeRelease(data) {
  if (!data || typeof data !== 'object') return null;
  // 接受 GitHub API 的 tag_name，也接受已缓存过的 tag（本函数对缓存再校验时是幂等的）。
  const rawTag = typeof data.tag_name === 'string' ? data.tag_name : (typeof data.tag === 'string' ? data.tag : null);
  if (!rawTag || !parseVersion(rawTag)) return null;
  const tag = rawTag.slice(0, MAX_TAG_LEN);
  const name = typeof data.name === 'string' ? data.name.slice(0, MAX_NAME_LEN) : tag;
  const body = typeof data.body === 'string' ? data.body.slice(0, MAX_BODY_LEN) : '';
  return { tag, name, body, html_url: safeReleaseUrl(data.html_url) };
}

function rateLimitErrorMessage(status, data, headers) {
  const msg = data && typeof data.message === 'string' ? data.message.slice(0, 200) : '';
  let resetMs = 0;
  const reset = headers.get('x-ratelimit-reset');
  if (reset && Number.isFinite(Number(reset))) resetMs = Number(reset) * 1000;
  const retryAfter = headers.get('retry-after');
  if (!resetMs && retryAfter && Number.isFinite(Number(retryAfter))) resetMs = Date.now() + Number(retryAfter) * 1000;
  const until = resetMs ? Math.min(resetMs, Date.now() + MAX_BACKOFF_MS) : Date.now() + 60000;
  const minutes = Math.max(1, Math.ceil((until - Date.now()) / 60000));
  return { until, text: `GitHub 返回 ${status}（API 调用次数已用完，约 ${minutes} 分钟后恢复${msg ? `：${msg}` : ''}）` };
}

async function checkRelease(force) {
  const now = Date.now();
  const cachedRaw = (await chrome.storage.local.get(CACHE_KEY))[CACHE_KEY];
  // 缓存也要重新校验：存储里的记录可能被损坏或篡改，不能直接信任上次存的形状。
  const cached = cachedRaw && cachedRaw.release && typeof cachedRaw.checkedAt === 'number'
    ? { release: sanitizeRelease(cachedRaw.release), checkedAt: cachedRaw.checkedAt }
    : null;
  const rateLimitUntil = Number((await chrome.storage.local.get(RATELIMIT_KEY))[RATELIMIT_KEY]) || 0;

  if (force && now - lastForceAt < FORCE_THROTTLE_MS && cached && cached.release) {
    return cached.release; // 10 秒节流：直接用缓存，不再发请求
  }
  if (!force && cached && cached.release && now - cached.checkedAt < CACHE_TTL_MS) {
    return cached.release; // 6 小时缓存
  }
  if (rateLimitUntil > now) {
    if (cached && cached.release) return cached.release; // 退避期内用缓存，不再发请求
    throw new Error(`GitHub API 调用次数已用完，约 ${Math.max(1, Math.ceil((rateLimitUntil - now) / 60000))} 分钟后恢复`);
  }

  if (force) lastForceAt = now;

  let res;
  try {
    // 15 秒超时：请求挂起时不让扩展页面的查询永远等不到回复（页面侧另有 20 秒超时兜底）。
    const timeoutSignal = (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function')
      ? AbortSignal.timeout(15000)
      : undefined;
    res = await fetch(UPDATE_API_URL, {
      signal: timeoutSignal,
      headers: {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'private-bookmarks-update-check'
      }
    });
  } catch (err) {
    throw new Error(`无法连接 GitHub：${err && err.message ? err.message : String(err)}`);
  }

  if (res.status === 404) {
    await chrome.storage.local.remove(RATELIMIT_KEY);
    return null; // 还没有任何 Release
  }
  if (res.status === 403 || res.status === 429) {
    let data = null;
    try { data = await res.json(); } catch (_) { /* 只有状态码也够用 */ }
    const info = rateLimitErrorMessage(res.status, data, res.headers);
    await chrome.storage.local.set({ [RATELIMIT_KEY]: info.until });
    throw new Error(info.text);
  }
  if (!res.ok) {
    throw new Error(`GitHub 返回 ${res.status}`);
  }

  await chrome.storage.local.remove(RATELIMIT_KEY);
  let data;
  try { data = await res.json(); } catch (_) { return null; }
  const release = sanitizeRelease(data);
  if (release) {
    await chrome.storage.local.set({ [CACHE_KEY]: { release, checkedAt: Date.now() } });
  }
  return release;
}

// 只回答本扩展自己的页面：sender.id 必须是本扩展的 id。
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== 'checkUpdate') return;
  if (!sender || sender.id !== chrome.runtime.id) {
    sendResponse({ ok: false, error: '拒绝：发送方不是本扩展' });
    return;
  }
  checkRelease(!!msg.force)
    .then((release) => sendResponse({ ok: true, release }))
    .catch((err) => sendResponse({ ok: false, error: err && err.message ? err.message : String(err) }));
  return true; // 异步回复
});
