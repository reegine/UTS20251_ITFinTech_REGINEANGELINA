import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
  domains: [
    'images.unsplash.com',
    'via.placeholder.com',
    'localhost',
    'images.tokopedia.net',
    'www.carnation.co.uk',
    'bakewithzoha.com',
    'takestwoeggs.com',
    'ordinarybaker.com.my',
    'dollopofdough.com',
    'www.tasteofhome.com',
  ],
},
};

export default nextConfig;