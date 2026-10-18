/** Hides the password in a MongoDB URI so it is safe to print. */
export function maskUri(uri: string): string {
  return uri.replace(/(\/\/[^:/@]+):[^@]*@/, "$1:****@")
}
