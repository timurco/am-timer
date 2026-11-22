/* Keep a complete, working copy before replacing the previous offline copy. */
const PREFIX = 'meditation-timer-offline-';
const META = 'meditation-timer-meta';
const CURRENT = '/__offline_snapshot__';
const CORE = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png', '/icon.svg', '/bowl.mp3'];

async function saveSnapshot() {
  const root = await fetch('/', { cache: 'no-store' });
  if (!root.ok) throw new Error('Could not fetch timer page');
  const html = await root.clone().text();
  const paths = new Set(CORE.slice(1));
  for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    const url = new URL(match[1].replace(/&amp;/g, '&'), self.location.origin);
    if (url.origin === self.location.origin && url.pathname.startsWith('/_next/static/')) paths.add(url.pathname + url.search);
  }
  const name = PREFIX + Date.now() + '-' + Math.random().toString(36).slice(2);
  const cache = await caches.open(name);
  try {
    await Promise.all([...paths].map(async (path) => {
      const response = await fetch(path, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Could not cache ${path}`);
      if (path.split('?')[0].endsWith('.css')) {
        const css = await response.clone().text();
        const fonts = [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m => new URL(m[1], new URL(path, self.location.origin)));
        await Promise.all(fonts.filter(url => url.origin === self.location.origin).map(async url => {
          const asset = await fetch(url.href, { cache: 'no-store' });
          if (!asset.ok) throw new Error(`Could not cache ${url.pathname}`);
          await cache.put(url.href, asset);
        }));
      }
      await cache.put(path, response);
    }));
    await cache.put('/', root);
    const meta = await caches.open(META);
    const previous = await meta.match(CURRENT);
    const previousName = previous ? await previous.text() : null;
    await meta.put(CURRENT, new Response(name));
    const names = await caches.keys();
    await Promise.all(names.filter(key => key.startsWith(PREFIX) && key !== name && key !== previousName).map(key => caches.delete(key)));
  } catch (error) {
    await caches.delete(name);
    throw error;
  }
}

// Serialize updates: two open tabs must not remove each other's snapshots.
let updating;
function updateSnapshot() {
  if (!updating) updating = saveSnapshot().finally(() => { updating = null; });
  return updating;
}

self.addEventListener('install', event => {
  event.waitUntil(updateSnapshot().then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('message', event => {
  if (event.data === 'UPDATE_OFFLINE_COPY') event.waitUntil(updateSnapshot().catch(() => {}));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => {
      const meta = await caches.open(META);
      const pointer = await meta.match(CURRENT);
      if (!pointer) return Response.error();
      return (await (await caches.open(await pointer.text())).match('/')) || Response.error();
    }));
    return;
  }
  if (url.pathname.startsWith('/_next/static/') || CORE.includes(url.pathname)) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
  }
});
