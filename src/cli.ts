import { intro, log, outro } from "@clack/prompts"
import { getConfig, isConfigured } from "./infra/config.js"
import { runMenu } from "./ui/menu.js"
import { runSetup } from "./ui/setup.js"

intro("~~ mongopuppet ~~")

if (!isConfigured()) await runSetup()

const { uri, database } = getConfig()
log.info(`uri=${uri} database=${database}`)

await runMenu()

outro("Bye!")
