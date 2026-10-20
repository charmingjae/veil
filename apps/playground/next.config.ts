import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Link hrefs only accept existing routes, so typos are type errors.
  typedRoutes: true,
  // Builds plain static files into `out/`, which GitHub Pages serves.
  output: "export",
  // GitHub Pages serves the demo under the repository's name (`/veil`). The deploy workflow passes
  // that in; local runs leave it unset and stay at `/`.
  basePath: process.env.PAGES_BASE_PATH,
};

export default nextConfig;
