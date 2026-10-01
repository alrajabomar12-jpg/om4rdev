import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-site flex min-h-svh flex-col items-center justify-center gap-6 text-center">
      <Image src="/brand/om4r-logo.png" alt="om4r.dev" width={2172} height={724} sizes="220px" className="h-auto w-[220px]" />
      <p className="eyebrow text-accent-bright">404</p>
      <h1 className="font-display text-h2">This page doesn&apos;t exist.</h1>
      <Link href="/" className="btn btn-primary">
        Back to the portfolio
      </Link>
    </main>
  );
}
