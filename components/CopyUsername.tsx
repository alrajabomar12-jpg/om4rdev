"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function CopyUsername({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(username);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok && textRef.current) {
      // Fallback: select the text so the user can copy it themselves.
      const range = document.createRange();
      range.selectNodeContents(textRef.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <span ref={textRef} className="font-mono text-2xl font-semibold tracking-tight text-text sm:text-3xl">
        {username}
      </span>
      <div className="mt-6 flex w-full flex-col gap-3 min-[400px]:w-auto min-[400px]:flex-row">
        <button type="button" onClick={copy} className="btn btn-primary min-w-[11rem]">
          {copied ? (
            <>
              <Check size={16} aria-hidden="true" /> Copied!
            </>
          ) : (
            <>
              <Copy size={16} aria-hidden="true" /> Copy username
            </>
          )}
        </button>
        <a href="https://discord.com/app" target="_blank" rel="noopener noreferrer" className="btn btn-outline">
          Open Discord <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? `Copied ${username} to the clipboard` : ""}
      </p>
    </>
  );
}
