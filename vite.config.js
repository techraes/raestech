import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        port: 5173,
        host: "127.0.0.1",
    },
    build: {
        outDir: "dist",
        sourcemap: false,
        chunkSizeWarningLimit: 900,
        rollupOptions: {
            output: {
                manualChunks: {
                    react: ["react", "react-dom", "react-router-dom"],
                    supabase: ["@supabase/supabase-js"],
                    ui: ["@radix-ui/react-dialog", "@radix-ui/react-select", "@radix-ui/react-dropdown-menu", "class-variance-authority", "clsx", "tailwind-merge"],
                    icons: ["lucide-react"],
                    catalog: ["./src/data/catalog_seed.json"],
                },
            },
        },
    },
});
