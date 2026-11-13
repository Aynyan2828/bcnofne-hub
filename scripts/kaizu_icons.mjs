// 海図帳のアプリ用アイコンを SVG から書き出す（180=iPhone / 192・512=manifest / 512 maskable）
// 使い方: node scripts/kaizu_icons.mjs
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
const dir = new URL('../public/prompts/icons/', import.meta.url);
const svg = await readFile(new URL('kaizu.svg', dir));
for (const size of [180, 192, 512]) {
  await sharp(svg, { density: 300 }).resize(size, size).png().toFile(new URL(`kaizu-${size}.png`, dir).pathname);
  console.log('wrote kaizu-' + size + '.png');
}
// maskable: 端を丸く切られても絵が欠けんよう、80% に縮めて地の色で囲む
const inner = await sharp(svg, { density: 300 }).resize(410, 410).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#1f2540' } })
  .composite([{ input: inner, gravity: 'center' }]).png().toFile(new URL('kaizu-maskable-512.png', dir).pathname);
console.log('wrote kaizu-maskable-512.png');
