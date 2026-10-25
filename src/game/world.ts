// 生命模擬器的「人生主題」：進入某個組別時，先選這一世最在意的主題（例如社會組的家庭、工作、感情）。
// 選了哪個主題，data.ts 裡 roles 有寫這個 id 的故事就會優先出現。

import type { StageId } from './data';

export interface Role {
  id: string;
  stage: StageId;
  name: string;
  blurb: string;
  icon: string; // 卡片上的小圖示
  ready: boolean; // 還不能選的主題會顯示「準備中」
}

export const roles: Role[] = [
  { id: 'family', stage: 'adult', name: '家庭', blurb: '父母、伴侶、孩子，一家人的日常。', icon: '🏠', ready: true },
  { id: 'work', stage: 'adult', name: '工作', blurb: '職場上的人情、壓力和選擇。', icon: '💼', ready: true },
  { id: 'love', stage: 'adult', name: '感情', blurb: '愛情裡的相遇、爭吵與放手。', icon: '❤️', ready: true },
];
