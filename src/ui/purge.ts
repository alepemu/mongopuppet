import pc from "picocolors"
import { purge } from "../core/purge.js"
import { requireConfig } from "../infra/config.js"
import { maskUri } from "../utils/maskUri.js"
import { dim, error, success, warn } from "./output.js"
import { askTyped, BACK, pick } from "./prompts.js"

export async function runPurge(): Promise<void> {
  const { uri, database } = requireConfig()

  const choice = await pick(
    `${pc.yellow("!!")} Delete ALL collections in ${database}?`,
    [{ name: "Yes, delete everything", value: "delete" }],
    { canGoBack: true },
  )
  if (choice === BACK) return

  await askTyped(`Type "delete" to confirm`, "delete")

  dim(`Purging ${database}...`)
  try {
    const count = await purge({ uri, database })
    if (count === 0) warn(`${database} has no collections to drop.`)
    else success(`Dropped ${count} ${count === 1 ? "collection" : "collections"} from ${database}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    error(maskUri(message))
  }
}
