# Ledger — текущее состояние

> **Это единственный live-файл, который Codex читает в начале каждой сессии.**
> Контракт описан в `staff/ledger/README.md`. Slack — для исключений.

---

## main HEAD

- SHA: `8b38bba`
- Дата: 2026-06-19
- Последний закрытый PR: `#209` (ARMOR-PR3 — grinder strategy gate)
- Baseline gates на этом SHA: `tsc 0` · `eslint(src) 0` · `vitest 523 passed` · `vite build ✓`

Codex: сверь `git rev-parse main` с этим SHA. Если расходится — `git fetch && git pull --ff-only` и перечитай файл.

---

## Текущий пакет

**ID:** TBD (M18 package)
**Preflight:** ⏳ ещё не написан. Ross готовит `staff/implementation/M18-PACKAGE-PREFLIGHT.md`.
**Якорь пакета:** `narrativeEvents` загружен в `ContentData` но никем не потребляется (dead infra) — пакет должен закрыть этот шов и добить M18 territory.

### Закрыто в этом пакете

(пусто — пакет ещё не начат)

### Следующий PR

**Статус:** `ОЖИДАНИЕ`
**Причина:** package preflight на M18 ещё не открыт.

Codex: стой. Не пиши код, не открывай ветку. Когда package preflight приземлится
в main, Ross обновит этот раздел на `Статус: GO` со ссылкой на конкретный PR-слот.

---

## Блокер

(нет)

---

## Журнал последних обновлений ledger'а

| Дата | Кто | Что |
|---|---|---|
| 2026-06-21 | Ross | Создан ledger-протокол. Seed состоянием на main `8b38bba` (M17 + ARMOR-PR3 пакет закрыт). Ожидание M18 package preflight. |

---

## Архив закрытых пакетов

Закрытые пакеты переезжают в `staff/ledger/archive/PACKAGE-<id>.md`. Текущий список:

(пока пусто — этот ledger seed'ится после закрытия M17 + ARMOR-PR3 пакета, исторические M-вехи в `staff/handoff/`)
