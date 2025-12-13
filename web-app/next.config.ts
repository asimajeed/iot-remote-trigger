import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed "export" to enable API routes
  // Static export doesn't support server-side API routes
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
