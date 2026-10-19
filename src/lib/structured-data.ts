// 構造化データ（JSON-LD）と llms.txt の材料。GEO（生成AI検索）向け。
// 正本は src/content/*.md ＝ md を1枚足せば JSON-LD と llms.txt にも自動で載る。
// 「誰が・何を出しとるか」を AI に機械で読ませるのが目的（2026-10-19 GEO 点検）。
import { getCollection } from 'astro:content';

export const ORG_NAME = 'BCNOFNe〜ボクのフネ〜';
export const ORG_ALT_NAMES = ['BCNOFNe', 'ボクのフネ', 'ボクノフネ', '僕の船'];
export const ORG_DESCRIPTION =
  '機関士AI「AYN（あゆにゃん）」を看板にした、日本の個人プロジェクト。iPhone アプリ・睡眠/作業BGM・AIラジオ・音楽配信・水彩イラストを出している。';

// コンテンツ md に無いけど「同じ運営者」と示したいプロフィール
const EXTRA_SAME_AS = ['https://www.threads.com/@aynyan28', 'https://zenn.dev/aynyan'];

// App Store のカテゴリ（schema.org の applicationCategory）。appId で引く
const APP_CATEGORY: Record<string, string> = {
  fuyometer: 'FinanceApplication',
  shiftwake: 'UtilitiesApplication',
  sorotte: 'LifestyleApplication',
  angleon: 'EntertainmentApplication',
};

// 一般の悩みの言葉（AI が「おすすめのアプリ」を答える時に拾う語）。扶養は 2026 年の壁で書く
const APP_KEYWORDS: Record<string, string[]> = {
  fuyometer: ['扶養の壁', '130万円の壁', '136万円の壁', '178万円の壁', '学生バイト', 'パート', '年収管理', '2026年'],
  shiftwake: ['シフト勤務', '夜勤', '交代勤務', '看護師', '介護', '工場', '寝坊防止', 'カレンダー連動アラーム'],
  subscope: ['サブスク管理', '解約忘れ', '無料トライアル', '固定費削減', '更新日'],
  sorotte: ['ホーム画面カスタマイズ', 'アイコン着せ替え', '推し活'],
  angleon: ['隠し絵', '壁紙', '推し活'],
};

// 課金のある「基本無料」アプリの中身（offers の説明）。各アプリの紹介ページと同じ文
const APP_OFFER_NOTE: Record<string, string> = {
  fuyometer: '基本無料・扶養メーター PRO は月額 300 円または買い切り 1,500 円のアプリ内課金',
  shiftwake: '基本無料（ルール 2 件まで）・ShiftWake Pro は月額 200 円または買い切り 1,500 円のアプリ内課金',
  subscope: '基本無料・SubScope Pro は買い切りまたは月額のアプリ内課金',
};

const visible = (e: { data: { status: string } }) =>
  e.data.status !== 'hidden' && e.data.status !== 'draft';
const byOrder = (a: { data: { order: number } }, b: { data: { order: number } }) =>
  a.data.order - b.data.order;

// 運営者（人）＝あゆにゃん。看板の AYN とは別（2026-10-19 マスター：運営は X のアカウントで）
export function ownerNode(site: URL) {
  return {
    '@type': 'Person',
    '@id': ids(site).owner,
    name: 'あゆにゃん',
    alternateName: ['aynyan', 'Aynyan'],
    jobTitle: '個人開発者（元・二等機関士）',
    description: '有明海の元船乗り（甲板員から二等機関士）。BCNOFNe の名前は元素の覚え歌「水兵リーベ僕の船」の B・C・N・O・F・Ne から。',
    url: 'https://x.com/Aynyann',
    worksFor: { '@id': ids(site).org },
    knowsAbout: ['iOS アプリ開発', 'Swift', 'ローカルAI・LLM', '業務の自動化', '音楽制作（睡眠・作業BGM）', '船舶機関（二等機関士として乗船）'],
    // 本人のプロフィール（作品の置き場ではない所）だけ
    sameAs: [
      'https://x.com/Aynyann',
      'https://www.threads.com/@aynyan28',
      'https://zenn.dev/aynyan',
      'https://github.com/Aynyan2828',
      'https://note.com/aynyan_sui_ice',
      'https://bsky.app/profile/aynyan.bsky.social',
      'https://lit.link/aynyann',
    ],
  };
}

// 自前の紹介ページがあるアプリは、そのページの JSON-LD と同じ @id にそろえる
const APP_PAGE: Record<string, string> = {
  sorotte: '/sorotte/',
  subscope: '/subscope/',
  angleon: '/angleon/',
  fuyometer: '/fuyou-meter/',
  shiftwake: '/shiftwake/',
};

/** サイト全体で固定の @id（ページごとに変わらんように site のルートで作る） */
export function ids(site: URL) {
  const root = new URL('/', site).href;
  return {
    root,
    org: root + '#org',
    ayn: root + '#ayn',
    owner: root + '#owner',
    artist: root + '#artist',
    website: root + '#website',
  };
}

export async function loadEntities() {
  const apps = (await getCollection('apps')).filter(visible).sort(byOrder);
  const channels = (await getCollection('channels')).filter(visible).sort(byOrder);
  const music = (await getCollection('music')).filter(visible).sort(byOrder);
  const social = (await getCollection('social')).filter(visible).sort(byOrder);
  const releases = music.filter((m) => m.data.service !== 'Spotify');
  const spotify = music.find((m) => m.data.service === 'Spotify');
  const podcast = channels.find((c) => c.data.url.includes('podcasts.apple.com'));
  return { apps, channels, music, releases, spotify, podcast, social };
}

