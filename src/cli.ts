import pc from "picocolors"
import { findMissingTools } from "./core/tools.js"
import { isConfigured, requireConfig } from "./infra/config.js"
import { runMenu } from "./ui/menu.js"
import { dim, info } from "./ui/output.js"
import { runSetup } from "./ui/setup.js"
import { showMissingTools } from "./ui/tools.js"
import { maskUri } from "./utils/maskUri.js"

const missingTools = await findMissingTools()
if (missingTools.length > 0) {
  showMissingTools(missingTools)
  process.exit(1)
}

if (!isConfigured()) await runSetup()

const { uri, database } = requireConfig()
info(`${pc.bold(pc.green("mongopuppet"))} ${pc.dim(`${maskUri(uri)} / ${database}`)}`)

await runMenu()

dim("Bye!")
