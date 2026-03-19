import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    maximumDiskCacheSize: 1024 * 1024 * 100, // 100MB limit
  },
};

export default nextConfig;
