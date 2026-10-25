import { input } from "@inquirer/prompts"
import pc from "picocolors"
import { backupExists } from "../core/backup.js"
import { backupNameError } from "../utils/backupName.js"
import { databaseNameError } from "../utils/databaseName.js"
import { maskUri } from "../utils/maskUri.js"
import { BACK, type MenuChoice, menuPrompt } from "./menuPrompt.js"

const theme = { prefix: { idle: "", done: "" } }

/** Ctrl+C at any prompt exits the program. */
async function prompt<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (error) {
    if (error instanceof Error && error.name === "ExitPromptError") process.exit(0)
    throw error
  }
}

export function askUri(initialValue?: string): Promise<string> {
  return prompt(() =>
    input({
      message: "MongoDB URI:",
      theme: { ...theme, style: { answer: (text: string) => pc.cyan(maskUri(text)) } },
      default: initialValue,
      prefill: "editable",
      validate: (value) =>
        /^mongodb(\+srv)?:\/\//.test(value) || "URI must start with mongodb:// or mongodb+srv://",
    }),
  )
}

export async function askDatabase(initialValue?: string): Promise<string> {
  const database = await prompt(() =>
    input({
      message: "Database:",
      theme,
      default: initialValue,
      prefill: "editable",
      validate: (value) => databaseNameError(value.trim()) ?? true,
    }),
  )
  return database.trim()
}

export async function askBackupName(database: string, initialValue: string): Promise<string> {
  const name = await prompt(() =>
    input({
      message: "Name:",
      theme,
      default: initialValue,
      prefill: "editable",
      validate: async (value) => {
        const problem = backupNameError(value.trim())
        if (problem) return problem
        return (await backupExists(database, value.trim()))
          ? "A backup with that name already exists"
          : true
      },
    }),
  )
  return name.trim()
}

export async function askTyped(message: string, expected: string): Promise<void> {
  await prompt(() =>
    input({
      message,
      theme,
      validate: (value) =>
        value.trim().toLowerCase() === expected.toLowerCase() || `Type "${expected}" to continue`,
    }),
  )
}

export { BACK }

export function pick<T extends string>(message: string, choices: MenuChoice<T>[]): Promise<T>
export function pick<T extends string>(
  message: string,
  choices: MenuChoice<T>[],
  options: { canGoBack: true },
): Promise<T | typeof BACK>
export function pick<T extends string>(
  message: string,
  choices: MenuChoice<T>[],
  options?: { canGoBack: true },
): Promise<T | typeof BACK> {
  return prompt(
    () => menuPrompt({ message, choices, canGoBack: options?.canGoBack ?? false }) as Promise<T>,
  )
}
