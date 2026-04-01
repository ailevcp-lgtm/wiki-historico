import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  {
    protocol: "https",
    hostname: "**.supabase.co",
    pathname: "/storage/v1/object/public/**"
  }
];

if (supabaseUrl) {
  const parsedUrl = new URL(supabaseUrl);

  remotePatterns.push({
    protocol: parsedUrl.protocol.replace(":", "") as "http" | "https",
    hostname: parsedUrl.hostname,
    pathname: "/**"
  });
}

const nextConfig = (phase: string): NextConfig => ({
  // Keep dev output separate so a running `next dev` instance does not corrupt
  // production builds or `next start` artifacts under `.next`.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  images: {
    remotePatterns
  }
});

export default nextConfig;
