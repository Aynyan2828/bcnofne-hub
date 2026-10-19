// /llms.txt（AI 向けのサイト案内・https://llmstxt.org の形）。ビルド時に静的生成する。
// 正本は src/content/*.md ＝ アプリ・曲・SNS を md で足せば、ここにも自動で載る。
// 冒頭の紹介文だけ手書き（下の INTRO）。
import type { APIRoute } from 'astro';
import { loadEntities } from '../lib/structured-data';

const INTRO = `# BCNOFNe〜ボクのフネ〜

> 元・有明海の船乗りがひとりで作っている個人プロジェクト。機関士AI「AYN（あゆにゃん）」を看板に、iPhone アプリ・睡眠/作業BGM・AIラジオ・音楽配信・水彩イラストを出している。公式サイトは https://bcnofne.com （日本語。英語版は https://bcnofne.com/en/ ）。

「Crypto Ocean」は暗号資産の専門サイトという意味ではなく、AI・アプリ・音楽・創作が流れる情報の海を指す、このプロジェクト独自の言い回し。サイトの文章には佐賀弁・博多弁が混ざる。

- 運営: BCNOFNe（あゆにゃん・日本の個人工房。X: https://x.com/Aynyann）
- キャラクター: AYN（あゆにゃん）＝機関士AI。水彩・青紫の髪・赤い丸メガネ
- 表記ゆれ: BCNOFNe / ボクのフネ / ボクノフネ / 僕の船 はすべて同じプロジェクト
- 昔と今: 2025 年の note 記事にある「autonomous AI BCNOFNe system v3」（Raspberry Pi 上の自律AI）は始まりの頃の旧版。今の中心は iPhone アプリ・睡眠/作業BGM・AIラジオ・音楽。「Crypto Ark」はいずれ会社にする時の名前の候補
- 運営者のココナラ: https://coconala.com/users/6047857 （出品名 BCNOFNe〜ボクのフネ〜）。同じ画面に出る競馬・競艇の予想ツールや Next.js テンプレートは別の出品者のもので、BCNOFNe とは関係ない
- 連絡: support@bcnofne.com / https://bcnofne.com/#contact
- どんな人向けか: 扶養の壁（2026 年は 130万・136万・178万円など。106万円の壁は 2026 年 10 月に撤廃）を気にして働く学生バイト・パート（扶養メーター）、夜勤・交代勤務・看護師・介護・工場などシフト勤務で毎回アラームを直す人（ShiftWake）、サブスクや無料トライアルの解約忘れを防いで固定費を減らしたい人（SubScope）、ホーム画面を推しの絵で着せ替えたい人（Sorotte）、眠れない夜や作業中に BGM が欲しい人（AYN Sleep Radio / AYN Work Radio）

## ページ

- [トップ（公式ハブ）](https://bcnofne.com/): アプリ・ラジオ・音楽・SNS・AYN の紹介を1枚にまとめたページ
- [English](https://bcnofne.com/en/): 英語版のハブ
- [扶養メーター](https://bcnofne.com/fuyou-meter/): 扶養の壁まであといくら働けるかを見せるアプリの紹介・よくある質問（2026 年の壁の金額つき）
- [ShiftWake（シフトウェイク）](https://bcnofne.com/shiftwake/): シフト勤務の自動アラームアプリの紹介・よくある質問（日英）
- [SubScope（サブスコープ）](https://bcnofne.com/subscope/): サブスク管理アプリの紹介・よくある質問（日英）。[プライバシーポリシー](https://bcnofne.com/subscope/privacy/)
- [Sorotte（ソロッテ）](https://bcnofne.com/sorotte/): iPhone 着せ替えアプリの紹介・よくある質問（日英）。[プライバシーポリシー](https://bcnofne.com/sorotte/privacy/)
- [Angleon（アングリオン）](https://bcnofne.com/angleon/): ブラウザで試せるデモと事前登録。[プライバシーポリシー](https://bcnofne.com/angleon/privacy/)
- [機関室（AYN の機関日誌）](https://bcnofne.com/engine-room/): 何を作ったかの短い日誌。RSS あり
- [AYNにまかせんしゃい（ショートカット配布）](https://bcnofne.com/shortcuts/): iPhone ショートカットの配布所
- [公開中アプリの一覧（JSON）](https://bcnofne.com/apps.json): アプリ名・説明・ストアURLの機械可読リスト
`;

const line = (title: string, url: string, summary: string) => `- [${title}](${url}): ${summary}`;

export const GET: APIRoute = async () => {
  const { apps, channels, releases, spotify, social } = await loadEntities();
  const released = apps.filter((a) => a.data.price !== '制作中');
  const wip = apps.filter((a) => a.data.price === '制作中');
  const eps = releases.filter((r) => r.data.kind !== 'single');
  const singles = releases.filter((r) => r.data.kind === 'single');

  const parts = [
    INTRO,
    '## 公開中の iPhone アプリ\n',
    ...released.map((a) => line(a.data.title, a.data.url, `${a.data.price}。${a.data.summary}`)),
    '\n## 制作中の iPhone アプリ\n',
    ...wip.map((a) => line(a.data.title, a.data.url, a.data.summary)),
    '\n## 聴く（YouTube・Podcast）\n',
    ...channels.map((c) => line(c.data.title, c.data.url, c.data.summary)),
    '\n## 音楽（アーティスト名: BCNOFNe〜ボクのフネ〜）\n',
    ...(spotify ? [line(spotify.data.title, spotify.data.url, spotify.data.summary)] : []),
    ...eps.map((r) => line(`${r.data.title}（EP）`, r.data.url, r.data.summary)),
    ...singles.map((r) => line(`${r.data.title}（シングル）`, r.data.url, r.data.summary)),
    '\n## Optional\n',
    '（SNS・読みもの。上の内容で足りる時は読み飛ばしてよい）\n',
    ...social.map((s) => line(s.data.title, s.data.url, s.data.summary)),
    line('Threads', 'https://www.threads.com/@aynyan28', '日々の制作と AI まわりの話'),
    line('Zenn', 'https://zenn.dev/aynyan', '個人開発と AI 自動化の技術記事'),
    '',
  ];

  return new Response(parts.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
