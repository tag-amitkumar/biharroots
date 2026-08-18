"use client";

import { forwardRef, useEffect, useState } from "react";
import Image, { type ImageProps } from "next/image";

const FALLBACK_SRC = {
  product: "/images/product-fallback.svg",
  category: "/images/category-fallback.svg",
} as const;

type SafeImageKind = keyof typeof FALLBACK_SRC;

type SafeImageProps = Omit<ImageProps, "src" | "onError"> & {
  src: string | null | undefined;
  kind?: SafeImageKind;
  alt: string;
};

// Wraps next/image with a fallback for missing/broken images - a pattern
// that didn't previously exist anywhere in this codebase. An empty/
// whitespace `src` is treated the same as a failed load. `failed` resets
// whenever `src` changes so a new image (e.g. switching gallery thumbnails)
// gets its own fresh load attempt rather than staying stuck on a stale
// failure. The two local fallback assets are rendered `unoptimized` -
// trivial static files that don't need to go through the image optimizer
// (and avoids touching the global `dangerouslyAllowSVG` config flag, which
// would also apply to the already-wildcard-open remote image patterns).
// forwardRef so `motion(SafeImage)` (ProductDetailView's zoomable hero
// image) can attach its ref the same way it could to a plain next/image.
const SafeImage = forwardRef<HTMLImageElement, SafeImageProps>(function SafeImage(
  { src, kind = "product", alt, ...props },
  ref
) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => setFailed(false));
  }, [src]);

  const isMissing = !src?.trim();
  const useFallback = failed || isMissing;
  const resolvedSrc = useFallback ? FALLBACK_SRC[kind] : (src as string);

  return (
    <Image
      {...props}
      ref={ref}
      src={resolvedSrc}
      alt={alt}
      unoptimized={useFallback}
      onError={() => setFailed(true)}
    />
  );
});

export default SafeImage;
