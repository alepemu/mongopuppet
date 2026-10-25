import { beforeEach, describe, expect, it, vi } from "vitest"
import { getHistory, setDatabase, setUri } from "../infra/config.js"
import { dim, header, success, warn } from "./output.js"
import { askDatabase, BACK, pick } from "./prompts.js"
import { runSettings } from "./settings.js"

vi.mock("./prompts.js", () => ({
  BACK: Symbol("back"),
  pick: vi.fn(),
  askUri: vi.fn(),
  askDatabase: vi.fn(),
}))
vi.mock("./output.js", () => ({ dim: vi.fn(), header: vi.fn(), success: vi.fn(), warn: vi.fn() }))
vi.mock("../infra/config.js", () => ({
  getConfig: vi.fn(),
  getHistory: vi.fn(),
  requireConfig: vi.fn(),
  setUri: vi.fn(),
  setDatabase: vi.fn(),
}))

let current: { uri: string; database: string }

beforeEach(async () => {
  vi.resetAllMocks()
  current = { uri: "mongodb://u:pw@a", database: "shop" }
  const config = await import("../infra/config.js")
  vi.mocked(config.getConfig).mockImplementation(() => ({ ...current }))
  vi.mocked(config.requireConfig).mockImplementation(() => ({ ...current }))
  vi.mocked(setUri).mockImplementation((uri) => {
    current.uri = uri
  })
  vi.mocked(setDatabase).mockImplementation((database) => {
    current.database = database
  })
  vi.mocked(getHistory).mockImplementation((setting) =>
    setting === "uri" ? [current.uri, "mongodb://b"] : [current.database, "blog"],
  )
})

describe("runSettings", () => {
  it("leaves on ← at the first question", async () => {
    vi.mocked(pick).mockResolvedValueOnce(BACK)
    await runSettings()
    expect(vi.mocked(pick)).toHaveBeenCalledWith("Which setting?", expect.any(Array), {
      canGoBack: true,
    })
  })

  it("switches to a URI from the history and shows the new target", async () => {
    vi.mocked(pick)
      .mockResolvedValueOnce("uri")
      .mockResolvedValueOnce("history")
      .mockResolvedValueOnce("mongodb://b")
      .mockResolvedValueOnce(BACK)
    await runSettings()

    const historyChoices = vi.mocked(pick).mock.calls[2]?.[1]
    expect(historyChoices).toEqual([
      { name: "mongodb://u:****@a (current)", value: "mongodb://u:pw@a" },
      { name: "mongodb://b", value: "mongodb://b" },
    ])
    expect(vi.mocked(setUri)).toHaveBeenCalledWith("mongodb://b")
    expect(vi.mocked(success)).toHaveBeenCalledWith("URI updated.")
    expect(vi.mocked(header)).toHaveBeenCalledWith("mongodb://b", "shop")
  })

  it("says No change when the current value is picked", async () => {
    vi.mocked(pick)
      .mockResolvedValueOnce("database")
      .mockResolvedValueOnce("history")
      .mockResolvedValueOnce("shop")
      .mockResolvedValueOnce(BACK)
    await runSettings()

    expect(vi.mocked(dim)).toHaveBeenCalledWith("No change")
    expect(vi.mocked(setDatabase)).not.toHaveBeenCalled()
    expect(vi.mocked(header)).not.toHaveBeenCalled()
  })

  it("types a new database, starting from the current one", async () => {
    vi.mocked(pick)
      .mockResolvedValueOnce("database")
      .mockResolvedValueOnce("type")
      .mockResolvedValueOnce(BACK)
    vi.mocked(askDatabase).mockResolvedValueOnce("blog")
    await runSettings()

    expect(vi.mocked(askDatabase)).toHaveBeenCalledWith("shop")
    expect(vi.mocked(setDatabase)).toHaveBeenCalledWith("blog")
    expect(vi.mocked(header)).toHaveBeenCalledWith("mongodb://u:pw@a", "blog")
  })

  it("goes back one level at a time with ←", async () => {
    vi.mocked(pick)
      .mockResolvedValueOnce("uri") // Which setting?
      .mockResolvedValueOnce("history") // How to set it?
      .mockResolvedValueOnce(BACK) // Use which URI? ← -> How to set it?
      .mockResolvedValueOnce(BACK) // How to set it? ← -> Which setting?
      .mockResolvedValueOnce(BACK) // Which setting? ← -> leave
    await runSettings()

    expect(vi.mocked(pick).mock.calls.map((call) => call[0])).toEqual([
      "Which setting?",
      "How to set it?",
      "Use which URI?",
      "How to set it?",
      "Which setting?",
    ])
    expect(vi.mocked(setUri)).not.toHaveBeenCalled()
  })

  it("warns when there is no history yet", async () => {
    vi.mocked(getHistory).mockReturnValue([])
    vi.mocked(pick)
      .mockResolvedValueOnce("uri")
      .mockResolvedValueOnce("history")
      .mockResolvedValueOnce(BACK)
      .mockResolvedValueOnce(BACK)
    await runSettings()

    expect(vi.mocked(warn)).toHaveBeenCalledWith("No history yet")
    // ...and stays on "How to set it?" instead of leaving Settings
    expect(vi.mocked(pick).mock.calls.map((call) => call[0])).toEqual([
      "Which setting?",
      "How to set it?",
      "How to set it?",
      "Which setting?",
    ])
  })
})
