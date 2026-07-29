# Как запустить редизайн локально

```bash
git clone https://github.com/alexbayov/oplot.git
cd oplot
git checkout redesign/r-series
npm install
npm run dev
```

Открой URL из Vite (обычно http://localhost:5173).

- **По умолчанию** — 3D изометрия (R0/R1): кликай по клеткам, герой ходит, укрытия блокируют путь.
- **Старая 2D-игра** — http://localhost:5173/?mode=2d

Сборка: `npm run build` → папка `dist/`.

Ветка: `redesign/r-series` · канон: `docs/redesign/R-MASTER.md`.
