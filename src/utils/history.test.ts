import { describe, expect, it } from "vitest"
import { addToHistory, HISTORY_SIZE } from "./history.js"

describe("addToHistory", () => {
  it("starts a history", () => {
    expect(addToHistory([], "a")).toEqual(["a"])
  })

  it("puts the value first and removes the older copy", () => {
    expect(addToHistory(["a", "b", "c"], "c")).toEqual(["c", "a", "b"])
  })

  it("keeps at most HISTORY_SIZE values, dropping the oldest", () => {
    const full = Array.from({ length: HISTORY_SIZE }, (_, i) => `v${i}`)
    const next = addToHistory(full, "new")
    expect(next).toHaveLength(HISTORY_SIZE)
    expect(next[0]).toBe("new")
    expect(next).not.toContain(`v${HISTORY_SIZE - 1}`)
  })

  it("does not change the list it was given", () => {
    const list = ["a", "b"]
    addToHistory(list, "c")
    expect(list).toEqual(["a", "b"])
  })
})
