"use client";

import { useEffect, useRef, useState } from "react";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { LifeBuoy, Loader2, Send, Sparkles, X } from "lucide-react";
import { useAssistantStore, ChatMessage } from "@/features/assistant/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function ProductChip({ product }: { product: NonNullable<ChatMessage["products"]>[number] }) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white p-2 transition-colors hover:border-brand-300 dark:border-neutral-700 dark:bg-neutral-900"
    >
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
        <SafeImage src={product.image} alt={product.name} fill sizes="40px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-neutral-800 dark:text-neutral-100">
          {product.name}
        </p>
        <p className="text-xs font-bold text-brand-600">₹{product.price}</p>
      </div>
    </Link>
  );
}

export default function ChatWidget() {
  const { data: session } = useSession();
  const { isOpen, messages, close, toggle, addMessage, clear } = useAssistantStore();

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [escalateName, setEscalateName] = useState("");
  const [escalateEmail, setEscalateEmail] = useState("");
  const [escalating, setEscalating] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/ai/status")
      .then((res) => res.json())
      .then((data) => setAiAvailable(Boolean(data.configured)))
      .catch(() => setAiAvailable(false));
  }, []);

  useEffect(() => {
    if (session?.user) {
      Promise.resolve().then(() => {
        setEscalateName((prev) => prev || session.user!.name || "");
        setEscalateEmail((prev) => prev || session.user!.email || "");
      });
    }
  }, [session]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isOpen]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();

    const text = input.trim();
    if (!text || sending) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    addMessage(userMessage);
    setInput("");
    setSending(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      const data = await res.json();

      addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply || "Sorry, something went wrong. Please try again.",
        products: data.products,
      });
    } catch {
      addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: "I couldn't reach the assistant service. Please try again in a moment.",
      });
    } finally {
      setSending(false);
    }
  }

  async function submitEscalation(e: React.FormEvent) {
    e.preventDefault();

    setEscalating(true);

    try {
      const transcript = messages.map((m) => `${m.role}: ${m.content}`).join("\n");

      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: escalateName,
          email: escalateEmail,
          message: transcript || "No conversation yet - shopper requested help.",
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || "Could not send your request");
        return;
      }

      toast.success("A team member will get back to you by email.");
      setEscalateOpen(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setEscalating(false);
    }
  }

  return (
    <>
      <motion.button
        onClick={toggle}
        aria-label={isOpen ? "Close shopping assistant" : "Open shopping assistant"}
        aria-expanded={isOpen}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-2xl shadow-brand-600/30"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-label="NatureCart shopping assistant"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-24 left-4 right-4 z-50 flex h-[70vh] max-h-[600px] flex-col overflow-hidden rounded-3xl border border-neutral-200/70 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 sm:left-6 sm:right-auto sm:w-[380px]"
          >
            <div className="flex items-center justify-between gap-2 border-b border-neutral-100 bg-gradient-to-r from-brand-600 to-brand-700 p-4 text-white dark:border-neutral-800">
              <div>
                <p className="font-display font-bold">NatureCart Assistant</p>
                <p className="flex items-center gap-1 text-xs text-white/80">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      aiAvailable ? "bg-brand-300" : "bg-white/60"
                    )}
                  />
                  {aiAvailable === null ? "Checking..." : aiAvailable ? "Smart AI mode" : "Guided mode"}
                </p>
              </div>

              <button
                onClick={close}
                aria-label="Close"
                className="rounded-full p-1.5 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600 dark:bg-neutral-800/50 dark:text-neutral-300">
                  Hi! Ask me about shipping, payments, or try{" "}
                  <span className="font-semibold">&quot;organic snacks under 300&quot;</span>.
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
                      message.role === "user"
                        ? "bg-brand-600 text-white"
                        : "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                    )}
                  >
                    {message.content}

                    {message.products && message.products.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.products.map((product) => (
                          <ProductChip key={product.id} product={product} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-neutral-100 px-4 py-2.5 text-sm text-neutral-500 dark:bg-neutral-800">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking...
                  </div>
                </div>
              )}
            </div>

            {escalateOpen ? (
              <form onSubmit={submitEscalation} className="space-y-2 border-t border-neutral-100 p-4 dark:border-neutral-800">
                <p className="text-xs font-semibold text-neutral-500">Talk to a human</p>
                <Input
                  required
                  placeholder="Your name"
                  value={escalateName}
                  onChange={(e) => setEscalateName(e.target.value)}
                />
                <Input
                  required
                  type="email"
                  placeholder="Your email"
                  value={escalateEmail}
                  onChange={(e) => setEscalateEmail(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" className="flex-1" onClick={() => setEscalateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" className="flex-1" disabled={escalating}>
                    {escalating ? "Sending..." : "Send"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="border-t border-neutral-100 p-3 dark:border-neutral-800">
                <button
                  onClick={() => setEscalateOpen(true)}
                  className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 py-2 text-xs font-semibold text-neutral-600 hover:border-brand-300 hover:text-brand-600 dark:border-neutral-700 dark:text-neutral-300"
                >
                  <LifeBuoy className="h-3.5 w-3.5" /> Talk to a human
                </button>

                <form onSubmit={sendMessage} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything..."
                    aria-label="Message the assistant"
                    disabled={sending}
                  />
                  <Button type="submit" variant="primary" disabled={sending || !input.trim()} aria-label="Send">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>

                {messages.length > 0 && (
                  <button
                    onClick={clear}
                    className="mt-2 w-full text-center text-[11px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  >
                    Clear conversation
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
