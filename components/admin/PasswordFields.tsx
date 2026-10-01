"use client";

import { Field } from "./Field";

export interface PasswordValues {
  current?: string;
  password: string;
  confirm: string;
}

/** New + confirm (and optionally current) password inputs with per-field errors. */
export function PasswordFields({
  values,
  errors,
  onChange,
  withCurrent = false,
}: {
  values: PasswordValues;
  errors: Partial<Record<keyof PasswordValues, string>>;
  onChange: (v: PasswordValues) => void;
  withCurrent?: boolean;
}) {
  return (
    <>
      {withCurrent && (
        <Field label="Current password" error={errors.current}>
          {(p) => (
            <input
              {...p}
              type="password"
              autoComplete="current-password"
              className="admin-input"
              value={values.current ?? ""}
              onChange={(e) => onChange({ ...values, current: e.target.value })}
            />
          )}
        </Field>
      )}
      <Field label="New password" hint="10–128 characters." error={errors.password}>
        {(p) => (
          <input
            {...p}
            type="password"
            autoComplete="new-password"
            className="admin-input"
            value={values.password}
            onChange={(e) => onChange({ ...values, password: e.target.value })}
          />
        )}
      </Field>
      <Field label="Confirm new password" error={errors.confirm}>
        {(p) => (
          <input
            {...p}
            type="password"
            autoComplete="new-password"
            className="admin-input"
            value={values.confirm}
            onChange={(e) => onChange({ ...values, confirm: e.target.value })}
          />
        )}
      </Field>
    </>
  );
}

/** Maps zod issues (client mirror) to per-field messages. */
export function issuesByField(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Partial<Record<keyof PasswordValues, string>> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? "password") as keyof PasswordValues;
    out[key] ??= i.message;
  }
  return out;
}
