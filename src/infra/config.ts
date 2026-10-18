import Conf from "conf"

export interface Config {
  uri?: string
  database?: string
}

const store = new Conf<Config>({ projectName: "mongopuppet" })

export function getConfig(): Config {
  return { uri: store.get("uri"), database: store.get("database") }
}

export function saveConfig(config: Required<Config>): void {
  store.set(config)
}

export function isConfigured(): boolean {
  const { uri, database } = getConfig()
  return Boolean(uri && database)
}

export function configPath(): string {
  return store.path
}
