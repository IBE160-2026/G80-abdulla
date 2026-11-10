import type { NextConfig } from "next";

// cacheComponents er fjernet fra startpakken: AD-13 krever
// `export const dynamic = "force-dynamic"`, som Next 16 avviser sammen med den.
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Bildet til en rapport kan være 5 MiB (AD-9, Story 2.4), og Server
      // Actions er begrenset til 1 MB som standard. 6 MiB er 5 MiB pluss
      // tekstfeltene og kodingen av forespørselen, og er under grensen proxy.ts
      // klarer å lese (`proxyClientMaxBodySize`, standard 10 MB). Selve
      // størrelsesregelen er `IMAGE_MAX_BYTES`, som sjekkes i skjemaet, i
      // `prepareImage` og av bucketen.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
