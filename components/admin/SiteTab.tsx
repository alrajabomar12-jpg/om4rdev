"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminData } from "@/lib/admin/data";
import { settingsSchema } from "@/lib/validation";
import { api } from "./api";
import { Field } from "./Field";
import { useToast } from "./Toasts";

type Form = {
  heroTitle: string;
  tagline: string;
  aboutText: string;
  robloxProfileUrl: string;
  discordUsername: string;
  highestPeakCcu: string;
};
type Errors = Partial<Record<keyof Form, string>>;

const toForm = (s: AdminData["settings"]): Form => ({
  ...s,
  highestPeakCcu: s.highestPeakCcu === null ? "" : String(s.highestPeakCcu),
});

export function SiteTab({ settings }: { settings: AdminData["settings"] }) {
  const router = useRouter();
  const toast = useToast();
  const [saved, setSaved] = useState(() => toForm(settings));
  const [form, setForm] = useState(saved);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const dirty = (Object.keys(form) as (keyof Form)[]).some((k) => form[k] !== saved[k]);

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = settingsSchema.safeParse(form);
    if (!parsed.success) {
      const next: Errors = {};
      for (const i of parsed.error.issues) next[i.path[0] as keyof Form] ??= i.message;
      setErrors(next);
      toast("error", "Fix the highlighted fields.");
      return;
    }
    setBusy(true);
    const res = await api("/api/admin/settings", "PUT", form);
    setBusy(false);
    if (!res.ok) return toast("error", res.error);
    setSaved(form);
    toast("success", "Site settings saved. The public page is updated.");
    router.refresh();
  }

  return (
    <form onSubmit={save} noValidate className="flex max-w-2xl flex-col gap-6">
      <div className="admin-card flex flex-col gap-5 p-5 sm:p-6">
        <h2 className="text-lg font-bold">Hero</h2>
        <Field label="Hero title" hint="The last word gets the blue gradient." error={errors.heroTitle} counter={{ value: form.heroTitle.length, max: 80 }}>
          {(p) => <input {...p} className="admin-input" value={form.heroTitle} onChange={set("heroTitle")} maxLength={120} />}
        </Field>
        <Field label="Tagline" hint="Also used as the page description." error={errors.tagline} counter={{ value: form.tagline.length, max: 200 }}>
          {(p) => <textarea {...p} rows={2} className="admin-input resize-y" value={form.tagline} onChange={set("tagline")} />}
        </Field>
      </div>

      <div className="admin-card flex flex-col gap-5 p-5 sm:p-6">
        <h2 className="text-lg font-bold">About</h2>
        <Field
          label="About text"
          hint="Plain text. Leave a blank line between paragraphs."
          error={errors.aboutText}
          counter={{ value: form.aboutText.length, max: 2000 }}
        >
          {(p) => <textarea {...p} rows={8} className="admin-input resize-y" value={form.aboutText} onChange={set("aboutText")} />}
        </Field>
      </div>

      <div className="admin-card flex flex-col gap-5 p-5 sm:p-6">
        <h2 className="text-lg font-bold">Profile &amp; stats</h2>
        <Field label="Roblox profile URL" hint="Like https://www.roblox.com/users/3049207260/profile" error={errors.robloxProfileUrl}>
          {(p) => <input {...p} type="url" inputMode="url" className="admin-input" value={form.robloxProfileUrl} onChange={set("robloxProfileUrl")} />}
        </Field>
        <Field label="Discord username" hint="Lowercase letters, numbers, _ and . (2–32)." error={errors.discordUsername}>
          {(p) => (
            <input
              {...p}
              className="admin-input font-mono"
              autoCapitalize="none"
              spellCheck={false}
              value={form.discordUsername}
              onChange={set("discordUsername")}
            />
          )}
        </Field>
        <Field label="Highest peak CCU" hint="Shown as e.g. “40K”. Clear it to remove the stat." error={errors.highestPeakCcu}>
          {(p) => (
            <input
              {...p}
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              className="admin-input tabular max-w-[14rem]"
              value={form.highestPeakCcu}
              onChange={set("highestPeakCcu")}
            />
          )}
        </Field>
      </div>

      <div className="flex items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={busy || !dirty}>
          {busy ? "Saving…" : "Save"}
        </button>
        {dirty && !busy && (
          <button type="button" className="text-sm font-medium text-muted hover:text-text" onClick={() => (setForm(saved), setErrors({}))}>
            Discard changes
          </button>
        )}
      </div>
    </form>
  );
}
