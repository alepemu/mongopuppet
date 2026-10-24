import { withDb } from "../infra/mongo.js"

export interface PurgeOptions {
  uri: string
  database: string
}

/** MongoDB manages `system.*` collections itself, so they are never dropped. */
export function isUserCollection(name: string): boolean {
  return !name.startsWith("system.")
}

/** Drops every user collection in the database (the database itself stays). Returns the count. */
export function purge({ uri, database }: PurgeOptions): Promise<number> {
  return withDb(uri, database, async (db) => {
    const collections = await db.listCollections({}, { nameOnly: true }).toArray()
    const names = collections.map((collection) => collection.name).filter(isUserCollection)
    for (const name of names) await db.dropCollection(name)
    return names.length
  })
}
