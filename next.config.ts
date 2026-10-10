import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@coral-xyz/anchor"],
  agentRules: false,
};

export default nextConfig;
