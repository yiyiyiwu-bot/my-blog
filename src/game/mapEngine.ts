// 2D 俯視地圖：畫地圖、讓小人物走動、踩到場所就通知外面。
// 手機：點哪裡就走過去；電腦：方向鍵或 WASD。

import { LEGEND, SHEET, SHEET_COLS, TILE, type WorldMap } from './world';

export interface MapOptions {
  host: HTMLElement; // 放畫布的容器
  map: WorldMap;
  sprite: number; // 玩家人物圖
  done: Set<string>; // 已經去過的場所 id
  pos?: [number, number]; // 從哪一格開始（回到地圖時接著原本的位置）
  onPlace: (placeId: string, pos: [number, number]) => void;
  onExit: () => void;
}

const STEP_MS = 180; // 走一格要多久
const DIRS: Record<string, [number, number, number]> = {
  ArrowRight: [1, 0, 0],
  KeyD: [1, 0, 0],
  ArrowDown: [0, 1, 1],
  KeyS: [0, 1, 1],
  ArrowUp: [0, -1, 2],
  KeyW: [0, -1, 2],
  ArrowLeft: [-1, 0, 3],
  KeyA: [-1, 0, 3],
};

let sheet: HTMLImageElement | null = null;
function loadSheet(): Promise<HTMLImageElement> {
  if (sheet?.complete) return Promise.resolve(sheet);
  sheet = new Image();
  sheet.src = SHEET;
  return new Promise((resolve) => sheet!.addEventListener('load', () => resolve(sheet!), { once: true }));
}

