# CHANGELOG — bcnofne-hub

## 2026-09-22 — 縦長をほどく（横に流す棚）＋ ふわっと出る演出

スマホ幅 375px で **ページ全体の高さ 17,418px → 8,585px（約半分）**。

### Added
- `src/components/HScroll.astro` — 横に流れる「棚」の共通部品。
  スマホはスワイプ、PC はホバーで左右の送りボタン、キーボードは棚ごと
  tabindex=0 で矢印キー。端まで行ったかを JS が `data-at` に書いて、
  端だけ霧をかける（まだ先があると分かる）。1枚の幅は size プリセット
  （card / wide / video / pill）。次の1枚がちょっと覗く幅にしとる。
- `src/components/Reveal.astro` + global.css — 「ふわっと湧く／横から入る」演出。
  `data-reveal="up|left|right"` と `data-reveal-stagger`（子を1枚ずつ 70ms ずらす）。
  IntersectionObserver 1つ・出したら監視を外す。
  reduced-motion / IO 無し / 印刷 では伏せずそのまま出す。さらに保険として
  読み込み 4 秒後、まだ伏せたままで画面に届いとる要素は問答無用で出す
  （演出が一度も動かんより、静かに出とる方がよか）。

### Changed
- Apps: 縦 9:16 の紹介動画を縦積み（1本で 1280px 相当）→ **横に流す動画棚**へ。
  夜の水彩ループも動画棚に合流させて「動画は動画で1か所」に。
- Radio: チャンネル4枚の縦並び → 横の棚。
- Music: 作品8件の grid → 横の棚（件数を右肩に出す）。気分で絞ると先頭へ戻る。
- Social: **SNS 8件をぜんぶ画像つきカード1本の棚に統合**。
  「その他の航路」に落としとった X / Instagram / TikTok / SUZURI も
  note / Bluesky / GitHub / 公式LINE と同じ扱いに上げた（横に流すなら
  格下げして隠す理由が無い）。棚の並びは order で note→Bluesky→GitHub→
  LINE→X→Instagram→TikTok→SUZURI。Litlink は見出し下のピルのまま。
  `tier: more` の受け皿は残しとる＝リンクが増えすぎた時の逃がし先。
- Art（水彩の航海記録）: 自前の横スクロールをやめて HScroll に統合。
- 見出し・Featured・About・Contact に出現演出（Featured は本文が左から、
  動画が右から入る。About は絵が左・文が右）。
- 使われんようになった `.feature` レイアウト CSS を global.css から削除。

### 地雷メモ
- IntersectionObserver も setTimeout も、**非表示のタブ／ペインでは止まる**。
  「演出が効かん」時はまず画面が見えとるかを疑う（ここで一度ハマった）。

## 2026-09-22 — 航海をもう一段ふかく（日誌スタンプ・潮・霧）
前の「一隻の船」化の続き。演出は増やさず、深さを足した。

### Added
- **航海日誌スタンプ**: 寄った港を localStorage(`bcnofne_logbook`) に憶えて、
  航路の点と AYN ナビのスタンプが灯る。全部回ると AYN が一度だけ労う。
  VoyageRail が `bcnofne:voyage` (CustomEvent) を投げ、AynNavigator が拾う
  ＝共有モジュールを持たん疎結合。localStorage が死んどっても落とさん。
- **時刻連動の海(tide)**: 22〜6時は `<html data-tide="night">`。紙の白を少しだけ
  青へ寄せて、背景の霧も青紫に沈む。ダークモードにはせん（本文のコントラストを守る）。
  BaseLayout の head で決めるけんちらつかん。1分ごとに VoyageRail が見直す。
- **港ごとの霧(depth/fog)**: 沖へ出るほど背景がうっすら霞む。VoyageRail が
  港が変わった時だけ `<html data-depth="0..5">` を書き換え、CSS が 1.6s かけて
  霧レイヤーの opacity だけ動かす（合成のみ・再レイアウトせん）。
