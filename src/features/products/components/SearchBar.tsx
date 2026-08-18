"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { Clock, Mic, Search } from "lucide-react";
import { useRecentSearchesStore } from "@/features/products/recentSearchesStore";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description?: string;
  brand?: string | null;
};

// Minimal typing for the Web Speech API - not part of the standard DOM
// lib, and only implemented in some browsers, so every use is guarded by
// a feature check rather than assumed to exist.
type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

// Wraps the substrings of `text` covered by Fuse.js's match `indices` in
// <mark> so a shopper can see exactly why a fuzzy/typo result matched.
function HighlightedText({ text, indices }: { text: string; indices?: readonly [number, number][] }) {
  if (!indices || indices.length === 0) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  indices.forEach(([start, end], i) => {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark
        key={i}
        className="rounded-sm bg-brand-100 text-brand-900 dark:bg-brand-900/50 dark:text-brand-200"
      >
        {text.slice(start, end + 1)}
      </mark>
    );
    cursor = end + 1;
  });

  if (cursor < text.length) parts.push(text.slice(cursor));

  return <>{parts}</>;
}

// Shared across every mounted SearchBar instance (e.g. the desktop and
// mobile copies rendered by Navbar) so only one /api/products request
// fires per page load instead of one per instance.
let cachedProducts: Promise<Product[]> | null = null;

function getProducts(): Promise<Product[]> {
  if (!cachedProducts) {
    cachedProducts = fetch("/api/products")
      .then((res) => res.json())
      .catch(() => []);
  }

  return cachedProducts;
}

export default function SearchBar() {
  const router = useRouter();
  const recentSearches = useRecentSearchesStore((state) => state.searches);
  const addSearch = useRecentSearchesStore((state) => state.addSearch);
  const clearSearches = useRecentSearchesStore((state) => state.clear);

  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  // Starts false (matching the server, which has no `window`) and is only
  // set from the real browser capability after mount - computing this
  // directly in the render body from `typeof window` would make the
  // client's first render disagree with the server-rendered HTML on any
  // browser that actually supports SpeechRecognition, a hydration mismatch.
  const [voiceSearchSupported, setVoiceSearchSupported] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    Promise.resolve().then(() => {
      setVoiceSearchSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
    });
  }, []);

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(products, {
        keys: ["name", "category", "description", "brand"],
        threshold: 0.35,
        includeMatches: true,
      }),
    [products]
  );

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];

    return fuse.search(query).slice(0, 6);
  }, [fuse, query]);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  function startVoiceSearch() {
    const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!RecognitionCtor) return;

    const recognition = new RecognitionCtor();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        setQuery(transcript);
        setOpen(true);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }

  function goToResults(term?: string) {
    const value = (term ?? query).trim();

    setOpen(false);

    if (value) {
      addSearch(value);
      setQuery(value);
      router.push(`/shop?search=${encodeURIComponent(value)}`);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") goToResults();
          }}
          placeholder="Search products..."
          aria-label="Search products"
          className={`w-full rounded-full border border-neutral-200 bg-neutral-50/80 py-2.5 pl-10 text-sm text-neutral-900 outline-none transition-colors focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50 dark:focus:border-brand-400 ${
            voiceSearchSupported ? "pr-10" : "pr-4"
          }`}
        />

        {voiceSearchSupported && (
          <button
            type="button"
            onClick={startVoiceSearch}
            aria-label={isListening ? "Listening for voice search" : "Search by voice"}
            aria-pressed={isListening}
            className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors ${
              isListening
                ? "animate-pulse text-brand-600 dark:text-brand-400"
                : "text-neutral-400 hover:text-brand-600 dark:hover:text-brand-400"
            }`}
          >
            <Mic className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && !query.trim() && recentSearches.length > 0 && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-neutral-200/70 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/95">
          <div className="flex items-center justify-between px-4 pt-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            <span>Recent Searches</span>
            <button onClick={clearSearches} className="normal-case text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
              Clear
            </button>
          </div>

          {recentSearches.map((term) => (
            <button
              key={term}
              onClick={() => goToResults(term)}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <Clock className="h-3.5 w-3.5 text-neutral-400" /> {term}
            </button>
          ))}
        </div>
      )}

      {open && query.trim() && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-neutral-200/70 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/95">
          {suggestions.length > 0 ? (
            <>
              {suggestions.map(({ item: product, matches }) => {
                const nameMatch = matches?.find((m) => m.key === "name");

                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 border-b border-neutral-100 p-3 last:border-b-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                      <SafeImage src={product.image} alt={product.name} fill sizes="40px" className="object-cover" />
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                        <HighlightedText text={product.name} indices={nameMatch?.indices} />
                      </p>
                      <p className="text-xs capitalize text-neutral-500">
                        {product.category}
                      </p>
                    </div>

                    <span className="text-sm font-bold text-brand-600">
                      ₹{product.price}
                    </span>
                  </Link>
                );
              })}

              <button
                onClick={() => goToResults()}
                className="w-full p-3 text-center text-sm font-semibold text-brand-700 hover:bg-neutral-50 dark:text-brand-400 dark:hover:bg-neutral-800"
              >
                See all results for “{query}”
              </button>
            </>
          ) : (
            <p className="p-4 text-center text-sm text-neutral-500">
              No products match “{query}”
            </p>
          )}
        </div>
      )}
    </div>
  );
}
