import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { run } from "../infra/runner.js"
import {
  backup,
  backupExists,
  backupPath,
  backupsRoot,
  buildBackupArgs,
  defaultBackupName,
} from "./backup.js"

vi.mock("../infra/runner.js", () => ({ run: vi.fn() }))

describe("pure helpers", () => {
  it("builds the mongodump arguments", () => {
    expect(buildBackupArgs({ uri: "mongodb://h", database: "shop", outDir: "out" })).toEqual([
      "--uri",
      "mongodb://h",
      "--db",
      "shop",
      "--out",
      "out",
    ])
  })

  it("places backups under backups/<database>/<name>", () => {
    expect(backupsRoot("shop")).toBe(join("backups", "shop"))
    expect(backupPath("shop", "x")).toBe(join("backups", "shop", "x"))
  })

  it("names backups after the UTC time", () => {
    expect(defaultBackupName(new Date("2026-10-25T18:30:02.123Z"))).toBe("2026-10-25-18-30-02")
  })
})

describe("on disk", () => {
  const startDir = process.cwd()
  let workDir: string

  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), "mongopuppet-backup-"))
    process.chdir(workDir)
    vi.mocked(run).mockReset()
  })

  afterEach(() => {
    process.chdir(startDir)
    rmSync(workDir, { recursive: true, force: true })
  })

  it("knows whether a backup name is taken", async () => {
    mkdirSync(backupPath("shop", "taken"), { recursive: true })
    expect(await backupExists("shop", "taken")).toBe(true)
    expect(await backupExists("shop", "free")).toBe(false)
  })

  it("leaves the dump files directly in the backup folder and removes the temp folder", async () => {
    // Pretend to be mongodump: it always writes into <out>/<database>/
    vi.mocked(run).mockImplementation(async (_binary, args) => {
      const out = args[args.indexOf("--out") + 1] ?? ""
      mkdirSync(join(out, "shop"), { recursive: true })
      writeFileSync(join(out, "shop", "items.bson"), "")
      return ""
    })
    const outDir = backupPath("shop", "b1")

    await backup({ uri: "mongodb://h", database: "shop", outDir })

    expect(vi.mocked(run)).toHaveBeenCalledWith(
      "mongodump",
      buildBackupArgs({ uri: "mongodb://h", database: "shop", outDir: `${outDir}.tmp` }),
    )
    expect(readdirSync(outDir)).toEqual(["items.bson"])
    expect(existsSync(`${outDir}.tmp`)).toBe(false)
  })

  it("cleans up and rethrows when mongodump fails", async () => {
    vi.mocked(run).mockImplementation(async (_binary, args) => {
      mkdirSync(args[args.indexOf("--out") + 1] ?? "", { recursive: true })
      throw new Error("bad auth")
    })
    const outDir = backupPath("shop", "b2")

    await expect(backup({ uri: "mongodb://h", database: "shop", outDir })).rejects.toThrow(
      "bad auth",
    )
    expect(existsSync(outDir)).toBe(false)
    expect(existsSync(`${outDir}.tmp`)).toBe(false)
  })
})
