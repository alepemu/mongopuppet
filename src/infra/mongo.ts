import { type Db, MongoClient } from "mongodb"

export async function withClient<T>(
  uri: string,
  fn: (client: MongoClient) => Promise<T>,
): Promise<T> {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 })
  try {
    await client.connect()
    return await fn(client)
  } finally {
    await client.close()
  }
}

export function withDb<T>(uri: string, database: string, fn: (db: Db) => Promise<T>): Promise<T> {
  return withClient(uri, (client) => fn(client.db(database)))
}
