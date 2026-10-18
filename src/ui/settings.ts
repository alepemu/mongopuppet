import { getConfig, saveConfig } from "../infra/config.js"
import { success } from "./output.js"
import { askDatabase, askUri, pick } from "./prompts.js"

type Choice = "uri" | "database" | "back"

export async function runSettings(): Promise<void> {
  while (true) {
    const choice = await pick<Choice>("Settings", [
      { name: "Change URI", value: "uri" },
      { name: "Change database", value: "database" },
      { name: "Back", value: "back" },
    ])

    if (choice === "back") return

    if (choice === "uri") await changeUri()
    if (choice === "database") await changeDatabase()
  }
}

async function changeUri(): Promise<void> {
  saveConfig({ uri: await askUri(getConfig().uri) })
  success("URI updated.")
}

async function changeDatabase(): Promise<void> {
  saveConfig({ database: await askDatabase(getConfig().database) })
  success("Database updated.")
}
