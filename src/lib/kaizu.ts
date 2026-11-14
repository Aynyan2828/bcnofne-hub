// 海図帳（Kaizu）— AI 画像生成用のプロンプト集。
// データの正本は Vault（03_Knowledge/Image_Prompts/BCNOFNe_画風カタログ）。
// scripts/kaizu_sync.py で src/data/kaizu/*.json と public/prompts/ に写したものを読む。
import style from '../data/kaizu/style.json';
import scene from '../data/kaizu/scene.json';
import lettering from '../data/kaizu/lettering.json';
import framing from '../data/kaizu/framing.json';
import light from '../data/kaizu/light.json';
import weather from '../data/kaizu/weather.json';

export type StyleItem = (typeof style.items)[number];
export type SceneItem = (typeof scene.items)[number];
export type LetteringItem = (typeof lettering.items)[number];
/** 構図・光とレンズ・時間帯と天気の棚の 1 項目（img が null＝見本の絵はまだ） */
export interface AddonItem {
  id: string; number_ja: string; slug: string; section: string; name_ja: string; name_en: string;
  general_ja: string; aliases: string[]; desc_ja: string; time: string | null; img: string | null;
}
export interface AddonShelf { version: string; updated: string | null; section_titles: Record<string, string>; items: AddonItem[] }

export const STYLE = style;
export const SCENE = scene;
export const LETTERING = lettering;
export const FRAMING = framing as AddonShelf;
export const LIGHT = light as AddonShelf;
export const WEATHER = weather as AddonShelf;

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const kaizuBase = `${base}/prompts`;

/** 見本画像の URL。size: s=一覧用 480px / l=1 種ずつのページ用 1000px */
export function kaizuImg(stem: string, size: 's' | 'l' = 's'): string {
  return `${kaizuBase}/img/${stem}-${size}.webp`;
}
export const IMG_W = { s: 480, l: 1000 } as const;

export function styleUrl(it: { slug: string }): string {
  return `${kaizuBase}/style/${it.slug}/`;
}

/** 統合モード（/prompts/compose/）へ。lt=文字の書体・main=画風の主・fr=構図・lg=光・ln=レンズ・tw=時間帯と天気 */
export function composeUrl(q: { lt?: string; main?: string; fr?: string; lg?: string; ln?: string; tw?: string } = {}): string {
  const p = new URLSearchParams(Object.entries(q).filter(([, v]) => v) as [string, string][]).toString();
  return `${kaizuBase}/compose/${p ? `?${p}` : ''}`;
}

/** 呼び方（機械用の ID と番号の書き方は外す） */
export function displayAliases(aliases: string[], skip: string[]): string[] {
  return aliases.filter((a) => !/^(ST|SC|LT|CP|LG|TW)-?\d+$/.test(a) && !/番/.test(a) && !skip.includes(a)).slice(0, 6);
}
