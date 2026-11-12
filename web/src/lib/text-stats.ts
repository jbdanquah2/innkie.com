/** Text statistics that count the way people do: words in any script, characters as they look on screen. */

const STOP = new Set('a an and are as at be but by for from has have he her his i if in into is it its of on or our she so that the their them they this to was we were will with you your'.split(' '));

/** Scripts written without spaces between words, where whitespace splitting would count a whole sentence as one word. */
const UNSPACED = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}]/u;
const HAS_WORD_CHAR = /[\p{L}\p{N}]/u;

type SegmenterLike = { segment(input: string): Iterable<{ segment: string; isWordLike?: boolean }> };
const makeSegmenter = (granularity: 'word' | 'sentence' | 'grapheme'): SegmenterLike | null => {
  try {
    const I = Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => SegmenterLike };
    return I.Segmenter ? new I.Segmenter(undefined, { granularity }) : null;
  } catch { return null; }
};
const wordSeg = makeSegmenter('word');
const sentenceSeg = makeSegmenter('sentence');
const graphemeSeg = makeSegmenter('grapheme');

/** Line breaks are counted once, whether the text came from Windows (\r\n), old Mac (\r) or Unix (\n). */
export const normalizeNewlines = (s: string) => s.replace(/\r\n?/g, '\n');

/** Characters as a reader sees them: an emoji family or a letter with an accent is one character. */
export function countCharacters(text: string): number {
  const t = normalizeNewlines(text);
  if (!graphemeSeg) return [...t].length;
  let n = 0;
  for (const _ of graphemeSeg.segment(t)) n++;
  return n;
}

/**
 * Words are whitespace-separated pieces that contain a letter or digit, so a lone dash or ampersand is not a word.
 * Pieces in scripts written without spaces are split with the browser's dictionary segmenter.
 */
export function listWords(text: string): string[] {
  const out: string[] = [];
  for (const token of text.split(/\s+/)) {
    if (!token || !HAS_WORD_CHAR.test(token)) continue;
    if (wordSeg && UNSPACED.test(token)) {
      for (const s of wordSeg.segment(token)) if (s.isWordLike) out.push(s.segment);
    } else {
      out.push(token);
    }
  }
  return out;
}

export function countSentences(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  if (sentenceSeg) {
    let n = 0;
    for (const s of sentenceSeg.segment(t)) if (HAS_WORD_CHAR.test(s.segment)) n++;
    return n;
  }
  return (t.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? []).filter((s) => s.trim()).length;
}

export interface TextStats {
  words: number;
  chars: number;
  noSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  unique: number;
  avgWordLength: number;
  avgSentenceWords: number;
  top: [string, number][];
  read: number;
  speak: number;
}

export function analyze(text: string, wpmRead = 200, wpmSpeak = 130): TextStats {
  const t = normalizeNewlines(text);
  const trimmed = t.trim();
  const words = trimmed ? listWords(trimmed) : [];
  const sentences = countSentences(t);
  const clean = (w: string) => w.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
  const freq = new Map<string, number>();
  const unique = new Set<string>();
  let letters = 0;
  for (const w of words) {
    const k = clean(w);
    if (!k) continue;
    unique.add(k);
    letters += [...k].length;
    if ([...k].length > 2 && !STOP.has(k)) freq.set(k, (freq.get(k) ?? 0) + 1);
  }
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);
  return {
    words: words.length,
    chars: countCharacters(t),
    noSpaces: countCharacters(t.replace(/\s/g, '')),
    sentences,
    paragraphs: trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length : 0,
    lines: t ? t.split('\n').length : 0,
    unique: unique.size,
    avgWordLength: words.length ? Math.round((letters / words.length) * 10) / 10 : 0,
    avgSentenceWords: sentences ? Math.round((words.length / sentences) * 10) / 10 : 0,
    top,
    read: words.length / wpmRead,
    speak: words.length / wpmSpeak,
  };
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0 sec';
  const s = Math.round(minutes * 60);
  if (s < 60) return `${s} sec`;
  const m = Math.floor(s / 60);
  return `${m} min${s % 60 ? ` ${s % 60} sec` : ''}`;
}

// ---- Text messages ---------------------------------------------------------------------------------------------

const GSM7_BASIC = new Set('@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\u001bÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'.split(''));
const GSM7_EXTENDED = new Set('^{}\\[~]|€\f'.split(''));

export interface SmsInfo { encoding: 'GSM-7' | 'UCS-2'; units: number; segments: number; perSegment: number; characters: number }

/**
 * How many text messages the text needs. Plain characters use GSM-7 (160 per message, 153 each when a message is split).
 * One emoji or an unusual letter switches the whole message to UCS-2, which fits only 70 (67 when split).
 */
export function smsInfo(text: string): SmsInfo {
  const t = normalizeNewlines(text);
  const chars = [...t];
  const gsm = chars.every((c) => GSM7_BASIC.has(c) || GSM7_EXTENDED.has(c));
  if (gsm) {
    const units = chars.reduce((n, c) => n + (GSM7_EXTENDED.has(c) ? 2 : 1), 0);
    return { encoding: 'GSM-7', units, perSegment: units <= 160 ? 160 : 153, segments: units === 0 ? 0 : units <= 160 ? 1 : Math.ceil(units / 153), characters: chars.length };
  }
  const units = t.length; // UTF-16 code units, which is how UCS-2 messages are counted
  return { encoding: 'UCS-2', units, perSegment: units <= 70 ? 70 : 67, segments: units === 0 ? 0 : units <= 70 ? 1 : Math.ceil(units / 67), characters: chars.length };
}

export interface Limit { id: string; label: string; max: number; note?: string }
export const LIMITS: Limit[] = [
  { id: 'x', label: 'X (Twitter) post', max: 280, note: 'Links and some emoji count differently on X.' },
  { id: 'title', label: 'Page title (search results)', max: 60, note: 'A guideline: Google cuts titles by width, not characters.' },
  { id: 'meta', label: 'Meta description', max: 160, note: 'A guideline: Google may show more or less.' },
  { id: 'yt', label: 'YouTube title', max: 100 },
  { id: 'ig', label: 'Instagram caption', max: 2200 },
  { id: 'li', label: 'LinkedIn post', max: 3000 },
];

// ---- Cleaning up -----------------------------------------------------------------------------------------------

export const tidy = {
  extraSpaces: (s: string) => normalizeNewlines(s).split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).join('\n'),
  emptyLines: (s: string) => normalizeNewlines(s).split('\n').filter((l) => l.trim() !== '').join('\n'),
  upper: (s: string) => s.toUpperCase(),
  lower: (s: string) => s.toLowerCase(),
  sentenceCase: (s: string) => s.toLowerCase().replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (_m, a: string, b: string) => a + b.toUpperCase()),
};
