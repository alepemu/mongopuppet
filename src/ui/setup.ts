import { saveConfig } from "../infra/config.js"
import { askDatabase, askUri } from "./prompts.js"

export async function runSetup(): Promise<void> {
  const uri = await askUri()
  const database = await askDatabase()
  saveConfig({ uri, database })
}
