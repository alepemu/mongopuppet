import { execa } from "execa"

/** True if the binary can be started (i.e. it is on the PATH). */
export async function isInstalled(binary: string): Promise<boolean> {
  try {
    await execa(binary, ["--version"])
    return true
  } catch {
    return false
  }
}