// 回傳一個停止函式；離開地圖時一定要呼叫，才會移除鍵盤監聽和動畫
export function startMap(opts: MapOptions): () => void {
  const { host, map, sprite, done, onPlace, onExit } = opts;
  const W = map.rows[0].length;
  const H = map.rows.length;
  const canvas = document.createElement('canvas');
  canvas.className = 'game-map-canvas';
  host.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;

  const placeAt = (x: number, y: number) =>
    map.places.find((p) => !done.has(p.id) && p.tiles.some(([px, py]) => px === x && py === y));
  const allDone = () => map.places.every((p) => done.has(p.id));
  const isExit = (x: number, y: number) => allDone() && x === map.exit[0] && y === map.exit[1];
  const solid = (x: number, y: number) =>
    x < 0 || y < 0 || x >= W || y >= H || !!LEGEND[map.rows[y][x]]?.solid || map.npcs.some((n) => n.x === x && n.y === y);

  // 玩家狀態：所在格、正在走向的格、面向、走路進度
  let [px, py] = opts.pos ?? map.start;
  let from: [number, number] = [px, py];
  let moveStart = 0;
  let moving = false;
  let dir = 1;
  let path: [number, number][] = [];
  let held: string | null = null;
  let stopped = false;
  let scale = 2;

  function resize() {
    const cssW = host.clientWidth;
    scale = cssW >= 600 ? 3 : 2;
    const cssH = Math.min(H * TILE * scale, Math.round(window.innerHeight * 0.62));
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  function tile(img: HTMLImageElement, index: number, dx: number, dy: number) {
    const sx = (index % SHEET_COLS) * TILE;
    const sy = Math.floor(index / SHEET_COLS) * TILE;
    ctx.drawImage(img, sx, sy, TILE, TILE, dx, dy, TILE * scale, TILE * scale);
  }

  // 找一條從玩家走到 (tx, ty) 的路（只走上下左右）
  function findPath(tx: number, ty: number): [number, number][] {
    if (solid(tx, ty)) return [];
    const key = (x: number, y: number) => y * W + x;
    const prev = new Map<number, number>();
    const queue: [number, number][] = [[px, py]];
    prev.set(key(px, py), -1);
    while (queue.length) {
      const [x, y] = queue.shift()!;
      if (x === tx && y === ty) break;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (solid(nx, ny) || prev.has(key(nx, ny))) continue;
        prev.set(key(nx, ny), key(x, y));
        queue.push([nx, ny]);
      }
    }
    if (!prev.has(key(tx, ty))) return [];
    const out: [number, number][] = [];
    for (let k = key(tx, ty); k !== key(px, py); k = prev.get(k)!) out.unshift([k % W, Math.floor(k / W)]);
    return out;
  }

  function tryStep(dx: number, dy: number, d: number) {
    dir = d;
    if (solid(px + dx, py + dy)) return false;
    from = [px, py];
    px += dx;
    py += dy;
    moving = true;
    moveStart = performance.now();
    return true;
  }

  // 走完一格之後：檢查有沒有踩到場所或出口
  function arrived() {
    moving = false;
    const place = placeAt(px, py);
    if (place) {
      path = [];
      held = null;
      onPlace(place.id, [px, py]);
      return;
    }
    if (isExit(px, py)) {
      path = [];
      held = null;
      onExit();
    }
  }

  function update(now: number) {
    if (moving && now - moveStart >= STEP_MS) arrived();
    if (stopped || moving) return;
    if (held) {
      const [dx, dy, d] = DIRS[held];
      tryStep(dx, dy, d);
    } else if (path.length) {
      const [nx, ny] = path.shift()!;
      const dx = nx - px;
      const dy = ny - py;
      const d = dx > 0 ? 0 : dx < 0 ? 3 : dy > 0 ? 1 : 2;
      if (!tryStep(dx, dy, d)) path = [];
    }
  }

  function draw(img: HTMLImageElement, now: number) {
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    const size = TILE * scale;
    // 走路中的位置（在兩格之間）
    const t = moving ? Math.min(1, (now - moveStart) / STEP_MS) : 1;
    const fx = from[0] + (px - from[0]) * t;
    const fy = from[1] + (py - from[1]) * t;
    // 鏡頭跟著玩家，但不超出地圖邊界
    const camX = Math.max(0, Math.min(W * size - cssW, (fx + 0.5) * size - cssW / 2));
    const camY = Math.max(0, Math.min(H * size - cssH, (fy + 0.5) * size - cssH / 2));
    const ox = W * size < cssW ? (cssW - W * size) / 2 : -camX;
    const oy = H * size < cssH ? (cssH - H * size) / 2 : -camY;

    ctx.fillStyle = '#2b2620';
    ctx.fillRect(0, 0, cssW, cssH);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const cell = LEGEND[map.rows[y][x]];
        if (!cell) continue;
        tile(img, cell.ground, ox + x * size, oy + y * size);
        if (cell.over !== undefined) tile(img, cell.over, ox + x * size, oy + y * size);
      }
    }

    // 還沒去過的場所：發光的圈
    const pulse = 0.5 + 0.5 * Math.sin(now / 300);
    for (const p of map.places) {
      if (done.has(p.id)) continue;
      for (const [x, y] of p.tiles) {
        ctx.fillStyle = `rgba(255, 214, 102, ${0.25 + 0.3 * pulse})`;
        ctx.fillRect(ox + x * size + 2, oy + y * size + 2, size - 4, size - 4);
      }
    }
    if (allDone()) {
      ctx.fillStyle = `rgba(140, 220, 255, ${0.3 + 0.35 * pulse})`;
      ctx.fillRect(ox + map.exit[0] * size + 2, oy + map.exit[1] * size + 2, size - 4, size - 4);
    }

    // NPC 和玩家
    for (const n of map.npcs) tile(img, n.sprite + n.dir, ox + n.x * size, oy + n.y * size);
    const frame = moving ? 1 + (Math.floor(now / 140) % 2) : 0;
    tile(img, sprite + frame * SHEET_COLS + dir, ox + fx * size, oy + fy * size);

    // 場所名稱
    ctx.font = `bold ${scale === 3 ? 14 : 12}px "Noto Serif TC", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const label = (text: string, x: number, y: number, color: string) => {
      const w = ctx.measureText(text).width + 12;
      ctx.fillStyle = 'rgba(20, 16, 10, 0.75)';
      ctx.fillRect(x - w / 2, y - 20, w, 18);
      ctx.fillStyle = color;
      ctx.fillText(text, x, y - 4);
    };
    for (const p of map.places) {
      const xs = p.tiles.map(([x]) => x);
      const cx = ox + ((Math.min(...xs) + Math.max(...xs) + 1) / 2) * size;
      const cy = oy + p.tiles[0][1] * size;
      label(done.has(p.id) ? `${p.label} ✓` : p.label, cx, cy, done.has(p.id) ? '#bbbbbb' : '#ffd666');
    }
    if (allDone()) label('繼續人生 →', ox + (map.exit[0] + 0.5) * size - 30, oy + map.exit[1] * size, '#8cdcff');
  }

  let raf = 0;
  loadSheet().then((img) => {
    if (stopped) return;
    resize();
    const loop = (now: number) => {
      if (stopped) return;
      update(now);
      draw(img, now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  });

  const onKeyDown = (e: KeyboardEvent) => {
    if (!DIRS[e.code]) return;
    e.preventDefault();
    held = e.code;
    path = [];
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.code === held) held = null;
  };
  const onPointer = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    const size = TILE * scale;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    const camX = Math.max(0, Math.min(W * size - cssW, (px + 0.5) * size - cssW / 2));
    const camY = Math.max(0, Math.min(H * size - cssH, (py + 0.5) * size - cssH / 2));
    const ox = W * size < cssW ? (cssW - W * size) / 2 : -camX;
    const oy = H * size < cssH ? (cssH - H * size) / 2 : -camY;
    const tx = Math.floor((e.clientX - rect.left - ox) / size);
    const ty = Math.floor((e.clientY - rect.top - oy) / size);
    path = findPath(tx, ty);
  };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('resize', resize);
  canvas.addEventListener('pointerdown', onPointer);

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('resize', resize);
    canvas.remove();
  };
}
