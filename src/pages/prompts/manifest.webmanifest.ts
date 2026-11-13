// 海図帳をアプリとして置く時の設定（Mac は Safari の「Dock に追加」、iPhone は「ホーム画面に追加」）。
// scope は /prompts/ だけ。サイトのほかのページはアプリの外として開く。
import type { APIRoute } from 'astro';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export const GET: APIRoute = () => {
  const p = `${base}/prompts`;
  const manifest = {
    id: `${p}/`,
    name: '海図帳 — AI 画像生成用のプロンプト集',
    short_name: '海図帳',
    description: 'BCNOFNe の、AI 画像生成用のプロンプト集。画風 30 種と場所 24 か所。',
    lang: 'ja',
    start_url: `${p}/style/`,
    scope: `${p}/`,
    display: 'standalone',
    background_color: '#1f2540',
    theme_color: '#1f2540',
    icons: [
      { src: `${p}/icons/kaizu-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${p}/icons/kaizu-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `${p}/icons/kaizu-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  return new Response(JSON.stringify(manifest, null, 2), { headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' } });
};
