const STOP_PATTERNS: RegExp[] = [
  /\bstop\b/i,
  /\bwait\b/i,
  /\bno\b/i,
  /\bhold on\b/i,
  /\babort\b/i,
  /\bcancel\b/i,
];

export function containsStopWord(text: string): boolean {
  if (!text) return false;
  return STOP_PATTERNS.some((re) => re.test(text));
}
