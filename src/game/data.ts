// 生命模擬器的內容資料：卡片、人生章節、中陰身考驗。
// 要新增章節，就在 chapters 裡多加一個；要新增卡片，就在 cards 裡多加一張（圖片放 public/game/cards/）。

export interface Card {
  id: string;
  name: string;
  img: string;
  quote: string; // 取自戴戴筆記「導師的點滴心語」
}

export interface Choice {
  text: string;
  result: string;
  merit: number; // 陰德，玩家看不到
  cards?: string[]; // 這個選擇會得到的卡片 id（可以不只一張）
  karma?: string; // 惡報：會在下一章開頭出現
}

export interface Chapter {
  id: string;
  title: string;
  text: string;
  choices: Choice[];
}

export interface Trial {
  id: string;
  title: string;
  text: string;
  counters: string[]; // 能抵抗這個考驗的卡片 id
  pass: string;
  fail: string;
}

export const cards: Record<string, Card> = {
  youyi: {
    id: 'youyi',
    name: '友誼',
    img: '/game/cards/youyi.jpg',
    quote: '該相遇的必定相遇，該等待的必須等待，好聚才能好散，友誼因生命而豐富。',
  },
  meide: {
    id: 'meide',
    name: '美德',
    img: '/game/cards/meide.jpg',
    quote: '請將獲得變成獲德，那麼你會發現，一切將是如此的美好。',
  },
  shouhu: {
    id: 'shouhu',
    name: '守護',
    img: '/game/cards/shouhu.jpg',
    quote: '守護不是佔有而是分享。人的守護用真心，事的守護用耐心，物的守護用捨心。',
  },
  zhenxi: {
    id: 'zhenxi',
    name: '珍惜',
    img: '/game/cards/zhenxi.jpg',
    quote: '珍惜學會了放下，你會發現得到的越多。',
  },
  zhuannian: {
    id: 'zhuannian',
    name: '轉念',
    img: '/game/cards/zhuannian.jpg',
    quote: '轉念的障礙來自於習性，性轉命就轉，轉念不過是一念之差。',
  },
  satuo: {
    id: 'satuo',
    name: '灑脫',
    img: '/game/cards/satuo.jpg',
    quote: '看淡了就瀟灑了；看清了就洒脫了。',
  },
};

