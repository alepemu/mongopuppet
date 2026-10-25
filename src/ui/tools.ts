import { error, info } from "./output.js"

export function showMissingTools(missing: string[]): void {
  error(`MongoDB Database Tools not found (missing: ${missing.join(", ")}).`)
  info("Please install them, make sure they are on your PATH, and start mongopuppet again.")
}
