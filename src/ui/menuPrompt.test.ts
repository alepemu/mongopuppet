import { PassThrough } from "node:stream"
import { stripVTControlCharacters } from "node:util"
import { describe, expect, it } from "vitest"
import { BACK, menuPrompt } from "./menuPrompt.js"

// The real prompt, driven through fake keyboard/screen streams.
const KEY = { up: "\u001B[A", down: "\u001B[B", left: "\u001B[D", enter: "\r" }
const PENDING = Symbol("pending")
const CHOICES = [
  { name: "Change URI", value: "uri" },
  { name: "Change database", value: "database" },
]

type Config = Parameters<typeof menuPrompt>[0]

const pause = (ms = 15) => new Promise((resolve) => setTimeout(resolve, ms))
const clean = (text: string) => stripVTControlCharacters(text)

async function drive(config: Partial<Config>, keys: string[]) {
  const input = new PassThrough()
  const output = new PassThrough()
  let screen = ""
  output.on("data", (chunk) => {
    screen += String(chunk)
  })

  const stop = new AbortController()
  const answer = menuPrompt(
    { message: "Pick one?", choices: CHOICES, canGoBack: true, ...config },
    { input, output, signal: stop.signal },
  )
  await pause(40)
  const firstFrame = clean(screen)
  const firstFrameLength = screen.length

  for (const key of keys) {
    input.write(key)
    await pause()
  }
  const result = await Promise.race([answer, pause(150).then(() => PENDING)])
  if (result === PENDING) {
    answer.catch(() => {}) // aborting rejects; that's expected here
    stop.abort()
  }
  input.end()

  const lines = firstFrame.split("\n").map((line) => line.trimEnd())
  return { result, lines, after: clean(screen.slice(firstFrameLength)) }
}

describe("menuPrompt", () => {
  it("shows the title, the choices and the keys", async () => {
    const { lines } = await drive({}, [KEY.enter])
    expect(lines).toEqual([
      "Pick one?",
      "❯ Change URI",
      "  Change database",
      "↑↓ navigate • ⏎ select • ← back",
    ])
  })

  it("selects the highlighted choice and collapses to one line", async () => {
    const { result, after } = await drive({}, [KEY.enter])
    expect(result).toBe("uri")
    expect(after).toContain("Pick one? Change URI")
  })

  it.each([
    ["down", [KEY.down], "database"],
    ["down twice (wraps)", [KEY.down, KEY.down], "uri"],
    ["up (wraps)", [KEY.up], "database"],
  ])("moves with %s", async (_label, moves, expected) => {
    const { result } = await drive({}, [...moves, KEY.enter])
    expect(result).toBe(expected)
  })

  it("ignores typed letters", async () => {
    const { result } = await drive({}, ["x", "y", KEY.enter])
    expect(result).toBe("uri")
  })

  it("goes back with ← when allowed", async () => {
    const { result, after } = await drive({}, [KEY.left])
    expect(result).toBe(BACK)
    expect(after).toContain("Pick one? ← back")
  })

  it("ignores ← and hides its hint when going back is not allowed", async () => {
    const { result, lines } = await drive({ canGoBack: false }, [KEY.left])
    expect(result).toBe(PENDING)
    expect(lines.at(-1)).toBe("↑↓ navigate • ⏎ select")
  })

  it("draws no title line when the message is empty", async () => {
    const { lines, after } = await drive({ message: "" }, [KEY.enter])
    expect(lines[0]).toBe("❯ Change URI")
    expect(after.trim()).toBe("Change URI")
  })

  it("survives an empty list", async () => {
    const { result } = await drive({ choices: [] }, [KEY.down, KEY.enter, KEY.left])
    expect(result).toBe(BACK)
  })
})
