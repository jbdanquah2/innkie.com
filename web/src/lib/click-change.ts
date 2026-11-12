/** Sums the clicks of a daily series that fall before `firstDay` (YYYY-MM-DD): the period just before the current one. */
export function clicksBefore(series: { date: string; clicks?: number }[], firstDay: string): number {
  return series.filter((d) => d.date < firstDay).reduce((n, d) => n + (d.clicks || 0), 0);
}

/** "12% more than the previous 30 days". Undefined when there is nothing meaningful to compare with. */
export function describeChange(current: number, previous: number | null, days: number): string | undefined {
  if (previous === null) return undefined;
  if (previous === 0) return current > 0 ? `Up from none in the previous ${days} days` : undefined;
  if (current === previous) return `Same as the previous ${days} days`;
  const pct = Math.round((Math.abs(current - previous) / previous) * 100);
  return `${pct}% ${current > previous ? 'more' : 'fewer'} than the previous ${days} days`;
}
