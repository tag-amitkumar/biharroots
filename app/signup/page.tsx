"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Gift, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) Promise.resolve().then(() => setReferralCode(ref.toUpperCase()));
  }, [searchParams]);

  async function signup(e: React.FormEvent) {
    e.preventDefault();

    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        "/api/auth/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
            referralCode: referralCode.trim() || undefined,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        toast.success(
          referralCode.trim()
            ? "Account created — referral bonus applied! Please log in"
            : "Account created — please log in"
        );
        router.push("/login");
      } else {
        toast.error(data.message || "Signup failed");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onSubmit={signup}
      className="w-full max-w-md rounded-[32px] border border-neutral-200/70 bg-white p-8 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-900/20">
        <UserPlus className="h-6 w-6 text-brand-600" />
      </div>

      <h1 className="mb-8 mt-4 text-center font-display text-3xl font-extrabold text-neutral-900 dark:text-white">
        Create Account
      </h1>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            className="mt-1.5"
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            className="mt-1.5"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            className="mt-1.5"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="referralCode" className="flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5 text-brand-600" /> Referral Code (optional)
          </Label>
          <Input
            id="referralCode"
            placeholder="e.g. JANE4821"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            className="mt-1.5 uppercase"
          />
        </div>
      </div>

      <Button type="submit" variant="primary" disabled={loading} className="mt-6 w-full">
        {loading ? "Creating account..." : "Create Account"}
      </Button>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">
          Log in
        </Link>
      </p>
    </motion.form>
  );
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 dark:bg-canvas-dark">
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
