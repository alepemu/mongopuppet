import { describe, expect, it } from "vitest"
import { databaseNameError } from "./databaseName.js"

describe("databaseNameError", () => {
  it.each(["shop", "mongopuppet-test", "ok_name1", "a".repeat(63)])("accepts %s", (name) => {
    expect(databaseNameError(name)).toBeUndefined()
  })

  it.each([
    ["", "required"],
    ["a".repeat(64), "63 characters"],
    ["-x", "start with -"],
    ["../x", "cannot contain"],
    ["my db", "cannot contain"],
    ["a.b", "cannot contain"],
    ["a$b", "cannot contain"],
    ['a"b', "cannot contain"],
  ])("rejects %j", (name, reason) => {
    expect(databaseNameError(name)).toContain(reason)
  })
})
