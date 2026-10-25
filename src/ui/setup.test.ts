import { beforeEach, describe, expect, it, vi } from "vitest"
import { checkConnection, findDatabases } from "../core/connection.js"
import { setDatabase, setUri } from "../infra/config.js"
import { error, success } from "./output.js"
import { askDatabase, askUri, pick } from "./prompts.js"
import { runSetup } from "./setup.js"

vi.mock("./prompts.js", () => ({ pick: vi.fn(), askUri: vi.fn(), askDatabase: vi.fn() }))
vi.mock("./output.js", () => ({ dim: vi.fn(), error: vi.fn(), info: vi.fn(), success: vi.fn() }))
vi.mock("../core/connection.js", () => ({ checkConnection: vi.fn(), findDatabases: vi.fn() }))
vi.mock("../infra/config.js", () => ({
  configPath: () => "/fake/config.json",
  setUri: vi.fn(),
  setDatabase: vi.fn(),
}))

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(checkConnection).mockResolvedValue()
  vi.mocked(findDatabases).mockResolvedValue(["blog", "shop"])
})

describe("runSetup", () => {
  it("suggests a local server, connects, lets you pick a database and saves", async () => {
    vi.mocked(askUri).mockResolvedValueOnce("mongodb://good")
    vi.mocked(pick).mockResolvedValueOnce("shop")
    await runSetup()

    expect(vi.mocked(askUri)).toHaveBeenCalledWith("mongodb://localhost:27017")
    expect(vi.mocked(success)).toHaveBeenCalledWith("Connected")
    expect(vi.mocked(pick)).toHaveBeenCalledWith("Which database?", [
      { name: "blog", value: "blog" },
      { name: "shop", value: "shop" },
      { name: "Type a name…", value: "Type a name…" },
    ])
    expect(vi.mocked(setUri)).toHaveBeenCalledWith("mongodb://good")
    expect(vi.mocked(setDatabase)).toHaveBeenCalledWith("shop")
    expect(vi.mocked(success)).toHaveBeenCalledWith("Saved to /fake/config.json")
  })

  it("retypes after a failed connection, keeping what was typed", async () => {
    vi.mocked(askUri)
      .mockResolvedValueOnce("mongodb://u:secret@bad")
      .mockResolvedValueOnce("mongodb://good")
    vi.mocked(checkConnection).mockRejectedValueOnce(
      new Error("bad auth for mongodb://u:secret@bad"),
    )
    vi.mocked(pick).mockResolvedValueOnce("retype").mockResolvedValueOnce("shop")
    await runSetup()

    expect(vi.mocked(error)).toHaveBeenCalledWith("bad auth for mongodb://u:****@bad")
    expect(vi.mocked(askUri)).toHaveBeenNthCalledWith(2, "mongodb://u:secret@bad")
    expect(vi.mocked(setUri)).toHaveBeenCalledWith("mongodb://good")
  })

  it("can use a URI that doesn't connect, then asks for the database name", async () => {
    vi.mocked(askUri).mockResolvedValueOnce("mongodb://offline")
    vi.mocked(checkConnection).mockRejectedValueOnce(new Error("timed out"))
    vi.mocked(pick).mockResolvedValueOnce("use")
    vi.mocked(askDatabase).mockResolvedValueOnce("shop")
    await runSetup()

    expect(vi.mocked(findDatabases)).not.toHaveBeenCalled()
    expect(vi.mocked(setUri)).toHaveBeenCalledWith("mongodb://offline")
    expect(vi.mocked(setDatabase)).toHaveBeenCalledWith("shop")
  })

  it("lets you type a database name instead of picking", async () => {
    vi.mocked(askUri).mockResolvedValueOnce("mongodb://good")
    vi.mocked(pick).mockResolvedValueOnce("Type a name…")
    vi.mocked(askDatabase).mockResolvedValueOnce("new_db")
    await runSetup()

    expect(vi.mocked(setDatabase)).toHaveBeenCalledWith("new_db")
  })

  it("asks for the name directly when the server lists no databases", async () => {
    vi.mocked(askUri).mockResolvedValueOnce("mongodb://good")
    vi.mocked(findDatabases).mockResolvedValueOnce([])
    vi.mocked(askDatabase).mockResolvedValueOnce("shop")
    await runSetup()

    expect(vi.mocked(pick)).not.toHaveBeenCalled()
    expect(vi.mocked(setDatabase)).toHaveBeenCalledWith("shop")
  })
})
