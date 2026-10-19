import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Link hrefs only accept existing routes, so typos are type errors.
  typedRoutes: true,
};

export default nextConfig;
