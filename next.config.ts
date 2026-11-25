import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Product photos: resized per screen, served as AVIF/WebP, cached for a month.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.21st.dev" }],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000,
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600],
  },
  eslint: { ignoreDuringBuilds: true },
  // Run `npm run typecheck` to see type errors; they don't block the build of this prototype.
  typescript: { ignoreBuildErrors: true },
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
};

export default nextConfig;
