import { beforeEach, describe, expect, it, vi } from "vitest"
import { purge } from "../core/purge.js"
import { error, success, warn } from "./output.js"
import { askTyped, BACK, pick } from "./prompts.js"
import { runPurge } from "./purge.js"

vi.mock("./prompts.js", () => ({ BACK: Symbol("back"), pick: vi.fn(), askTyped: vi.fn() }))
vi.mock("./output.js", () => ({ dim: vi.fn(), error: vi.fn(), success: vi.fn(), warn: vi.fn() }))
vi.mock("../infra/config.js", () => ({
  requireConfig: () => ({ uri: "mongodb://u:secret@h", database: "shop" }),
}))
vi.mock("../core/purge.js", () => ({ purge: vi.fn() }))

beforeEach(() => {
  vi.resetAllMocks()
})

describe("runPurge", () => {
  it("names the database in the question", async () => {
    vi.mocked(pick).mockResolvedValueOnce(BACK)
    await runPurge()
    expect(vi.mocked(pick).mock.calls[0]?.[0]).toContain("Delete ALL collections in shop?")
  })

  it("cancels on ← without asking for confirmation", async () => {
    vi.mocked(pick).mockResolvedValueOnce(BACK)
    await runPurge()

    expect(vi.mocked(askTyped)).not.toHaveBeenCalled()
    expect(vi.mocked(purge)).not.toHaveBeenCalled()
  })

  it("asks to type delete, then purges", async () => {
    vi.mocked(pick).mockResolvedValueOnce("delete")
    vi.mocked(purge).mockResolvedValueOnce(3)
    await runPurge()

    expect(vi.mocked(askTyped)).toHaveBeenCalledWith('Type "delete" to confirm', "delete")
    expect(vi.mocked(purge)).toHaveBeenCalledWith({ uri: "mongodb://u:secret@h", database: "shop" })
    expect(vi.mocked(success)).toHaveBeenCalledWith("Dropped 3 collections from shop")
  })

  it("uses the singular for one collection", async () => {
    vi.mocked(pick).mockResolvedValueOnce("delete")
    vi.mocked(purge).mockResolvedValueOnce(1)
    await runPurge()
    expect(vi.mocked(success)).toHaveBeenCalledWith("Dropped 1 collection from shop")
  })

  it("warns when there was nothing to drop", async () => {
    vi.mocked(pick).mockResolvedValueOnce("delete")
    vi.mocked(purge).mockResolvedValueOnce(0)
    await runPurge()
    expect(vi.mocked(warn)).toHaveBeenCalledWith("shop has no collections to drop.")
  })

  it("prints failures with the password masked", async () => {
    vi.mocked(pick).mockResolvedValueOnce("delete")
    vi.mocked(purge).mockRejectedValueOnce(new Error("auth failed for mongodb://u:secret@h"))
    await runPurge()
    expect(vi.mocked(error)).toHaveBeenCalledWith("auth failed for mongodb://u:****@h")
  })
})
