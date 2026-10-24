import { runBackup } from "./backup.js"
import { pick } from "./prompts.js"
import { runPurge } from "./purge.js"
import { runRestore } from "./restore.js"
import { runSettings } from "./settings.js"

type Action = "backup" | "purge" | "restore" | "settings" | "exit"

const handlers: Record<Exclude<Action, "exit">, () => Promise<void>> = {
  backup: runBackup,
  purge: runPurge,
  restore: runRestore,
  settings: runSettings,
}

export async function runMenu(): Promise<void> {
  while (true) {
    const action = await pick<Action>("What do you want to do?", [
      { name: "Backup", value: "backup" },
      { name: "Purge", value: "purge" },
      { name: "Restore", value: "restore" },
      { name: "Settings", value: "settings" },
      { name: "Exit", value: "exit" },
    ])

    if (action === "exit") return
    await handlers[action]()
  }
}
