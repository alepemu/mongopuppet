import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { run } from "../infra/runner.js"
import { backupPath } from "./backup.js"
import { buildRestoreArgs, listBackups, parseRestoreSummary, restore } from "./restore.js"

vi.mock("../infra/runner.js", () => ({ run: vi.fn() }))

const SUMMARY_LINE =
  "2026-10-25T20:00:00.000+0200\t5 document(s) restored successfully. 2 document(s) failed to restore."

describe("buildRestoreArgs", () => {
  it("restores one folder into the database, with the folder last", () => {
    expect(
      buildRestoreArgs({ uri: "mongodb://h", database: "shop", dir: "d", drop: false }),
    ).toEqual(["--uri", "mongodb://h", "--db", "shop", "d"])
  })

  it("adds --drop for Replace", () => {
    expect(
      buildRestoreArgs({ uri: "mongodb://h", database: "shop", dir: "d", drop: true }),
    ).toEqual(["--uri", "mongodb://h", "--db", "shop", "--drop", "d"])
  })
})

describe("parseRestoreSummary", () => {
  it("reads mongorestore's final line", () => {
    expect(parseRestoreSummary(`some progress\n${SUMMARY_LINE}\n`)).toEqual({
      restored: 5,
      failed: 2,
    })
  })

  it("returns undefined when there is no summary", () => {
    expect(parseRestoreSummary("nothing to see here")).toBeUndefined()
  })
})

describe("restore", () => {
  it("runs mongorestore and returns the summary", async () => {
    vi.mocked(run).mockResolvedValueOnce(SUMMARY_LINE)
    const options = { uri: "mongodb://h", database: "shop", dir: "d", drop: true }

    expect(await restore(options)).toEqual({ restored: 5, failed: 2 })
    expect(vi.mocked(run)).toHaveBeenCalledWith("mongorestore", buildRestoreArgs(options))
  })
})

describe("listBackups", () => {
  const startDir = process.cwd()
  let workDir: string

  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), "mongopuppet-restore-"))
    process.chdir(workDir)
  })

  afterEach(() => {
    process.chdir(startDir)
    rmSync(workDir, { recursive: true, force: true })
  })

  const makeBackup = (name: string, daysAgo: number) => {
    const path = backupPath("shop", name)
    mkdirSync(path, { recursive: true })
    const time = new Date(Date.now() - daysAgo * 86_400_000)
    utimesSync(path, time, time)
  }

  it("lists the most recently modified first, whatever the names", async () => {
    makeBackup("oldest", 30)
    makeBackup("zzz-custom", 10)
    makeBackup("2026-01-01-00-00-00", 1)

    expect(await listBackups("shop")).toEqual(["2026-01-01-00-00-00", "zzz-custom", "oldest"])
  })

  it("skips unfinished .tmp folders and plain files", async () => {
    makeBackup("good", 1)
    makeBackup("half.tmp", 0)
    writeFileSync(join(backupPath("shop", "good"), "..", "notes.txt"), "")

    expect(await listBackups("shop")).toEqual(["good"])
  })

  it("returns [] when the database has no backups folder", async () => {
    expect(await listBackups("other")).toEqual([])
  })
})
