import pc from "picocolors"
import { checkConnection, findDatabases } from "../core/connection.js"
import { configPath, setDatabase, setUri } from "../infra/config.js"
import { maskUri } from "../utils/maskUri.js"
import { dim, error, info, success } from "./output.js"
import { askDatabase, askUri, pick } from "./prompts.js"

const DEFAULT_URI = "mongodb://localhost:27017"
// Not a valid database name (names can't contain spaces), so it can't clash with a real one.
const TYPE_A_NAME = "Type a name…"

export async function runSetup(): Promise<void> {
  info(
    `${pc.bold(pc.green("mongopuppet"))}  ${pc.dim("Back up, restore and purge a MongoDB database.")}`,
  )
  dim("No settings found. Let's set up a connection (you can change it later in Settings).")

  const { uri, connected } = await chooseUri()
  const database = await chooseDatabase(uri, connected)

  setUri(uri)
  setDatabase(database)
  success(`Saved to ${configPath()}`)
  dim("The URI is stored in plain text there.")
}

async function chooseUri(): Promise<{ uri: string; connected: boolean }> {
  let uri = DEFAULT_URI
  while (true) {
    uri = await askUri(uri)

    dim("Checking connection...")
    try {
      await checkConnection(uri)
      success("Connected")
      return { uri, connected: true }
    } catch (err) {
      error(maskUri(err instanceof Error ? err.message : String(err)))
      const next = await pick("Connection failed. Use it anyway?", [
        { name: "Retype the URI", value: "retype" },
        { name: "Use it anyway", value: "use" },
      ])
      if (next === "use") return { uri, connected: false }
    }
  }
}

async function chooseDatabase(uri: string, connected: boolean): Promise<string> {
  const names = connected ? await findDatabases(uri) : []
  if (names.length === 0) return askDatabase()

  const choice = await pick("Which database?", [
    ...names.map((name) => ({ name, value: name })),
    { name: TYPE_A_NAME, value: TYPE_A_NAME },
  ])
  return choice === TYPE_A_NAME ? askDatabase() : choice
}
