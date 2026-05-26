import Phaser from "phaser";
import { BACKGROUND_COLOR, GAME_HEIGHT, GAME_WIDTH } from "./config";
import { BaseScene } from "./scenes/BaseScene";
import { BootScene } from "./scenes/BootScene";
import { CombatScene } from "./scenes/CombatScene";
import { CraftScene } from "./scenes/CraftScene";
import { InventoryScene } from "./scenes/InventoryScene";
import { LootScene } from "./scenes/LootScene";
import { MapScene } from "./scenes/MapScene";
import { LevelUpScene } from "./scenes/LevelUpScene";
import { ProgressionScene } from "./scenes/ProgressionScene";
import { RadioScene } from "./scenes/RadioScene";
import { ReturnScene } from "./scenes/ReturnScene";
import { SortieScene } from "./scenes/SortieScene";
import { initPlatform } from "./systems/platform";
import { startCloudSave } from "./systems/cloudSave";
import { initIap, checkUnprocessedPurchases, registerConsumable } from "./systems/iap";
import { initAudioUnlock } from "./utils/audioUnlock";
import { GameState, addToStack } from "./state/GameState";

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
    CombatScene,
    LootScene,
    ReturnScene,
    InventoryScene,
    CraftScene,
    RadioScene,
    ProgressionScene,
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
