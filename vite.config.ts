import { defineConfig, type Plugin } from "vite";
import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const copyContent = (): Plugin => ({
  name: "copy-content-dir",
  apply: "build",
  closeBundle() {
    const src = resolve(__dirname, "content");
    const dest = resolve(__dirname, "dist", "content");
    if (existsSync(src)) {
      cpSync(src, dest, { recursive: true });
    }
  },
});

export default defineConfig({
  base: "./",
  plugins: [copyContent()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          babylon: ["@babylonjs/core", "@babylonjs/materials"],
          phaser: ["phaser"],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["@babylonjs/core", "@babylonjs/materials", "phaser"],
  },
});
