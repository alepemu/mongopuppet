/** Greedy, so a password containing a raw "@" is fully hidden. */
export function maskUri(text: string): string {
  return text.replace(/(\/\/[^:/@\s]+):[^\s/]*@/g, "$1:****@")
}
