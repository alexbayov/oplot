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

new Phaser.Game(config);
