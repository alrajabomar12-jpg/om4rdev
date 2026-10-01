import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · om4r.dev",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-svh bg-bg">{children}</div>;
}
