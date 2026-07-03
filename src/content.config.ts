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
    }),
});

export const collections = { apps, channels, music, social };
