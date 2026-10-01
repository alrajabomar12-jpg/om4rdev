"use client";

import Image from "next/image";
import { ArrowDown, ArrowUp, ImagePlus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { AdminShowcaseItem } from "@/lib/admin/data";
import type { ImageInfo } from "@/lib/uploads";
import { showcaseUpdateSchema } from "@/lib/validation";
import { api } from "./api";
import { ConfirmDialog } from "./ConfirmDialog";
import { Field } from "./Field";
import { useToast } from "./Toasts";
import { ACCEPT, inspectImage, uploadImage } from "./upload";

interface Pending {
  key: string;
  file: File;
  preview: string;
  info: ImageInfo;
  caption: string;
  alt: string;
  progress: number | null;
  error: string | null;
}

export function ShowcaseTab({ items }: { items: AdminShowcaseItem[] }) {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <Uploader />
      <div>
        <h2 className="text-lg font-bold">Images, in display order</h2>
        {items.length === 0 ? (
          <p className="mt-2 text-muted">No images yet. The Showcase section and its nav link stay hidden until you add one.</p>
        ) : (
          <ol className="mt-4 flex flex-col gap-4">
            {items.map((item, i) => (
              <ShowcaseRow
                key={`${item.id}:${item.caption}:${item.alt}`}
                item={item}
                index={i}
                isFirst={i === 0}
                isLast={i === items.length - 1}
              />
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function Uploader() {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState<Pending[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const urls = useRef(new Set<string>());

  useEffect(() => {
    const set = urls.current;
    return () => set.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const update = (key: string, patch: Partial<Pending>) =>
    setPending((all) => all.map((p) => (p.key === key ? { ...p, ...patch } : p)));

  const remove = (key: string) =>
    setPending((all) => {
      const gone = all.find((p) => p.key === key);
      if (gone) {
        URL.revokeObjectURL(gone.preview);
        urls.current.delete(gone.preview);
      }
      return all.filter((p) => p.key !== key);
    });

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const added: Pending[] = [];
    for (const file of Array.from(files)) {
      try {
        const info = await inspectImage(file, "showcase");
        const preview = URL.createObjectURL(file);
        urls.current.add(preview);
        added.push({ key: `${file.name}-${file.size}-${Math.random()}`, file, preview, info, caption: "", alt: "", progress: null, error: null });
      } catch (err) {
        toast("error", err instanceof Error ? err.message : `${file.name} can't be used.`);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
    setPending((all) => [...all, ...added]);
  }

  async function uploadAll() {
    setBusy(true);
    let done = 0;
    for (const p of pending) {
      const fields = showcaseUpdateSchema.safeParse({ caption: p.caption, alt: p.alt });
      if (!fields.success) {
        update(p.key, { error: fields.error.issues[0]?.message ?? "Invalid caption." });
        continue;
      }
      try {
        update(p.key, { progress: 0, error: null });
        const url = await uploadImage(p.file, "showcase", p.info, (pct) => update(p.key, { progress: pct }));
        const res = await api("/api/admin/showcase", "POST", {
          url,
          caption: p.caption,
          alt: p.alt,
          width: p.info.width,
          height: p.info.height,
        });
        if (!res.ok) throw new Error(res.error);
        done++;
        remove(p.key);
      } catch (err) {
        update(p.key, { progress: null, error: err instanceof Error ? err.message : "Upload failed." });
      }
    }
    setBusy(false);
    if (done) {
      toast("success", `Added ${done} image${done === 1 ? "" : "s"} to the showcase.`);
      router.refresh();
    }
  }

  return (
    <div className="admin-card p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <ImagePlus size={18} aria-hidden="true" className="text-accent-bright" /> Add images
      </h2>
      <p className="admin-hint mt-1">PNG, JPEG or WebP up to 8 MB each. Add a caption to each; alt text defaults to the caption.</p>
      <input ref={fileRef} type="file" accept={ACCEPT} multiple className="sr-only" id="showcase-files" onChange={(e) => addFiles(e.target.files)} />
      <button type="button" className="btn btn-outline mt-4" disabled={busy} onClick={() => fileRef.current?.click()}>
        Choose images…
      </button>

      {pending.length > 0 && (
        <>
          <ul className="mt-5 flex flex-col gap-4">
            {pending.map((p) => (
              <li key={p.key} className="flex flex-col gap-4 rounded-xl border border-border p-4 sm:flex-row">
                {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
                <img src={p.preview} alt="" className="h-28 w-full rounded-lg bg-surface-2 object-contain sm:w-40" />
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <p className="admin-hint truncate">
                    {p.file.name} · {p.info.width}×{p.info.height}
                  </p>
                  <Field label="Caption" counter={{ value: p.caption.length, max: 200 }}>
                    {(f) => <input {...f} className="admin-input" value={p.caption} onChange={(e) => update(p.key, { caption: e.target.value })} />}
                  </Field>
                  <Field label="Alt text (optional)">
                    {(f) => (
                      <input
                        {...f}
                        className="admin-input"
                        placeholder={p.caption || "3D model by om4r"}
                        value={p.alt}
                        onChange={(e) => update(p.key, { alt: e.target.value })}
                      />
                    )}
                  </Field>
                  {p.progress !== null && <p className="admin-hint tabular">Uploading… {Math.round(p.progress)}%</p>}
                  {p.error && <p className="admin-error" role="alert">{p.error}</p>}
                </div>
                <button type="button" className="icon-btn self-start" aria-label={`Remove ${p.file.name}`} disabled={busy} onClick={() => remove(p.key)}>
                  <X size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-primary mt-5" disabled={busy} onClick={uploadAll}>
            {busy ? "Uploading…" : `Upload ${pending.length} image${pending.length === 1 ? "" : "s"}`}
          </button>
        </>
      )}
    </div>
  );
}

function ShowcaseRow({ item, index, isFirst, isLast }: { item: AdminShowcaseItem; index: number; isFirst: boolean; isLast: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [caption, setCaption] = useState(item.caption);
  const [alt, setAlt] = useState(item.alt);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const label = item.caption || `Image ${index + 1}`;
  const dirty = caption !== item.caption || alt !== item.alt;

  async function run(key: string, fn: () => ReturnType<typeof api>, success: string) {
    setBusy(key);
    const res = await fn();
    setBusy(null);
    if (!res.ok) {
      toast("error", res.error);
      return false;
    }
    toast("success", success);
    router.refresh();
    return true;
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = showcaseUpdateSchema.safeParse({ caption, alt });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Invalid input.");
    setError(null);
    run("save", () => api(`/api/admin/showcase/${item.id}`, "PATCH", { caption, alt }), "Caption saved.");
  }

  return (
    <li className="admin-card flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
      <div className="relative w-full shrink-0 overflow-hidden rounded-lg bg-surface-2 sm:w-40" style={{ aspectRatio: `${item.width} / ${item.height}` }}>
        <Image src={item.src} alt="" fill sizes="(min-width: 640px) 160px, 100vw" className="object-cover" />
      </div>
      <form onSubmit={save} noValidate className="flex min-w-0 flex-1 flex-col gap-3">
        <Field label="Caption" error={error} counter={{ value: caption.length, max: 200 }}>
          {(f) => <input {...f} className="admin-input" value={caption} onChange={(e) => setCaption(e.target.value)} />}
        </Field>
        <Field label="Alt text (optional)" hint="Empty uses the caption.">
          {(f) => <input {...f} className="admin-input" placeholder={caption || "3D model by om4r"} value={alt} onChange={(e) => setAlt(e.target.value)} />}
        </Field>
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" className="btn btn-primary btn-sm" disabled={!dirty || busy !== null}>
            {busy === "save" ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label={`Move ${label} up`}
            disabled={isFirst || busy !== null}
            onClick={() => run("move", () => api(`/api/admin/showcase/${item.id}/move`, "POST", { direction: "up" }), "Moved up.")}
          >
            <ArrowUp size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label={`Move ${label} down`}
            disabled={isLast || busy !== null}
            onClick={() => run("move", () => api(`/api/admin/showcase/${item.id}/move`, "POST", { direction: "down" }), "Moved down.")}
          >
            <ArrowDown size={16} aria-hidden="true" />
          </button>
          <button type="button" className="btn btn-danger btn-sm ml-auto" onClick={() => setConfirming(true)}>
            <Trash2 size={14} aria-hidden="true" /> Delete
          </button>
        </div>
      </form>
      <ConfirmDialog
        open={confirming}
        title={`Delete “${label}”?`}
        confirmLabel="Delete image"
        busy={busy === "delete"}
        onCancel={() => setConfirming(false)}
        onConfirm={async () => {
          if (await run("delete", () => api(`/api/admin/showcase/${item.id}`, "DELETE"), "Image deleted.")) setConfirming(false);
        }}
      >
        The image is removed from the showcase and deleted from storage.
      </ConfirmDialog>
    </li>
  );
}
