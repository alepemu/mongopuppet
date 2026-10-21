import { backup, defaultBackupDir } from "../core/backup.js"
import { requireConfig } from "../infra/config.js"
import { maskUri } from "../utils/maskUri.js"
import { dim, error, success } from "./output.js"

export async function runBackup(): Promise<void> {
  const { uri, database } = requireConfig()
  const outDir = defaultBackupDir(database)

  dim(`Backing up ${database}...`)
  try {
    await backup({ uri, database, outDir })
    success(`Backup saved to ${outDir}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    error(maskUri(message))
  }
}
