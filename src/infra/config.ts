import Conf from "conf"

export interface Config {
  uri?: string
  database?: string
}

const store = new Conf<Config>({ projectName: "mongopuppet" })

export function getConfig(): Config {
  return { uri: store.get("uri"), database: store.get("database") }
}

/** Config that is guaranteed to be complete. Call it after the first-run setup. */
export function requireConfig(): Required<Config> {
  const { uri, database } = getConfig()
  if (!uri || !database) throw new Error("mongopuppet is not configured yet.")
  return { uri, database }
}

export function saveConfig(config: Config): void {
  store.set(config)
}

export function isConfigured(): boolean {
  const { uri, database } = getConfig()
  return Boolean(uri && database)
}

export function configPath(): string {
  return store.path
}
