import { describe, expect, test } from "vitest";
import { activeSignals, dismissSignal, tickRadioOnReturn } from "../radio";
import type { RadioSignal } from "../../types";

const sig = (overrides: Partial<RadioSignal> = {}): RadioSignal => ({
  id: "r1",
  from: "unknown",
  subject: "test",
  body_ru: "тестовое сообщение",
  options: [
    { id: "respond", label_ru: "Откликнуться" },
    { id: "ignore", label_ru: "Игнорировать" },
  ],
  expires_after_sorties: 3,
  dismissed: false,
  ...overrides,
});

describe("activeSignals", () => {
  test("filters out dismissed and expired signals", () => {
    const list: RadioSignal[] = [
      sig({ id: "a" }),
      sig({ id: "b", dismissed: true }),
      sig({ id: "c", expires_after_sorties: 0 }),
      sig({ id: "d", expires_after_sorties: -1 }),
      sig({ id: "e" }),
    ];
    expect(activeSignals(list).map((s) => s.id)).toEqual(["a", "e"]);
  });

  test("returns empty list when input is empty", () => {
    expect(activeSignals([])).toEqual([]);
  });
});

describe("dismissSignal", () => {
  test("flips dismissed for matching id", () => {
    const list = [sig({ id: "a" }), sig({ id: "b" })];
    dismissSignal(list, "a");
    expect(list[0]?.dismissed).toBe(true);
    expect(list[1]?.dismissed).toBe(false);
  });

  test("no-op when id missing", () => {
    const list = [sig({ id: "a" })];
    dismissSignal(list, "ghost");
    expect(list[0]?.dismissed).toBe(false);
  });
});

describe("tickRadioOnReturn", () => {
  test("decrements expires_after_sorties on active signals", () => {
    const list = [sig({ id: "a", expires_after_sorties: 3 })];
    tickRadioOnReturn(list);
    expect(list[0]?.expires_after_sorties).toBe(2);
    expect(list[0]?.dismissed).toBe(false);
  });

  test("auto-dismisses when counter reaches 0 after decrement", () => {
    const list = [sig({ id: "a", expires_after_sorties: 1 })];
    tickRadioOnReturn(list);
    expect(list[0]?.expires_after_sorties).toBe(0);
    expect(list[0]?.dismissed).toBe(true);
  });

  test("does not decrement already-dismissed signals", () => {
    const list = [sig({ id: "a", expires_after_sorties: 3, dismissed: true })];
    tickRadioOnReturn(list);
    expect(list[0]?.expires_after_sorties).toBe(3);
    expect(list[0]?.dismissed).toBe(true);
  });

  test("auto-dismisses leftover already-zero non-dismissed signals (defensive)", () => {
    const list = [sig({ id: "a", expires_after_sorties: 0, dismissed: false })];
    tickRadioOnReturn(list);
    expect(list[0]?.dismissed).toBe(true);
  });

  test("two ticks chain decrement → dismiss correctly", () => {
    const list = [
      sig({ id: "a", expires_after_sorties: 2 }),
      sig({ id: "b", expires_after_sorties: 1 }),
    ];
    tickRadioOnReturn(list);
    expect(list[0]?.expires_after_sorties).toBe(1);
    expect(list[0]?.dismissed).toBe(false);
    expect(list[1]?.dismissed).toBe(true);
    tickRadioOnReturn(list);
    expect(list[0]?.dismissed).toBe(true);
  });
});
