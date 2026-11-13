// 海図帳のアプリ用アイコンを書き出す。
// 2026-11-13 マスター決定：アイコンは BCNOFNe のロゴ（正本＝Vault 03_Knowledge/Content/ShipsLog_assets/BCNOFNe_logo_透過.png）。
//   iOS は角を丸く切るけん、ロゴの周りに余白を取って紙の白（サイトの --c-cream）で地を塗る。
//   出す物：logo-32（favicon）/ logo-180（iPhone・Mac の Dock）/ logo-192・logo-512（manifest）/ logo-maskable-512
// 前の自前の絵（kaizu.svg → kaizu-*.png）は使わんが消さずに残す（旧：海図帳の本と羅針 〜2026-11-13）。
// 使い方: node scripts/kaizu_icons.mjs [ロゴの PNG]
import sharp from 'sharp';
import { homedir } from 'node:os';
const SRC = process.argv[2] ?? `${homedir()}/Documents/BCNOFNe Vault/03_Knowledge/Content/ShipsLog_assets/BCNOFNe_logo_透過.png`;
const dir = new URL('../public/prompts/icons/', import.meta.url).pathname;
const BG = '#fbfcff';
async function make(size, scale, name) {
  const inner = Math.round(size * scale);
  const logo = await sharp(SRC).trim().resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: logo, gravity: 'center' }]).flatten({ background: BG }).png().toFile(`${dir}${name}`);
  console.log('wrote', name);
}
try {
  await make(32, 0.94, 'logo-32.png');            // タブの小さいアイコンは余白少なめ
  await make(180, 0.78, 'logo-180.png');          // iOS は角丸で切られる
  await make(192, 0.78, 'logo-192.png');
  await make(512, 0.78, 'logo-512.png');
  await make(512, 0.62, 'logo-maskable-512.png'); // 丸く切られても欠けん内側 80% に収める
} catch (e) { console.error('icon build failed:', e); process.exit(1); }
