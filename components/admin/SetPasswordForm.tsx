"use client";

import { useState } from "react";
import { setPasswordSchema } from "@/lib/validation";
import { api, hardNavigate } from "./api";
import { issuesByField, PasswordFields, type PasswordValues } from "./PasswordFields";

export function SetPasswordForm() {
  const [values, setValues] = useState<PasswordValues>({ password: "", confirm: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof PasswordValues, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsed = setPasswordSchema.safeParse(values);
    if (!parsed.success) return setErrors(issuesByField(parsed.error.issues));
    setErrors({});
    setBusy(true);
    const res = await api<{ redirect: string }>("/api/admin/set-password", "POST", values);
    if (res.ok) {
      hardNavigate(res.data.redirect);
      return;
    }
    setBusy(false);
    setFormError(res.error);
  }

  async function logout() {
    await api("/api/admin/logout", "POST", {});
    hardNavigate("/admin/login");
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <PasswordFields values={values} errors={errors} onChange={setValues} />
      {formError && (
        <p role="alert" className="admin-error">
          {formError}
        </p>
      )}
      <button type="submit" className="btn btn-primary w-full" disabled={busy}>
        {busy ? "Saving…" : "Save password"}
      </button>
      <button type="button" onClick={logout} className="text-sm font-medium text-muted underline-offset-4 hover:text-text hover:underline">
        Log out
      </button>
    </form>
  );
}
