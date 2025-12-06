const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  /* Allow dynamic server behavior (do not force static export)
     output: 'export' was removed so API routes and server-side features work. */

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;