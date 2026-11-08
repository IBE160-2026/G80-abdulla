import type { NextConfig } from "next";

// cacheComponents er fjernet fra startpakken: AD-13 krever
// `export const dynamic = "force-dynamic"`, som Next 16 avviser sammen med den.
const nextConfig: NextConfig = {};

export default nextConfig;
