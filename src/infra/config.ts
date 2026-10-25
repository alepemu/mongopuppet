import Conf from "conf"
import { addToHistory } from "../utils/history.js"

export type Setting = "uri" | "database"

export interface Config {
  uri?: string
  database?: string
  /** Last values used, newest first. */
  uriHistory?: string[]
  databaseHistory?: string[]
}

// 0o600: only the owner may read the file, since it holds URIs with passwords (no effect on Windows).
const store = new Conf<Config>({ projectName: "mongopuppet", configFileMode: 0o600 })

export function getConfig(): { uri?: string; database?: string } {
  return { uri: store.get("uri"), database: store.get("database") }
}

export function requireConfig(): { uri: string; database: string } {
  const { uri, database } = getConfig()
  if (!uri || !database) throw new Error("mongopuppet is not configured yet.")
  return { uri, database }
}

function setValue(setting: Setting, value: string): void {
  const historyKey = `${setting}History` as const
  store.set(setting, value)
  store.set(historyKey, addToHistory(store.get(historyKey) ?? [], value))
}

/** setUri / setDatabase are the only writers of the values, so the history stays in sync. */
export function setUri(uri: string): void {
  setValue("uri", uri)
}

export function setDatabase(database: string): void {
  setValue("database", database)
}

/** Always includes the current value (configs saved before history existed have none stored). */
export function getHistory(setting: Setting): string[] {
  const stored = store.get(`${setting}History`) ?? []
  const current = store.get(setting)
  return current ? addToHistory(stored, current) : stored
}

export function isConfigured(): boolean {
  const { uri, database } = getConfig()
  return Boolean(uri && database)
}

export function configPath(): string {
  return store.path
}
