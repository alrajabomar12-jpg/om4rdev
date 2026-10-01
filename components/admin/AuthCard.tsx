import Image from "next/image";

export function AuthCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <main className="container-site flex min-h-svh items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <Image
          src="/brand/om4r-logo.png"
          alt="om4r.dev"
          width={2172}
          height={724}
          sizes="180px"
          loading="eager"
          className="mx-auto h-auto w-[180px]"
        />
        <div className="admin-card mt-8 p-6 sm:p-8">
          <h1 className="font-display text-2xl font-extrabold">{title}</h1>
          <p className="mt-2 text-sm text-muted">{description}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
