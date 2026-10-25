import type { Db } from "mongodb"
import { describe, expect, it, vi } from "vitest"
import { withDb } from "../infra/mongo.js"
import { isUserCollection, purge } from "./purge.js"

vi.mock("../infra/mongo.js", () => ({ withDb: vi.fn() }))

function fakeDb(names: string[]) {
  const dropCollection = vi.fn(async () => true)
  const db = {
    listCollections: () => ({ toArray: async () => names.map((name) => ({ name })) }),
    dropCollection,
  }
  return { db: db as unknown as Db, dropCollection }
}

describe("isUserCollection", () => {
  it("excludes MongoDB's own system.* collections", () => {
    expect(isUserCollection("orders")).toBe(true)
    expect(isUserCollection("system.views")).toBe(false)
  })
})

describe("purge", () => {
  it("drops every user collection and reports how many", async () => {
    const { db, dropCollection } = fakeDb(["orders", "system.views", "users"])
    vi.mocked(withDb).mockImplementationOnce(async (_uri, _database, fn) => fn(db))

    expect(await purge({ uri: "mongodb://h", database: "shop" })).toBe(2)
    expect(vi.mocked(withDb)).toHaveBeenCalledWith("mongodb://h", "shop", expect.any(Function))
    expect(dropCollection.mock.calls).toEqual([["orders"], ["users"]])
  })

  it("returns 0 for an empty database", async () => {
    const { db, dropCollection } = fakeDb([])
    vi.mocked(withDb).mockImplementationOnce(async (_uri, _database, fn) => fn(db))

    expect(await purge({ uri: "mongodb://h", database: "shop" })).toBe(0)
    expect(dropCollection).not.toHaveBeenCalled()
  })
})
