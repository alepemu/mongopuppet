import { findMissingTools } from "./core/tools.js"
import { isConfigured, requireConfig } from "./infra/config.js"
import { runMenu } from "./ui/menu.js"
import { error, header } from "./ui/output.js"
import { runSetup } from "./ui/setup.js"
import { showMissingTools } from "./ui/tools.js"
import { maskUri } from "./utils/maskUri.js"

try {
  const missingTools = await findMissingTools()
  if (missingTools.length > 0) {
    showMissingTools(missingTools)
    process.exit(1)
  }

  if (!isConfigured()) await runSetup()

  const { uri, database } = requireConfig()
  header(uri, database)

  await runMenu()
} catch (err) {
  // Last resort: never print a raw stack trace (driver messages can contain the URI).
  error(maskUri(err instanceof Error ? err.message : String(err)))
  process.exit(1)
}
