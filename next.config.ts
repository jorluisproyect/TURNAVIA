import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Shared cPanel hosting has strict process limits.
    // Keep concurrency to one worker. Worker threads are disabled because
    // Next.js 15 can throw DataCloneError when serializing build config.
    cpus: 1,
    workerThreads: false,
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 1,
  },
};

export default nextConfig;
