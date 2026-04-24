/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    webpackBuildWorker: false,
  },
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
