import type { NextConfig } from "next";

const adminHeaders = [
  { key: "Cache-Control", value: "no-store" },
  { key: "X-Robots-Tag", value: "noindex" },
];

const nextConfig: NextConfig = {
  // Dev server logs each fetch with cache HIT/MISS (used to verify the 5-minute Roblox cache).
  logging: { fetches: { fullUrl: true } },
  // Native argon2 bindings: load from node_modules at runtime instead of bundling.
  serverExternalPackages: ["@node-rs/argon2"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "tr.rbxcdn.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  async headers() {
    return ["/admin", "/admin/:path*", "/api/admin/:path*", "/api/auth/:path*"].map((source) => ({
      source,
      headers: adminHeaders,
    }));
  },
};

export default nextConfig;
