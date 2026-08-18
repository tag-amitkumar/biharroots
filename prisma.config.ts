// Loads .env for the Prisma CLI (Next.js loads it on its own for the app,
// but `prisma generate` / `prisma migrate` run outside of Next).
import "dotenv/config";
import { defineConfig } from "prisma/config";

// schema.prisma declares `directUrl = env("DIRECT_URL")`, and Prisma treats a
// declared-but-unset env var as a hard schema validation failure (P1012) - so
// every CLI command, `generate` included, dies before it reads the schema when
// DIRECT_URL is absent. DIRECT_URL only has to differ from DATABASE_URL when
// the latter points at a connection pooler, which not every deployment uses,
// so default it to DATABASE_URL instead of failing. Environments that *are*
// pooled still set DIRECT_URL explicitly and this is a no-op for them.
if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

// No `datasource` override here on purpose: schema.prisma already reads
// DATABASE_URL and DIRECT_URL from the environment, and overriding `url`
// here would also override it for `prisma migrate`, which must use the
// unpooled DIRECT_URL rather than the pooled runtime connection.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
});
