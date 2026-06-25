import Phaser from "phaser";
import { GameState } from "../state/GameState";
import {
  getAllNodes,
  getNodeById,
  isUnlocked,
  canUnlock,
  unlockNode,
  derivePerks,
  deriveHeroStats,
} from "../state/SkillTree";
import type { SkillBranch, SkillNode } from "../types/skillNode";
import { CX, W, H } from "../ui/layout";
import { createButton, createTitle } from "./sceneUi";

const BRANCH_COLORS: Record<SkillBranch, { active: number; locked: number; label: string }> = {
  fighter: { active: 0xc9302c, locked: 0x4a1a1a, label: "БОЕЦ" },
  survivor: { active: 0x4caf50, locked: 0x1f3d20, label: "ВЫЖИВАЛЬЩИК" },
  crafter: { active: 0xff9800, locked: 0x4a3a10, label: "РЕМЕСЛЕННИК" },
};

const NODE_R = 28;
const COL_X = (i: number): number => 200 + i * 440;
const ROW_Y = (pos: number): number => 140 + (pos - 1) * 65;

export class SkillTreeScene extends Phaser.Scene {
  private nodeButtons: Phaser.GameObjects.Container[] = [];
  private pointsText?: Phaser.GameObjects.Text;
  private detailsText?: Phaser.GameObjects.Text;

  constructor() {
    super("SkillTreeScene");
  }

  public create(): void {
    this.add.rectangle(CX, H / 2, W, H, 0x0a0806).setOrigin(0.5);
    createTitle(this, "ДЕРЕВО НАВЫКОВ");

    this.pointsText = this.add
      .text(CX, 64, "", {
        color: "#c5a267",
        fontFamily: "Roboto Condensed, sans-serif",
        fontSize: "16px",
      })
      .setOrigin(0.5);

    const branches: SkillBranch[] = ["fighter", "survivor", "crafter"];
    branches.forEach((branch, i) => {
      const colX = COL_X(i);
      this.add
        .text(colX, 100, BRANCH_COLORS[branch].label, {
          color: "#d4c5a0",
          fontFamily: "Oswald, sans-serif",
          fontSize: "18px",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      const nodes = getAllNodes()
        .filter((n) => n.branch === branch)
        .sort((a, b) => a.position - b.position);

      for (const node of nodes) {
        this.drawNode(node, colX, ROW_Y(node.position));
      }
    });

    this.detailsText = this.add.text(CX, H - 110, "Наведи на узел для описания.", {
      color: "#a89968",
      fontFamily: "Roboto Condensed, sans-serif",
      fontSize: "13px",
      align: "center",
      wordWrap: { width: W - 100 },
    }).setOrigin(0.5);

    createButton(this, H - 40, "Назад в Оплот", () => this.scene.start("BaseScene"));
    this.refresh();
  }

  private drawNode(node: SkillNode, x: number, y: number): void {
    const player = GameState.player;
    const unlocked = player.unlockedSkillNodes ?? [];
    const points = player.skillPoints ?? 0;
    const colors = BRANCH_COLORS[node.branch];

    const isOpen = isUnlocked(node.id, unlocked);
    const allowed = canUnlock(node.id, unlocked, points).ok;
    const color = isOpen ? colors.active : allowed ? 0xc5a267 : colors.locked;

    const c = this.add.container(x, y);
    const bg = this.add.circle(0, 0, NODE_R, color, isOpen ? 1 : 0.35);
    bg.setStrokeStyle(2, 0xd4c5a0, isOpen ? 1 : 0.5);
    const label = this.add
      .text(0, 0, node.name.slice(0, 10), {
        color: "#0a0806",
        fontFamily: "Oswald, sans-serif",
        fontSize: "10px",
        align: "center",
        wordWrap: { width: NODE_R * 2 - 6 },
      })
      .setOrigin(0.5);
    c.add([bg, label]);

    if (node.requires) {
      const parentNode = getNodeById(node.requires);
      if (parentNode) {
        const px = x;
        const py = ROW_Y(parentNode.position);
        const line = this.add.line(0, 0, px, py + NODE_R, x, y - NODE_R, 0xc5a267, 0.4);
        line.setOrigin(0, 0).setLineWidth(2);
      }
    }

    c.setSize(NODE_R * 2, NODE_R * 2);
    c.setInteractive(new Phaser.Geom.Circle(0, 0, NODE_R), Phaser.Geom.Circle.Contains);
    c.on("pointerover", () => {
      this.detailsText?.setText(
        `${node.name} · ${BRANCH_COLORS[node.branch].label}\n${node.description}\n${isOpen ? "✓ ОТКРЫТО" : allowed ? "Доступно — клик чтобы открыть" : "Нужен предыдущий узел или skill point"}`,
      );
    });
    c.on("pointerdown", () => {
      if (!allowed || isOpen) return;
      const result = unlockNode(node.id, unlocked, points);
      if (!result) return;
      player.unlockedSkillNodes = result.unlocked;
      player.skillPoints = result.skillPoints;
      // B-2 fix: rebuild legacy perks[] so combat/loot/craft pick up the new bonus.
      player.perks = derivePerks(player.unlockedSkillNodes);
      // M20-PR1: пересчитать персистентные характеристики из дерева. Прирост
      // hp_max сразу даём как текущий HP — узел «+HP» должен двигать полоску.
      const prevMax = player.hp_max;
      const stats = deriveHeroStats(player.unlockedSkillNodes);
      player.hp_max = stats.hp_max;
      player.max_weight_kg = stats.max_weight_kg;
      if (player.hp_max > prevMax) player.hp += player.hp_max - prevMax;
      this.refresh();
    });

    this.nodeButtons.push(c);
  }

  private refresh(): void {
    const player = GameState.player;
    const pts = player.skillPoints ?? 0;
    const opened = (player.unlockedSkillNodes ?? []).length;
    this.pointsText?.setText(`Очков навыков: ${pts}   ·   Открыто узлов: ${opened}/24`);
    // Restart visuals
    for (const c of this.nodeButtons) c.destroy();
    this.nodeButtons = [];
    const branches: SkillBranch[] = ["fighter", "survivor", "crafter"];
    branches.forEach((branch, i) => {
      const colX = COL_X(i);
      const nodes = getAllNodes()
        .filter((n) => n.branch === branch)
        .sort((a, b) => a.position - b.position);
      for (const node of nodes) this.drawNode(node, colX, ROW_Y(node.position));
    });
  }
}
