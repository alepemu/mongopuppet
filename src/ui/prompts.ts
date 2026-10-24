import { input, select } from "@inquirer/prompts"
import pc from "picocolors"
import { maskUri } from "../utils/maskUri.js"
import { dim } from "./output.js"

/** Shared look for all prompts: no "?" / "✔" prefix in front of the question. */
const theme = { prefix: { idle: "", done: "" } }

/** Runs a prompt. Ctrl+C at any prompt exits the program. */
async function prompt<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (error) {
    if (error instanceof Error && error.name === "ExitPromptError") {
      dim("Bye!")
      process.exit(0)
    }
    throw error
  }
}

export function askUri(initialValue?: string): Promise<string> {
  return prompt(() =>
    input({
      message: "MongoDB URI",
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
      message: "Database",
      theme,
      default: initialValue,
      prefill: "editable",
      validate: (value) => value.trim().length > 0 || "Database name is required",
    }),
  )
  return database.trim()
}

/** Asks the user to type `expected` exactly. Used before destructive actions. */
export async function askTyped(message: string, expected: string): Promise<void> {
  await prompt(() =>
    input({
      message,
      theme,
      validate: (value) => value === expected || `Type "${expected}" to continue`,
    }),
  )
}

export function pick<T extends string>(
  message: string,
  choices: { name: string; value: T }[],
): Promise<T> {
  return prompt(() => select({ message, choices, theme }))
}
