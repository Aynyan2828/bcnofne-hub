// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 独自ドメイン bcnofne.com で公開（GitHub Pages + CNAME）。
// public/CNAME に "bcnofne.com" を置き、DNS を GitHub Pages に向ける。
// 別ホスト（Cloudflare Pages 等）へ移す時は環境変数で上書きできる。
// ※ GitHub Pages のプロジェクトURLで先行確認したい時は
//   SITE_URL=https://aynyan2828.github.io BASE_PATH=/bcnofne-hub npm run build
const SITE = process.env.SITE_URL ?? 'https://bcnofne.com';
const BASE = process.env.BASE_PATH ?? '/';

// https://astro.build/config
export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  image: {
    // 静的サイトなのでビルド時に最適化（sharp）
    responsiveStyles: true,
  },
});
