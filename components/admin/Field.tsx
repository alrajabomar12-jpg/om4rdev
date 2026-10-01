"use client";

import { useId } from "react";

interface FieldProps {
  label: string;
  hint?: React.ReactNode;
  error?: string | null;
  counter?: { value: number; max: number };
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => React.ReactNode;
}

/** Label + control + hint/counter + inline error, wired up with ids for screen readers. */
export function Field({ label, hint, error, counter, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint || counter ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="admin-label">
        {label}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {(hint || counter) && (
        <div id={hintId} className="admin-hint flex justify-between gap-4">
          <span>{hint}</span>
          {counter && (
            <span className={`tabular shrink-0 ${counter.value > counter.max ? "text-[#ff8a80]" : ""}`}>
              {counter.value} / {counter.max}
            </span>
          )}
        </div>
      )}
      {error && (
        <p id={errorId} className="admin-error">
          {error}
        </p>
      )}
    </div>
  );
}
