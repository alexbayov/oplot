import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  Vector3,
  Color3,
  Color4,
  MeshBuilder,
  StandardMaterial,
  ShadowGenerator,
  AbstractMesh,
  PointerEventTypes,
} from "@babylonjs/core";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";

const GRID = 16;
const CELL = 1;

export async function boot3D(): Promise<void> {
  const host = document.getElementById("game");
  if (!host) throw new Error("#game mount missing");

  host.innerHTML = "";
  const canvas = document.createElement("canvas");
  canvas.id = "oplot-3d";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  canvas.style.touchAction = "none";
  host.style.width = "100vw";
  host.style.height = "100vh";
  host.style.maxWidth = `${GAME_WIDTH}px`;
  host.style.maxHeight = `${GAME_HEIGHT}px`;
  host.style.margin = "0 auto";
  host.appendChild(canvas);

  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    adaptToDeviceRatio: true,
  });
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.067, 0.071, 0.063, 1);

  const camera = new ArcRotateCamera(
    "iso",
    -Math.PI / 4,
    Math.PI / 3,
    28,
    new Vector3(GRID / 2, 0, GRID / 2),
    scene,
  );
  camera.lowerRadiusLimit = 14;
  camera.upperRadiusLimit = 40;
  camera.lowerBetaLimit = Math.PI / 3;
  camera.upperBetaLimit = Math.PI / 3;
  camera.lowerAlphaLimit = -Math.PI / 4;
  camera.upperAlphaLimit = -Math.PI / 4;
  camera.panningSensibility = 0;
  camera.attachControl(canvas, true);
  camera.inputs.removeByType("ArcRotateCameraPointersInput");

  const hemi = new HemisphericLight("hemi", new Vector3(0.2, 1, 0.1), scene);
  hemi.intensity = 0.55;
  hemi.groundColor = new Color3(0.15, 0.12, 0.1);

  const sun = new DirectionalLight("sun", new Vector3(-0.6, -1, -0.4), scene);
  sun.position = new Vector3(20, 30, 10);
  sun.intensity = 0.85;
  const shadows = new ShadowGenerator(1024, sun);
  shadows.useBlurExponentialShadowMap = true;
  shadows.blurKernel = 16;

  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: GRID * CELL, height: GRID * CELL, subdivisions: GRID },
    scene,
  );
  ground.position = new Vector3((GRID * CELL) / 2 - CELL / 2, 0, (GRID * CELL) / 2 - CELL / 2);
  const groundMat = new StandardMaterial("groundMat", scene);
  groundMat.diffuseColor = new Color3(0.22, 0.24, 0.18);
  groundMat.specularColor = Color3.Black();
  ground.material = groundMat;
  ground.receiveShadows = true;

  const lineMat = new StandardMaterial("lineMat", scene);
  lineMat.diffuseColor = new Color3(0.35, 0.38, 0.28);
  lineMat.emissiveColor = new Color3(0.08, 0.09, 0.06);
  lineMat.specularColor = Color3.Black();
  for (let i = 0; i <= GRID; i++) {
    const zLine = MeshBuilder.CreateBox(`gz${i}`, { width: GRID * CELL, height: 0.02, depth: 0.03 }, scene);
    zLine.position = new Vector3((GRID * CELL) / 2 - CELL / 2, 0.01, i * CELL - CELL / 2);
    zLine.material = lineMat;
    const xLine = MeshBuilder.CreateBox(`gx${i}`, { width: 0.03, height: 0.02, depth: GRID * CELL }, scene);
    xLine.position = new Vector3(i * CELL - CELL / 2, 0.01, (GRID * CELL) / 2 - CELL / 2);
    xLine.material = lineMat;
  }

  const coverMat = new StandardMaterial("coverMat", scene);
  coverMat.diffuseColor = new Color3(0.35, 0.28, 0.2);
  coverMat.specularColor = Color3.Black();
  const blocked = new Set<string>();
  const coverCells: Array<[number, number, "half" | "full"]> = [
    [4, 4, "half"],
    [5, 4, "full"],
    [8, 7, "full"],
    [9, 7, "half"],
    [3, 10, "full"],
    [11, 3, "half"],
    [12, 12, "full"],
    [6, 11, "half"],
  ];
  for (const [cx, cz, kind] of coverCells) {
    const h = kind === "full" ? 1.2 : 0.55;
    const box = MeshBuilder.CreateBox(`cover_${cx}_${cz}`, { width: 0.9, height: h, depth: 0.9 }, scene);
    box.position = new Vector3(cx * CELL, h / 2, cz * CELL);
    box.material = coverMat;
    box.receiveShadows = true;
    shadows.addShadowCaster(box);
    if (kind === "full") blocked.add(`${cx},${cz}`);
  }

  let heroCell = { x: 2, z: 2 };
  const hero = MeshBuilder.CreateCapsule("hero", { height: 1.4, radius: 0.28 }, scene);
  const heroMat = new StandardMaterial("heroMat", scene);
  heroMat.diffuseColor = new Color3(0.72, 0.55, 0.28);
  heroMat.emissiveColor = new Color3(0.08, 0.05, 0.02);
  heroMat.specularColor = new Color3(0.1, 0.1, 0.1);
  hero.material = heroMat;
  shadows.addShadowCaster(hero);

  const markerMat = new StandardMaterial("markerMat", scene);
  markerMat.diffuseColor = new Color3(0.85, 0.55, 0.15);
  markerMat.emissiveColor = new Color3(0.25, 0.12, 0.02);
  markerMat.alpha = 0.85;
  markerMat.specularColor = Color3.Black();
  let markers: AbstractMesh[] = [];

  function cellToWorld(cx: number, cz: number): Vector3 {
    return new Vector3(cx * CELL, 0, cz * CELL);
  }
  function placeHero(): void {
    const p = cellToWorld(heroCell.x, heroCell.z);
    hero.position = new Vector3(p.x, 0.7, p.z);
  }
  placeHero();

  function clearMarkers(): void {
    for (const m of markers) m.dispose();
    markers = [];
  }

  function inBounds(x: number, z: number): boolean {
    return x >= 0 && z >= 0 && x < GRID && z < GRID;
  }

  function findPath(from: { x: number; z: number }, to: { x: number; z: number }): Array<{ x: number; z: number }> {
    if (!inBounds(to.x, to.z) || blocked.has(`${to.x},${to.z}`)) return [];
    if (from.x === to.x && from.z === to.z) return [from];
    const key = (x: number, z: number) => `${x},${z}`;
    const q: Array<{ x: number; z: number }> = [from];
    const prev = new Map<string, string | null>();
    prev.set(key(from.x, from.z), null);
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    while (q.length) {
      const cur = q.shift()!;
      if (cur.x === to.x && cur.z === to.z) break;
      for (const [dx, dz] of dirs) {
        const nx = cur.x + dx;
        const nz = cur.z + dz;
        const k = key(nx, nz);
        if (!inBounds(nx, nz) || blocked.has(k) || prev.has(k)) continue;
        prev.set(k, key(cur.x, cur.z));
        q.push({ x: nx, z: nz });
      }
    }
    const endK = key(to.x, to.z);
    if (!prev.has(endK)) return [];
    const path: Array<{ x: number; z: number }> = [];
    let ck: string | null = endK;
    while (ck) {
      const [x, z] = ck.split(",").map(Number);
      path.push({ x, z });
      ck = prev.get(ck) ?? null;
    }
    path.reverse();
    return path;
  }

  let moving = false;
  async function walkPath(path: Array<{ x: number; z: number }>): Promise<void> {
    if (path.length <= 1) return;
    moving = true;
    clearMarkers();
    for (let i = 1; i < path.length; i++) {
      const m = MeshBuilder.CreateBox(`m${i}`, { width: 0.35, height: 0.05, depth: 0.35 }, scene);
      const w = cellToWorld(path[i].x, path[i].z);
      m.position = new Vector3(w.x, 0.04, w.z);
      m.material = markerMat;
      markers.push(m);
    }
    for (let i = 1; i < path.length; i++) {
      const step = path[i];
      const target = cellToWorld(step.x, step.z);
      const start = hero.position.clone();
      const end = new Vector3(target.x, 0.7, target.z);
      const t0 = performance.now();
      const dur = 140;
      await new Promise<void>((resolve) => {
        const tick = () => {
          const u = Math.min(1, (performance.now() - t0) / dur);
          hero.position = Vector3.Lerp(start, end, u);
          if (u >= 1) resolve();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      heroCell = { x: step.x, z: step.z };
      const m = markers.shift();
      m?.dispose();
    }
    moving = false;
  }

  scene.onPointerObservable.add((pi) => {
    if (pi.type !== PointerEventTypes.POINTERPICK) return;
    if (moving) return;
    const pick = scene.pick(scene.pointerX, scene.pointerY, (m) => m === ground);
    if (!pick?.hit || !pick.pickedPoint) return;
    const cx = Math.round(pick.pickedPoint.x / CELL);
    const cz = Math.round(pick.pickedPoint.z / CELL);
    const path = findPath(heroCell, { x: cx, z: cz });
    const limited = path.slice(0, 5);
    if (limited.length > 1) void walkPath(limited);
  });

  const hud = document.createElement("div");
  hud.style.cssText =
    "position:fixed;left:12px;top:12px;z-index:10;color:#e8dcc0;font:14px/1.4 'Roboto Condensed',sans-serif;" +
    "background:rgba(17,18,16,0.82);padding:10px 14px;border:1px solid #5a4a32;border-radius:4px;max-width:320px;";
  hud.innerHTML =
    "<b>Оплот — R0/R1 prototype</b><br/>" +
    "Изометрия · клик/тап по клетке — ход (до 4 клеток)<br/>" +
    "Коричневые блоки — укрытия · полные блокируют путь<br/>" +
    "<span style='opacity:.7'>Legacy 2D: ?mode=2d</span>";
  document.body.appendChild(hud);

  window.addEventListener("resize", () => engine.resize());
  engine.runRenderLoop(() => {
    scene.render();
  });
}
