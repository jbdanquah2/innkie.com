import { describe, expect, it } from 'vitest';
import { analyze, countCharacters, countSentences, formatDuration, listWords, smsInfo, tidy } from '@/lib/text-stats';

describe('words', () => {
  it('counts space-separated words and ignores lone punctuation', () => {
    expect(listWords('Hello world')).toEqual(['Hello', 'world']);
    expect(listWords('word - word & word — end')).toEqual(['word', 'word', 'word', 'end']);
    expect(listWords("don't well-known e-mail")).toEqual(["don't", 'well-known', 'e-mail']);
    expect(listWords('  \n\t ')).toEqual([]);
    expect(listWords('3.14 and 1,000')).toHaveLength(3);
  });
  it('splits scripts that are written without spaces', () => {
    const jp = listWords('私は猫が好きです');
    expect(jp.length).toBeGreaterThan(2); // whitespace splitting would have said 1
    const zh = listWords('我喜欢吃苹果');
    expect(zh.length).toBeGreaterThan(1);
    const mixed = listWords('Hello 世界 and 你好吗');
    expect(mixed).toContain('Hello');
    expect(mixed.length).toBeGreaterThan(4);
    expect(listWords('ฉันรักแมว').length).toBeGreaterThan(1);
  });
});

describe('characters', () => {
  it('counts what a reader sees: emoji sequences and accents are one character', () => {
    expect(countCharacters('a😀b')).toBe(3);
    expect(countCharacters('👨‍👩‍👧')).toBe(1);
    expect(countCharacters('🇬🇭')).toBe(1);
    expect(countCharacters('é')).toBe(1); // e + combining accent
    expect(countCharacters('')).toBe(0);
  });
  it('counts a Windows line break once', () => {
    expect(countCharacters('a\r\nb')).toBe(3);
    expect(countCharacters('a\nb')).toBe(3);
    expect(analyze('a\r\nb\r\nc').lines).toBe(3);
  });
});

describe('analyze', () => {
  it('counts the basics', () => {
    const a = analyze('Hello world. This is a test!\n\nSecond paragraph here.');
    expect(a.words).toBe(9);
    expect(a.sentences).toBe(3);
    expect(a.paragraphs).toBe(2);
    expect(a.chars).toBe('Hello world. This is a test!\n\nSecond paragraph here.'.length);
  });
  it('handles empty and whitespace-only text', () => {
    expect(analyze('')).toMatchObject({ words: 0, chars: 0, sentences: 0, paragraphs: 0, lines: 0, unique: 0 });
    expect(analyze('   \n ').words).toBe(0);
  });
  it('finds the most used words, skipping common ones', () => {
    const top = analyze('Apple apple APPLE the the banana').top;
    expect(top[0]).toEqual(['apple', 3]);
    expect(top.find(([w]) => w === 'the')).toBeUndefined();
  });
  it('reports unique words and averages', () => {
    const a = analyze('The cat sat. The cat ran.');
    expect(a.unique).toBe(4);
    expect(a.avgSentenceWords).toBe(3);
    expect(a.avgWordLength).toBe(3);
  });
  it('estimates reading and speaking time, and the speed can change', () => {
    expect(analyze('word '.repeat(400)).read).toBeCloseTo(2);
    expect(analyze('word '.repeat(400)).speak).toBeCloseTo(400 / 130);
    expect(analyze('word '.repeat(300), 300).read).toBeCloseTo(1);
  });
  it('counts sentences without splitting on decimals', () => {
    expect(countSentences('It cost 3.14 dollars. Then it rose.')).toBe(2);
    expect(countSentences('No end punctuation here')).toBe(1);
    expect(countSentences('')).toBe(0);
  });
});

describe('formatDuration', () => {
  it('formats seconds and minutes', () => {
    expect(formatDuration(0)).toBe('0 sec');
    expect(formatDuration(0.5)).toBe('30 sec');
    expect(formatDuration(2)).toBe('2 min');
    expect(formatDuration(2.5)).toBe('2 min 30 sec');
  });
});

describe('smsInfo', () => {
  it('uses 160 characters per message for plain text', () => {
    expect(smsInfo('a'.repeat(160))).toMatchObject({ encoding: 'GSM-7', segments: 1, units: 160 });
    expect(smsInfo('a'.repeat(161))).toMatchObject({ encoding: 'GSM-7', segments: 2, perSegment: 153 });
    expect(smsInfo('a'.repeat(306))).toMatchObject({ segments: 2 });
    expect(smsInfo('a'.repeat(307))).toMatchObject({ segments: 3 });
    expect(smsInfo('')).toMatchObject({ segments: 0, units: 0 });
  });
  it('counts extended characters twice', () => {
    expect(smsInfo('€').units).toBe(2);
    expect(smsInfo('{a}').units).toBe(5);
    expect(smsInfo('a'.repeat(159) + '€')).toMatchObject({ units: 161, segments: 2 });
  });
  it('switches the whole message to 70 characters when it contains an emoji or an unusual letter', () => {
    expect(smsInfo('Hello 😀')).toMatchObject({ encoding: 'UCS-2', units: 8, segments: 1, perSegment: 70 });
    expect(smsInfo('a'.repeat(70) + '😀').segments).toBe(2);
    expect(smsInfo('Dziękuję')).toMatchObject({ encoding: 'UCS-2' });
    expect(smsInfo('café déjà vu')).toMatchObject({ encoding: 'GSM-7' });
  });
});

describe('tidy', () => {
  it('cleans spaces and empty lines', () => {
    expect(tidy.extraSpaces('  a   b \t c  \n  d  ')).toBe('a b c\nd');
    expect(tidy.emptyLines('a\n\n\nb\n   \nc')).toBe('a\nb\nc');
  });
  it('changes case', () => {
    expect(tidy.upper('héllo')).toBe('HÉLLO');
    expect(tidy.lower('HELLO')).toBe('hello');
    expect(tidy.sentenceCase('hELLO there. how ARE you? fine!')).toBe('Hello there. How are you? Fine!');
  });
});
