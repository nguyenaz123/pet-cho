import type { MetadataRoute } from "next";

/** Web app manifest: lets the game install to the home screen and open full screen. Icons: npm run icons. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Pixel Pet",
    short_name: "Pixel Pet",
    description: "Raise your own 8-bit puppy.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#e6ebf0",
    theme_color: "#e6ebf0",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
