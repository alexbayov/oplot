import { resolveUse3D } from "./config";

/**
 * Entry: R-series boots 3D iso prototype by default.
 * Legacy Phaser loop: open with ?mode=2d
 */
async function boot(): Promise<void> {
  if (resolveUse3D()) {
    const { boot3D } = await import("./scenes3d/boot3d");
    await boot3D();
    return;
  }

  const Phaser = (await import("phaser")).default;
  const { BACKGROUND_COLOR, GAME_HEIGHT, GAME_WIDTH } = await import("./config");
  const { BaseScene } = await import("./scenes/BaseScene");
  const { BootScene } = await import("./scenes/BootScene");
  const { CraftScene } = await import("./scenes/CraftScene");
  const { CraftedWeaponsScene } = await import("./scenes/CraftedWeaponsScene");
  const { InventoryScene } = await import("./scenes/InventoryScene");
  const { LootScene } = await import("./scenes/LootScene");
  const { EncounterScene } = await import("./scenes/EncounterScene");
  const { MapScene } = await import("./scenes/MapScene");
  const { LevelUpScene } = await import("./scenes/LevelUpScene");
  const { ProgressionScene } = await import("./scenes/ProgressionScene");
  const { RadioScene } = await import("./scenes/RadioScene");
  const { ReturnScene } = await import("./scenes/ReturnScene");
  const { SortieScene } = await import("./scenes/SortieScene");
  const { SortieRunScene } = await import("./scenes/SortieRunScene");
  const { SkillTreeScene } = await import("./scenes/SkillTreeScene");
  const { WeaponAssemblyScene } = await import("./scenes/WeaponAssemblyScene");
  const { initPlatform } = await import("./systems/platform");
  const { startCloudSave } = await import("./systems/cloudSave");
  const { initIap, checkUnprocessedPurchases, registerConsumable } = await import("./systems/iap");
  const { initAudioUnlock } = await import("./utils/audioUnlock");
  const { GameState, addToStack } = await import("./state/GameState");

  registerConsumable("starter_pack", async () => {
    GameState.baseStash = addToStack(GameState.baseStash, "bandage", 5);
    GameState.baseStash = addToStack(GameState.baseStash, "scrap", 3);
    GameState.baseStash = addToStack(GameState.baseStash, "electronics", 2);
  });
  registerConsumable("gas_pack", async () => {
    GameState.player.gas = (GameState.player.gas ?? 0) + 3;
  });

  void initPlatform().then(() => {
    void initIap().then(() => {
      void checkUnprocessedPurchases();
    });
  });

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: "game",
    backgroundColor: BACKGROUND_COLOR,
    scene: [
      BootScene,
      BaseScene,
      MapScene,
      SortieScene,
      SortieRunScene,
      LootScene,
      EncounterScene,
      ReturnScene,
      InventoryScene,
      CraftScene,
      WeaponAssemblyScene,
      CraftedWeaponsScene,
      RadioScene,
      ProgressionScene,
      SkillTreeScene,
      LevelUpScene,
    ],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  };

  const game = new Phaser.Game(config);
  startCloudSave();
  initAudioUnlock(() => {
    if ("context" in game.sound) {
      return (game.sound as { context: AudioContext }).context;
    }
    return null;
  });

  const canvas = game.canvas;
  canvas.addEventListener(
    "touchstart",
    (e: TouchEvent) => {
      if (e.target === canvas) e.preventDefault();
    },
    { passive: false },
  );
}

void boot();
