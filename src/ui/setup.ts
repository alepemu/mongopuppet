import { cancel, isCancel, text } from "@clack/prompts"
import { saveConfig } from "../infra/config.js"

export async function runSetup(): Promise<void> {
  const uri = await text({
    message: "MongoDB URI",
    placeholder: "mongodb://localhost:27017",
    validate: (value) =>
      /^mongodb(\+srv)?:\/\//.test(value ?? "")
        ? undefined
        : "URI must start with mongodb:// or mongodb+srv://",
  })
  if (isCancel(uri)) return exitCancelled()

  const database = await text({
    message: "Database",
    validate: (value) => (value?.trim() ? undefined : "Database name is required"),
  })
  if (isCancel(database)) return exitCancelled()

  saveConfig({ uri, database: database.trim() })
}

function exitCancelled(): never {
  cancel("Setup cancelled.")
  process.exit(0)
}
