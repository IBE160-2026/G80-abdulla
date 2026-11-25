import type { NextConfig } from "next";

// cacheComponents er fjernet fra startpakken: AD-13 krever
// `export const dynamic = "force-dynamic"`, som Next 16 avviser sammen med den.
const nextConfig: NextConfig = {
  // Minimum av sikkerhetsheadere (kodereview av gruppe A, valg 1). Ingen CSP:
  // den må testes mot Supabase Storage og Next, og er ikke med i v1.
  // `X-Frame-Options` hindrer at «Bekreft» og «Skjul rapport» legges i en
  // usynlig ramme (clickjacking).
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
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
