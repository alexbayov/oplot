/**
 * sceneStack — overlay-режим для subscene'ов через Phaser scene stack.
 *
 * Решение из M10.0: используем `scene.launch()` + `scene.pause()` вместо
 * Container-based overlays. Это позволяет:
 *  - сохранять BaseScene живой (ambient SFX, анимации) пока поверх открыт Craft
 *  - не переписывать существующие сцены
 *  - изолировать depth между overlay и базой
 *
 * В M10.0 модуль создаётся, тестируется, но НЕ интегрируется в существующие
 * сцены. Интеграция — задача M10.3 (Base as Scene).
 *
 * Использование:
 *
 * ```ts
 * import { openOverlay, closeOverlay } from "../systems/sceneStack";
 *
 * // Из BaseScene открываем CraftScene поверх:
 * openOverlay(this, "CraftScene");
 *
 * // Из CraftScene возвращаемся в BaseScene:
 * closeOverlay(this);
 * ```
 */

import type Phaser from "phaser";

/**
 * Открыть overlay-сцену поверх текущей.
 *
 * Текущая сцена паузится (логика и тайминги останавливаются), но остаётся
 * на экране. Overlay-сцена стартует поверх (с прозрачным фоном, если задан
 * через `scene.cameras.main.setBackgroundColor()`).
 *
 * @param current — сцена, из которой открываем (обычно `this`)
 * @param overlayKey — ключ сцены для launch'а (например "CraftScene")
 * @param data — опциональные данные для overlay'а (passed to init/create)
 */
export const openOverlay = (
  current: Phaser.Scene,
  overlayKey: string,
  data?: Record<string, unknown>,
): void => {
  const sm = current.scene;

  // Idempotent: если overlay уже активен, ничего не делаем
  if (sm.isActive(overlayKey)) return;

  // Запоминаем parent для closeOverlay (через data registry)
  current.registry.set(`__overlayParent:${overlayKey}`, sm.key);

  sm.launch(overlayKey, data);
  sm.pause(sm.key);
};

/**
 * Закрыть overlay-сцену и вернуть управление родителю.
 *
 * Останавливает текущую сцену и возобновляет родителя (по ключу из
 * registry). Если родитель неизвестен — fallback на стоп без resume.
 *
 * @param current — overlay-сцена, из которой закрываемся (обычно `this`)
 */
export const closeOverlay = (current: Phaser.Scene): void => {
  const sm = current.scene;
  const overlayKey = sm.key;
  const parentKey = current.registry.get(`__overlayParent:${overlayKey}`) as
    | string
    | undefined;

  if (parentKey && sm.isPaused(parentKey)) {
    sm.resume(parentKey);
  }
  current.registry.remove(`__overlayParent:${overlayKey}`);
  sm.stop(overlayKey);
};

/**
 * Проверить, открыт ли указанный overlay поверх текущей сцены.
 */
export const isOverlayOpen = (current: Phaser.Scene, overlayKey: string): boolean =>
  current.scene.isActive(overlayKey);
