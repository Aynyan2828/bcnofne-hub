// 海図帳の番号 → 名前の対応表（Bridge の操縦席カードが /kaizu/stats の番号を名前に直すのに使う）
import type { APIRoute } from 'astro';
import { STYLE, SCENE, LETTERING, FRAMING, LIGHT, WEATHER } from '../../lib/kaizu';

export const GET: APIRoute = () => {
  const row = (it: { id: string; number_ja: string; name_ja: string; slug: string }) => [it.id, { no: it.number_ja, name: it.name_ja, slug: it.slug }];
  const body = {
    version: STYLE.version,
    style: Object.fromEntries(STYLE.items.map(row)),
    scene: Object.fromEntries(SCENE.items.map(row)),
    lettering: Object.fromEntries(LETTERING.items.map(row)),
    framing: Object.fromEntries(FRAMING.items.map(row)),
    light: Object.fromEntries(LIGHT.items.map(row)),
    weather: Object.fromEntries(WEATHER.items.map(row)),
  };
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
