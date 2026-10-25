// 生命模擬器的「職業」：進入某個階段時可以選這輩子做什麼。
// 職業卡片上的小人物圖來自 Kenney「RPG Urban Pack」（CC0，public/game/map/），每塊 16×16。

import type { StageId } from './data';

export const TILE = 16;
export const SHEET = '/game/map/kenney-rpg-urban.png';
export const SHEET_COLS = 27;

// 人物圖：每個人物佔 4 欄 × 3 排，sprite 是左上角那一塊的編號（一排 27 塊，從 0 開始）。
// 欄：0 面向右、1 面向下、2 面向上、3 面向左；排：0 站著、1～2 走路
export const SPRITES = {
  greenBoy: 23,
  redGirl: 104,
  grandpa: 185,
  worker: 266,
  baldMan: 347,
  officeWorker: 428,
};

export interface Role {
  id: string;
  stage: StageId;
  name: string;
  blurb: string;
  sprite: number;
  ready: boolean; // 還沒有專屬故事的職業顯示「準備中」
}

export const roles: Role[] = [
  { id: 'office', stage: 'adult', name: '上班族', blurb: '朝九晚五，擠捷運、趕打卡。', sprite: SPRITES.officeWorker, ready: true },
  { id: 'delivery', stage: 'adult', name: '外送員', blurb: '風雨無阻，送餐到你家。', sprite: SPRITES.greenBoy, ready: false },
  { id: 'nurse', stage: 'adult', name: '護理師', blurb: '守護病人，日夜輪班。', sprite: SPRITES.redGirl, ready: false },
  { id: 'shop', stage: 'adult', name: '小吃店老闆', blurb: '一碗麵，撐起一個家。', sprite: SPRITES.baldMan, ready: false },
];
