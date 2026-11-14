import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Offer updates explicitly so a new app shell does not interrupt an open drink form.
      registerType: "prompt",
      includeAssets: [
        "LICENSE.txt",
        "THIRD_PARTY_NOTICES.txt",
        "icon.svg",
        "icon-192.png",
        "icon-512.png",
        "apple-touch-icon.png",
        "apple-touch-icon-v2.png",
        "apple-touch-icon-120.png",
        "apple-touch-icon-152.png",
        "apple-touch-icon-167.png",
        "apple-touch-icon-180.png",
        "icon-maskable-512.png",
        "icon-maskable-1024.png",
      ],
      manifest: {
        name: "SipAhoy — Your cruise drink journal",
        short_name: "SipAhoy",
        description: "Offline cruise drink tracking and package comparisons.",
        theme_color: "#3156f5",
        background_color: "#f5f6ff",
        display: "standalone",
        start_url: ".",
        icons: [
          // Every candidate is opaque and full-bleed, so Safari need not inset an
          // `any`-only image onto a white tile when choosing an installation icon.
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "icon-maskable-1024.png",
            sizes: "1024x1024",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      // Bundled menus ship inside the JavaScript cache; runtime source-site requests are unnecessary.
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,webp,woff2}"],
        navigateFallback: "index.html",
      },
    }),
  ],
});
