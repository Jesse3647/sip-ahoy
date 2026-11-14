import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Offer updates explicitly so a new app shell does not interrupt an open drink form.
      registerType: "prompt",
      includeAssets: ["icon.svg", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "SipAhoy — Your cruise drink journal",
        short_name: "SipAhoy",
        description: "Offline cruise drink tracking and package comparisons.",
        theme_color: "#123d46",
        background_color: "#f7f7f2",
        display: "standalone",
        start_url: ".",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      // Bundled menus ship inside the JavaScript cache; runtime source-site requests are unnecessary.
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "index.html",
      },
    }),
  ],
});
