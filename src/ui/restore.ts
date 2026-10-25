import { backupPath, backupsRoot } from "../core/backup.js"
import { listBackups, restore } from "../core/restore.js"
import { requireConfig } from "../infra/config.js"
import { maskUri } from "../utils/maskUri.js"
import { dim, error, success, warn } from "./output.js"
import { BACK, pick } from "./prompts.js"

type Mode = "add" | "replace"

export async function runRestore(): Promise<void> {
  const { uri, database } = requireConfig()

  const backups = await listBackups(database)
  if (backups.length === 0) {
    warn(`No backups found in ${backupsRoot(database)}`)
    return
  }

  // ← on the second question returns to the first; ← on the first leaves Restore.
  while (true) {
    const name = await pick(
      "Restore which backup?",
      backups.map((backup) => ({ name: backup, value: backup })),
      { canGoBack: true },
    )
    if (name === BACK) return

    const mode = await pick<Mode>(
      "Merge or replace?",
      [
        { name: "Merge (keep existing documents)", value: "add" },
        { name: "Replace (drop collections first)", value: "replace" },
      ],
      { canGoBack: true },
    )
    if (mode === BACK) continue

    dim(`Restoring ${name} into ${database}...`)
    try {
      const summary = await restore({
        uri,
        database,
        dir: backupPath(database, name),
        drop: mode === "replace",
      })
      success(
        summary
          ? `Restored ${name} into ${database} (${summary.restored} ${plural(summary.restored, "document")})`
          : `Restored ${name} into ${database}`,
      )
      if (summary && summary.failed > 0) {
        const hint = mode === "add" ? " (Merge keeps documents that already exist)" : ""
        warn(`${summary.failed} ${plural(summary.failed, "document")} not restored${hint}.`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      error(maskUri(message))
    }
    return
  }
}

function plural(count: number, word: string): string {
  return count === 1 ? word : `${word}s`
}
