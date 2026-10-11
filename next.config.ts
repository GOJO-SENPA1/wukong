import type { NextConfig } from "next";

const dev = process.env.NODE_ENV !== "production";

// A CSP that still lets Privy (its auth iframe, Cloudflare Turnstile) and wallet
// connections work. Inline scripts stay allowed because Next injects them; the
// page can't be framed, can't load plugins, and forms only post to this site.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https: wss:" + (dev ? " http://127.0.0.1:* http://localhost:* ws://localhost:*" : ""),
  "frame-src https://auth.privy.io https://*.privy.io https://verify.walletconnect.com https://verify.walletconnect.org https://challenges.cloudflare.com",
  "child-src https://auth.privy.io https://*.privy.io https://verify.walletconnect.com https://verify.walletconnect.org",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  ...(dev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  reactStrictMode: true,
  // Never ship source maps to browsers: the client code stays minified.
  productionBrowserSourceMaps: false,
  serverExternalPackages: ["@coral-xyz/anchor"],
  agentRules: false,
  bundler: "webpack",
  async rewrites() {
    return [
      { source: "/@:handle", destination: "/u/:handle" },
      // The benchmark page is a static file in public/.
      { source: "/benchmarks", destination: "/benchmarks.html" },
    ];
  },
};

export default nextConfig;
