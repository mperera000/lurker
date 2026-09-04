import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and start Postgres (see README).",
    );
  }
  return url;
}

type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  db: Database | undefined;
};

function getDb(): Database {
  if (!globalForDb.db) {
    const client = postgres(requireDatabaseUrl(), {
      max: 4,
      prepare: false,
    });
    globalForDb.db = drizzle(client, { schema });
  }
  return globalForDb.db;
}

export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export { schema };
