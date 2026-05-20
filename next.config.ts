import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['mammoth', 'pdf-parse', 'xlsx'],
  allowedDevOrigins: ['172.16.0.128', 'localhost', '127.0.0.1'],
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },
};

export default nextConfig;
