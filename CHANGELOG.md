# CHANGELOG — bcnofne-hub

All notable changes to this project.
形式は [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) を緩く踏襲。

## [0.2.0] - 2026-07-03

### Added
- 各セクション見出しに丸いAYN表情アイコンを追加（Apps=ok / 聴く・眠る=night /
  Music=excited / SNS=smile。BaitoPayApp のAYN表情立ち絵を流用）。
- 大きな水彩シーンをセクションに配置: Apps=朝の「Welcome aboard」、
  聴く・眠る=夜の「おやすみー！」。カード＋シーンの横並びレイアウト（`.feature`）。
- Section コンポーネントに `avatar` prop、global.css に `.feature` 応答レイアウトを追加。

### Changed
- テキスト主体だったカード群に水彩ビジュアルを添え、AYNの世界観を前面に。

## [0.1.0] - 2026-07-03

### Added
- Astro による BCNOFNe 公式ハブサイトの初版をスキャフォールド（Prompt165）。
- Content Collections（`apps` / `channels` / `music` / `social`）で
  「Markdown1枚追加＝カード1枚追加」の構造を実装。
- セクション: Hero / Apps / 聴く・眠る(YouTube・AI RADIO) / Music / SNS / About AYN / Footer。
- 初期コンテンツ:
  - Apps: 扶養メーター（App Store id6781950133・無料）
  - Channels: AYN Sleep Radio(YouTube) / AI RADIO(Apple Podcasts)
  - Music: 最新アルバム HyperFollow / Spotify アーティスト
  - Social: Litlink / X / TikTok / Instagram / Bluesky / LINE / SUZURI
- 水彩×航海テーマの配色・タイポグラフィ（`src/styles/global.css`）。
- AYN水彩ビジュアル（KeyVisual/Profile）を `src/assets/` に取り込み、Astro Image で最適化。
- SEO: title/description/OGP/Twitter Card、JSON-LD（Organization/Person/WebSite）、
  `@astrojs/sitemap`、`robots.txt`、favicon(SVG)、OGP画像(1200×630)。
- GitHub Pages 自動デプロイ（`.github/workflows/deploy.yml`）。
- ドキュメント: README（更新手順・早見表・デプロイ手順）、docs/ADD_CONTENT.md。
- 独自ドメイン **bcnofne.com** で公開する構成に確定（`astro.config.mjs`
  `site=https://bcnofne.com` / `base=/`、`public/CNAME`）。`SITE_URL`/`BASE_PATH`
  環境変数で GitHub PagesプロジェクトURLや他ホストにも切替可能。

### Fixed
- 扶養メーターのApp Store URLを `apps.apple.com/jp/app/id6781950133` に修正
  （国コード無しの `/app/id...` は404になるため）。App公開・無料・Financeを実機確認。

### Verified
- 全外部リンクの生存を確認: 扶養メーター / AI RADIO(Podcast) / HyperFollow(海の灯りの子守唄)
  / Spotify(BCNOFNe〜ボクのフネ〜) / Litlink / YouTube。

### Notes
- レスポンシブ（モバイル最優先）・アクセシビリティ（skip link / alt / focus-visible /
  prefers-reduced-motion）対応。
- ローカルで `npm run build` 成功・プレビュー表示確認済み。
- 2026-07-03 公開作業: リポ `Aynyan2828/bcnofne-hub` 作成・push、GitHub Pages 有効化
  （Source=GitHub Actions）、カスタムドメイン `bcnofne.com` 設定、デプロイ成功。
- 未実施: DNS設定（マスター作業。A/AAAA/CNAMEレコード）→ 反映後に Enforce HTTPS。
