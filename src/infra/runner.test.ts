import { describe, expect, it } from "vitest"
import { isInstalled, run, ToolError } from "./runner.js"

// Real child processes: the Node binary running these tests stands in for mongodump.
const node = process.execPath

describe("run", () => {
  it("returns what the tool wrote to stderr", async () => {
    expect(await run(node, ["-e", "process.stderr.write('3 document(s) restored')"])).toBe(
      "3 document(s) restored",
    )
  })

  it("fails with the tool's stderr only, never the command line", async () => {
    const secretArg = "mongodb://user:secret@host"
    const failing = run(node, [
      "-e",
      "process.stderr.write('bad auth'); process.exit(3)",
      secretArg,
    ])

    await expect(failing).rejects.toBeInstanceOf(ToolError)
    await expect(failing).rejects.toThrow(/^bad auth$/)
  })

  it("falls back to a generic message when the tool prints nothing", async () => {
    await expect(run(node, ["-e", "process.exit(1)"])).rejects.toThrow(`${node} failed.`)
  })
})

describe("isInstalled", () => {
  it("finds a binary that can start", async () => {
    expect(await isInstalled(node)).toBe(true)
  })

  it("reports a missing binary", async () => {
    expect(await isInstalled("mongopuppet-no-such-binary")).toBe(false)
  })
})
