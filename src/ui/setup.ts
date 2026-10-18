import { cancel } from "@clack/prompts"
import { saveConfig } from "../infra/config.js"
import { askDatabase, askUri } from "./prompts.js"

export async function runSetup(): Promise<void> {
  const uri = await askUri()
  if (!uri) return exitCancelled()

  const database = await askDatabase()
  if (!database) return exitCancelled()

  saveConfig({ uri, database })
}

function exitCancelled(): never {
  cancel("Setup cancelled.")
  process.exit(0)
}
