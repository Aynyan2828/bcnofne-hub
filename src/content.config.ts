import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 共通のカードフィールド。新コンテンツ＝Markdown1枚追加でカードが増える。
const cardBase = {
  title: z.string(),
  summary: z.string(),
  url: z.string().url(),
  category: z.string().optional(),
  order: z.number().default(100),
  status: z.enum(['active', 'draft', 'hidden']).default('active'),
  cta: z.string().optional(), // ボタン文言（未指定なら既定文言）
  // /apps.json 用。アプリ側 BCNOFNeLinksView(currentAppID:) と突き合わせる識別子。
  appId: z.string().optional(),
  // /apps.json 用の短い一言（未指定なら summary を使う）。
  tagline: z.string().optional(),
};

// アプリ：アイコン画像つき
const apps = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/apps' }),
  schema: ({ image }) =>
    z.object({
      ...cardBase,
      price: z.string().default('無料'),
      platform: z.string().default('iOS'),
      icon: image().optional(),
      image: image().optional(), // カード上部のサムネイル（横長推奨）
      // ── Featured Project（Apps 港の主役）────────────────────────────
      // featured: true にした1本が大きな FEATURED PROJECT 枠に出る。
      // 主役を差し替えたい時は、古い方の featured を消して新しい方に true を付けるだけ。
      featured: z.boolean().default(false),
      // 主役枠の2〜3行キャッチ（改行で分ける）。未指定なら summary を使う。
      hook: z.string().optional(),
      // 主役枠のデモ動画（public/ 配下の絶対パス。例: /media/angleon_promo.mp4）
      demo: z.string().optional(),
      demoPoster: z.string().optional(),
      // 主役枠の追加ボタン（デモ・制作記録・事前登録など）
      extraLinks: z
        .array(z.object({ label: z.string(), url: z.string() }))
        .default([]),
    }),
});

// チャンネル（YouTube / AI RADIO）
const channels = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/channels' }),
  schema: ({ image }) =>
    z.object({
      ...cardBase,
      handle: z.string().optional(),
      image: image().optional(),
    }),
});

// 音楽配信（各DSP）
const music = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/music' }),
  schema: ({ image }) =>
    z.object({
      ...cardBase,
      service: z.string().optional(),
      image: image().optional(),
      // 「今どんな気分？」で絞り込むためのタグ。
      // 未指定（空）＝どの気分でも出る常設カード（Spotify のような入口）。
      moods: z
        .array(z.enum(['sleep', 'night', 'morning', 'focus']))
        .default([]),
    }),
});

// SNS リンク
const social = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/social' }),
  schema: ({ image }) =>
    z.object({
      ...cardBase,
      handle: z.string().optional(),
      image: image().optional(),
      // 表示の強さ。pinned=見出し横のピル / primary=大きなカード / more=「その他の航路」の中。
      tier: z.enum(['pinned', 'primary', 'more']).default('more'),
    }),
});

// AYN の機関日誌（/engine-room/）。1 日 1 枚 = src/content/worklog/YYYY-MM-DD.md。
// ayn-jarvis が下書き→マスターの「よかよ」でだけ追加される（手で足してもよか）。
// 数字（DL 数・売上・コミット数など）は書かん約束。中身の話だけ。
const worklog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/worklog' }),
  schema: ({ image }) =>
    z.object({
      date: z.coerce.date(),
      title: z.string(), // 一行見出し（RSS・トップの航海日誌にはこれが出る）
      projects: z.array(z.string()).default([]), // 許可リストのプロジェクト名タグ
      image: image().optional(),
      imageAlt: z.string().optional(),
      status: z.enum(['active', 'draft', 'hidden']).default('active'),
    }),
});

export const collections = { apps, channels, music, social, worklog };
