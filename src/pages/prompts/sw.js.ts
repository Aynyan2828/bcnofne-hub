// 海図帳の service worker（scope=/prompts/）。ビルドのたびに版が変わり、古い置き場は消す。
// - 入れた時：/prompts/ の全ページ・一覧用の見本画像・混ぜる部品・アイコンを先に取っておく
//   ページが読む CSS・JS（/_astro/）も、取ったページの中から拾って一緒に取る
// - ページ：まず通信（新しい方）、つながらん時は取っておいた物
// - 絵・CSS・JS・フォント：取っておいた物を先に出す（1 種ずつの大きい絵は、開いた時に取っておく。
//   まだ取っとらん大きい絵は、オフラインの時だけ一覧用の小さい絵で代わりに出す）
// /prompts/ の外のページから来た通信には関わらん（scope の外は service worker が見ん）。
import type { APIRoute } from 'astro';
import { STYLE } from '../../lib/kaizu';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export const GET: APIRoute = () => {
  const p = `${base}/prompts`;
  const pages = [`${p}/`, `${p}/style/`, `${p}/scene/`, ...STYLE.items.map((it) => `${p}/style/${it.slug}/`)];
  const stems = [...STYLE.items.map((it) => it.img), STYLE.source_img, ...STYLE.mix_samples.map((m) => m.img)].filter(Boolean);
  const assets = [
    ...stems.map((s) => `${p}/img/${s}-s.webp`),
    `${p}/style/mix.json`,
    `${p}/manifest.webmanifest`,
    `${p}/icons/kaizu-180.png`,
    `${p}/icons/kaizu-192.png`,
    `${p}/icons/kaizu-512.png`,
  ];
  const version = `kaizu-${STYLE.version}-${Date.now()}`;
  const js = `/* 海図帳 service worker ${version} */
const CACHE = ${JSON.stringify(version)};
const PAGES = ${JSON.stringify(pages)};
const ASSETS = ${JSON.stringify(assets)};
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(ASSETS);
    const found = new Set();
    for (const url of PAGES) {
      try {
        const r = await fetch(url, { cache: 'no-cache' });
        if (!r.ok) continue;
        const html = await r.clone().text();
        await c.put(url, r);
        for (const m of html.matchAll(/(?:href|src)="([^"]*\\/_astro\\/[^"]+)"/g)) found.add(new URL(m[1], location.origin + url).href);
      } catch (err) { console.warn('kaizu sw: page', url, err); }
    }
    for (const u of found) { try { await c.add(u); } catch (err) { console.warn('kaizu sw: asset', u, err); } }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('kaizu-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === location.origin;
  const font = /fonts\\.(googleapis|gstatic)\\.com$/.test(url.hostname);
  if (!same && !font) return;
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const r = await fetch(req);
        if (r.ok && url.pathname.startsWith(${JSON.stringify(p + '/')})) (await caches.open(CACHE)).put(req, r.clone());
        return r;
      } catch (err) {
        const hit = await caches.match(req, { ignoreSearch: true });
        return hit || (await caches.match(${JSON.stringify(p + '/style/')})) || Response.error();
      }
    })());
    return;
  }
  if (font || /\\.(webp|png|jpe?g|svg|css|js|woff2?|json)$/.test(url.pathname)) {
    e.respondWith((async () => {
      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;
      try {
        const r = await fetch(req);
        if (r.ok || r.type === 'opaque') (await caches.open(CACHE)).put(req, r.clone());
        return r;
      } catch (err) {
        // 大きい絵（-l）をまだ取っとらん時は、取ってある一覧用（-s）で代わりに出す
        if (/-l\\.webp$/.test(url.pathname)) {
          const small = await caches.match(url.pathname.replace(/-l\\.webp$/, '-s.webp'));
          if (small) return small;
        }
        return Response.error();
      }
    })());
  }
});
`;
  return new Response(js, { headers: { 'Content-Type': 'text/javascript; charset=utf-8' } });
};
