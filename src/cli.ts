import { intro, log, outro } from "@clack/prompts"
import { isConfigured, requireConfig } from "./infra/config.js"
import { runMenu } from "./ui/menu.js"
import { runSetup } from "./ui/setup.js"
import { maskUri } from "./utils/maskUri.js"

intro("~~ mongopuppet ~~")

if (!isConfigured()) await runSetup()

const { uri, database } = requireConfig()
log.info(`uri=${maskUri(uri)} database=${database}`)

await runMenu()

outro("Bye!")
