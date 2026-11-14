import type { NextConfig } from "next";
import { securityHeaders } from "./src/infrastructure/web/security-headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The Docker image (Dockerfile) builds a self-contained server; `next start` keeps the default output.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  // Agent instructions live in CLAUDE.md (project convention); do not let `next dev` write AGENTS.md.
  agentRules: false,
  serverExternalPackages: ["@electric-sql/pglite", "@node-rs/argon2", "sharp"],
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders({ production: process.env.NODE_ENV === "production" }) },
    ];
  },
};

export default nextConfig;
