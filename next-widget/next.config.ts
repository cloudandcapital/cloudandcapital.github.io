/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true, // ensures /embed/ produces /embed/index.html
};

module.exports = nextConfig;

