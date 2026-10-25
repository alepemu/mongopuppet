import { runBackup } from "./backup.js"
import { pick } from "./prompts.js"
import { runPurge } from "./purge.js"
import { runRestore } from "./restore.js"
import { runSettings } from "./settings.js"

type Action = "backup" | "restore" | "purge" | "settings"

const handlers: Record<Action, () => Promise<void>> = {
  backup: runBackup,
  restore: runRestore,
  purge: runPurge,
  settings: runSettings,
}

/** Shows the main menu forever. The only way out is Ctrl+C (handled in ui/prompts.ts). */
export async function runMenu(): Promise<never> {
  while (true) {
    const action = await pick<Action>("What do you want to do?", [
      { name: "Backup", value: "backup" },
      { name: "Restore", value: "restore" },
      { name: "Purge", value: "purge" },
      { name: "Settings", value: "settings" },
    ])

    await handlers[action]()
  }
}
