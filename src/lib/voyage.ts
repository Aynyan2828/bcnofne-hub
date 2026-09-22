/**
 * 航路（Voyage）の寄港地マップ — サイト全体で1か所だけの正本。
 *
 * ここを直せば
 *   - 画面端の航路レール（VoyageRail.astro）
 *   - 到着演出（Section.astro の data-harbor）
 *   - AYN ナビゲーション（AynNavigator.astro）
 * がまとめて追従する。港を増やす時は STATIONS に1行足して、
 * index.astro の Section に同じ id を付けるだけばい。
 */
export interface Station {
  /** セクションの id（= アンカー）。既存URL（#about 等）は変えない。 */
  id: string;
  /** 航路レールに出す短い英字ラベル */
  code: string;
  /** 到着時に一瞬出る港の名前 */
  harbor: string;
  /** AYN ナビに出す日本語の行き先名 */
  label: string;
  /** AYN ナビの一言 */
  note: string;
}

export const STATIONS: Station[] = [
  { id: 'top', code: 'PORT', harbor: 'HOME PORT', label: '出航前の港へもどる', note: 'いちばん上ばい' },
  { id: 'apps', code: 'APPS', harbor: 'APPS HARBOR', label: 'アプリを見る', note: 'iPhone アプリ' },
  { id: 'listen', code: 'RADIO', harbor: 'RADIO HARBOR', label: '眠る・作業する', note: '睡眠BGM／作業BGM／ラジオ' },
  { id: 'music', code: 'MUSIC', harbor: 'MUSIC HARBOR', label: '音楽を聴く', note: '気分から選べるばい' },
  { id: 'sns', code: 'SOCIAL', harbor: 'SIGNAL HARBOR', label: '航海日誌を見る', note: 'SNS・note の更新' },
  { id: 'about', code: 'AYN', harbor: "AYN'S HARBOR", label: 'ぼくのことを知る', note: '機関士AI AYN と水彩の世界' },
];
