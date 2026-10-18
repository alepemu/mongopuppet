import { intro, outro } from "@clack/prompts";
import { getConfig, isConfigured } from "./infra/config.js";
import { runSetup } from "./ui/setup.js";

intro("~~ mongopuppet ~~");

if (!isConfigured()) await runSetup();

const { uri, database } = getConfig();

outro(`Ready with uri=${uri} and database=${database}`);
