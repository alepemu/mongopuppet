import pc from "picocolors"
import { isConfigured, requireConfig } from "./infra/config.js"
import { runMenu } from "./ui/menu.js"
import { dim, info } from "./ui/output.js"
import { runSetup } from "./ui/setup.js"
import { maskUri } from "./utils/maskUri.js"

if (!isConfigured()) await runSetup()

const { uri, database } = requireConfig()
info(`${pc.bold(pc.green("mongopuppet"))} ${pc.dim(`${maskUri(uri)} / ${database}`)}`)

await runMenu()

dim("Bye!")
