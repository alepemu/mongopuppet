import { beforeEach, describe, expect, it, vi } from "vitest"
import { HISTORY_SIZE } from "../utils/history.js"

// `conf` is replaced by an in-memory store, so tests never touch the real config file.
const fake = vi.hoisted(() => ({
  data: new Map<string, unknown>(),
  options: undefined as unknown,
}))

vi.mock("conf", () => ({
  default: class {
    path = "/fake/config.json"
    constructor(options: unknown) {
      fake.options = options
    }
    get(key: string) {
      return fake.data.get(key)
    }
    set(key: string, value: unknown) {
      fake.data.set(key, value)
    }
  },
}))

const config = await import("./config.js")

beforeEach(() => {
  fake.data.clear()
})

describe("config file", () => {
  it("is private to the user and lives under the mongopuppet name", () => {
    expect(fake.options).toEqual({ projectName: "mongopuppet", configFileMode: 0o600 })
    expect(config.configPath()).toBe("/fake/config.json")
  })
})

describe("before setup", () => {
  it("is not configured and refuses to hand out a config", () => {
    expect(config.isConfigured()).toBe(false)
    expect(() => config.requireConfig()).toThrow("not configured")
    expect(config.getHistory("uri")).toEqual([])
  })
})

describe("setUri / setDatabase", () => {
  it("saves both values", () => {
    config.setUri("mongodb://a")
    config.setDatabase("shop")
    expect(config.isConfigured()).toBe(true)
    expect(config.requireConfig()).toEqual({ uri: "mongodb://a", database: "shop" })
  })

  it("keeps the last values, newest first, without duplicates", () => {
    config.setDatabase("shop")
    config.setDatabase("blog")
    config.setDatabase("shop")
    expect(config.getHistory("database")).toEqual(["shop", "blog"])
  })

  it(`keeps at most ${HISTORY_SIZE} values`, () => {
    for (let i = 1; i <= HISTORY_SIZE + 2; i++) config.setUri(`mongodb://h${i}`)
    const history = config.getHistory("uri")
    expect(history).toHaveLength(HISTORY_SIZE)
    expect(history[0]).toBe(`mongodb://h${HISTORY_SIZE + 2}`)
    expect(history.at(-1)).toBe("mongodb://h3")
  })

  it("keeps separate histories for URI and database", () => {
    config.setUri("mongodb://a")
    config.setDatabase("shop")
    expect(config.getHistory("uri")).toEqual(["mongodb://a"])
    expect(config.getHistory("database")).toEqual(["shop"])
  })
})

describe("config saved before history existed", () => {
  it("shows the current value as the history", () => {
    fake.data.set("uri", "mongodb://legacy")
    fake.data.set("database", "old")
    expect(config.getHistory("uri")).toEqual(["mongodb://legacy"])
    expect(config.getHistory("database")).toEqual(["old"])
  })
})
