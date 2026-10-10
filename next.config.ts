import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@coral-xyz/anchor"],
  agentRules: false,
  bundler: "webpack",
};

export default nextConfig;