export const chapters: Chapter[] = [
  {
    id: 'old-friend',
    title: '老朋友的電話',
    text: '多年沒聯絡的老同學突然打電話來，聲音有點發抖。他說家裡出了事，想跟你借一筆錢。你最近手頭也不太寬裕。',
    choices: [
      {
        text: '約他出來見面，先聽他把話說完，能幫多少就幫多少。',
        result: '他紅著眼睛說：「錢是其次，謝謝你還願意聽我說。」後來，你們成了一輩子的朋友。',
        merit: 2,
        cards: ['youyi'],
      },
      {
        text: '說自己最近也很困難，委婉地拒絕。',
        result: '你保住了存款，但從此兩個人再也沒有聯絡。偶爾想起他，心裡有點空空的。',
        merit: 0,
      },
      {
        text: '掛掉電話後，在同學群組裡把他借錢的事當笑話講。',
        result: '大家笑了一陣子，就沒人再提起這件事了。',
        merit: -3,
        karma: '你在群組裡取笑老同學的事傳開了。這次換你遇到難關，打了好幾通電話，卻沒有一個人接。',
      },
    ],
  },
  {
    id: 'wallet',
    title: '掉在地上的錢包',
    text: '下班路上，你撿到一個鼓鼓的錢包，裡面有好幾萬塊現金，還有一張身分證。四周一個人都沒有。',
    choices: [
      {
        text: '照著身分證上的地址，親自把錢包送回去。',
        result: '失主是一位老奶奶，那是她要繳醫藥費的錢。她握著你的手，一直說謝謝。',
        merit: 2,
        cards: ['meide'],
      },
      {
        text: '把錢包交給附近的派出所。',
        result: '警察登記好，說會幫忙聯絡失主。你做了對的事，只是不知道後來怎麼樣了。',
        merit: 1,
      },
      {
        text: '把錢拿走，錢包丟進垃圾桶。',
        result: '你口袋裡多了一筆錢，走路都輕快了起來。',
        merit: -3,
        karma: '那筆不屬於你的錢，很快就花光了。不久之後，你自己的皮夾也被偷了，裡面是整個月的薪水。',
      },
    ],
  },
  {
    id: 'kitten',
    title: '雨夜的小貓',
    text: '下大雨的晚上，巷口的紙箱裡有一隻全身濕透的小貓，一直叫個不停。你家空間不大，也從來沒養過動物。',
    choices: [
      {
        text: '帶回家擦乾、餵飽牠，再幫牠找到一個願意好好照顧牠的家。',
        result: '送走小貓那天，你有點捨不得。新主人每個月都傳照片給你，牠長得又胖又好。',
        merit: 2,
        cards: ['shouhu'],
      },
      {
        text: '把紙箱移到屋簷下，放一點食物就離開。',
        result: '第二天早上，紙箱空了。你希望牠是被好心人帶走了。',
        merit: 1,
      },
      {
        text: '嫌牠太吵，把紙箱踢到更遠的水溝邊。',
        result: '叫聲終於變小了，你回家睡了個好覺。',
        merit: -3,
        karma: '某個深夜，你獨自生病發高燒，想找人幫忙，身邊卻一個人也沒有。你忽然想起那個雨夜的叫聲。',
      },
    ],
  },
  {
    id: 'sewing-machine',
    title: '媽媽的舊縫紉機',
    text: '整理老家的時候，你看到媽媽用了三十年的縫紉機。家人說它太占空間，叫你拿去回收。媽媽沒有說話，只是一直摸著它。',
    choices: [
      {
        text: '把它留下來，請媽媽教你用它縫一個小東西。',
        result: '那個下午，媽媽一邊踩著縫紉機，一邊說年輕時候的故事。那個縫得歪歪的小布包，你帶在身邊好多年。',
        merit: 2,
        cards: ['zhenxi', 'shouhu'],
      },
      {
        text: '拍幾張照片留念，再拿去回收。',
        result: '你把照片拿給媽媽看，她點點頭說：「也好。」',
        merit: 1,
      },
      {
        text: '不耐煩地說「舊東西留著幹嘛」，直接搬走。',
        result: '房間變得好寬敞。媽媽那天晚上很早就睡了。',
        merit: -2,
        karma: '後來媽媽不在了。你翻遍了整個家，想找一樣她留下來的東西，卻什麼都找不到。',
      },
    ],
  },
  {
    id: 'stolen-credit',
    title: '被搶走的功勞',
    text: '你熬了好幾個晚上做出來的企劃，主管在大會上說成是自己的點子，還得到了表揚。同事們都在偷看你的反應。',
    choices: [
      {
        text: '深呼吸，告訴自己：做得出好東西是我的本事，誰也拿不走。然後把下一個企劃做得更好。',
        result: '半年後，真正懂行的人看出來了，主動找你合作一個更大的案子。',
        merit: 2,
        cards: ['zhuannian'],
      },
      {
        text: '私下找主管，平靜地把話說清楚。',
        result: '主管有點尷尬。從那之後，每份報告上都會寫上你的名字。',
        merit: 1,
      },
      {
        text: '在網路上匿名爆料，把主管罵得很難聽。',
        result: '文章被瘋狂轉傳，你看著留言，覺得出了一口氣。',
        merit: -3,
        karma: '你匿名寫的那些話被查了出來。從此大家跟你說話都小心翼翼，再也沒有人敢信任你。',
      },
    ],
  },
  {
    id: 'promotion',
    title: '升遷名單',
    text: '你等了好多年的那個位子，最後給了一個比你年輕很多的同事。你心裡很不甘心。',
    choices: [
      {
        text: '真心跟他說恭喜，把自己手上的經驗都交接給他。',
        result: '心裡那塊石頭放下了。少了那個頭銜，你反而多了很多時間陪家人。',
        merit: 2,
        cards: ['satuo'],
      },
      {
        text: '表面上笑著道賀，心裡默默記下這筆帳。',
        result: '你每天上班都覺得悶悶的，那份不甘心跟了你好多年。',
        merit: 0,
      },
      {
        text: '暗中扯他後腿，等著看他出錯。',
        result: '他果然出了幾次包，你在旁邊偷偷笑。',
        merit: -3,
        karma: '你等著看別人跌倒，結果自己先被發現了。那年年底，被請走的人是你。',
      },
    ],
  },
];

export const trials: Trial[] = [
  {
    id: 'attachment',
    title: '眷戀：家人的哭聲',
    text: '你聽見家人在哭，看見你一輩子存下來的房子和存款。一股力量拉著你：「回去吧，那些都是你的，捨得嗎？」',
    counters: ['satuo', 'zhenxi'],
    pass: '你輕輕說了聲謝謝，轉身離開。愛還在，只是你不再抓著不放。',
    fail: '你捨不得，緊緊抓住那些東西不放……',
  },
  {
    id: 'fear',
    title: '恐懼：憤怒的影子',
    text: '黑暗中衝出好多巨大又可怕的影子，對著你怒吼，好像要把你整個吞掉。你好想轉身逃跑。',
    counters: ['zhuannian', 'shouhu'],
    pass: '你沒有逃。你看清楚了——那些影子，原來都是自己心裡的害怕。影子慢慢散了。',
    fail: '你嚇得拚命逃跑，一頭鑽進了一個看起來很安全的洞裡……',
  },
  {
    id: 'mirror',
    title: '業鏡：照出一生的鏡子',
    text: '一面巨大的鏡子出現在你面前，照出你這一生做過的每一個選擇。你好想說：「那不是我的錯，是別人逼我的。」',
    counters: ['meide', 'youyi'],
    pass: '你看著鏡子，坦然承認了一切。鏡子裡浮現出你曾經幫助過的人，他們都對著你微笑。',
    fail: '你不敢看鏡子，一直找理由怪別人，鏡子越來越暗……',
  },
];

// 不用卡片（或用錯卡片）時，要有多少陰德才撐得過去；撐過去會消耗陰德。
export const MERIT_NEEDED = 5;
export const MERIT_COST = 3;
export const START_AGE = 18;
export const DEATH_AGE = 75;
