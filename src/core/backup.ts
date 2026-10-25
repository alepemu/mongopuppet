import { access, rename, rm } from "node:fs/promises"
import { join } from "node:path"
import { run } from "../infra/runner.js"

export interface BackupOptions {
  uri: string
  database: string
  outDir: string
}

export function buildBackupArgs({ uri, database, outDir }: BackupOptions): string[] {
  return ["--uri", uri, "--db", database, "--out", outDir]
}

export function backupsRoot(database: string): string {
  return join("backups", database)
}

export function backupPath(database: string, name: string): string {
  return join(backupsRoot(database), name)
}

/** UTC on purpose, so names sort the same wherever they were made. */
export function defaultBackupName(now = new Date()): string {
  return now.toISOString().slice(0, 19).replace(/[T:]/g, "-")
}

export async function backupExists(database: string, name: string): Promise<boolean> {
  try {
    await access(backupPath(database, name))
    return true
  } catch {
    return false
  }
}

/**
 * mongodump always writes to <out>/<database>/, so we dump to a temporary folder
 * and move that <database> folder to outDir, leaving the files directly inside it.
 */
export async function backup(options: BackupOptions): Promise<void> {
  const tmpDir = `${options.outDir}.tmp`
  try {
    await run("mongodump", buildBackupArgs({ ...options, outDir: tmpDir }))
    await rename(join(tmpDir, options.database), options.outDir)
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
}
