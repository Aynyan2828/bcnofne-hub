/**
 * 線のアイコン（SVG）。絵文字をアイコン代わりに使うのをやめるための正本。
 *
 * UI UX Pro Max §4 no-emoji-icons: 絵文字は端末やフォントで見た目が変わる
 * （iPhone と Android で別物・色も変えられん）。線の太さ 1.8・角は丸で統一。
 * 色は文字色（currentColor）に従う＝港の色にも自然に揃う。
 *
 * ★よその会社のロゴ（Bluesky の蝶・YouTube の再生ボタンの形など）は勝手に描き直さん。
 *   どこのものでもない一般的な形（再生・マイク・ペン・ふきだし）にしとる。
 *
 * 使い方:
 *   静的な所 … <Icon name="wrench" />（src/components/Icon.astro）
 *   JS で組み立てる所 … import { iconSvg } from '../lib/icons'; el.innerHTML = iconSvg('play')
 */
const PATHS: Record<string, string> = {
  // 動画・ラジオの再生
  play: '<rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="M10.2 9.3v5.4l4.6-2.7z" fill="currentColor" stroke="none"/>',
  // ポッドキャスト
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
  // 読み物（note）
  pen: '<path d="M4 20l1.1-4.2L16.4 4.5a2.1 2.1 0 0 1 3 3L8.2 18.9z"/><path d="M14.4 6.6l3 3"/>',
  // 短い投稿（Bluesky など）
  chat: '<path d="M20 11.4a8 8 0 0 1-11.7 7.1L4 20l1.4-4.1A8 8 0 1 1 20 11.4z"/>',
  // 機関日誌（機関士のスパナ）
  wrench: '<path d="M14.8 6.2a4 4 0 0 0-5.3 5.3l-6 6a1.8 1.8 0 0 0 2.5 2.5l6-6a4 4 0 0 0 5.3-5.3l-2.5 2.5-2.4-.6-.6-2.4z"/>',
  // 上下にスクロールできる
  updown: '<path d="M12 3.5v17M8 7.5l4-4 4 4M8 16.5l4 4 4-4"/>',
  // 動画を止める／もう一回流す
  pause: '<path d="M9 6.5v11M15 6.5v11" stroke-width="2.4"/>',
  resume: '<path d="M8.5 6.3v11.4l9.2-5.7z" fill="currentColor" stroke="none"/>',
  // どれにも当てはまらん時
  dot: '<circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none"/>',
};

export type IconName = keyof typeof PATHS;

export function iconSvg(name: string, label?: string): string {
  const body = PATHS[name] ?? PATHS.dot;
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg class="ico" ${a11y} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}
