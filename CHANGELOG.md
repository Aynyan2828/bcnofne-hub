# CHANGELOG — bcnofne-hub

All notable changes to this project.
形式は [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) を緩く踏襲。

## [0.10.0] - 2026-07-03

### Added
- 訪問者カウンター「きみは N 人目の航海者ばい」を Hero 直後に追加(VoyagerCounter.astro)。
  - バックエンド: Cloudflare Worker `bcnofne-voyager` + KV(初訪問だけ番号を払い出し)。
    エンドポイント https://bcnofne-voyager.aynbcnofne.workers.dev。コード=~/bcnofne/bcnofne-counter。
  - 初訪問はカウントアップ演出+紫グロー、2回目以降はlocalStorageの自分の番号を表示。
  - API不通時は番号を出さず挨拶だけにフォールバック(CLSゼロ・高さ固定)。
  - 絵文字ルールに配慮し錨はSVG。CORSはbcnofne.com/localhostのみ許可。

## [0.9.2] - 2026-07-03

### Changed
- 「朝へ、きみを乗せて。」のリンクをSpotify直リンク→HyperFollow(nHzSSjhrGud)に差し替え
  （マスター提供・実在確認済み）。全アルバムカードがHyperFollowで統一。

### Fixed
- HTTPS化完了。GitHub Pagesの証明書発行が1時間以上stuck(https_certificate=null)だったため、
  カスタムドメインを一旦外して再設定→authorization_pending→approved。Enforce HTTPS ON。
  https://bcnofne.com が有効に。

## [0.9.1] - 2026-07-03

### Added
- 抜けていたアルバム「朝へ、きみを乗せて。」(おでかけEP 3枚目)のカードを追加。
  Spotifyディスコグラフィで配信済みを確認(6枚全部そろった)。
  リンクはSpotifyアルバム(3uO5Vqtv0Lr2xuielmgICM)を使用。※HyperFollowリンクが
  ローカル未記録のため。判明したら他カード同様HyperFollowへ差し替え可。

## [0.9.0] - 2026-07-03

### Added
- Appsセクション(扶養メーターの隣)に扶養メーターの縦型プロモ動画を埋め込み。
  - ソース: ayn-promo-video の out/fuyo_meter_9x16.mp4(1080x1920/34s/24MB)を
    Web用に 720x1280・CRF28・faststart 再エンコード → public/media/fuyo_promo.mp4(3.99MB)。
  - ポスター画像(webp 60KB)付き。autoplay muted loop playsinline controls preload=metadata。
    音声はナレ入りのためミュート自動再生、コントロールで音声ON可。
  - 従来の朝シーン(ayn-morning)は撤去。

## [0.8.0] - 2026-07-03

### Added
- マスター描き下ろしのロゴ入りAYNアート5枚を各カードに採用:
  TikTok / Instagram / X / Litlink（SNSカードの夜シーンを差し替え）、
  AI RADIO（Apple Podcasts）カードにAI RADIOバナーアート（ずんだもん入り）。
  → SNS系カードは全てサービス専用の描き下ろしで統一。

## [0.7.0] - 2026-07-03

### Added
- 音楽配信セクションを全アルバム表示に拡張（5枚・新しい順）:
  灯りの霧航(最新・M49paRV8QZE) / 海の灯りの子守唄 / 夜凪ノ子守唄 /
  きょうも、しゅっぱつ。 / 明日へ向かうコンパス。全カードにジャケット画像(600px webp)。
  HyperFollowリンクは全件WebFetchで実在確認済み。
- コンパスのジャケットは公式HyperFollowから取得（マスター承認済み）。
  他はPhotosの配信時取込分＋マスター提供EPアートを使用。

### Changed
- 旧「最新アルバム」カード(hyperfollow-latest.md)を廃止し、アルバム別カードに分割。
- Spotifyアーティストカードは画像なしの導線として最後尾に移動。

## [0.6.1] - 2026-07-03

### Changed
- 背景コラージュをもっと見せる調整（マスター指示）: 白ベール 62-72%→46-56%、
  Hero紺グラデ 58-72%→42-58%。可読性はPC/実画面で確認。

## [0.6.0] - 2026-07-03

### Changed
- コラージュ背景をHero限定からページ全体に拡張（CollageBackdrop.astro 新設）。
  - 固定(fixed)最背面レイヤーに18枚を散らし、スクロール中ずっと「机の上の写真」が
    背後に見える構成。座標は直書き配列で管理。
  - 白ベール(62〜72%)で全ページの可読性を確保。Heroは半透明紺グラデ(55〜72%)に変更し
    写真が透けるように。セクションの帯背景も半透明化。
  - 全画面backdrop-filterは重いので不使用（不透明度のみ）。すりガラスはHeroパネルと
    カードなど小面積に限定。
  - モバイル11枚・回転緩和・横スクロール無し検証済み。Hero専用コラージュは廃止。

## [0.5.0] - 2026-07-03

### Added
- Heroトップ背景を「YouTube動画制作アセットを斜めに散りばめたコラージュ」に刷新。
  - 素材: ayn-sleep-radio の動画用メインビジュアル20枚（現行10+直近アーカイブ10、
    HDD assets_images 由来）を幅560px webp化（計451KB、ファーストビュー予算内）。
  - 配置: 固定シード生成の座標を COLLAGE 配列に直書き（再シャッフル無し・微調整可）。
    ランダム回転±18°・大中小ミックス・白フチ+影の「プリント写真」風。
  - 読みやすさ: 水彩系グラデスクリム(55〜72%)+blur、本文はすりガラスパネルで
    コントラスト確保。z-index階層(コラージュ0/スクリム1/本文2)+isolation。
  - モバイル: 12枚に減量・回転55%に緩和・overflow hiddenで横スクロール無し。
  - a11y/性能: aria-hidden・alt空・lazyload・CLSゼロ(絶対配置+寸法指定)。

## [0.4.0] - 2026-07-03

### Added
- マスター描き下ろしの SNSロゴ入りAYN水彩アートをカードに採用:
  YouTube / LINE / Bluesky / SUZURI（差し替え）、note / GitHub（カード新規追加）。
- OGP画像を「Crypto Ark: BCNOFNe」横長バナーに差し替え（1200×630）。
- favicon を船×月の丸エンブレムに差し替え（favicon.png 192px、apple-touch-icon 180px）。
- Card サムネイルの縦横比を画像から自動判定（正方形アートは切り抜かず全体表示）。

### Changed
- v0.3.0 の夜シーンサムネイルは全カードから一旦撤去（別用途で後日指示予定、
  `src/assets/scenes/` に温存）。

## [0.3.0] - 2026-07-03

### Added
- 全カードに横長サムネイル画像（`image` frontmatter）を追加。マスター提供の
  夜の水彩AYNシーン10枚＋「灯りの霧航」EPジャケを channels / music / social の
  11カードに割り当て（iCloud写真経由で受領、`src/assets/scenes/`）。
- Card コンポーネントに 16:9 サムネイル表示（hoverでゆっくりズーム）。
- スキーマ全コレクションに `image` フィールド（任意）を追加。

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
