import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/Calculadora/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["PWAc-192x192.svg", "PWAc-512x512.svg", "uploads/produtos/LEIA-ME.txt"],
      manifest: {
        name: "Calculadora de Precos - L3D Atelier",
        short_name: "CalcPrecos",
        description:
          "Sistema de precificacao, estoque, produtos e orcamentos para impressao 3D e artesanato.",
        theme_color: "#081224",
        background_color: "#081224",
        display: "standalone",
        orientation: "portrait",
        start_url: "/Calculadora/",
        scope: "/Calculadora/",
        icons: [
          {
            src: "PWAc-192x192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
          {
            src: "PWAc-512x512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
});
