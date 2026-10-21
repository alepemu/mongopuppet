import { error, info } from "./output.js"

/** Tells the user which required tools are missing. */
export function showMissingTools(missing: string[]): void {
  error(`MongoDB Database Tools not found (missing: ${missing.join(", ")}).`)
  info("Please install them, make sure they are on your PATH, and start mongopuppet again.")
}
