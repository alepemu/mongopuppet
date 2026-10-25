import { join } from "node:path"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { listBackups, restore } from "../core/restore.js"
import { error, success, warn } from "./output.js"
import { BACK, pick } from "./prompts.js"
import { runRestore } from "./restore.js"

vi.mock("./prompts.js", () => ({ BACK: Symbol("back"), pick: vi.fn() }))
vi.mock("./output.js", () => ({ dim: vi.fn(), error: vi.fn(), success: vi.fn(), warn: vi.fn() }))
vi.mock("../infra/config.js", () => ({
  requireConfig: () => ({ uri: "mongodb://u:secret@h", database: "shop" }),
}))
vi.mock("../core/restore.js", () => ({ listBackups: vi.fn(), restore: vi.fn() }))

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(listBackups).mockResolvedValue(["b2", "b1"])
})

describe("runRestore", () => {
  it("says so when there is nothing to restore", async () => {
    vi.mocked(listBackups).mockResolvedValueOnce([])
    await runRestore()

    expect(vi.mocked(warn)).toHaveBeenCalledWith(expect.stringContaining("No backups found"))
    expect(vi.mocked(pick)).not.toHaveBeenCalled()
  })

  it("leaves on ← in the backup list", async () => {
    vi.mocked(pick).mockResolvedValueOnce(BACK)
    await runRestore()
    expect(vi.mocked(restore)).not.toHaveBeenCalled()
  })

  it("returns to the backup list on ← in the second question", async () => {
    vi.mocked(pick)
      .mockResolvedValueOnce("b1")
      .mockResolvedValueOnce(BACK) // Merge or replace? ←
      .mockResolvedValueOnce("b2")
      .mockResolvedValueOnce("replace")
    await runRestore()

    expect(vi.mocked(pick)).toHaveBeenCalledTimes(4)
    expect(vi.mocked(restore)).toHaveBeenCalledWith({
      uri: "mongodb://u:secret@h",
      database: "shop",
      dir: join("backups", "shop", "b2"),
      drop: true,
    })
  })

  it("reports the summary and explains skipped documents in Merge", async () => {
    vi.mocked(pick).mockResolvedValueOnce("b1").mockResolvedValueOnce("add")
    vi.mocked(restore).mockResolvedValueOnce({ restored: 5, failed: 2 })
    await runRestore()

    expect(vi.mocked(restore)).toHaveBeenCalledWith(expect.objectContaining({ drop: false }))
    expect(vi.mocked(success)).toHaveBeenCalledWith("Restored b1 into shop (5 documents)")
    expect(vi.mocked(warn)).toHaveBeenCalledWith(
      "2 documents not restored (Merge keeps documents that already exist).",
    )
  })

  it("still reports success when mongorestore printed no summary", async () => {
    vi.mocked(pick).mockResolvedValueOnce("b1").mockResolvedValueOnce("replace")
    vi.mocked(restore).mockResolvedValueOnce(undefined)
    await runRestore()

    expect(vi.mocked(success)).toHaveBeenCalledWith("Restored b1 into shop")
    expect(vi.mocked(warn)).not.toHaveBeenCalled()
  })

  it("prints failures with the password masked", async () => {
    vi.mocked(pick).mockResolvedValueOnce("b1").mockResolvedValueOnce("add")
    vi.mocked(restore).mockRejectedValueOnce(new Error("error connecting to mongodb://u:secret@h"))
    await runRestore()

    expect(vi.mocked(error)).toHaveBeenCalledWith("error connecting to mongodb://u:****@h")
  })
})
