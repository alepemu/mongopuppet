import { backupsRoot } from "../core/backup.js"
import { backupPath, listBackups, restore } from "../core/restore.js"
import { requireConfig } from "../infra/config.js"
import { maskUri } from "../utils/maskUri.js"
import { dim, error, success, warn } from "./output.js"
import { pick } from "./prompts.js"

type Mode = "add" | "replace"

export async function runRestore(): Promise<void> {
  const { uri, database } = requireConfig()

  const backups = await listBackups(database)
  if (backups.length === 0) {
    warn(`No backups found in ${backupsRoot(database)}`)
    return
  }

  const name = await pick("Restore which backup?", [
    ...backups.map((backup) => ({ name: backup, value: backup })),
    { name: "Back", value: "back" },
  ])
  if (name === "back") return

  const mode = await pick<Mode | "back">("If the database already has data:", [
    { name: "Merge (keep existing documents)", value: "add" },
    { name: "Replace (drop collections first)", value: "replace" },
    { name: "Back", value: "back" },
  ])
  if (mode === "back") return

  const drop = mode === "replace"

  dim(`Restoring ${name} into ${database}...`)
  try {
    await restore({ uri, database, dir: backupPath(database, name), drop })
    success(`Restored ${name} into ${database}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    error(maskUri(message))
  }
}
