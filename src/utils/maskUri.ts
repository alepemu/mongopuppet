/**
 * Hides passwords in any MongoDB URI found in the text, so it is safe to print.
 * The pattern is greedy so a password containing a raw "@" is fully hidden.
 */
export function maskUri(text: string): string {
  return text.replace(/(\/\/[^:/@\s]+):[^\s/]*@/g, "$1:****@")
}
