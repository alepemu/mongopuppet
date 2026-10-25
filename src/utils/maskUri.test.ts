import { describe, expect, it } from "vitest"
import { maskUri } from "./maskUri.js"

describe("maskUri", () => {
  it("hides the password", () => {
    expect(maskUri("mongodb://admin:s3cret@host:27017/db")).toBe(
      "mongodb://admin:****@host:27017/db",
    )
    expect(maskUri("mongodb+srv://u:p%40ss@c.mongodb.net/")).toBe(
      "mongodb+srv://u:****@c.mongodb.net/",
    )
  })

  it("hides a password that contains a raw @", () => {
    expect(maskUri("mongodb://user:p@ss@host:27017")).toBe("mongodb://user:****@host:27017")
  })

  it("leaves URIs without a password alone", () => {
    expect(maskUri("mongodb://localhost:27017")).toBe("mongodb://localhost:27017")
    expect(maskUri("mongodb://admin@host")).toBe("mongodb://admin@host")
    expect(maskUri("mongodb://host:27017/db@x")).toBe("mongodb://host:27017/db@x")
  })

  it("masks every URI inside a longer message", () => {
    const message =
      "failed to connect to mongodb://user:secret@127.0.0.1:1/?x=1 and mongodb://c:d@h2 twice"
    const masked = maskUri(message)
    expect(masked).not.toContain("secret")
    expect(masked).toBe(
      "failed to connect to mongodb://user:****@127.0.0.1:1/?x=1 and mongodb://c:****@h2 twice",
    )
  })
})
