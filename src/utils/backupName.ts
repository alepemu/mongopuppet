export function backupNameError(name: string): string | undefined {
  if (name.length === 0) return "Backup name is required"
  if (name.length > 64) return "Backup name must be 64 characters or fewer"
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name)) {
    return "Use only letters, numbers, . _ - and start with a letter or number"
  }
  // ".tmp" is the temporary dump folder and is hidden from the restore list
  if (name.endsWith(".") || name.toLowerCase().endsWith(".tmp")) {
    return 'Backup name cannot end with "." or ".tmp"'
  }
  return undefined
}
