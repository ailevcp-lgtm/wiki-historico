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

const nextConfig: NextConfig = {
  images: {
    remotePatterns
  }
};

export default nextConfig;