- **AYN に直接聞く窓口の口**（※2026-09-22 マスター判断で【見送り】・空のまま）:
  公開サイトから家の Jarvis へ口を開けると、プロンプトインジェクションと
  「誰でも無限に叩ける＝LLM コストが全部こっち持ち」の2つが避けられん、が理由。
  口だけ残しとる: `AynNavigator.astro` の `ASK_ENDPOINT` に
  bcnofne-edge のオリジンを入れると、パネルに入力欄が生えて `POST /ask {q}` →
  `{answer}` を吹き出しに出す。**空のあいだは入力欄ごと出さん**（いまは空）。
  家の Jarvis を直で公開せず、必ず Worker を挟む前提で書いとる。
- `.claude/launch.json` に `bcnofne-hub-preview`（`astro preview` :4332）。
  dev サーバーが別セッションに掴まれとる時に、**ビルド成果物で**確認するため。

### 地雷メモ
- `--fog: calc(var(--depth) / 5)` のような**入れ子の var を opacity に渡すと無効値**に
  なって `opacity:1` に落ちる＝霧が全開になる。各段に素の数値を直書きすること。
- dev サーバーが別セッションの古いモジュールを配っとることがある。
  スタイルだけ効かん時は `npm run build` → `astro preview` で確かめる。

## 2026-09-22 — サイトを「一隻の船」にする（航海体験化）
既存の水彩・夜の海・AYN・青〜紫〜ピンクはそのまま。UI 側を航海に寄せた。

### Added
- `src/lib/voyage.ts` — 寄港地マップの正本（PORT / APPS / RADIO / MUSIC / SOCIAL / AYN）。
  航路レール・到着演出・AYN ナビの3つがここを見る。港を増やす時はここ＋Section の id。
- `src/components/VoyageRail.astro` — 画面端の細い航路。PC(>=1240px)は左端の縦航路に
  寄港地の点＋小さな船が航跡を引いて進む／狭い画面は最上部 2px の航跡線＋到着時だけ
  左上に港名が一瞬出る。scroll は rAF で間引き、現在地と到着演出は
  IntersectionObserver 1つで兼用（監視を二重に持たん）。
- `src/components/AynNavigator.astro` — 右下の小さな AYN（AYN ● ONLINE）。押すと
  「今日はどこ行くと？」＋行き先一覧。**いまはサイト内ナビだけ**。将来 LLM を繋ぐ用に
  `window.AYN_NAV = { open, close, say, setStatus }` を公開しとる。
  Esc / 外側クリックで閉じる・開いたら先頭にフォーカス。スマホは丸だけ（文字なし）。
- `src/components/Featured.astro` — FEATURED PROJECT 枠（いまは Angleon）。
  出すものは `src/content/apps/*.md` の `featured: true` 1本で決まる＝**差し替えは .md だけ**。
- `src/components/MoodPicker.astro` — 「いま、どんな気分？」で音楽を絞る舵輪。
  眠りたい／夜の航海／朝・ドライブ／集中したい。作品側のタグは music の `moods:`。
  タグ無し＝常設（どの気分でも出る）。集中は Work Radio へ案内。
- `src/components/ScenesStrip.astro` — 水彩の航海記録（Art）。使っとらんかった
  `src/assets/scenes/*.jpg` 8枚を横スクロールの帯に。1枚 15〜31KB に最適化される。
- `src/components/LazyVideos.astro` — 動画の遅延読み込み（見える手前で src を入れ、
  画面外では一時停止）。save-data / reduced-motion では自動再生せず controls を出す。
- Hero に「積荷マニフェスト」（Apps / Radio / Music / Art / AI）。初見の人が3秒で
  何を作っとる場所か分かる行。スマホでは見出しの直下に順番を上げる。
- Section に `harbor` prop ＝ 到着演出（ARRIVING / APPS HARBOR）。`.arrival` の CSS は
  About でも使うけん global.css に置いた。
- BaseLayout の head に `<html class="has-js">` を付ける1行。到着演出を
  「JS がある時だけ伏せる」ためのちらつき防止。

