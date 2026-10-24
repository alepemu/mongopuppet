import { type Db, MongoClient } from "mongodb"

/** Opens a connection, runs `fn` with the database, and always closes the connection. */
export async function withDb<T>(
  uri: string,
  database: string,
  fn: (db: Db) => Promise<T>,
): Promise<T> {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 })
  try {
    await client.connect()
    return await fn(client.db(database))
  } finally {
    await client.close()
  }
}
