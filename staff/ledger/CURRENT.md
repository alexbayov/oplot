# CURRENT — ledger

> Обновлено: 2026-07-29 (Lindy redesign kickoff)
> Ветка работы: `redesign/r-series`
> main HEAD на момент ответвления: `3c4ae68` (M20 closed, SAVE_VERSION=9, vitest 592)

## North star
Полный редизайн: **3D изометрия (Babylon.js) + пошаговый бой с hit%/прицелом + реальные стволы и моды**.
Канон: `docs/redesign/R-MASTER.md`.

## Package in flight
**R0 Foundation** — следующий код-PR.
Спеки уже в ветке: R-MASTER, R0, R2, R3, CRITIC role.

## Next PR status
GO — Engineer/Lindy implements R0 per `docs/redesign/R0-FOUNDATION.md`.

## Critic
Role live: `staff/roles/CRITIC.md`. No merge without Critic APPROVE on R-milestones.

## Do not
- Не возвращать combat auto-resolve как player-facing core
- Не спрашивать владельца базовые GD-решения (автономный режим)
- Не коммитить секреты/токены
