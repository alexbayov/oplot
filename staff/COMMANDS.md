# Commands

> Проверенные/ожидаемые команды проекта. На ветке `main` часть npm-команд появится после мержа Engineer PR #7.

## Developer commands

```bash
npm install
npm run dev
npm run build
npm run lint
npm run typecheck
```

## Engineer checks

Run from a branch that contains `package.json`:

```bash
npm install
npm run typecheck
npm run lint
npm run build
npm run dev -- --host 127.0.0.1
npm audit
```

## Content checks

Minimum manual validation:

```bash
python3 -m json.tool content/items.json >/dev/null
python3 -m json.tool content/mobs.json >/dev/null
python3 -m json.tool content/recipes.json >/dev/null
python3 -m json.tool content/zones.json >/dev/null
```

QA should also verify cross-references:

- recipe results and ingredients exist in `items.json`;
- mob drops reference existing item ids;
- zone mobs/resources reference existing ids;
- numbers match `docs/balance.md`;
- scope matches current milestone anti-scope.

## Artist checks

```bash
find assets -type f -not -name ".gitkeep" -print
du -sh assets
```

Expected M1 asset scope:

- `assets/sprites/hero.png`
- 8 resource icons in `assets/sprites/items/`
- `assets/backgrounds/forest.png`
- Total M1 asset budget: about 300 KB target from `staff/handoff/M1-ARTIST.md`.
