import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.STATIC_EXPORT === "true" ? "export" : "standalone",
  ...(process.env.STATIC_EXPORT === "true"
    ? { basePath: "/next", trailingSlash: true, images: { unoptimized: true } }
    : {}),
};

export default nextConfig;
