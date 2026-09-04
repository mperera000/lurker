import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config();

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to migrate. See .env.example.");
  }
  return url;
}

async function main() {
  const sql = postgres(requireDatabaseUrl(), { max: 1 });
  const file = join(process.cwd(), "drizzle/0000_init.sql");
  const raw = readFileSync(file, "utf8");
  const statements = raw
    .split("--> statement-breakpoint")
    .map((part) => part.trim())
    .filter(Boolean);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      id serial PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    );
  `);

  const applied = await sql<{ hash: string }[]>`
    SELECT hash FROM "__drizzle_migrations" WHERE hash = '0000_init'
  `;

  if (applied.length === 0) {
    for (const statement of statements) {
      await sql.unsafe(statement);
    }
    await sql.unsafe(
      `INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ('0000_init', ${Date.now()})`,
    );
    console.log("Applied 0000_init");
  } else {
    console.log("0000_init already applied");
  }

  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
