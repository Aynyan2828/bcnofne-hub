// 海図帳（Kaizu）— AI 画像生成用のプロンプト集。
// データの正本は Vault（03_Knowledge/Image_Prompts/BCNOFNe_画風カタログ）。
// scripts/kaizu_sync.py で src/data/kaizu/*.json と public/prompts/ に写したものを読む。
import style from '../data/kaizu/style.json';
import scene from '../data/kaizu/scene.json';
import lettering from '../data/kaizu/lettering.json';

export type StyleItem = (typeof style.items)[number];
export type SceneItem = (typeof scene.items)[number];
export type LetteringItem = (typeof lettering.items)[number];

export const STYLE = style;
export const SCENE = scene;
export const LETTERING = lettering;

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

/** 統合モード（/prompts/compose/）へ。lt=文字の書体・main=画風の主 */
export function composeUrl(q: { lt?: string; main?: string } = {}): string {
  const p = new URLSearchParams(Object.entries(q).filter(([, v]) => v) as [string, string][]).toString();
  return `${kaizuBase}/compose/${p ? `?${p}` : ''}`;
}

/** 呼び方（機械用の ID と番号の書き方は外す） */
export function displayAliases(aliases: string[], skip: string[]): string[] {
  return aliases.filter((a) => !/^(ST|SC|LT)-?\d+$/.test(a) && !/番/.test(a) && !skip.includes(a)).slice(0, 6);
}
