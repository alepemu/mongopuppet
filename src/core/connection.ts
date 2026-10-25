import { withClient } from "../infra/mongo.js"
import { databaseNameError } from "../utils/databaseName.js"

const SYSTEM_DATABASES = new Set(["admin", "local", "config"])

export async function checkConnection(uri: string): Promise<void> {
  await withClient(uri, (client) => client.db("admin").command({ ping: 1 }))
}

/**
 * [] if the user may not list databases. Names our rules reject are left out,
 * since they become folder names and `--db` values.
 */
export async function findDatabases(uri: string): Promise<string[]> {
  try {
    const { databases } = await withClient(uri, (client) =>
      client.db().admin().listDatabases({ nameOnly: true }),
    )
    return databases
      .map((database) => database.name)
      .filter((name) => !SYSTEM_DATABASES.has(name) && databaseNameError(name) === undefined)
      .sort()
  } catch {
    return []
  }
}
