import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Konfigurasi standar Tauri: port tetap 1420 agar cocok dengan tauri.conf.json
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: { ignored: ["**/src-tauri/**"] },
  },
});
