/** Characters MongoDB does not allow in a database name (plus the null character). */
const FORBIDDEN = /[/\\. "$*<>:|?\0]/

export function databaseNameError(name: string): string | undefined {
  if (name.length === 0) return "Database name is required"
  if (name.length > 63) return "Database name must be 63 characters or fewer"
  if (name.startsWith("-")) return "Database name cannot start with -"
  if (FORBIDDEN.test(name)) return 'Database name cannot contain / \\ . " $ * < > : | ? or spaces'
  return undefined
}
