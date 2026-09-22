import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Shared cPanel hosting has strict process limits. Keep Next.js build
    // concurrency low and prefer worker threads to avoid spawn EAGAIN errors.
    cpus: 1,
    workerThreads: true,
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 1,
  },
};

export default nextConfig;
