import { isInstalled } from "../infra/runner.js"

export const REQUIRED_TOOLS = ["mongodump", "mongorestore"] as const

export async function findMissingTools(): Promise<string[]> {
  const results = await Promise.all(
    REQUIRED_TOOLS.map(async (tool) => ((await isInstalled(tool)) ? null : tool)),
  )
  return results.filter((tool) => tool !== null)
}
