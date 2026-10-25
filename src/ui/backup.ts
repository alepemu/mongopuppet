import { backup, backupExists, backupPath, defaultBackupName } from "../core/backup.js"
import { requireConfig } from "../infra/config.js"
import { maskUri } from "../utils/maskUri.js"
import { dim, error, success } from "./output.js"
import { askBackupName, BACK, pick } from "./prompts.js"

export async function runBackup(): Promise<void> {
  const { uri, database } = requireConfig()

  const defaultName = defaultBackupName()
  const choice = await pick(
    "Backup name?",
    [
      { name: defaultName, value: "default" },
      { name: "Type a name…", value: "custom" },
    ],
    { canGoBack: true },
  )
  if (choice === BACK) return

  // When typing, start from today's date (YYYY-MM-DD) so the user only adds a label.
  const name =
    choice === "default" ? defaultName : await askBackupName(database, defaultName.slice(0, 10))
  if (await backupExists(database, name)) {
    error(`A backup named ${name} already exists.`)
    return
  }
  const outDir = backupPath(database, name)

  dim(`Backing up ${database}...`)
  try {
    await backup({ uri, database, outDir })
    success(`Backup saved to ${outDir}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    error(maskUri(message))
  }
}
