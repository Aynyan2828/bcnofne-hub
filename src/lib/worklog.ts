/**
 * AYN の機関日誌（worklog コレクション）の読み出し — 機関室ページ・RSS・トップの予告で共通。
 * 並びは新しい順。draft / hidden は出さん。
 */
import { getCollection, type CollectionEntry } from 'astro:content';

export type WorklogEntry = CollectionEntry<'worklog'> | CollectionEntry<'worklogEn'>;

/** lang 'en' は英語版（src/content/worklog-en/）。日誌は日本語・英語の両方を書く（2026-11-02 マスター）。 */
export async function getWorklog(lang: 'ja' | 'en' = 'ja'): Promise<WorklogEntry[]> {
  const all = await getCollection(lang === 'en' ? 'worklogEn' : 'worklog');
  return all
    .filter((e) => e.data.status === 'active')
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** 日付はいつも日本時間で見せる（ビルド機のタイムゾーンに引っぱられんように）。 */
function jstParts(d: Date) {
  const j = new Date(d.getTime() + 9 * 3600 * 1000);
  return { y: j.getUTCFullYear(), m: j.getUTCMonth() + 1, d: j.getUTCDate() };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** 2026.09.24 */
export function fmtLogDate(d: Date): string {
  const p = jstParts(d);
  return `${p.y}.${pad(p.m)}.${pad(p.d)}`;
}

/** アンカー用 2026-09-24 */
export function logAnchor(d: Date): string {
  const p = jstParts(d);
  return `log-${p.y}-${pad(p.m)}-${pad(p.d)}`;
}

/** 本文（md の生テキスト）を行ごとに。空行は捨てる。 */
export function logLines(e: WorklogEntry): string[] {
  return (e.body ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}