### Changed
- `src/content.config.ts` — apps に `featured` / `hook` / `demo` / `demoPoster` / `extraLinks`、
  music に `moods`、social に `tier`（pinned / primary / more）を追加。全部 default 付き＝
  既存の .md はそのまま通る。
- Apps 港: Angleon を Featured に昇格、扶養メーター・ShiftWake は「Other Apps」に。
- Music 港: MoodPicker を一覧の上に。一覧自体は残す（消しとらん）。
- Social 港: 「航海日誌・リンク」に改名。Litlink をピル、note / Bluesky / GitHub / 公式LINE を
  カード、X / Instagram / TikTok / SUZURI は `<details>`「その他の航路」に畳んだ。
  **リンクは1つも消しとらん**。YouTube は Radio 港への案内ピルを置いた。
- VoyagerCounter と About に Crypto Ocean の注記（＝AI・アプリ・音楽・創作が流れる情報の海。
  暗号資産の専門サイトやなか）を追加。
- ホームの動画4本を `autoplay preload="metadata"` から遅延読み込みへ。
  **初回表示で動画 0 バイト**（以前は約 11MB が即読み込み）。Angleon の 6.5MB を足しても初速は軽い。

### 地雷メモ
- `<script define:vars>` は Astro が hoist せん＝その場で即実行される。下にある DOM を
  触るなら DOMContentLoaded を待つこと（MoodPicker で踏んだ）。
- `hidden` 属性は author style（`display:block` 等）に負ける。`[hidden]{display:none!important}` を明示。
- 航路レールの現在地ラベルは 1240px 未満だと本文にかぶる。だから PC 表示は >=1240px だけ。

## 2026-09-22 — Angleon 需要検証 LP（Prompt231 フェーズ1）
- `src/pages/angleon/index.astro` — `/angleon/`：ヒーロー（無音ツアー動画 540p 20s・LINE CTA）／ミニ体験（`public/angleon/play.html`＝Angleon HTML 版の 3 枚軽量ビルド・275KB・iframe）／なぜ出る／使い道 4／実績（曲 3 曲 9/29）／事前登録（LINE 主・メール任意→bcnofne-edge `/waitlist`、未実装のうちは「準備中」表示）／CTA 計測 beacon（`/angleon/hit`）
- `src/pages/angleon/privacy/index.astro` — 事前登録のプライバシーポリシー
- `public/og/og-angleon.jpg`・`src/assets/app-angleon-icon.png`・`public/media/angleon_promo.mp4`（6.5MB）＋poster
- `BaseLayout` に `ogImage` prop を追加（ページ別 OGP）


All notable changes to this project.
形式は [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) を緩く踏襲。

## [0.19.0] - 2026-09-17

### Added
- Prompt166 Phase2: `src/components/Feed.astro` 「最新の航海日誌」を SNS セクション先頭に配線。
  bcnofne-edge `/feed?limit=8`（YouTube×3ch / AI RADIO / note / Bluesky を時系列統合）を
  取得して媒体バッジ＋タイトル＋日付で8件表示。末尾に「RSSで購読する」（`/feed?format=rss`）。
  取得失敗時は枠ごと非表示（CLS配慮）。JS生成の要素にはAstroのスコープ属性が付かんため
  `<style is:global>`＋`.feedwrap` 配下限定で当てとる（地雷）。

## [0.18.0] - 2026-07-19

### Added
- Prompt193 C-2: `src/content/channels/youtube-work-radio.md` を追加。作業用BGM
  チャンネル「AYN Work Radio」（@AYNWorkRadio）への導線カード。Sleep Radio /
  BCNOFNe Radio と並ぶ（order:12）。画像は既存 `assets/sns/art-youtube-work.png`
  を流用。dev server（astro dev）で3チャンネルカードの並びとリンク
  （`https://www.youtube.com/@AYNWorkRadio`）を確認済み。

## [0.17.0] - 2026-07-09

### Added
- Prompt178: 新規ページ `/shortcuts`（AYNにまかせんしゃい — ショートカット集）。
  台帳 `bcnofne-edge/src/shortcuts.json` を正本に、Worker `/shortcuts` API を
  クライアント取得してカード一覧描画（タイトル/説明/カテゴリ/安全バッジ/QR/使用回数）。
  取得失敗時はカードを出さずCLSを避け、案内文のみ表示。
