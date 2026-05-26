/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // No basePath needed — serving from root of psychometriccoach.com
};
module.exports = nextConfig;
