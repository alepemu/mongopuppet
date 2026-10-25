import { execa } from "execa"

/** Thrown when an external tool fails. The message is the tool's stderr, never the command line. */
export class ToolError extends Error {}

export async function isInstalled(binary: string): Promise<boolean> {
  try {
    await execa(binary, ["--version"])
    return true
  } catch {
    return false
  }
}

/** Returns stderr, where the MongoDB tools log. The command line may hold a password, so it is never reported. */
export async function run(binary: string, args: string[]): Promise<string> {
  try {
    const { stderr } = await execa(binary, args)
    return stderr
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr?.trim()
    throw new ToolError(stderr || `${binary} failed.`)
  }
}
