import { readdirSync, readFileSync } from "node:fs";
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
  const files = readdirSync(join(process.cwd(), "drizzle"))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      id serial PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    );
  `);

  for (const file of files) {
    const hash = file.replace(/\.sql$/, "");
    const applied = await sql<{ hash: string }[]>`
      SELECT hash FROM "__drizzle_migrations" WHERE hash = ${hash}
    `;

    if (applied.length > 0) {
      console.log(`${hash} already applied`);
      continue;
    }

    const raw = readFileSync(join(process.cwd(), "drizzle", file), "utf8");
    const statements = raw
      .split("--> statement-breakpoint")
      .map((part) => part.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await sql.unsafe(statement);
    }
    await sql.unsafe(
      `INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ('${hash}', ${Date.now()})`,
    );
    console.log(`Applied ${hash}`);
  }

  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
