/** @type {import('next').NextConfig} */

const nextConfig = {
  // Ensure proper production build for Hostinger Node environment
  output: 'standalone',
  reactStrictMode: true,

  // Disable Next.js built-in image optimization (Hostinger doesn’t provide sharp)
  images: {
    unoptimized: true,
  },

  // Externalize heavy server dependencies (MongoDB)
  experimental: {
    serverComponentsExternalPackages: ['mongodb'],
  },

  // Optimize Webpack for Hostinger (low CPU usage on shared hosting)
  webpack(config, { dev }) {
    if (dev) {
      config.watchOptions = {
        poll: 2000, // check for file changes every 2 seconds
        aggregateTimeout: 300, // wait before rebuilding
        ignored: ['**/node_modules'],
      };
    }
    return config;
  },

  // Tune page caching and reload behavior (good for small Node instances)
  onDemandEntries: {
    maxInactiveAge: 10000, // page kept in memory for 10 seconds
    pagesBufferLength: 2,  // max pages kept without rebuilding
  },

  // Secure headers + CORS setup
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *;" },
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.CORS_ORIGINS || "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-Requested-With",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
