import {
  getConfig,
  getHistory,
  requireConfig,
  type Setting,
  setDatabase,
  setUri,
} from "../infra/config.js"
import { maskUri } from "../utils/maskUri.js"
import { dim, header, success, warn } from "./output.js"
import { askDatabase, askUri, BACK, pick } from "./prompts.js"

type Method = "type" | "history"

const LABEL: Record<Setting, string> = { uri: "URI", database: "database" }
const TYPE_LABEL: Record<Setting, string> = {
  uri: "Type a URI…",
  database: "Type a database name…",
}

export async function runSettings(): Promise<void> {
  while (true) {
    const setting = await pick<Setting>(
      "Which setting?",
      [
        { name: "URI", value: "uri" },
        { name: "Database", value: "database" },
      ],
      { canGoBack: true },
    )
    if (setting === BACK) return

    await changeSetting(setting)
  }
}

/** Asks how to set the value. ← goes up a level; picking nothing in History stays here. */
async function changeSetting(setting: Setting): Promise<void> {
  while (true) {
    const method = await pick<Method>(
      "How to set it?",
      [
        { name: TYPE_LABEL[setting], value: "type" },
        { name: "History", value: "history" },
      ],
      { canGoBack: true },
    )
    if (method === BACK) return

    const value = method === "type" ? await typeValue(setting) : await valueFromHistory(setting)
    if (value === undefined) continue

    apply(setting, value)
    return
  }
}

function typeValue(setting: Setting): Promise<string> {
  const current = getConfig()[setting]
  return setting === "uri" ? askUri(current) : askDatabase(current)
}

async function valueFromHistory(setting: Setting): Promise<string | undefined> {
  const history = getHistory(setting)
  if (history.length === 0) {
    warn("No history yet")
    return undefined
  }

  const current = getConfig()[setting]
  const value = await pick(
    `Use which ${LABEL[setting]}?`,
    history.map((item) => ({
      name: (setting === "uri" ? maskUri(item) : item) + (item === current ? " (current)" : ""),
      value: item,
    })),
    { canGoBack: true },
  )
  return value === BACK ? undefined : value
}

function apply(setting: Setting, value: string): void {
  if (value === getConfig()[setting]) {
    dim("No change")
    return
  }
  if (setting === "uri") setUri(value)
  else setDatabase(value)
  success(`${setting === "uri" ? "URI" : "Database"} updated.`)

  // Show the new target right away: every action from now on uses it.
  const { uri, database } = requireConfig()
  header(uri, database)
}
