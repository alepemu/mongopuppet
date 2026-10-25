import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { backup, backupExists } from "../core/backup.js"
import { runBackup } from "./backup.js"
import { error, success } from "./output.js"
import { askBackupName, BACK, pick } from "./prompts.js"

vi.mock("./prompts.js", () => ({ BACK: Symbol("back"), pick: vi.fn(), askBackupName: vi.fn() }))
vi.mock("./output.js", () => ({ dim: vi.fn(), error: vi.fn(), success: vi.fn() }))
vi.mock("../infra/config.js", () => ({
  requireConfig: () => ({ uri: "mongodb://u:secret@h", database: "shop" }),
}))
vi.mock("../core/backup.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../core/backup.js")>()),
  backup: vi.fn(),
  backupExists: vi.fn(),
}))

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(backupExists).mockResolvedValue(false)
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(new Date("2026-10-25T18:30:02Z"))
})

afterEach(() => {
  vi.useRealTimers()
})

describe("runBackup", () => {
  it("offers the UTC timestamp or typing a name", async () => {
    vi.mocked(pick).mockResolvedValueOnce(BACK)
    await runBackup()
    expect(vi.mocked(pick)).toHaveBeenCalledWith(
      "Backup name?",
      [
        { name: "2026-10-25-18-30-02", value: "default" },
        { name: "Type a name…", value: "custom" },
      ],
      { canGoBack: true },
    )
  })

  it("does nothing on ←", async () => {
    vi.mocked(pick).mockResolvedValueOnce(BACK)
    await runBackup()
    expect(vi.mocked(backup)).not.toHaveBeenCalled()
  })

  it("backs up under the timestamp", async () => {
    vi.mocked(pick).mockResolvedValueOnce("default")
    await runBackup()

    const outDir = join("backups", "shop", "2026-10-25-18-30-02")
    expect(vi.mocked(backup)).toHaveBeenCalledWith({
      uri: "mongodb://u:secret@h",
      database: "shop",
      outDir,
    })
    expect(vi.mocked(success)).toHaveBeenCalledWith(`Backup saved to ${outDir}`)
  })

  it("starts a typed name from today's (UTC) date", async () => {
    vi.mocked(pick).mockResolvedValueOnce("custom")
    vi.mocked(askBackupName).mockResolvedValueOnce("2026-10-25-before-migration")
    await runBackup()

    expect(vi.mocked(askBackupName)).toHaveBeenCalledWith("shop", "2026-10-25")
    expect(vi.mocked(backup)).toHaveBeenCalledWith(
      expect.objectContaining({ outDir: join("backups", "shop", "2026-10-25-before-migration") }),
    )
  })

  it("never overwrites an existing backup", async () => {
    vi.mocked(pick).mockResolvedValueOnce("default")
    vi.mocked(backupExists).mockResolvedValueOnce(true)
    await runBackup()

    expect(vi.mocked(backup)).not.toHaveBeenCalled()
    expect(vi.mocked(error)).toHaveBeenCalledWith(expect.stringContaining("already exists"))
  })

  it("prints failures with the password masked", async () => {
    vi.mocked(pick).mockResolvedValueOnce("default")
    vi.mocked(backup).mockRejectedValueOnce(new Error("failed to connect to mongodb://u:secret@h"))
    await runBackup()

    expect(vi.mocked(error)).toHaveBeenCalledWith("failed to connect to mongodb://u:****@h")
  })
})
