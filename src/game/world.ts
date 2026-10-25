// 生命模擬器的「情節」和「角色」：
// 進入某個組別時，先選情節（例如社會組的家庭、工作、感情）；
// 情節底下如果還有角色（parent 指向那個情節），就再選一個角色。
// 選了哪個情節或角色，data.ts 裡 roles 有寫這個 id 的故事就會優先出現；
// 角色寫了 sequence 的話，那幾個故事會照順序一個接一個玩。

import type { StageId } from './data';

export interface Role {
  id: string;
  stage: StageId;
  name: string;
  blurb: string;
  icon: string; // 卡片上的小圖示
  ready: boolean; // 還不能選的會顯示「準備中」
  parent?: string; // 屬於哪個情節（角色才有）
  sequence?: string[]; // 這個角色依序會遇到的故事 id
}

export const roles: Role[] = [
  // 社會組的三個情節
  { id: 'family', stage: 'adult', name: '家庭', blurb: '父母、伴侶、孩子，一家人的日常。', icon: '🏠', ready: true },
  { id: 'work', stage: 'adult', name: '工作', blurb: '職場上的人情、壓力和選擇。', icon: '💼', ready: true },
  { id: 'love', stage: 'adult', name: '感情', blurb: '愛情裡的相遇、爭吵與放手。', icon: '❤️', ready: true },

  // 工作底下的角色
  {
    id: 'medsoc',
    stage: 'adult',
    parent: 'work',
    name: '醫學會專員',
    blurb: '在醫學會上班，負責醫師的課程和網站。',
    icon: '🩺',
    ready: true,
    sequence: ['med-website'],
  },
  { id: 'more-jobs', stage: 'adult', parent: 'work', name: '更多角色', blurb: '', icon: '➕', ready: false },
];
