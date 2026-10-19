import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// El navegador habla con Vite (5173) y Vite reenvía /api al backend (8000).
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy: { "/api": "http://localhost:8000" },
  },
});
