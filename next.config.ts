import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  experimental: {
    // Shared cPanel hosting has strict process and memory limits.
    cpus: 1,
    workerThreads: false,
    webpackBuildWorker: true,
    webpackMemoryOptimizations: true,
    serverSourceMaps: false,
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 1,
  },
};

export default nextConfig;
