import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { stripVTControlCharacters } from "node:util"
import { afterAll, describe, expect, it } from "vitest"

const cli = join(import.meta.dirname, "..", "dist", "cli.js")
const home = mkdtempSync(join(tmpdir(), "mongopuppet-home-"))

afterAll(() => {
  rmSync(home, { recursive: true, force: true })
})

describe("dist/cli.js", () => {
  it("is built (run `pnpm run build` or `pnpm test`)", () => {
    expect(existsSync(cli)).toBe(true)
  })

  it("stops with a clear message when the MongoDB tools are not on PATH", () => {
    const env: NodeJS.ProcessEnv = { ...process.env }
    // Empty PATH (Windows spells it "Path") and a throwaway home, so no real config is read or written.
    for (const key of Object.keys(env)) if (key.toLowerCase() === "path") env[key] = ""
    Object.assign(env, { HOME: home, USERPROFILE: home, APPDATA: home, XDG_CONFIG_HOME: home })

    const result = spawnSync(process.execPath, [cli], { env, encoding: "utf8", timeout: 20_000 })

    expect(result.status).toBe(1)
    expect(stripVTControlCharacters(result.stdout)).toContain(
      "MongoDB Database Tools not found (missing: mongodump, mongorestore).",
    )
  })
})
