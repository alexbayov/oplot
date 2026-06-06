import { defineConfig, type Plugin } from "vite";
import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// content/*.json лежит в корне репо (чтобы node-тесты читали его через fs).
// `vite dev` отдаёт корень → работает. Но `vite build` НЕ копирует её в dist/,
// поэтому prod-билд получал index.html вместо content/items.json и падал
// на экране загрузки с "Unexpected token '<' ... is not valid JSON".
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
});
