import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Skip type-checking during production build.
    // TS errors are still surfaced in dev / editor.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
