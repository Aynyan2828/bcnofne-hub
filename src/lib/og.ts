// ビルド時 動的OGP生成（satori → SVG → sharp → PNG）。
// Cloudflare Worker の日本語フォント上限を踏まないよう、生成はビルド時(Node)で行う。
// 手書きフォント（本文=Yomogi / 見出し=Yusei Magic）をそのまま埋め込む。
import satori from 'satori';
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ビルド時のみ実行。バンドル後 import.meta.url は dist/ を指すため、
// プロジェクトルート(cwd)基準で素材を読む（astro build/dev とも cwd=リポルート）。
const asset = (p: string) => resolve(process.cwd(), 'src/assets', p);
const yomogi = readFileSync(asset('fonts/Yomogi-Regular.ttf'));
const yusei = readFileSync(asset('fonts/YuseiMagic-Regular.ttf'));

// AYN キービジュアルを円形ポートレート用に事前縮小してデータURI化（初回のみ）
let aynDataUri: string | null = null;
async function aynPortrait(): Promise<string> {
  if (!aynDataUri) {
    const raw = readFileSync(asset('ayn-keyvisual.png'));
    const buf = await sharp(raw).resize(500, 500, { fit: 'cover', position: 'top' }).png().toBuffer();
    aynDataUri = 'data:image/png;base64,' + buf.toString('base64');
  }
  return aynDataUri;
}

export interface OgCard {
  eyebrow?: string;
  title: string;
  tagline?: string;
}

// 1枚のブランドOGカード(1200×630 PNG)を生成して Buffer で返す
export async function renderOgCard(card: OgCard): Promise<Buffer> {
  const { eyebrow = 'BCNOFNe 〜ボクのフネ〜', title, tagline = '機関士AI AYN の公式ハブ' } = card;
  const portrait = await aynPortrait();

  const el = {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        alignItems: 'center',
        color: '#ffffff',
        fontFamily: 'Yomogi',
        backgroundImage:
          'radial-gradient(120% 120% at 12% 0%, #2a3566 0%, #3a4a86 42%, #5f6fb8 74%, #9fb6e6 100%)',
      },
      children: [
        // 左：テキスト
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              flex: '1',
              padding: '72px 24px 72px 84px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: { fontSize: '30px', letterSpacing: '4px', opacity: 0.92, marginBottom: '20px' },
                  children: eyebrow,
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontFamily: 'Yusei Magic',
                    fontSize: '72px',
                    lineHeight: 1.24,
                    display: 'flex',
                    textShadow: '0 3px 18px rgba(20,30,70,0.45)',
                  },
                  children: title,
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: '30px', marginTop: '28px', opacity: 0.95, lineHeight: 1.5 },
                  children: tagline,
                },
              },
            ],
          },
        },
        // 右：AYN 円形ポートレート
        {
          type: 'div',
          props: {
            style: { display: 'flex', padding: '0 76px 0 24px' },
            children: [
              {
                type: 'img',
                props: {
                  src: portrait,
                  width: 380,
                  height: 380,
                  style: {
                    width: '380px',
                    height: '380px',
                    borderRadius: '190px',
                    border: '6px solid rgba(255,255,255,0.32)',
                  },
                },
              },
            ],
          },
        },
      ],
    },
  };

  const svg = await satori(el as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Yomogi', data: yomogi, weight: 400, style: 'normal' },
      { name: 'Yusei Magic', data: yusei, weight: 400, style: 'normal' },
    ],
  });

  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}
