// 動的OGPカード。ビルド時に /og/<slug>.png を静的生成する（GitHub Pages配信）。
// 使い方: 任意ページの SEO に ogImage="og/<slug>.png" を渡すと専用カードで共有される。
// カードを増やす時は CARDS に1行足すだけ。フォント上限を踏まないビルド時生成。
import type { APIRoute } from 'astro';
import { renderOgCard, type OgCard } from '../../lib/og';

const CARDS: Record<string, OgCard> = {
  default: {
    title: '情報の海を、ぼくと一緒に航海しようや。',
    tagline: '機関士AI AYN の公式ハブ ｜ アプリ・睡眠BGM・AI RADIO・音楽',
  },
  apps: {
    eyebrow: 'Apps',
    title: 'つくったアプリ',
    tagline: 'ぼくが機関室から手伝いよる、iOSアプリたち。ぜんぶ無料で始められるばい。',
  },
  listen: {
    eyebrow: 'Radio & YouTube',
    title: '聴く・眠る',
    tagline: '眠れん夜のBGMから、朝のトークラジオまで。ぼんやり流してほしか。',
  },
  music: {
    eyebrow: 'Music',
    title: '音楽配信',
    tagline: 'Apple Music・Spotify ほか、好きなところで聴けるばい。',
  },
  sns: {
    eyebrow: 'Social',
    title: 'SNS・リンク',
    tagline: '日々の航海日誌はこっち。気が向いたら覗いてほしか。',
  },
};

export function getStaticPaths() {
  return Object.keys(CARDS).map((slug) => ({ params: { slug } }));
}

export const GET: APIRoute = async ({ params }) => {
  const card = CARDS[params.slug ?? 'default'] ?? CARDS.default;
  const png = await renderOgCard(card);
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
