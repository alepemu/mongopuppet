export const HISTORY_SIZE = 10

export function addToHistory(list: readonly string[], value: string, max = HISTORY_SIZE): string[] {
  return [value, ...list.filter((item) => item !== value)].slice(0, max)
}
