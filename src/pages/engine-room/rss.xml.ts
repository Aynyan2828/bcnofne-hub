// AYN の機関日誌の RSS（/engine-room/rss.xml）。
// bcnofne-edge の /feed がこれを読んで、トップの「最新の航海日誌」に ⚙ で流す。
// 依存を増やさんよう手書き（@astrojs/rss は入れとらん）。
import type { APIRoute } from 'astro';
import { getWorklog, logAnchor, logLines } from '../../lib/worklog';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const root = new URL(`${base}/engine-room/`, site ?? 'https://bcnofne.com').toString();
  const logs = await getWorklog();

  const items = logs
    .map((e) => {
      const link = `${root}#${logAnchor(e.data.date)}`;
      const body = logLines(e).join('\n');
      return [
        '    <item>',
        `      <title>${esc(e.data.title)}</title>`,
        `      <link>${esc(link)}</link>`,
        `      <guid isPermaLink="true">${esc(link)}</guid>`,
        `      <pubDate>${e.data.date.toUTCString()}</pubDate>`,
        `      <description>${esc(body)}</description>`,
        ...e.data.projects.map((p) => `      <category>${esc(p)}</category>`),
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>AYN の機関日誌</title>
    <link>${esc(root)}</link>
    <description>機関士AI AYN が書きとめる、BCNOFNe の毎日の整備記録。</description>
    <language>ja</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
