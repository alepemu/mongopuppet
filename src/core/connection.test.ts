import type { MongoClient } from "mongodb"
import { describe, expect, it, vi } from "vitest"
import { withClient } from "../infra/mongo.js"
import { checkConnection, findDatabases } from "./connection.js"

vi.mock("../infra/mongo.js", () => ({ withClient: vi.fn() }))

function fakeClient(databaseNames: string[]) {
  const command = vi.fn(async () => ({ ok: 1 }))
  const client = {
    db: () => ({
      command,
      admin: () => ({
        listDatabases: async () => ({ databases: databaseNames.map((name) => ({ name })) }),
      }),
    }),
  }
  return { client: client as unknown as MongoClient, command }
}

describe("checkConnection", () => {
  it("pings the server", async () => {
    const { client, command } = fakeClient([])
    vi.mocked(withClient).mockImplementationOnce(async (_uri, fn) => fn(client))

    await checkConnection("mongodb://h")
    expect(command).toHaveBeenCalledWith({ ping: 1 })
  })

  it("passes the connection error on", async () => {
    vi.mocked(withClient).mockRejectedValueOnce(new Error("bad auth : authentication failed"))
    await expect(checkConnection("mongodb://h")).rejects.toThrow("bad auth")
  })
})

describe("findDatabases", () => {
  it("lists user databases sorted, hiding system ones and names we can't use", async () => {
    const { client } = fakeClient(["shop", "admin", "local", "config", "-bad", "blog"])
    vi.mocked(withClient).mockImplementationOnce(async (_uri, fn) => fn(client))

    expect(await findDatabases("mongodb://h")).toEqual(["blog", "shop"])
  })

  it("returns [] when listing is not allowed", async () => {
    vi.mocked(withClient).mockRejectedValueOnce(new Error("not authorized"))
    expect(await findDatabases("mongodb://h")).toEqual([])
  })
})
