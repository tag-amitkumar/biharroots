import type { NextConfig } from "next";

// Vercel hands Sensitive environment variables to the build as empty strings
// rather than omitting them. That breaks any consumer using `??`/`?.` to pick
// a fallback, because an empty string is neither null nor undefined - notably
// next-auth, which resolves its base URL as `process.env.NEXTAUTH_URL ?? ...`
// and so ends up calling `new URL("")`. Every prerendered page then fails with
// a bare `TypeError: Invalid URL` naming neither the variable nor the file.
//
// Treating empty as unset restores the intended fallback chains. This runs
// before Next forks its build/prerender workers, so they inherit the cleaned
// environment.
for (const key of ["NEXTAUTH_URL", "NEXT_PUBLIC_SITE_URL", "VERCEL_URL"]) {
  if (process.env[key] === "") delete process.env[key];
}

// Product images can come from anywhere - Cloudinary uploads, Unsplash seed
// content, or a free-text URL an admin pastes into the product form - so a
// fixed per-host allowlist would break real product images. A wildcard
// remotePattern keeps next/image's optimization/lazy-loading benefits
// without restricting which host a product image can live on.
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
