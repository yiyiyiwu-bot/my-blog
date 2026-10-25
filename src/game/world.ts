// 生命模擬器的「走動地圖」：角色、地圖、地圖上可以走進去的場所。
// 圖塊來自 Kenney「RPG Urban Pack」（CC0，public/game/map/），每塊 16×16。
// 圖塊編號 = 在圖塊表上由左到右、由上到下數第幾塊（一排 27 塊，從 0 開始）。

import type { StageId } from './data';

export const TILE = 16;
export const SHEET = '/game/map/kenney-rpg-urban.png';
export const SHEET_COLS = 27;

// 人物圖：每個人物佔 4 欄 × 3 排，sprite 是左上角那一塊的編號。
// 欄：0 面向右、1 面向下、2 面向上、3 面向左；排：0 站著、1～2 走路
export const SPRITES = {
  greenBoy: 23,
  redGirl: 104,
  grandpa: 185,
  worker: 266,
  baldMan: 347,
  officeWorker: 428,
};

export interface Place {
  id: string;
  label: string; // 地圖上顯示的名字
  chapter: string; // 走進去會觸發的故事 id（data.ts 的 chapters）
  tiles: [number, number][]; // 踩到哪幾格會觸發
}

export interface Npc {
  sprite: number;
  x: number;
  y: number;
  dir: number; // 0 右、1 下、2 上、3 左
}

export interface WorldMap {
  id: string;
  rows: string[]; // 每個字代表一格，對照 LEGEND
  start: [number, number]; // 角色出發的位置
  exit: [number, number]; // 場所都去過之後，出現「繼續人生」的位置
  places: Place[];
  npcs: Npc[];
}

// 地圖字元對照：ground 是地面，over 是疊在上面的東西（背景透明），solid 表示走不過去
export const LEGEND: Record<string, { ground: number; over?: number; solid?: boolean }> = {
  '.': { ground: 36 }, // 人行道
  g: { ground: 28 }, // 草地
  r: { ground: 460 }, // 馬路
  '-': { ground: 433 }, // 馬路中線
  z: { ground: 435 }, // 斑馬線
  T: { ground: 28, over: 232, solid: true }, // 樹（上半）
  t: { ground: 28, over: 259, solid: true }, // 樹（下半）
  P: { ground: 28, over: 265, solid: true }, // 小松樹（一格）
  h: { ground: 36, over: 329, solid: true }, // 矮樹叢
  L: { ground: 36, over: 164 }, // 路燈（上半）
  l: { ground: 36, over: 191, solid: true }, // 路燈（下半）
  m: { ground: 36, over: 305, solid: true }, // 郵筒
  b: { ground: 28, over: 270, solid: true }, // 長椅
  // 大樓屋頂（3×3 邊框）
  '1': { ground: 81, solid: true },
  '2': { ground: 82, solid: true },
  '3': { ground: 83, solid: true },
  '4': { ground: 108, solid: true },
  '5': { ground: 109, solid: true },
  '6': { ground: 110, solid: true },
  '7': { ground: 135, solid: true },
  '8': { ground: 136, solid: true },
  '9': { ground: 137, solid: true },
  w: { ground: 72, solid: true }, // 紅磚外牆
  W: { ground: 72, over: 363, solid: true }, // 外牆＋窗戶
  D: { ground: 312, solid: true }, // 玻璃大門
};

// 社會組・上班族：公司、路口
export const officeMap: WorldMap = {
  id: 'office',
  rows: [
    'gTggTggggggggggggTggTg',
    'gtggtg12222223gggtggtg',
    'gggggg45555556gggggggg',
    'gggggg45555556ggTggggg',
    'gggggg78888889ggtggggg',
    '......WWWWWWWW........',
    '..L...wWDDwWWw....L...',
    '..l..............ml...',
    'rrrrrrrrrrrrrrzzrrrrrr',
    '--------------zz------',
    'rrrrrrrrrrrrrrzzrrrrrr',
    '......................',
    'hhh.....hhhhhh.....hhh',
    'ggggg.ggPggggggg.ggggg',
    'gTgTg.gbggggTggg.gTgTg',
    'gtgtg.ggggggtggg.gtgtg',
  ],
  start: [5, 14],
  exit: [21, 11],
  places: [
    { id: 'company', label: '公司', chapter: 'deepfake-boss', tiles: [[8, 7], [9, 7]] },
    { id: 'crossing', label: '路口', chapter: 'crosswalk', tiles: [[14, 7], [15, 7]] },
  ],
  npcs: [{ sprite: SPRITES.grandpa, x: 15, y: 9, dir: 3 }],
};

export interface Role {
  id: string;
  stage: StageId;
  name: string;
  blurb: string;
  sprite: number;
  map?: WorldMap; // 還沒有地圖的角色會顯示「準備中」
}

export const roles: Role[] = [
  { id: 'office', stage: 'adult', name: '上班族', blurb: '朝九晚五，擠捷運、趕打卡。', sprite: SPRITES.officeWorker, map: officeMap },
  { id: 'delivery', stage: 'adult', name: '外送員', blurb: '風雨無阻，送餐到你家。', sprite: SPRITES.greenBoy },
  { id: 'nurse', stage: 'adult', name: '護理師', blurb: '守護病人，日夜輪班。', sprite: SPRITES.redGirl },
  { id: 'shop', stage: 'adult', name: '小吃店老闆', blurb: '一碗麵，撐起一個家。', sprite: SPRITES.baldMan },
];
