import { describe, expect, test, vi, beforeEach } from "vitest";
import type { Perk } from "../../types";

const mockPerks: Perk[] = [
  { id: "toughness", name: "toughness", description: "", type: "additive", stat: "hp_max", value: 10 },
  { id: "scavenger", name: "scavenger", description: "", type: "multiplicative", stat: "loot_quantity_multiplier", value: 1.2 },
];

const makeSnapshot = (overrides: Record<string, unknown> = {}) => ({
  level: 3,
  xp: 150,
  perks: ["toughness"],
  inventory: [{ id: "bandage", count: 2 }],
  baseStash: [{ id: "wood", count: 5 }],
  radio_trust: 2,
  resolvedSignals: ["signal_1"],
  settings: { mute: true, volume: 0.5 },
  saved_at: new Date().toISOString(),
  ...overrides,
});

const setupGameState = async (): Promise<void> => {
  const { GameState, setContent } = await import("../../state/GameState");
  GameState.reset();
  setContent({
    items: {},
    mobs: {},
    recipes: {},
    zones: {},
    radioSignals: [
      {
        id: "signal_1",
        from: "",
        subject: "",
        body_ru: "",
        type: "truth",
        zone_id: "forest",
        options: [],
        reward: null,
        trap_mob_id: null,
        trust_impact: { respond: 0, ignore: 0 },
        expires_after_sorties: 3,
        chosen_option: null,
        resolved: false,
      },
    ],
    perks: {} as Record<string, never>,
  });
};

beforeEach(async () => {
  vi.resetModules();
  vi.unstubAllGlobals();
  await setupGameState();
});

describe("cloudSave", () => {
  test("serialize round-trip includes all fields", async () => {
    const { GameState } = await import("../../state/GameState");
    const { serializeGameState } = await import("../cloudSave");

    GameState.player.level = 5;
    GameState.player.xp = 300;
    const perk = mockPerks[0];
    if (perk) GameState.player.perks = [perk];
    GameState.player.backpack = [{ item_id: "bandage", count: 2 }];
    GameState.baseStash = [{ item_id: "wood", count: 5 }];
    GameState.progress.radio_trust = 2;
    const signal = GameState.data.radioSignals[0];
    if (signal) signal.resolved = true;
    GameState.settings = { sfxMuted: true, sfxVolume: 0.5 };

    const snapshot = serializeGameState();

    expect(snapshot.level).toBe(5);
    expect(snapshot.xp).toBe(300);
    expect(snapshot.perks).toEqual(["toughness"]);
    expect(snapshot.inventory).toEqual([{ id: "bandage", count: 2 }]);
    expect(snapshot.baseStash).toEqual([{ id: "wood", count: 5 }]);
    expect(snapshot.radio_trust).toBe(2);
    expect(snapshot.resolvedSignals).toEqual(["signal_1"]);
    expect(snapshot.settings).toEqual({ mute: true, volume: 0.5 });
    expect(typeof snapshot.saved_at).toBe("string");
    expect(snapshot.saved_at.length).toBeGreaterThan(0);
  });

  test("resolveConflict remote newer wins", async () => {
    const { resolveConflict } = await import("../cloudSave");
    const local = makeSnapshot({ saved_at: "2026-01-01T00:00:00Z" });
    const remote = makeSnapshot({ saved_at: "2026-06-01T00:00:00Z" });
    const result = resolveConflict(local, remote);
    expect(result).toBe(remote);
  });

  test("resolveConflict local newer wins", async () => {
    const { resolveConflict } = await import("../cloudSave");
    const local = makeSnapshot({ saved_at: "2026-06-01T00:00:00Z" });
    const remote = makeSnapshot({ saved_at: "2026-01-01T00:00:00Z" });
    const result = resolveConflict(local, remote);
    expect(result).toBe(local);
  });

  test("resolveConflict equal timestamps returns remote", async () => {
    const { resolveConflict } = await import("../cloudSave");
    const ts = "2026-01-01T00:00:00Z";
    const local = makeSnapshot({ saved_at: ts });
    const remote = makeSnapshot({ saved_at: ts });
    const result = resolveConflict(local, remote);
    expect(result).toBe(remote);
  });

  test("resolveConflict null local returns remote", async () => {
    const { resolveConflict } = await import("../cloudSave");
    const remote = makeSnapshot({ saved_at: "2026-01-01T00:00:00Z" });
    expect(resolveConflict(null, remote)).toBe(remote);
  });

  test("resolveConflict null remote returns local", async () => {
    const { resolveConflict } = await import("../cloudSave");
    const local = makeSnapshot({ saved_at: "2026-01-01T00:00:00Z" });
    expect(resolveConflict(local, null)).toBe(local);
  });

  test("throttle prevents save within interval", async () => {
    vi.useFakeTimers();

    const mockPlayer = {
      setData: vi.fn(),
      getData: vi.fn(),
    };
    const mockSdk = {
      features: {},
      getPlayer: vi.fn().mockResolvedValue(mockPlayer),
    };
    vi.stubGlobal("YaGames", {
      init: vi.fn().mockResolvedValue(mockSdk),
    });

    const { initPlatform } = await import("../platform");
    await initPlatform();

    const { saveToCloud, MIN_CLOUD_SAVE_INTERVAL_MS } = await import("../cloudSave");

    await saveToCloud();
    expect(mockPlayer.setData).toHaveBeenCalledTimes(1);

    await saveToCloud();
    expect(mockPlayer.setData).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(MIN_CLOUD_SAVE_INTERVAL_MS + 100);
    await saveToCloud();
    expect(mockPlayer.setData).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  test("no-op when platform unavailable", async () => {
    vi.stubGlobal("YaGames", undefined);
    await (await import("../platform")).initPlatform();
    const { saveToCloud, loadFromCloud } = await import("../cloudSave");
    await expect(saveToCloud()).resolves.toBeUndefined();
    await expect(loadFromCloud()).resolves.toBeNull();
  });
});
