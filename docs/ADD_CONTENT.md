# 新コンテンツの追加のやり方（Markdown1枚）

このサイトは **Markdownを1枚足すだけでカードが増える** 構造。
HTML/CSSは触らんでよか。以下のどれかのフォルダに `.md` を作るだけばい。

| 足したいカード | 置き場所 |
|---|---|
| アプリ | `src/content/apps/` |
| YouTube / AI RADIO | `src/content/channels/` |
| 音楽配信 | `src/content/music/` |
| SNS リンク | `src/content/social/` |

---

## 例1: アプリを1つ追加する

`src/content/apps/my-new-app.md` を新規作成:

```markdown
---
title: あたらしいアプリ
summary: どんなアプリか1〜2文で。ぼくの口調（ばい/けん）でよか。
url: https://apps.apple.com/app/idXXXXXXXXXX
price: 無料
platform: iOS
icon: ../../assets/my-new-app-icon.png   # 任意。無ければこの行を消す
cta: App Store で見る
order: 20                                 # 小さいほど上に出る
status: active
---

カードの下に出る本文（任意）。長めの説明はここに書く。
```

アイコンを付けるなら、画像を `src/assets/` に置いてから
`icon:` にそのファイルへの相対パス（`../../assets/ファイル名`）を書く。
画像はビルド時に自動で最適化（webp化・リサイズ）される。

---

## 例2: SNSリンクを1つ追加する

`src/content/social/threads.md`:

```markdown
---
title: Threads
summary: もうひとつの発信先。
url: https://www.threads.net/@xxxx
handle: "@xxxx"
category: SNS
cta: Threadsを見る
order: 45
status: active
---
```

---

## 公開まで

```bash
cd ~/bcnofne/bcnofne-hub
npm run dev            # ローカルで見た目を確認（http://localhost:4321/）
git add -A
git commit -m "add: Threads のリンクを追加"
git push               # → GitHub Actions が自動でビルド＆公開
```

数十秒〜数分で https://bcnofne.com/ に反映される。

---

## よくある操作

- **一時的に隠したい**: frontmatter の `status: active` を `status: hidden` に変える。
- **並び順を変える**: `order:` の数字を小さくすると上に来る。
- **カードを消す**: その `.md` ファイルを削除する。
- **必須項目を忘れた**: `npm run build` がエラーで「どのファイルの何が足りない」か教えてくれる。

---

## Claude Code への頼み方（マスター向け）

ターミナルを開かんでも、Claude Code にこう頼めばよか:

> 「hubサイトに ◯◯ っていうアプリのカードを足して。URLは △△、無料。」
> 「hubのHeroのキャッチを ×× に変えて push して。」

Claude Code が該当Markdownを作成/編集 → commit → push まで流す。
