import { readdir } from "node:fs/promises"
import { join } from "node:path"
import { run } from "../infra/runner.js"
import { backupsRoot } from "./backup.js"

export interface RestoreOptions {
  uri: string
  database: string
  /** Folder that holds the .bson files directly (backups/<database>/<timestamp>). */
  dir: string
  /** Drop each collection in the backup before restoring it. */
  drop: boolean
}

export function buildRestoreArgs({ uri, database, dir, drop }: RestoreOptions): string[] {
  const args = ["--uri", uri, "--db", database]
  if (drop) args.push("--drop")
  args.push(dir)
  return args
}

/** Backup folder names for a database, newest first. Empty if there are none. */
export async function listBackups(database: string): Promise<string[]> {
  try {
    const entries = await readdir(backupsRoot(database), { withFileTypes: true })
    return entries
      .filter((entry) => entry.isDirectory() && !entry.name.endsWith(".tmp"))
      .map((entry) => entry.name)
      .sort()
      .reverse()
  } catch {
    return []
  }
}

export function backupPath(database: string, name: string): string {
  return join(backupsRoot(database), name)
}

export function restore(options: RestoreOptions): Promise<void> {
  return run("mongorestore", buildRestoreArgs(options))
}
