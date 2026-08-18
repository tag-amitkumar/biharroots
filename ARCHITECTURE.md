# Architecture — naturecart

This document describes the architecture as built. It was originally written as a migration target alongside a `PROJECT_ANALYSIS.md` baseline and a `MODERNIZATION_PLAN.md` route between them; that migration is finished and both of those documents have been removed rather than left to rot.

## 1. Guiding constraints

- **Postgres, and serverless as a first-class target.** Originally self-hosted Docker with SQLite. It now deploys to Vercel as well, where each request is served by an ephemeral function with a read-only filesystem, so a file-backed database has nowhere to live. Hence Postgres, and hence `DATABASE_URL` being the *pooled* connection: every invocation opens its own, and an unpooled URL exhausts the connection limit under load.
- **COD-only checkout.** Razorpay and all payment-gateway code are removed; the order flow is: build cart → submit delivery details → create `Order` + `OrderItem`s → confirmation page. No payment-provider abstraction is introduced since there is currently exactly one fulfillment method.
- **Credentials-first auth, Google optional.** Email/password via the NextAuth Credentials provider. Google OAuth was removed during the migration and has since been added back, but stays self-disabling: the provider is only registered when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are both set, and the login page hides the button otherwise.
- **Preserve all current user-facing behavior** that is actually reachable today (browsing, cart, wishlist, orders, admin CRUD, reviews once fixed) — nothing here changes what the app does, only how it's built.

## 2. Layering

Today, server components query Prisma directly in the render path *and* client components hit `/api/*` route handlers that also query Prisma directly — two parallel access paths with no shared validation or error handling. The target introduces one shared layer in between:

```
┌─────────────────────────────────────────────┐
│  UI (Server & Client Components)             │  app/**, feature UI
├─────────────────────────────────────────────┤
│  Route Handlers (app/api/**)                 │  thin: parse request → call service → shape response
├─────────────────────────────────────────────┤
│  Service layer (src/features/*/service.ts)   │  business rules, validation, authorization checks
├─────────────────────────────────────────────┤
│  Repository layer (src/features/*/repo.ts)   │  Prisma queries only, no business logic
├─────────────────────────────────────────────┤
│  Prisma Client (src/lib/prisma.ts) → SQLite   │
└─────────────────────────────────────────────┘
```

- **Route handlers** stay thin: parse/validate input (via a schema library, e.g. Zod), call one service function, map the result/error to an HTTP response. No Prisma imports in route handlers.
- **Services** hold business rules that today are scattered or missing entirely — e.g. "only an admin session may update order status," "an order's amount must equal the sum of its items," "a review requires an authenticated user." This is where the admin-authorization gap and the Razorpay-amount mismatch get fixed structurally, not just patched.
- **Repositories** are the only code that imports `PrismaClient`. Server components that currently query Prisma directly call into the same repository/service functions instead, closing the two-parallel-paths gap the migration set out to fix.
- **Server components** may call services directly (no need to round-trip through an API route for first-load data); **client components** call `/api/*` for interactivity (add to cart, submit review, etc). Both paths converge on the same service layer.

## 3. Feature-based folder structure

Replacing the former mix of `app/`, top-level `auth/`/`lib/`/`types/`/`data/` (orphaned, outside the `@/*` alias), and `src/components/*` (flat, no grouping). **Scope decision**: only the `src/` side moved to feature folders with a service/repository split; `app/` (the Next.js App Router) stays at the project root rather than relocating under `src/app/` — that move is mostly cosmetic (Next.js supports either location equally) and wasn't worth the extra churn across every route file for no behavioral gain. As implemented:

