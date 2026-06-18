import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import nitro from "nitro/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Importação dinâmica/segura do plugin do Dyad para evitar quebras em produção
let dyadPlugin: any = null;
try {
  const mod = await import("@dyad-sh/react-vite-component-tagger");
  dyadPlugin = mod.default || mod;
} catch (e) {
  console.warn("Dyad component tagger plugin não encontrado ou ignorado no build de produção.");
}

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    ...(dyadPlugin ? [dyadPlugin()] : []),
    react(),
    nitro(),
  ],
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