import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.GITHUB_ACTIONS ? "/uk-bangla" : undefined,
  assetPrefix: process.env.GITHUB_ACTIONS ? "/uk-bangla/" : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
