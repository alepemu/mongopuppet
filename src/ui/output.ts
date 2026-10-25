import pc from "picocolors"
import { maskUri } from "../utils/maskUri.js"

export const info = (message: string) => console.log(message)
export const dim = (message: string) => console.log(pc.dim(message))
export const success = (message: string) => console.log(`${pc.green("✔")} ${message}`)
export const warn = (message: string) => console.log(`${pc.yellow("!")} ${message}`)
export const error = (message: string) => console.log(`${pc.red("✖")} ${message}`)

export const header = (uri: string, database: string) =>
  info(`${pc.bold(pc.green("mongopuppet"))} ${pc.dim(`${maskUri(uri)} @ ${database}`)}`)
