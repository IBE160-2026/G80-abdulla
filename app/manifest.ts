import type { MetadataRoute } from "next";

// PWA-manifest for installasjon på hjemskjermen (NFR-5, AR-17). Ingen service
// worker og ingen frakoblet modus i v1.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LocalFix · Campus Molde",
    short_name: "LocalFix",
    description:
      "Meld fra om problemer på campus ved Høgskolen i Molde, og se hva andre har meldt.",
    lang: "nb",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F7FA",
    theme_color: "#1F4E79",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
