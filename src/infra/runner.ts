import { execa } from "execa"

/** Thrown when an external tool fails. The message is the tool's stderr, never the command line. */
export class ToolError extends Error {}

/** True if the binary can be started (i.e. it is on the PATH). */
export async function isInstalled(binary: string): Promise<boolean> {
  try {
    await execa(binary, ["--version"])
    return true
  } catch {
    return false
  }
}

/** Runs a binary without a shell. The command line may hold a password, so it is never reported. */
export async function run(binary: string, args: string[]): Promise<void> {
  try {
    await execa(binary, args)
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr?.trim()
    throw new ToolError(stderr || `${binary} failed.`)
  }
}
