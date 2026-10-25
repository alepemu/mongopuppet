import { describe, expect, it } from "vitest"
import { backupNameError } from "./backupName.js"

describe("backupNameError", () => {
  it.each(["2026-10-25-before-migration", "2026-10-25-18-30-02", "v1.2_test", "a".repeat(64)])(
    "accepts %s",
    (name) => {
      expect(backupNameError(name)).toBeUndefined()
    },
  )

  it.each([
    ["", "required"],
    ["a".repeat(65), "64 characters"],
    ["../x", "Use only"],
    ["a/b", "Use only"],
    ["a b", "Use only"],
    ["C:x", "Use only"],
    ["-lead", "Use only"],
    [".hidden", "Use only"],
    ["name.", "cannot end"],
    ["x.tmp", "cannot end"],
    ["X.TMP", "cannot end"],
  ])("rejects %j", (name, reason) => {
    expect(backupNameError(name)).toContain(reason)
  })
})
