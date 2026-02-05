import type { NextConfig } from "next";

// Required for @cloudflare/next-on-pages
import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

// Setup Cloudflare dev platform for local development
if (process.env.NODE_ENV === "development") {
  setupDevPlatform();
}

const nextConfig: NextConfig = {
  transpilePackages: [
    'radix-ui',
    '@radix-ui/react-direction',
    '@radix-ui/react-primitive',
  ],
};

export default nextConfig;
