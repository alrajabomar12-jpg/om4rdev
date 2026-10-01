"use client";

import { useState } from "react";
import { api, hardNavigate } from "./api";
import { Field } from "./Field";

export function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return setError("Enter the password.");
    setBusy(true);
    setError(null);
    const res = await api<{ redirect: string }>("/api/auth/login", "POST", { password });
    if (res.ok) {
      hardNavigate(res.data.redirect);
      return;
    }
    setBusy(false);
    setError(res.error);
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Field label="Password" error={error}>
        {(p) => (
          <input
            {...p}
            type="password"
            name="password"
            autoComplete="current-password"
            autoFocus
            required
            className="admin-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}
      </Field>
      <button type="submit" className="btn btn-primary w-full" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