const isReleased = (price: string) => price !== '制作中';
const priceOf = (price: string) => (price === '無料' || price === '基本無料' ? '0' : undefined);

/** 公式ハブのトップ用の JSON-LD @graph（Organization ほか全部） */
export async function buildGraph(site: URL, page: { url: string; title: string; description: string; lang: string; image: string }) {
  const id = ids(site);
  const abs = (src: string) => new URL(src, site).href;
  const { apps, channels, releases, spotify, podcast, social } = await loadEntities();

  const sameAs = [
    ...social.map((s) => s.data.url),
    ...channels.map((c) => c.data.url),
    ...(spotify ? [spotify.data.url] : []),
    ...EXTRA_SAME_AS,
  ];

  const org = {
    '@type': 'Organization',
    '@id': id.org,
    name: ORG_NAME,
    alternateName: ORG_ALT_NAMES,
    description: ORG_DESCRIPTION,
    url: id.root,
    logo: abs('/apple-touch-icon.png'),
    image: page.image,
    email: 'support@bcnofne.com',
    founder: { '@id': id.owner },
    sameAs: [...new Set(sameAs)],
  };

  const ayn = {
    '@type': 'Person',
    '@id': id.ayn,
    name: 'AYN（あゆにゃん）',
    alternateName: '機関士AI AYN',
    description: 'BCNOFNe から生まれた機関士AI。Crypto Ocean を一緒に航海する相棒。',
    image: page.image,
    memberOf: { '@id': id.org },
  };

  const website = {
    '@type': 'WebSite',
    '@id': id.website,
    url: id.root,
    name: ORG_NAME,
    inLanguage: ['ja', 'en'],
    publisher: { '@id': id.org },
  };

  const webpage = {
    '@type': 'WebPage',
    '@id': page.url + '#webpage',
    url: page.url,
    name: page.title,
    description: page.description,
    inLanguage: page.lang,
    isPartOf: { '@id': id.website },
    about: { '@id': id.org },
  };

  const appNodes = apps.map((a) => {
    const appId = a.data.appId ?? a.id;
    const price = priceOf(a.data.price);
    return {
      '@type': 'MobileApplication',
      '@id': APP_PAGE[appId] ? new URL(APP_PAGE[appId], site).href + '#app' : id.root + '#app-' + appId,
      name: a.data.title,
      description: a.data.summary,
      url: APP_PAGE[appId] ? new URL(APP_PAGE[appId], site).href : a.data.url,
      ...(a.data.url.includes('apps.apple.com') ? { downloadUrl: a.data.url } : {}),
      operatingSystem: a.data.platform,
      applicationCategory: APP_CATEGORY[appId] ?? 'LifestyleApplication',
      ...(APP_KEYWORDS[appId] ? { keywords: APP_KEYWORDS[appId].join(', ') } : {}),
      ...(a.data.icon ? { image: abs(a.data.icon.src) } : {}),
      ...(isReleased(a.data.price)
        ? price
          ? { offers: { '@type': 'Offer', price, priceCurrency: 'JPY', ...(APP_OFFER_NOTE[appId] ? { description: APP_OFFER_NOTE[appId] } : {}) } }
          : {}
        : { creativeWorkStatus: '制作中（未公開）' }),
      author: { '@id': id.org },
      publisher: { '@id': id.org },
    };
  });

  const artist = {
    '@type': 'MusicGroup',
    '@id': id.artist,
    name: ORG_NAME,
    alternateName: 'BCNOFNe',
    genre: ['Lo-Fi', 'Sleep music', 'J-Pop'],
    url: id.root + '#music',
    sameAs: [
      ...(spotify ? [spotify.data.url] : []),
      ...channels.filter((c) => /AYNSleepRadio|AYNWorkRadio/.test(c.data.url)).map((c) => c.data.url),
    ],
    member: { '@id': id.ayn },
    album: releases.map((r) => ({ '@id': id.root + '#music-' + r.id })),
  };

  const releaseNodes = releases.map((r) => ({
    '@type': 'MusicAlbum',
    '@id': id.root + '#music-' + r.id,
    name: r.data.title,
    description: r.data.summary,
    url: r.data.url,
    albumReleaseType: r.data.kind === 'single' ? 'SingleRelease' : 'EPRelease',
    byArtist: { '@id': id.artist },
    ...(r.data.image ? { image: abs(r.data.image.src) } : {}),
  }));

  const podcastNode = podcast
    ? [
        {
          '@type': 'PodcastSeries',
          '@id': id.root + '#podcast',
          name: 'AI RADIO',
          description: podcast.data.summary,
          url: podcast.data.url,
          author: { '@id': id.org },
        },
      ]
    : [];

  return {
    '@context': 'https://schema.org',
    '@graph': [org, ownerNode(site), ayn, website, webpage, ...appNodes, artist, ...releaseNodes, ...podcastNode],
  };
}

/** トップ以外のページ用：運営者と WebSite だけの軽い版 */
export function buildLiteGraph(site: URL, page: { url: string; title: string; description: string; lang: string; image: string }) {
  const id = ids(site);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': id.org,
        name: ORG_NAME,
        alternateName: ORG_ALT_NAMES,
        url: id.root,
        logo: new URL('/apple-touch-icon.png', site).href,
        founder: { '@id': id.owner },
      },
      ownerNode(site),
      {
        '@type': 'WebSite',
        '@id': id.website,
        url: id.root,
        name: ORG_NAME,
        publisher: { '@id': id.org },
      },
      {
        '@type': 'WebPage',
        '@id': page.url + '#webpage',
        url: page.url,
        name: page.title,
        description: page.description,
        inLanguage: page.lang,
        isPartOf: { '@id': id.website },
        publisher: { '@id': id.org },
      },
    ],
  };
}
