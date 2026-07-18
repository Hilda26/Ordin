"use client";

import { useState } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    const { error: err } = await sb.auth.resetPasswordForEmail(email);
    if (err) setError(err.message);
    else setDone(true);
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rule-top pt-4">
        <p className="font-mono-ev uppercase tracking-[0.2em] text-ink-faint">Account</p>
        <h1 className="font-display mt-2 text-3xl">Reset password</h1>
      </div>
      {!isSupabaseConfigured() ? (
        <p className="mt-6 border-l-2 border-verdict-wait pl-3 text-sm text-ink-soft">
          Account services are not configured yet.
        </p>
      ) : done ? (
        <p className="mt-6 border-l-2 border-emerald-seal pl-3 text-sm">
          If that address has an account, a reset link is on its way.
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
          {error ? <p className="text-sm text-verdict-fail" role="alert">{error}</p> : null}
          <button className="w-full border-2 border-ink bg-ink px-6 py-3 text-paper hover:bg-oxblood hover:border-oxblood">
            Send reset link
          </button>
        </form>
      )}
    </div>
  );
}
