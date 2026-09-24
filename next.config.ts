import type { NextConfig } from "next";

const cpanelBuild = process.env.CPANEL_BUILD === "1";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  typescript: {
    // TypeScript is already enforced by GitHub Production Validation.
    // Skipping it only on the constrained cPanel build saves memory.
    ignoreBuildErrors: cpanelBuild,
  },
  experimental: {
    // cPanel/Apache runs Next.js behind a reverse proxy. The public Origin can
    // differ from X-Forwarded-Host, so explicitly trust only TUCITA's domains
    // for Server Actions (login, forms, saves, etc.).
    serverActions: {
      allowedOrigins: ["tucita.com.ve", "www.tucita.com.ve"],
    },
    // Shared cPanel hosting has strict process and memory limits.
    cpus: 1,
    workerThreads: false,
    // On cPanel the child build worker is the process being SIGKILLed.
    // Build in the main process there; keep the worker everywhere else.
    webpackBuildWorker: !cpanelBuild,
    webpackMemoryOptimizations: true,
    serverSourceMaps: false,
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 1,
    preloadEntriesOnStart: false,
  },
  webpack(config) {
    if (cpanelBuild && !config.name?.includes("edge")) {
      // Disk/memory caches can create large peaks on small shared hosts.
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
