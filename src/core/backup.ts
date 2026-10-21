import { rename, rm } from "node:fs/promises"
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

/** backups/<database> */
export function backupsRoot(database: string): string {
  return join("backups", database)
}

/** backups/<database>/<YYYY-MM-DD-HH-mm-ss> */
export function defaultBackupDir(database: string, now = new Date()): string {
  const stamp = now.toISOString().slice(0, 19).replace(/[T:]/g, "-")
  return join(backupsRoot(database), stamp)
}

/**
 * Dumps the database into options.outDir.
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
