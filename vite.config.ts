import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";

import { nitro } from "nitro/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [dyadComponentTagger(), react(), nitro()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ["@anthropic-ai/sdk", "standardwebhooks"],
  },
  build: {
    rollupOptions: {
      external: ["@anthropic-ai/sdk", "standardwebhooks"],
    },
  },
});
