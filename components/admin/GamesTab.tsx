"use client";

import Image from "next/image";
import { ArrowDown, ArrowUp, ExternalLink, Eye, ImageUp, Pencil, Plus, Trash2, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { AdminGame } from "@/lib/admin/data";
import { formatCompact } from "@/lib/format";
import type { GamePreview } from "@/lib/admin/games";
import { firstIssue, gameUpdateSchema, placeUrlSchema, roleSchema } from "@/lib/validation";
import { api } from "./api";
import { ConfirmDialog } from "./ConfirmDialog";
import { Field } from "./Field";
import { useToast } from "./Toasts";
import { ACCEPT, inspectImage, uploadImage } from "./upload";

export function GamesTab({ games, liveAvailable }: { games: AdminGame[]; liveAvailable: boolean }) {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <AddGame />
      <div>
        <h2 className="text-lg font-bold">Games, in display order</h2>
        {!liveAvailable && (
          <p className="admin-hint mt-1">Live Roblox data is unavailable right now, so names and numbers may be missing.</p>
        )}
        {games.length === 0 ? (
          <p className="mt-4 text-muted">No games yet. The public page shows “Projects coming soon.”</p>
        ) : (
          <ol className="mt-4 flex flex-col gap-4">
            {games.map((g, i) => (
              <GameRow key={g.id} game={g} isFirst={i === 0} isLast={i === games.length - 1} />
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

// ---------- Add ----------

function AddGame() {
  const router = useRouter();
  const toast = useToast();
  const [url, setUrl] = useState("");
  const [role, setRole] = useState("");
  const [preview, setPreview] = useState<GamePreview | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"preview" | "save" | null>(null);

  async function loadPreview(e: React.FormEvent) {
    e.preventDefault();
    setPreview(null);
    const err = firstIssue(placeUrlSchema.safeParse(url));
    if (err) return setUrlError(err);
    setUrlError(null);
    setBusy("preview");
    const res = await api<{ preview: GamePreview }>("/api/admin/games/preview", "POST", { url });
    setBusy(null);
    if (!res.ok) return setUrlError(res.error);
    setPreview(res.data.preview);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const err = firstIssue(roleSchema.safeParse(role));
    if (err) return setRoleError(err);
    setRoleError(null);
    setBusy("save");
    const res = await api("/api/admin/games", "POST", { url, role });
    setBusy(null);
    if (!res.ok) return toast("error", res.error);
    toast("success", `Added ${preview?.name ?? "the game"}.`);
    setUrl("");
    setRole("");
    setPreview(null);
    router.refresh();
  }

  return (
    <div className="admin-card p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Plus size={18} aria-hidden="true" className="text-accent-bright" /> Add a game
      </h2>
      <form onSubmit={loadPreview} noValidate className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <Field label="Roblox game URL" error={urlError}>
            {(p) => (
              <input
                {...p}
                type="url"
                inputMode="url"
                placeholder="https://www.roblox.com/games/123456789/Name"
                className="admin-input"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setPreview(null);
                  setUrlError(null);
                }}
              />
            )}
          </Field>
        </div>
        <button type="submit" className="btn btn-outline sm:mt-[1.6rem]" disabled={busy !== null}>
          {busy === "preview" ? "Looking up…" : "Preview"}
        </button>
      </form>

      {preview && (
        <form onSubmit={save} noValidate className="mt-5 flex flex-col gap-4 border-t border-border pt-5">
          <div className="flex gap-4">
            <Thumb src={preview.thumbnailUrl} name={preview.name} />
            <div className="min-w-0">
              <p className="font-semibold">{preview.name}</p>
              <p className="admin-hint">
                by {preview.creator.name}
                {preview.creator.verified ? " (verified)" : ""}
              </p>
              <LiveStats playing={preview.playing} visits={preview.visits} />
            </div>
          </div>
          <Field label="My role" hint="Required. Shown verbatim on the card." error={roleError} counter={{ value: role.length, max: 300 }}>
            {(p) => (
              <textarea {...p} rows={2} className="admin-input resize-y" value={role} onChange={(e) => setRole(e.target.value)} autoFocus />
            )}
          </Field>
          <div className="flex gap-3">
            <button type="submit" className="btn btn-primary" disabled={busy !== null}>
              {busy === "save" ? "Adding…" : "Add game"}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setPreview(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ---------- Row ----------

function Thumb({ src, name }: { src: string | null; name: string }) {
  return (
    <div className="relative aspect-video w-28 shrink-0 self-start overflow-hidden rounded-lg bg-surface-2 sm:w-36">
      {src ? (
        <Image src={src} alt="" fill sizes="144px" className="object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#0a1a4f,#111833_55%,#0a4dff)] p-2 text-center text-xs font-bold">
          {name}
        </div>
      )}
    </div>
  );
}

function LiveStats({ playing, visits, peak }: { playing: number | null; visits: number | null; peak?: number | null }) {
  return (
    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
      {playing != null && (
        <span className="flex items-center gap-1.5">
          <span className="live-dot" aria-hidden="true" />
          <span className="tabular">{formatCompact(playing)}</span> playing
        </span>
      )}
      {visits != null && (
        <span className="flex items-center gap-1.5">
          <Eye size={14} aria-hidden="true" />
          <span className="tabular">{formatCompact(visits)}</span> visits
        </span>
      )}
      {peak != null && (
        <span className="flex items-center gap-1.5">
          <Trophy size={14} aria-hidden="true" />
          <span className="tabular">{formatCompact(peak)}</span> peak
        </span>
      )}
    </p>
  );
}

function GameRow({ game, isFirst, isLast }: { game: AdminGame; isFirst: boolean; isLast: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function run(label: string, fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    setBusy(label);
    const res = await fn();
    setBusy(null);
    if (!res.ok) {
      toast("error", res.error ?? "Something went wrong.");
      return false;
    }
    toast("success", success);
    router.refresh();
    return true;
  }

  const move = (direction: "up" | "down") =>
    run(direction, () => api(`/api/admin/games/${game.id}/move`, "POST", { direction }), `Moved ${game.name} ${direction}.`);

  return (
    <li className="admin-card p-4 sm:p-5">
      <div className="flex gap-4">
        <Thumb src={game.customThumbnailUrl ?? game.robloxThumbnailUrl} name={game.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{game.name}</h3>
            {game.hidden && <span className="admin-badge">Hidden</span>}
            {!game.includeInTotals && <span className="admin-badge">Excluded from totals</span>}
            {game.customThumbnailUrl && <span className="admin-badge">Custom thumbnail</span>}
          </div>
          <LiveStats playing={game.playing} visits={game.visits} peak={game.peakCcu} />
          <p className="mt-1 line-clamp-2 text-sm text-text/80">{game.role}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-outline btn-sm" aria-expanded={editing} onClick={() => setEditing((v) => !v)}>
          <Pencil size={14} aria-hidden="true" /> {editing ? "Close" : "Edit"}
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label={`Move ${game.name} up`}
          disabled={isFirst || busy !== null}
          onClick={() => move("up")}
        >
          <ArrowUp size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label={`Move ${game.name} down`}
          disabled={isLast || busy !== null}
          onClick={() => move("down")}
        >
          <ArrowDown size={16} aria-hidden="true" />
        </button>
        <a href={game.href} target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label={`Open ${game.name} on Roblox`}>
          <ExternalLink size={16} aria-hidden="true" />
        </a>
        <button type="button" className="btn btn-danger btn-sm ml-auto" onClick={() => setConfirming(true)}>
          <Trash2 size={14} aria-hidden="true" /> Delete
        </button>
      </div>

      {/* The row keeps its open/closed state across refreshes; the editor is keyed on the saved
          values so its fields reset to what was actually stored after each save. */}
      {editing && <GameEditor key={JSON.stringify(game)} game={game} run={run} busy={busy} />}

      <ConfirmDialog
        open={confirming}
        title={`Delete “${game.name}”?`}
        confirmLabel="Delete game"
        busy={busy === "delete"}
        onCancel={() => setConfirming(false)}
        onConfirm={async () => {
          const ok = await run("delete", () => api(`/api/admin/games/${game.id}`, "DELETE"), `Deleted ${game.name}.`);
          if (ok) setConfirming(false);
        }}
      >
        It disappears from the public page{game.customThumbnailUrl ? " and its custom thumbnail is deleted" : ""}. You can add it again
        later by URL.
      </ConfirmDialog>
    </li>
  );
}

type Run = (label: string, fn: () => Promise<{ ok: boolean; error?: string }>, success: string) => Promise<boolean>;

function GameEditor({ game, run, busy }: { game: AdminGame; run: Run; busy: string | null }) {
  const toast = useToast();
  const [form, setForm] = useState({
    role: game.role,
    displayNameOverride: game.displayNameOverride ?? "",
    peakCcu: game.peakCcu === null ? "" : String(game.peakCcu),
    includeInTotals: game.includeInTotals,
    hidden: game.hidden,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = gameUpdateSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const i of parsed.error.issues) next[String(i.path[0])] ??= i.message;
      return setErrors(next);
    }
    setErrors({});
    await run("save", () => api(`/api/admin/games/${game.id}`, "PATCH", form), `Saved ${game.name}.`);
  }

  async function onFile(file: File | undefined) {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    setProgress(0);
    try {
      const info = await inspectImage(file, "thumbnail");
      if (info.width < 1280 || info.height < 720 || Math.abs(info.width / info.height - 16 / 9) > 0.02) {
        toast("success", `Note: ${info.width}×${info.height} isn't 16:9 at 1280×720 or more, so it may be cropped or soft.`);
      }
      const url = await uploadImage(file, "thumbnail", info, setProgress);
      await run("thumb", () => api(`/api/admin/games/${game.id}/thumbnail`, "PUT", { url }), "Custom thumbnail saved.");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setProgress(null);
    }
  }

  const bind = (key: "role" | "displayNameOverride" | "peakCcu") => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="mt-5 flex flex-col gap-6 border-t border-border pt-5">
      <form onSubmit={save} noValidate className="flex flex-col gap-4">
        <Field label="My role" hint="Required." error={errors.role} counter={{ value: form.role.length, max: 300 }}>
          {(p) => <textarea {...p} rows={2} className="admin-input resize-y" {...bind("role")} />}
        </Field>
        <Field
          label="Display name override"
          hint={game.robloxName ? `Leave empty to use the Roblox name: “${game.robloxName}”.` : "Leave empty to use the Roblox name."}
          error={errors.displayNameOverride}
        >
          {(p) => <input {...p} className="admin-input" placeholder={game.robloxName ?? ""} {...bind("displayNameOverride")} />}
        </Field>
        <Field label="Peak CCU" hint="Leave empty to hide the peak on this card." error={errors.peakCcu}>
          {(p) => <input {...p} type="number" min={0} step={1} inputMode="numeric" className="admin-input tabular max-w-[14rem]" {...bind("peakCcu")} />}
        </Field>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            role="switch"
            className="admin-switch"
            checked={form.includeInTotals}
            onChange={(e) => setForm((f) => ({ ...f, includeInTotals: e.target.checked }))}
          />
          Include in the total visits / playing stats
        </label>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            role="switch"
            className="admin-switch"
            checked={form.hidden}
            onChange={(e) => setForm((f) => ({ ...f, hidden: e.target.checked }))}
          />
          Hide from the public page
        </label>
        <div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy !== null}>
            {busy === "save" ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-3">
        <h4 className="admin-label">Custom thumbnail</h4>
        <p className="admin-hint">
          Replaces Roblox&apos;s thumbnail. 16:9, at least 1280×720. PNG, JPEG or WebP up to 8 MB.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" accept={ACCEPT} className="sr-only" id={`thumb-${game.id}`} onChange={(e) => onFile(e.target.files?.[0])} />
          <button type="button" className="btn btn-outline btn-sm" disabled={progress !== null || busy !== null} onClick={() => fileRef.current?.click()}>
            <ImageUp size={14} aria-hidden="true" />
            {progress !== null ? `Uploading… ${Math.round(progress)}%` : game.customThumbnailUrl ? "Replace thumbnail" : "Upload thumbnail"}
          </button>
          {game.customThumbnailUrl && (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              disabled={busy !== null}
              onClick={() => run("thumb", () => api(`/api/admin/games/${game.id}/thumbnail`, "DELETE"), "Custom thumbnail removed. Using Roblox's again.")}
            >
              Remove custom thumbnail
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
