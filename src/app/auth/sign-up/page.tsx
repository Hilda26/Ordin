"use client";

import { useState } from "react";
import Link from "next/link";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    setError("");
    const { data, error: err } = await sb.auth.signUp({ email, password });
    if (!err && data.user) {
      await sb.from("profiles").upsert({ id: data.user.id, display_name: displayName });
    }
    setBusy(false);
    if (err) setError(err.message);
    else setDone(true);
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rule-top pt-4">
        <p className="font-mono-ev uppercase tracking-[0.2em] text-ink-faint">Account</p>
        <h1 className="font-display mt-2 text-3xl">Create an account</h1>
      </div>
      {!isSupabaseConfigured() ? (
        <p className="mt-6 border-l-2 border-verdict-wait pl-3 text-sm text-ink-soft">
          Account services are not configured yet (Supabase credentials missing). You can
          keep using Ordin in chain-only mode meanwhile.
        </p>
      ) : done ? (
        <p className="mt-6 border-l-2 border-emerald-seal pl-3 text-sm">
          Check your inbox to confirm your email, then{" "}
          <Link href="/auth/sign-in" className="underline underline-offset-4">sign in</Link>.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="font-mono-ev uppercase text-ink-faint">Display name</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full border border-rule bg-card px-3 py-2 outline-none focus:border-ink"
            />
          </label>
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
              minLength={8}
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
            {busy ? "Creating…" : "Sign up"}
          </button>
        </form>
      )}
      <p className="mt-6 text-sm text-ink-soft">
        Already registered? <Link href="/auth/sign-in" className="underline underline-offset-4">Sign in</Link>
      </p>
    </div>
  );
}
