import { isCancel, text } from "@clack/prompts"

/** Ask for a MongoDB URI. Returns undefined if the user cancels. */
export async function askUri(initialValue?: string): Promise<string | undefined> {
  const uri = await text({
    message: "MongoDB URI",
    placeholder: "mongodb://localhost:27017",
    initialValue,
    validate: (value) =>
      /^mongodb(\+srv)?:\/\//.test(value ?? "")
        ? undefined
        : "URI must start with mongodb:// or mongodb+srv://",
  })
  return isCancel(uri) ? undefined : uri
}

/** Ask for a database name. Returns undefined if the user cancels. */
export async function askDatabase(initialValue?: string): Promise<string | undefined> {
  const database = await text({
    message: "Database",
    initialValue,
    validate: (value) => (value?.trim() ? undefined : "Database name is required"),
  })
  return isCancel(database) ? undefined : database.trim()
}
