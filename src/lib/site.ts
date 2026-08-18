export const SITE_NAME = "NatureCart";

export const SITE_DESCRIPTION =
  "Premium organic groceries, sourced responsibly and delivered fresh. Shop fruits, vegetables, dairy, and more.";

// A bare host ("naturecart.vercel.app") is the natural thing to paste into a
// dashboard env var, but `new URL()` in the root layout's metadataBase throws
// on it and takes the whole build down with a stack trace that names neither
// the variable nor the file. Normalizing here keeps that mistake harmless.
function withProtocol(url: string) {
  return /^https?:\/\//.test(url) ? url : `https://${url}`;
}

// Resolution order:
//  - NEXT_PUBLIC_SITE_URL: the real production domain, set explicitly.
//  - NEXTAUTH_URL: guaranteed to be configured wherever NextAuth runs.
//  - VERCEL_URL: the per-deployment hostname Vercel injects. Preview builds
//    get a fresh one each time, so it's the only value that can make preview
//    metadata/sitemap URLs point at the deployment actually being viewed.
//    Protocol-less by design, hence withProtocol above.
//  - localhost: local dev with nothing configured.
const configuredUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  process.env.VERCEL_URL ||
  "http://localhost:3000";

export const SITE_URL = withProtocol(configuredUrl).replace(/\/+$/, "");
