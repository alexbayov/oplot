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

  // ── M13 PR-6c persistence regression (catches PR-6c review fold-in) ──

  test("getData whitelist covers every serialized key (drift guard)", async () => {
    // Yandex getData(keys) возвращает ТОЛЬКО whitelisted ключи. Если
    // serialize пишет ключ, которого нет в CLOUD_SAVE_KEYS — он тихо не
    // переживёт round-trip. Этот тест ловит дрейф (поймал бы пропавшие
    // buildings/hp/skillPoints/unlockedSkillNodes/progress_flags).
    const { serializeGameState, CLOUD_SAVE_KEYS } = await import("../cloudSave");
    const serializedKeys = Object.keys(serializeGameState());
    const whitelist = CLOUD_SAVE_KEYS as string[];
    const missing = serializedKeys.filter((k) => !whitelist.includes(k));
    expect(missing).toEqual([]);
  });

  test("buildings buffer + hp survive a full save→getData→load round-trip", async () => {
    const { GameState } = await import("../../state/GameState");
    GameState.buildings = [
      { id: "garden", accumulated_output: 12 },
      { id: "bunk", accumulated_output: 0 },
    ];
    const woundedHp = Math.max(1, GameState.player.hp_max - 20);
    GameState.player.hp = woundedHp;

    const { serializeGameState, applySnapshot, CLOUD_SAVE_KEYS } = await import("../cloudSave");
    const saved = serializeGameState() as unknown as Record<string, unknown>;

    // Симулируем Yandex getData(keys): только whitelisted ключи доезжают.
    const fromCloud: Record<string, unknown> = {};
    for (const k of CLOUD_SAVE_KEYS as string[]) {
      if (k in saved) fromCloud[k] = saved[k];
    }

    GameState.reset(); // wipe in-memory state
    applySnapshot(fromCloud as never);

    const garden = GameState.buildings.find((b) => b.id === "garden");
    expect(garden?.accumulated_output).toBe(12); // буфер пережил load
    expect(GameState.player.hp).toBe(woundedHp); // hp пережил load (раненым)
  });

  test("old v5 save (no buildings) loads with garden+bunk, not empty", async () => {
    // CATCH: migrate v5→v6 раньше инжектил buildings:[], и applySnapshot
    // `[] ?? default === []` оставлял существующего игрока без построек.
    const { GameState } = await import("../../state/GameState");
    const { applySnapshot } = await import("../cloudSave");
    const v5 = makeSnapshot({ version: 5, saved_at: new Date().toISOString() });
    GameState.reset();
    applySnapshot(v5 as never);
    // M13 PR-6b-3 G3: даже v5-сейв через v5→v6→v7→v8 chain получает
    // generator (Trap B-2 закрыт в migrateV7ToV8 ensure-by-id).
    const ids = GameState.buildings.map((b) => b.id).sort();
    expect(ids).toEqual(["bunk", "garden", "generator"]);
  });

  // ── M13 PR-6b-1 persistence regression (durability-wire) ──────────

  test("equipped_weapon + crafted_weapons survive full save→getData→load round-trip", async () => {
    // Test 5 из preflight: equipped + crafted + durability_current
    // должны пережить cloud round-trip. До PR-6b-1 эти поля не
    // сериализовались — durability тихо ресетилась на каждый load.
    const { GameState } = await import("../../state/GameState");
    const wi = {
      id: "wi_round",
      name_ru: "Сборка",
      slot: "action" as const,
      stats: { damage_min: 4, damage_max: 9 },
      durability_max: 5,
      durability_current: 2,
      parts: ["pm_frame", "pm_barrel"],
    };
    GameState.player.crafted_weapons = [wi];
    GameState.player.equipped_weapon = { kind: "crafted", id: "wi_round" };

    const { serializeGameState, applySnapshot, CLOUD_SAVE_KEYS } = await import("../cloudSave");
    const saved = serializeGameState() as unknown as Record<string, unknown>;
    const fromCloud: Record<string, unknown> = {};
    for (const k of CLOUD_SAVE_KEYS as string[]) {
      if (k in saved) fromCloud[k] = saved[k];
    }

    GameState.reset();
    applySnapshot(fromCloud as never);

    expect(GameState.player.equipped_weapon).toEqual({ kind: "crafted", id: "wi_round" });
    expect(GameState.player.crafted_weapons).toHaveLength(1);
    expect(GameState.player.crafted_weapons[0]?.durability_current).toBe(2);
    expect(GameState.player.crafted_weapons[0]?.durability_max).toBe(5);
  });

  test("old v6 save (no equipped_weapon key) loads with default catalog craft_knife", async () => {
    // Test 6 part A: v6 → v7 миграция — отсутствующий ключ даёт дефолт
    // (createDefaultPlayer().equipped_weapon = catalog craft_knife).
    const { GameState } = await import("../../state/GameState");
    const { applySnapshot } = await import("../cloudSave");
    const v6 = makeSnapshot({ version: 6, saved_at: new Date().toISOString() });
    GameState.reset();
    applySnapshot(v6 as never);
    expect(GameState.player.equipped_weapon).toEqual({ kind: "catalog", id: "craft_knife" });
    expect(GameState.player.crafted_weapons).toEqual([]);
  });

  test("Trap A: equipped_weapon=null в снапшоте → НЕ перезаписывается дефолтом", async () => {
    // Test 6 part B (preflight §5 ловушка A): null = валидное «слот пуст»
    // (после поломки крафта). `migrated.equipped_weapon ?? default` стёр
    // бы намерение, потому что `null ?? x === x`. applySnapshot должна
    // отличать «ключа нет» от «ключ есть = null» через `in`-проверку.
    const { GameState } = await import("../../state/GameState");
    const { applySnapshot } = await import("../cloudSave");
    const snap = makeSnapshot({
      version: 7,
      saved_at: new Date().toISOString(),
      equipped_weapon: null,
      crafted_weapons: [],
    });
    GameState.reset();
    applySnapshot(snap as never);
    expect(GameState.player.equipped_weapon).toBeNull();
  });

  test("migrate chain идемпотентен — двойной запуск = no-op", async () => {
    // M13 PR-6b-3: после v7→v8 (data-full с ensure-by-id) проверяем что
    // повторный запуск миграции на уже-актуальном snapshot не дёргает
    // baseResources/buildings. Главный guard в migrateSnapshot —
    // `version >= SAVE_VERSION → passthrough`, плюс ensure-by-id
    // идемпотентен (находит generator и не добавляет ещё один).
    const { migrateSnapshot } = await import("../../state/migrations");
    const v6 = makeSnapshot({ version: 6, saved_at: "2026-06-14T00:00:00Z" });
    const once = migrateSnapshot(v6 as never);
    const twice = migrateSnapshot(once);
    expect(once.version).toBe(8);
    expect(twice).toEqual(once);
  });

  // ── M13 PR-6b-3 Verstak energy + generator persistence ──────────

  test("(e) v7 save с [garden,bunk] получает generator через v7→v8 applySnapshot", async () => {
    const { GameState } = await import("../../state/GameState");
    const { applySnapshot } = await import("../cloudSave");
    GameState.reset();
    const v7 = makeSnapshot({
      version: 7,
      saved_at: new Date().toISOString(),
      buildings: [
        { id: "garden", accumulated_output: 5 },
        { id: "bunk", accumulated_output: 0 },
      ],
      baseResources: { water: 1, fuel: 2, metal: 3, food: 4 },
    });
    applySnapshot(v7 as never);
    const ids = GameState.buildings.map((b) => b.id).sort();
    expect(ids).toEqual(["bunk", "garden", "generator"]);
    expect(GameState.baseResources.energy).toBe(0);
    expect(GameState.baseResources.water).toBe(1);
    expect(GameState.baseResources.fuel).toBe(2);
  });

  test("energy + generator переживают save → getData(whitelist) → load", async () => {
    const { GameState } = await import("../../state/GameState");
    GameState.reset();
    GameState.baseResources = {
      water: 0, fuel: 0, metal: 0, food: 0, energy: 7,
    };
    GameState.buildings = [
      { id: "garden", accumulated_output: 0 },
      { id: "bunk", accumulated_output: 0 },
      { id: "generator", accumulated_output: 0 },
    ];

    const { serializeGameState, applySnapshot, CLOUD_SAVE_KEYS } = await import("../cloudSave");
    const saved = serializeGameState() as unknown as Record<string, unknown>;
    const fromCloud: Record<string, unknown> = {};
    for (const k of CLOUD_SAVE_KEYS as string[]) {
      fromCloud[k] = saved[k];
    }

    GameState.reset();
    applySnapshot(fromCloud as never);

    expect(GameState.baseResources.energy).toBe(7);
    const ids = GameState.buildings.map((b) => b.id).sort();
    expect(ids).toEqual(["bunk", "garden", "generator"]);
  });
});
