"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    setError("");
    const { error: err } = await sb.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) setError(err.message);
    else router.push("/contributor");
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rule-top pt-4">
        <p className="font-mono-ev uppercase tracking-[0.2em] text-ink-faint">Account</p>
        <h1 className="font-display mt-2 text-3xl">Sign in</h1>
      </div>
      {!isSupabaseConfigured() ? (
        <p className="mt-6 border-l-2 border-verdict-wait pl-3 text-sm text-ink-soft">
          Account services are not configured yet (Supabase credentials missing). The
          application still works fully in chain-only mode with your StudioNet session key —
          accounts add profiles, drafts and notifications.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="font-mono-ev uppercase text-ink-faint">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-rule bg-card px-3 py-2 outline-none focus:border-ink"
            />
          </label>
          <label className="block">
            <span className="font-mono-ev uppercase text-ink-faint">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-rule bg-card px-3 py-2 outline-none focus:border-ink"
            />
          </label>
          {error ? <p className="text-sm text-verdict-fail" role="alert">{error}</p> : null}
          <button
            disabled={busy}
            className="w-full border-2 border-ink bg-ink px-6 py-3 text-paper hover:bg-oxblood hover:border-oxblood disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      )}
      <p className="mt-6 text-sm text-ink-soft">
        No account? <Link href="/auth/sign-up" className="underline underline-offset-4">Sign up</Link> ·{" "}
        <Link href="/auth/reset" className="underline underline-offset-4">Forgot password</Link>
      </p>
    </div>
  );
}
