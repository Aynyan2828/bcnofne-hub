# bcnofne-hub

BCNOFNe〜ボクのフネ〜 公式ハブサイト。
機関士AI **AYN** のアプリ・睡眠BGM・AI RADIO・音楽配信・SNS を1枚に集約する。

- 技術: [Astro](https://astro.build/)（静的サイト・Content Collections）
- ホスティング: **GitHub Pages**（`main` push で GitHub Actions が自動ビルド＆デプロイ）
- 公開URL: **https://bcnofne.com**（独自ドメイン。`public/CNAME` で設定）

> **設計の肝**: マスターは直接HTML/CSSを触らない。更新は全部
> **「Markdownを編集 → git push → 自動デプロイ」** で完結する。
> どのファイルを触れば何が変わるかは下の表と [docs/ADD_CONTENT.md](docs/ADD_CONTENT.md) を見る。

---

## クイックスタート（ローカル）

```bash
cd ~/bcnofne/bcnofne-hub
npm install          # 初回のみ
npm run dev          # http://localhost:4321/ で確認
npm run build        # dist/ に本番ビルド
npm run preview      # ビルド結果をローカルで確認
```

Node 18+ が必要（開発機は Node 26 で確認済み）。

---

## 「どこを触れば何が変わるか」早見表

| 変えたいもの | 触るファイル |
|---|---|
| アプリのカード | `src/content/apps/*.md` を追加・編集 |
| YouTube / AI RADIO のカード | `src/content/channels/*.md` |
| 音楽配信のカード | `src/content/music/*.md` |
| SNS リンクのカード | `src/content/social/*.md` |
| ショートカット集ページ `/shortcuts` | 台帳は `bcnofne-edge/src/shortcuts.json`（正本）。QRは `scripts/gen_shortcut_qr.py` で生成 |
| Hero（トップの見出し・キャッチ） | `src/components/Hero.astro` |
| About AYN の文章 | `src/components/About.astro` |
| フッターのリンク | `src/components/Footer.astro` |
| 配色・フォント・余白 | `src/styles/global.css`（`:root` のCSS変数） |
| サイト全体のtitle/description | `src/layouts/BaseLayout.astro` の既定props |
| OGP画像 | `public/og/og-default.png`（1200×630） |
| favicon | `public/favicon.svg` |
| AYN水彩ビジュアル | `src/assets/ayn-*.png` |

**新しいアプリ/リンクを足す = Markdownを1枚足すだけ**。
手順は [docs/ADD_CONTENT.md](docs/ADD_CONTENT.md)。

---

## コンテンツの frontmatter（カード情報）

全コレクション共通:

| キー | 必須 | 意味 |
|---|---|---|
| `title` | ○ | カード見出し |
| `summary` | ○ | 説明文（1〜2文） |
| `url` | ○ | リンク先（`https://` 始まり） |
| `order` | | 並び順（小さいほど上。既定100） |
| `status` | | `active` / `draft` / `hidden`。`active` 以外は非表示 |
| `cta` | | ボタン文言（未指定は「開く」） |
| `category` | | 分類ラベル（任意） |

コレクション固有:

- `apps`: `price`（既定「無料」）, `platform`, `icon`（`../../assets/xxx.png` で画像指定）
- `channels` / `social`: `handle`（@ハンドル表示）
- `music`: `service`（サービス名バッジ）

スキーマ本体は `src/content.config.ts`。バリデーションが効くので、
必須項目が抜けると `npm run build` がエラーで教えてくれる。

---

## ショートカット集ページ `/shortcuts`（Prompt178）

「AYNにまかせんしゃい」の自作iPhoneショートカット配布ページ。
**カードのデータはこのリポには持たない**。正本は Worker 側の台帳
`bcnofne-edge/src/shortcuts.json` で、ページはビルド不要でクライアントから
`https://bcnofne-edge.aynbcnofne.workers.dev/shortcuts` を取得して描画する。

QRコード（PCの人がスマホで読む用）だけは静的画像なので、台帳から生成して
`public/qr/<slug>.png` にコミットする：

```bash
# 台帳(bcnofne-edge/src/shortcuts.json)を読んで public/qr/<slug>.png を一括生成
python3 scripts/gen_shortcut_qr.py          # 要: pip install "qrcode[pil]"
```

**新しいワザを足す手順**：
1. `bcnofne-edge/src/shortcuts.json` に1エントリ追記 → `npx wrangler deploy`
2. このリポで `python3 scripts/gen_shortcut_qr.py` → `git push`（自動デプロイ）
3. Hermes登録簿は次回巡回で自動投稿（`shortcut-registry-notifier`）

QRの中身は `go.bcnofne.com/<slug>`（iCloud直リンクにしない＝タップ/スキャンを計測に通すため）。

---

## デプロイ（GitHub Pages + 独自ドメイン bcnofne.com）

本番は **https://bcnofne.com**。設定は `public/CNAME`（`bcnofne.com`）と
`astro.config.mjs`（`site=https://bcnofne.com` / `base=/`）で確定済み。

### 初回セットアップ（1回だけ）

1. GitHub で空リポジトリ `Aynyan2828/bcnofne-hub` を作成（Public）。
2. ローカルを push:
   ```bash
   cd ~/bcnofne/bcnofne-hub
   git init && git add -A && git commit -m "init: BCNOFNe hub site"
   git branch -M main
   git remote add origin git@github.com:Aynyan2828/bcnofne-hub.git
   git push -u origin main
   ```
3. リポジトリ → **Settings → Pages → Build and deployment → Source** を
   **「GitHub Actions」** に。
4. 同じ **Settings → Pages → Custom domain** に `bcnofne.com` を入力して保存。
   （`public/CNAME` があるので自動で入ることも多い）。「Enforce HTTPS」に必ずチェック。
5. **DNS**（ドメイン取得元の管理画面）で以下を設定:
   - apex `bcnofne.com` → GitHub Pages の A / AAAA レコード:
     ```
     A     185.199.108.153
     A     185.199.109.153
     A     185.199.110.153
     A     185.199.111.153
     AAAA  2606:50c0:8000::153
     AAAA  2606:50c0:8001::153
     AAAA  2606:50c0:8002::153
     AAAA  2606:50c0:8003::153
     ```
   - `www.bcnofne.com` → CNAME `aynyan2828.github.io`
6. DNS 反映（数分〜最大48h）後、GitHub が証明書を発行 → HTTPS で公開。

### 通常の更新フロー

```bash
# 例: 新アプリのカードを足す → src/content/apps/new-app.md を作成
git add -A
git commit -m "add: 新アプリのカード"
git push          # → Actions が自動デプロイ（数十秒〜数分で bcnofne.com に反映）
```

### GitHub PagesのプロジェクトURLで先に確認したい時

独自ドメインDNSが通る前に `https://aynyan2828.github.io/bcnofne-hub/` で見たい場合は、
一時的に base 付きでビルドできる（CNAMEは本番用なので確認用ビルドでは無視されない点に注意）:

```bash
SITE_URL=https://aynyan2828.github.io BASE_PATH=/bcnofne-hub npm run build
```

将来 Cloudflare Pages 等へ移す場合も `SITE_URL`/`BASE_PATH` を渡して
`npm run build` するだけで出力先を合わせられる。

---

## 方針・制約

- **秘密情報は一切置かない**（このサイトは公開静的物）。`.env` は git 管理外。
- 対外コピーの一人称は **「ぼく」**（BCNOFNe＝ボクのフネ 由来）。絵文字は使わない。
- アプリ情報・価格は正確に（誇大NG、Appleガイドライン意識）。
- 文字コード UTF-8 / 改行 LF。
- 変更したら `CHANGELOG.md` を更新する。

---

## ディレクトリ構成

```
bcnofne-hub/
├─ src/
│  ├─ assets/            AYN水彩ビジュアル・アプリアイコン（Astro Imageで最適化）
│  ├─ components/        Hero / Section / Card / About / Footer / SEO
│  ├─ content/           ★ここを編集＝カードが変わる（apps/channels/music/social）
│  ├─ content.config.ts  コンテンツのスキーマ定義
│  ├─ layouts/           BaseLayout（<head>・SEO）
│  ├─ pages/index.astro  1ページ集約（各セクションを組み立て）
│  └─ styles/global.css  配色・フォント・共通スタイル
├─ public/               favicon / robots.txt / og画像（そのまま配信）
├─ .github/workflows/    GitHub Pages 自動デプロイ
└─ astro.config.mjs      site/base 設定
```
