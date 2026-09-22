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

## 例3: Featured（Apps 港の主役）を差し替える

トップの大きな `FEATURED PROJECT` 枠に出るアプリは、**`featured: true` を書いた .md 1本**で決まる。
コードは触らんでよか。新しいアプリを主役にしたい時は:

1. 今の主役（`src/content/apps/angleon.md`）から `featured: true` の行を消す
2. 新しい .md に下の項目を足す

```markdown
---
title: あたらしいアプリ
summary: カードにも Featured にも出る説明。
url: https://bcnofne.com/newapp/
price: 制作中
icon: ../../assets/app-newapp-icon.png
cta: 先行して見る
featured: true          # ← これが主役の印（1本だけ）
hook: |                 # ← 大きく出る2〜3行のキャッチ（改行で1行ずつ）
  ぐちゃぐちゃの線を回す。
  ある角度だけ、絵が現れる。
demo: /media/newapp_promo.mp4        # 任意（public/ 配下のパス）
demoPoster: /media/newapp_poster.jpg # 任意（動画の1枚目）
extraLinks:                          # 任意（サブの導線）
  - label: ブラウザで試す
    url: https://bcnofne.com/newapp/#play
---
```

`featured: true` が無いアプリは、その下の「Other Apps」に並ぶ。
`featured` が1つも無い時は、Featured 枠ごと出んようになるだけ（壊れん）。

---

## 例4: 音楽に「気分」タグを付ける

Music 港の「いま、どんな気分？」で絞り込むためのタグ。`src/content/music/*.md` に:

```markdown
moods:
  - sleep     # 眠りたい
  - night     # 夜の航海
  # morning   # 朝・ドライブ
  # focus     # 集中したい
```

- **`moods` を書かんかったら「常設」**＝どの気分でも出る（Spotify の入口カードがこれ）。
- 気分そのものを増やしたい時は `src/components/MoodPicker.astro` の `MOODS` に1行＋
  `src/content.config.ts` の `z.enum([...])` に同じ値を足す。

---

## 例5: SNS リンクの「強さ」を変える

Social 港はリンクを3段に分けとる。`src/content/social/*.md` の `tier:` で決まる。

| `tier` | どう出るか |
|---|---|
| `pinned` | 見出しの下の目立つピル（いまは Litlink だけ） |
| `primary` | 画像つきの大きなカードの棚（いまは SNS ぜんぶここ） |
| `more` | 下の「その他の航路」に、一段小さいピルで出る（既定値） |

`tier` を書かんかったら `more`。いまは `more` が1つも無いけん、その棚ごと出とらん。
**リンクを消さんでも目立ち方だけ下げられる**けん、増えすぎたら `more` に落とすとよか。
棚の並び順は `order:` の小さい順（先頭ほど目に入る）。

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