- `scripts/gen_shortcut_qr.py` + `scripts/make_qr.py`: 台帳から `public/qr/<slug>.png` を一括生成。
  QRの中身は `go.bcnofne.com/<slug>`（計測を通すためiCloud直リンクにしない）。`ocr` のQRを同梱。

## [0.16.0] - 2026-07-07

### Added
- 「つくったアプリ」に新アプリ **ShiftWake（シフト自動アラーム / iOS）** のカードを追加。
  App Store: /jp/app/id6785128543・基本無料・icon=app-shiftwake-icon.png・order 20。
- ShiftWake の縦型プロモ動画を Apps セクションに追加（`media/shiftwake_promo.mp4` 720x1280/約3.6MB・
  poster=shiftwake_promo_poster.jpg）。プロモ動画枠を複数本対応（縦積み＋3px区切り）に。

## [0.15.0] - 2026-07-03

### Added
- 「聴く・眠る」に新チャンネル **BCNOFNe Radio（@BCNOFNeRadio）** のカードを追加。
  アイコンはYouTubeアバターから取得(art-bcnofne-radio.png)。order 15(Sleep Radioの次)。

## [0.14.0] - 2026-07-03

### Added
- Prompt166 Phase3: お問い合わせフォーム(Contact.astro)を index に配線・公開。
  送信先=bcnofne-edge /contact(→Discord ops通知)、honeypotでbot対策。
- Prompt166 Phase2: 動的OGPカードをビルド時生成(satori→sharp)。/og/<slug>.png を静的出力。
  手書きフォント(Yomogi/Yusei Magic)＋AYN円形ポートレート。default/apps/listen/music/sns の5枚。
  Cloudflare Workerのフォント上限を回避するためビルド時(Node)生成。

### Changed
- OGP既定画像を軽量化: 水彩1枚 og-default.png(1.5MB) → og-default.jpg(約200KB, JPEG q85)。
  一部SNSの画像サイズ上限/表示遅延に配慮。SEO.astro の既定を .jpg に変更。

## [0.13.0] - 2026-07-03

### Changed
- サイトフォントを手書き風に変更: 本文=Yomogi(ゆる丸手書き) / 見出し=Yusei Magic(マーカー風)。
  Google Fonts。単一ウェイトのため見出しは font-weight 400 に調整(擬似ボールド回避)。

## [0.12.0] - 2026-07-03

### Added
- Prompt166 Phase1 サイト表示: 「聴く・眠る」に最新YouTube動画(/latest)の1行リンク(LatestVideo)、
  カウンターを国別あいさつ対応(/greeting)＝日本語/英語で文面切替。
- Prompt166 Phase4: ブランド短縮リンク go.bcnofne.com/<slug>（Cloudflare Workers
  カスタムドメイン + SLUGS map、未知slugはトップへ302）。yt/x/note/github/app/radio 等を定義。

## [0.11.0] - 2026-07-03

### Changed
- 航海者カウンターのバックエンドを bcnofne-voyager → 統合Worker bcnofne-edge の
  `/counter` に切替（Prompt166 Phase1）。同一IP12h重複抑制はサーバ側でも実施。
- 旧 bcnofne-voyager Worker は削除（bcnofne-edge に統合）。

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

## 2026-09-17 — Hero に「動く AYN」

- Hero のキービジュアルを ayn-jarvis のリグ(パーツ WebP 7 枚 + rig.json + rig.js、計 216KB)に置き換え。
  まばたき・呼吸・髪揺れ、タップで一言喋る(吹き出し＋口パク)。JS 無効/`prefers-reduced-motion`/読み込み失敗時は従来の静止画。
- 素材の更新: `~/bcnofne/ayn-jarvis` で `scripts/build_rig.py --size 640 --format webp --no-psd --out ~/bcnofne/bcnofne-hub/public/ayn-rig`
  ＋ `cp hud/rig.js public/ayn-rig/`。
