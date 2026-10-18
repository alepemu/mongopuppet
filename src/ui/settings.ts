import { isCancel, log, select } from "@clack/prompts"
import { configPath, getConfig, requireConfig, saveConfig } from "../infra/config.js"
import { maskUri } from "../utils/maskUri.js"
import { askDatabase, askUri } from "./prompts.js"

type Choice = "view" | "uri" | "database" | "back"

export async function runSettings(): Promise<void> {
  while (true) {
    const choice = await select<Choice>({
      message: "Settings",
      options: [
        { value: "view", label: "View current settings" },
        { value: "uri", label: "Change URI" },
        { value: "database", label: "Change database" },
        { value: "back", label: "Back" },
      ],
    })

    if (isCancel(choice) || choice === "back") return

    if (choice === "view") showSettings()
    if (choice === "uri") await changeUri()
    if (choice === "database") await changeDatabase()
  }
}

function showSettings(): void {
  const { uri, database } = requireConfig()
  log.info(
    [`URI:      ${maskUri(uri)}`, `Database: ${database}`, `File:     ${configPath()}`].join("\n"),
  )
}

async function changeUri(): Promise<void> {
  const uri = await askUri(getConfig().uri)
  if (!uri) return
  saveConfig({ uri })
  log.success("URI updated.")
}

async function changeDatabase(): Promise<void> {
  const database = await askDatabase(getConfig().database)
  if (!database) return
  saveConfig({ database })
  log.success("Database updated.")
}
