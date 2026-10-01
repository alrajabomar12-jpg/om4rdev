"use client";

import Image from "next/image";
import { ImageUp, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { AdminData } from "@/lib/admin/data";
import { api } from "./api";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "./Toasts";
import { ACCEPT, inspectImage, uploadImage } from "./upload";

export function BrandingTab({ logo }: { logo: AdminData["logo"] }) {
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function onFile(file: File | undefined) {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    setProgress(0);
    try {
      const info = await inspectImage(file, "logo");
      const url = await uploadImage(file, "logo", info, setProgress);
      const res = await api("/api/admin/logo", "PUT", { url });
      if (!res.ok) throw new Error(res.error);
      toast("success", "New logo saved. It's live on the public page.");
      router.refresh();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setProgress(null);
    }
  }

  async function reset() {
    setResetting(true);
    const res = await api("/api/admin/logo", "DELETE");
    setResetting(false);
    setConfirming(false);
    if (!res.ok) return toast("error", res.error);
    toast("success", "Logo reset to the default.");
    router.refresh();
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="admin-card p-5 sm:p-6">
        <h2 className="text-lg font-bold">Logo</h2>
        <p className="admin-hint mt-1">
          {logo.isCustom ? "Using an uploaded logo." : "Using the default logo."} Shown in the hero, navbar and footer. PNG, JPEG or WebP up to
          2 MB; a transparent PNG works best.
        </p>
        <div className="mt-5 flex min-h-48 items-center justify-center rounded-xl border border-border bg-bg bg-[radial-gradient(ellipse_at_center,rgb(30_140_255/0.12),transparent_70%)] p-8">
          <Image src={logo.url} alt="Current logo preview" width={2172} height={724} sizes="420px" className="h-auto max-h-40 w-auto max-w-full" />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <input ref={fileRef} type="file" accept={ACCEPT} className="sr-only" id="logo-file" onChange={(e) => onFile(e.target.files?.[0])} />
          <button type="button" className="btn btn-primary" disabled={progress !== null} onClick={() => fileRef.current?.click()}>
            <ImageUp size={16} aria-hidden="true" />
            {progress !== null ? `Uploading… ${Math.round(progress)}%` : "Upload new logo"}
          </button>
          {logo.isCustom && (
            <button type="button" className="btn btn-outline" disabled={progress !== null} onClick={() => setConfirming(true)}>
              <RotateCcw size={16} aria-hidden="true" /> Reset to default
            </button>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={confirming}
        title="Reset to the default logo?"
        confirmLabel="Reset logo"
        busy={resetting}
        onCancel={() => setConfirming(false)}
        onConfirm={reset}
      >
        The uploaded logo is deleted from storage and the original om4r.dev logo is used again.
      </ConfirmDialog>
    </div>
  );
}
