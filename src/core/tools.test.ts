import { describe, expect, it, vi } from "vitest"
import { isInstalled } from "../infra/runner.js"
import { findMissingTools, REQUIRED_TOOLS } from "./tools.js"

vi.mock("../infra/runner.js", () => ({ isInstalled: vi.fn() }))

describe("findMissingTools", () => {
  it("requires mongodump and mongorestore", () => {
    expect(REQUIRED_TOOLS).toEqual(["mongodump", "mongorestore"])
  })

  it("returns nothing when everything is installed", async () => {
    vi.mocked(isInstalled).mockResolvedValue(true)
    expect(await findMissingTools()).toEqual([])
  })

  it("names the tools that are missing", async () => {
    vi.mocked(isInstalled).mockImplementation(async (binary) => binary === "mongodump")
    expect(await findMissingTools()).toEqual(["mongorestore"])
  })
})
