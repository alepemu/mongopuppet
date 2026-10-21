/** Hides passwords in any MongoDB URI found in the text, so it is safe to print. */
export function maskUri(text: string): string {
  return text.replace(/(\/\/[^:/@\s]+):[^@\s/]*@/g, "$1:****@")
}
