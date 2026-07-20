// 全アプリ共通の相互リンク用 JSON。ビルド時に /apps.json を静的生成する。
// 正本は src/content/apps/*.md ＝ md を1枚足せばアプリ一覧にも自動で載る。
// 各 iOS アプリの BCNOFNeLinks モジュールがここを取りに来る（取得失敗時は同梱JSONにフォールバック）。
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
  const base = site?.origin ?? 'https://bcnofne.com';

  const apps = (await getCollection('apps'))
    .filter((entry) => entry.data.status === 'active')
    .sort((a, b) => a.data.order - b.data.order)
    .map((entry) => ({
      // アプリ側の currentAppID と突き合わせる識別子。md の appId が無ければファイル名。
      id: entry.data.appId ?? entry.id.replace(/\.md$/, ''),
      name: entry.data.title,
      tagline: entry.data.tagline ?? entry.data.summary,
      icon: `${base}/icons/${entry.data.appId ?? entry.id.replace(/\.md$/, '')}.png`,
      url: entry.data.url,
    }));

  return new Response(JSON.stringify({ apps }, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
