import path from "path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silences "Next.js inferred your workspace root" — the repo root
  // (d:\ned\campuslens) also has a package-lock.json from the Expo app,
  // which Turbopack would otherwise pick as the root instead of web/.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
