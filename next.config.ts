import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Cloudflare Tunnel からのアクセスを許可
  allowedDevOrigins: [
    "*.trycloudflare.com",
  ],
};

export default nextConfig;