```
app/                        # Next.js App Router — unchanged location, now thin route handlers
  admin/...
  api/
    products/route.ts        # parse request -> call service -> shape response, no Prisma import
    orders/route.ts
    ...
  cart/page.tsx
  checkout/page.tsx
  product/[slug]/page.tsx
  ...
src/
  features/
    products/
      service.ts
      repository.ts          # the only file in this feature that imports PrismaClient
      components/
        ProductCard.tsx
        ProductSection.tsx
    cart/
      store.ts               # Zustand, keyed by product id
      components/
        CartDrawer.tsx
        FloatingCart.tsx
    wishlist/
      service.ts
      repository.ts
      store.ts
    orders/
      service.ts
      repository.ts
      errors.ts               # typed validation errors (e.g. OrderValidationError)
    reviews/
      service.ts
      repository.ts
      errors.ts
      components/
        ProductReviews.tsx
    users/
      service.ts
      repository.ts
      errors.ts
      components/
        UserRoleSelect.tsx
    auth/
      service.ts              # getAdminSession() and other session/role helpers
      auth-options.ts         # the one real NextAuth config
  components/                 # cross-feature primitives only (Navbar, Footer, HeroSection, providers, ...)
  lib/
    prisma.ts
    cloudinary.ts
  types/
    next-auth.d.ts
```

Every directory under `src/` is reachable via the existing `@/*` alias. Cross-feature repository imports are expected and fine (e.g. `features/orders/service.ts` imports `features/products/repository.ts` to re-price an order from real product data) — features are an organizational boundary, not a hard module boundary. Input validation is currently plain runtime checks that throw a feature-specific typed error (not a schema library like Zod) — introducing one is a reasonable future step, not done in this pass.

## 4. Authorization model

- `proxy.ts` at the **project root** (Next.js 16's replacement for `middleware.ts`, which is now deprecated; the current `auth/middleware.ts` never ran anyway — wrong location) checks the NextAuth JWT and redirects unauthenticated `/admin/*` requests to `/login`.
- Admin **API routes** additionally check `session.user.role === "admin"` server-side (middleware alone doesn't protect direct API calls from non-browser clients) via a shared `getAdminSession()` helper in `features/auth/service.ts`, which returns the session only when the role check passes.
- `Navbar.tsx` reads the session and conditionally renders admin links — a UX nicety, not a security boundary (the real boundary is the middleware + service-layer check above).

## 5. Data model changes

- `Review` gains `productId String` + `userId String` with `@relation` to `Product`/`User`, closing the schema gap that broke the reviews API on every call. Done (migration `20260806064905_add_review_relations`).
- Reviews and wishlist submission are tied to the authenticated session (`session.user.id`) instead of the hardcoded `"demo-user"`. Done. `Wishlist.userId` itself stays a plain string rather than gaining a formal `@relation` to `User` — the plain-string version already works correctly once it's populated from a real session id, and adding the relation is a follow-up schema change, not required to fix the actual bug.
- Cart/wishlist Zustand stores are keyed by `Product.id`, not `name`. Done.

## 6. Environment & configuration

- `.env.example` at the repo root documents every variable actually read by the code, with placeholder values and a one-line comment per var. Done — trimmed further as Razorpay/Google OAuth code was removed.
- `prisma.config.ts` fails fast with a clear error if `DATABASE_URL` is unset, rather than silently passing `undefined` through. A single typed `src/lib/env.ts` wrapper for the rest of the app's env vars (Cloudinary, NextAuth secret) would be a reasonable follow-up but wasn't introduced in this pass — those are still read inline where used.

## 7. Deployment shape

```
Dockerfile (multi-stage: deps → build → run)
  → runs `next start` on a persistent container
  → volume-mounts prisma/ (or an external SQLite file path) for durability across deploys
docker-compose.yml (optional) — app + volume, single service, no external DB dependency
```

CI (`.github/workflows/ci.yml`): install → lint → typecheck → test → build, on every PR. This is the automated form of the "run lint/typecheck/tests/build before every commit" rule, not a separate concern.

## 8. Testing strategy

- **Unit/integration**: Vitest for services and repositories (repository tests run against a throwaway SQLite file, not mocks — consistent with treating Prisma as the source of truth rather than mocking the DB).
- **API route tests**: Vitest + `next`'s route handler testing utilities, hitting real route handlers with a test DB.
- **No E2E framework** is introduced in this pass — out of scope unless a later phase specifically asks for browser-level testing.
