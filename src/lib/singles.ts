// シングル棚の並べ方（2026-11-01）。
//   1. pinned: true の曲（今は「6弦と僕の船」の日本語版・英語版）をいちばん左に固定。
//      固定曲どうしは配信日の古い順＝日本語版が左端、英語版がその右（聞き比べ用・2026-11-02 マスター）
//   2. released（配信日）を書いた曲を新しい順に
//   3. released を書いとらん既存曲（バグってごめん！ 以降）は今まで通り order の小さい順
// 新曲は src/content/music/single-*.md に released を書いて足すだけで、
// 「固定曲」と「バグってごめん！」の間に自動で入る。
type SingleLike = { data: { order: number; pinned?: boolean; released?: Date } };

export function sortSingles<T extends SingleLike>(items: T[]): T[] {
  const rank = (e: T) => (e.data.pinned ? 0 : e.data.released ? 1 : 2);
  return [...items].sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r !== 0) return r;
    const ta = a.data.released?.getTime() ?? 0;
    const tb = b.data.released?.getTime() ?? 0;
    if (ta !== tb) return a.data.pinned ? ta - tb : tb - ta; // 固定曲は古い順、それ以外は新しい順
    return a.data.order - b.data.order;
  });
}
