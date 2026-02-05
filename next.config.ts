import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    'radix-ui',
    '@radix-ui/react-direction',
    '@radix-ui/react-primitive',
  ],
};

export default nextConfig;
