# Оплот — Survival RPG для Яндекс Игр

> **Жанр:** Survival RPG с глубоким крафтом, пошаговым боем и механикой веса/жадности
> **Платформа:** Яндекс.Игры (HTML5, landscape 1280×720)
> **Стек:** Phaser 3 + TypeScript + Vite + Yandex Games SDK

## High Concept

Одиночка выживает в заброшенном городе после техногенной катастрофы. Ходит в вылазки за ресурсами, крафтит уникальное оружие и броню из модульных компонентов, строит небольшой оплот цивилизации. Каждая вылазка — выбор между жадностью и выживанием: чем больше тащишь — тем медленнее и уязвимее.

## Микс

```
(лут, вес, реалистичные предметы)
(XP → уровни → перки, гринд-петля)
(вес = жадность vs выживание)
(радио, доверие, неизвестность)
(компоненты → уникальные статы)
```

## Структура проекта

```
oplot/
├── staff/          # Управление командой (оркестрация, роли, статусы)
├── docs/           # Игровая документация (GDD, баланс, стиль)
├── content/        # Игровой контент (JSON: предметы, мобы, рецепты, зоны)
├── src/            # Код (Phaser 3 + TypeScript)
├── assets/         # Графика, звуки
├── public/         # Статические файлы
└── README.md
```

## Команда

| Роль | Артефакты |
|---|---|
| **PM (дирижёр)** | `staff/PLAN.md`, оркестрация, ревью |
| **Game Designer** | `docs/GDD.md`, `docs/balance.md` |
| **Content Designer** | `content/*.json` |
| **Engineer** | `src/` |
| **Artist** | `assets/`, `docs/style-guide.md` |
| **QA** | Чек-листы, вето, приёмка |

## Current status

**Канон на текущий `main`:** M0–M10 закрыты, Redesign закрыт, реализация M11/M12 влита в `main`, но M11/M12 ещё **не product-accepted** до QA-финализации. Текущая фаза: **M11/M12 QA hardening + release readiness**. Combat Overhaul требует acceptance testing перед тем, как объявлять его player-facing complete.

## Процесс

См. [`staff/PROCESS.md`](staff/PROCESS.md) — полный цикл вехи.
См. [`staff/ORCHESTRATION.md`](staff/ORCHESTRATION.md) — playbook PM.
См. [`staff/PLAN.md`](staff/PLAN.md) — source of truth по статусу вех: implementation merged ≠ product accepted; следующий шаг — QA hardening / release readiness.

## Быстрый старт (для разработчика)

```bash
npm ci            # Чистая установка зависимостей для release/CI
npm run dev       # Dev-сервер с HMR
npm run typecheck # tsc --noEmit
npm run lint      # ESLint
npm run test      # Vitest
npm run build     # Продакшн-билд в dist/
```

## Release gate

Перед релизом на Яндекс.Игры обязательны зелёные `typecheck`, `lint`, `test` и `build`; те же команды выполняет GitHub Actions workflow `.github/workflows/ci.yml`. Release-safe defaults: generic-названия оружия без реальных ТМ и ожидание загрузки Yandex Games SDK перед fail-soft fallback.

## Лицензия

Проприетарный. Все права защищены.
