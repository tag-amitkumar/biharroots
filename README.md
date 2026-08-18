# naturecart

An ecommerce app (Next.js App Router, Prisma/Postgres, NextAuth credentials + Google login) for browsing products, managing a cart and wishlist, checking out cash-on-delivery, and administering products/orders/users.

## Tech stack

- Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4
- Prisma 6 over Postgres
- NextAuth 4 — email/password (Credentials provider), plus Google OAuth when configured
- Zustand for client cart/wishlist state
- Cloudinary for product image uploads
- Vitest for the service-layer test suite

## Getting started

1. Install dependencies:
   ```
   npm install
   ```
2. Start a local Postgres (the `db` service in `docker-compose.yml` is published on host port 55432):
   ```
   docker compose up -d db
   ```
3. Copy `.env.example` to `.env` and fill in real values — it documents every variable, including which ones are optional:
   ```
   cp .env.example .env
   ```
   - `DATABASE_URL` — pooled Postgres connection used by the app at runtime. Against the compose service: `postgresql://naturecart:naturecart@localhost:55432/naturecart`.
   - `DIRECT_URL` — unpooled connection used only by `prisma migrate`. Same value locally; a different host on providers that put a pooler in front (Neon, Supabase, Vercel Postgres).
   - `NEXTAUTH_SECRET` — any random string for local dev; `openssl rand -base64 32` for production.
   - `NEXTAUTH_URL` — `http://localhost:3000` for local dev.
   - `CLOUDINARY_*` — only needed for the admin image-upload endpoint.
4. Apply the database schema:
   ```
   npx prisma migrate dev
   ```
5. Run the dev server:
   ```
   npm run dev
   ```
   The app is at `http://localhost:3000`.

### Creating an admin user

There's no seed script for users. Sign up a normal account through `/signup`, then promote it manually. The table name is quoted because Prisma keeps the model's capitalisation and Postgres folds unquoted identifiers to lower case:

```
npx prisma db execute --schema prisma/schema.prisma --stdin <<'EOF'
UPDATE "User" SET role = 'admin' WHERE email = 'you@example.com';
EOF
```

`/admin/*` requires an admin-role session (enforced both by `proxy.ts` at the route level and by each admin API route).

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build (`prisma generate && next build`) |
| `npm run start` | Run a production build (`npm run build` first) |
| `npm run lint` | ESLint |
| `npm test` | Vitest (service-layer unit tests) |
| `npm run db:migrate:deploy` | Apply pending migrations (non-interactive; for deploys) |
| `npm run db:seed-categories` | Seed the category tree |
| `npm run db:seed-products` | Seed demo products |
| `npm run db:seed-loyalty` | Seed loyalty tiers |

Before committing, run lint, typecheck (`npx tsc --noEmit`), test, and build — CI (`.github/workflows/ci.yml`) runs the same sequence on every PR.

## Project structure

```
app/                   Next.js App Router — routes and API handlers only
src/
  features/            One folder per domain (products, cart, orders, reviews,
                        wishlist, users, auth), each with service.ts (business
                        rules) and repository.ts (the only file that talks to
                        Prisma for that domain)
  components/          Cross-feature UI only (Navbar, Footer, etc.)
  lib/                 Prisma client, Cloudinary client
  types/               Shared type declarations
prisma/                Schema, migrations, and seed scripts
```

See `ARCHITECTURE.md` for the reasoning behind this layout.

## Deployment

### Vercel

Nothing in the app touches the database at build time — every catalog page either fetches from `/api/*` on the client or is marked `force-dynamic` — so the build needs a parseable `DATABASE_URL`, not a reachable one. Runtime does need a real, **pooled** connection: each request is served by its own short-lived function, and an unpooled URL exhausts the database's connection limit under load.

1. Provision Postgres (Neon, Supabase, Vercel Postgres, …).
2. Set these in Project Settings → Environment Variables, for Production **and** Preview:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | pooled connection string |
   | `DIRECT_URL` | unpooled connection string, for `prisma migrate`. Optional — `prisma.config.ts` falls back to `DATABASE_URL`, which is correct whenever nothing is pooled |
   | `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | full production origin, no trailing slash |
   | `NEXT_PUBLIC_SITE_URL` | same as `NEXTAUTH_URL` (leave unset on Preview so each deployment falls back to its own `VERCEL_URL`) |
   | `CLOUDINARY_*` | only if admin image upload is used |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | only if Google login is used |

   Mark `DATABASE_URL` and `DIRECT_URL` Sensitive if you like, but know what
   that costs: **Vercel does not expose Sensitive variables to the build**, and
   it passes them as empty strings rather than omitting them. Anything that
   needs a real connection string at build time cannot work under that setting.

3. Deploy. The build is `npm run build` (`prisma generate && next build`), which
   never opens a database connection — `generate` only reads `schema.prisma`.
   So the build needs a *parseable* `DATABASE_URL`, not a reachable one.

4. Apply migrations yourself, against the database you mean to change:
   ```
   npm run db:migrate:deploy
   ```
   Deliberately **not** part of the build. Two reasons: Sensitive variables are
   absent at build time so it would fail outright, and `DATABASE_URL` is scoped
   to Preview as well as Production, so every preview deployment would migrate
   whatever database it pointed at — production included.

5. Seed the catalog once, with `.env` pointing at the deployed database. Order
   matters: `seed-products` looks categories up by slug and, if one is missing,
   logs a warning and skips the product while still exiting 0 — so running it
   first yields an empty catalog and no error.
   ```
   npm run db:seed-categories && npm run db:seed-products && npm run db:seed-loyalty
   ```
   All three are idempotent: loyalty upserts, products skip names that already
   exist, categories upsert by slug.

6. Create the admin user as described above.

### Self-hosted via Docker

```
docker compose up --build
```

This builds the image, starts Postgres, applies pending Prisma migrations on container start (`prisma migrate deploy`), and serves the app on port 3000. The database lives in a named volume (`db-data`) so it survives container restarts and image rebuilds. `docker-compose.yml` reads its environment from `.env` (see setup above) — make sure that file exists with real values first.
