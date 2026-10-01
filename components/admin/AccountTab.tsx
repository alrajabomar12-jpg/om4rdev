"use client";

import { LogOut, MonitorX } from "lucide-react";
import { useState } from "react";
import { changePasswordSchema } from "@/lib/validation";
import { api, hardNavigate } from "./api";
import { ConfirmDialog } from "./ConfirmDialog";
import { issuesByField, PasswordFields, type PasswordValues } from "./PasswordFields";
import { useToast } from "./Toasts";

const EMPTY: PasswordValues = { current: "", password: "", confirm: "" };

export function AccountTab({ onLogout }: { onLogout: () => void }) {
  const toast = useToast();
  const [values, setValues] = useState<PasswordValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof PasswordValues, string>>>({});
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    const parsed = changePasswordSchema.safeParse(values);
    if (!parsed.success) return setErrors(issuesByField(parsed.error.issues));
    setErrors({});
    setBusy(true);
    const res = await api("/api/admin/password", "POST", values);
    setBusy(false);
    if (!res.ok) return toast("error", res.error);
    setValues(EMPTY);
    toast("success", "Password changed. Every other session was signed out.");
  }

  async function logoutEverywhere() {
    await api("/api/admin/logout", "POST", { everywhere: true });
    hardNavigate("/admin/login");
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <form onSubmit={changePassword} noValidate className="admin-card flex flex-col gap-5 p-5 sm:p-6">
        <h2 className="text-lg font-bold">Change password</h2>
        <PasswordFields values={values} errors={errors} onChange={setValues} withCurrent />
        <div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Change password"}
          </button>
        </div>
      </form>

      <div className="admin-card flex flex-col gap-4 p-5 sm:p-6">
        <h2 className="text-lg font-bold">Sessions</h2>
        <p className="admin-hint">“Log out” ends this session. “Log out everywhere” ends every session, including this one.</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn btn-outline" onClick={onLogout}>
            <LogOut size={16} aria-hidden="true" /> Log out
          </button>
          <button type="button" className="btn btn-danger" onClick={() => setConfirming(true)}>
            <MonitorX size={16} aria-hidden="true" /> Log out everywhere
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={confirming}
        title="Log out everywhere?"
        confirmLabel="Log out everywhere"
        onCancel={() => setConfirming(false)}
        onConfirm={logoutEverywhere}
      >
        Every signed-in browser, including this one, will need the password again.
      </ConfirmDialog>
    </div>
  );
}
