import { readdir, stat } from "node:fs/promises"
import { join } from "node:path"
import { run } from "../infra/runner.js"
import { backupsRoot } from "./backup.js"

export interface RestoreOptions {
  uri: string
  database: string
  /** Folder that holds the .bson files directly (backups/<database>/<name>). */
  dir: string
  drop: boolean
}

export function buildRestoreArgs({ uri, database, dir, drop }: RestoreOptions): string[] {
  const args = ["--uri", uri, "--db", database]
  if (drop) args.push("--drop")
  args.push(dir)
  return args
}

/** Most recently modified first: custom names can't be sorted alphabetically. */
export async function listBackups(database: string): Promise<string[]> {
  const root = backupsRoot(database)
  try {
    const entries = await readdir(root, { withFileTypes: true })
    const folders = entries.filter((entry) => entry.isDirectory() && !entry.name.endsWith(".tmp"))
    const withTime = await Promise.all(
      folders.map(async ({ name }) => ({ name, time: (await stat(join(root, name))).mtimeMs })),
    )
    return withTime
      .sort((a, b) => b.time - a.time || b.name.localeCompare(a.name))
      .map((f) => f.name)
  } catch {
    return []
  }
}

export interface RestoreSummary {
  restored: number
  failed: number
}

/** Reads mongorestore's final "N document(s) restored successfully. M document(s) failed…" line. */
export function parseRestoreSummary(log: string): RestoreSummary | undefined {
  const match =
    /(\d+) document\(s\) restored successfully\. (\d+) document\(s\) failed to restore/.exec(log)
  return match ? { restored: Number(match[1]), failed: Number(match[2]) } : undefined
}

export async function restore(options: RestoreOptions): Promise<RestoreSummary | undefined> {
  return parseRestoreSummary(await run("mongorestore", buildRestoreArgs(options)))
}
