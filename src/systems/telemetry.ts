/**
 * telemetry — минимальный baseline-трекинг событий для M10.
 *
 * Цель: получить 1 неделю baseline-данных до старта M10.1-M10.4,
 * чтобы было с чем сравнивать "стало лучше / хуже".
 *
 * Реализация:
 * - На Яндекс.Играх — отправляем через Yandex Metrica (ym counter)
 *   если global `ym` функция доступна
 * - Off-platform (dev/local) — console.log с префиксом [tel] только в development
 * - Никаких личных данных, никаких user-id (Яндекс сам анонимизирует)
 *
 * НЕ делаем в M10.0:
 * - funnel-анализ (это в Metrica UI смотрится)
 * - retention cohorts (это в Metrica UI)
 * - A/B testing (не нужен пока)
 *
 * Метрика-counter ID берётся из переменной окружения VITE_YM_COUNTER_ID
 * на этапе билда. Если не задан — в production события молча пропускаются.
 */

import { getPlatform } from "./platform";

type EventParams = Record<string, string | number | boolean | null>;

interface YmFunction {
  (counterId: number, action: "reachGoal", target: string, params?: EventParams): void;
  (counterId: number, action: "params", params: EventParams): void;
}

interface SessionState {
  startedAt: number;
  scenesVisited: Set<string>;
  ended: boolean;
}

let session: SessionState | null = null;
let warnedNoCounter = false;

const getCounterId = (): number | null => {
  // Vite заменяет import.meta.env на build-time константы
  const raw = (import.meta as ImportMeta & { env?: { VITE_YM_COUNTER_ID?: string } })
    .env?.VITE_YM_COUNTER_ID;
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
};

const getYm = (): YmFunction | null => {
  const ym = (globalThis as unknown as { ym?: YmFunction }).ym;
  return typeof ym === "function" ? ym : null;
};

/**
 * Основной API: трекать событие.
 *
 * Никогда не бросает — телеметрия не должна ломать игру.
 */
export const track = (event: string, params: EventParams = {}): void => {
  try {
    const platform = getPlatform();
    const counterId = getCounterId();
    const ym = getYm();

    // Side-effect: пометить сцену как посещённую
    if (session && typeof params.scene === "string") {
      session.scenesVisited.add(params.scene);
    }

    if (platform.available && counterId && ym) {
      ym(counterId, "reachGoal", event, params);
    } else {
      const isDev = import.meta.env?.MODE === "development";
      if (counterId === null && !warnedNoCounter && isDev) {
        warnedNoCounter = true;
        // single warning — не спамим в dev; production молчит.
        console.info("[tel] VITE_YM_COUNTER_ID not set — events only in dev console");
      }
      if (isDev) {
        console.log(`[tel] ${event}`, params);
      }
    }
  } catch (err) {
    // Никогда не пробрасываем — телеметрия не должна ломать игру
    console.warn("[tel] track() failed:", err);
  }
};

/**
 * Старт сессии. Вызывать один раз при загрузке (BootScene).
 */
export const sessionStart = (params: EventParams = {}): void => {
  session = {
    startedAt: Date.now(),
    scenesVisited: new Set<string>(),
    ended: false,
  };
  track("session_start", params);

  // Регистрируем session_end на закрытие вкладки
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    const handler = (): void => sessionEnd();
    window.addEventListener("beforeunload", handler, { once: true });
    window.addEventListener("pagehide", handler, { once: true });
  }
};

/**
 * Конец сессии. Вызывается автоматически на beforeunload, но может быть
 * вызван руками (например, на явный logout).
 */
export const sessionEnd = (): void => {
  if (!session || session.ended) return;
  session.ended = true;
  const durationSec = Math.round((Date.now() - session.startedAt) / 1000);
  track("session_end", {
    duration_sec: durationSec,
    scenes_visited: session.scenesVisited.size,
    scenes: Array.from(session.scenesVisited).join(","),
  });
};

/**
 * Текущая длительность сессии в секундах. null если сессия не запущена.
 */
export const sessionDurationSec = (): number | null => {
  if (!session) return null;
  return Math.round((Date.now() - session.startedAt) / 1000);
};

/**
 * Reset session state (для тестов). Не использовать в продакшен-коде.
 */
export const __resetTelemetryForTests = (): void => {
  session = null;
  warnedNoCounter = false;
};
