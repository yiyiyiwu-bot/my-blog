// 網站基本設定 — 之後想改網站名稱、標語,改這一個檔案就好。
export const siteConfig = {
  title: '點滴在心頭',
  tagline: '祝福天下懂得愛的人：\n願你們離苦得樂',
  description: '我們所能夠提供的，是在等待所求的心願時，應該有的心態，當水到渠成時，就能夠收成自己努力改變後，所有的好',
  heroVideo: '',
  heroImages: [{ src: '/images/hero-1.jpg', mobileSrc: '/images/hero-mobile.png', fit: 'cover' }],
  nav: [
    { label: '文章', href: '/articles' },
    { label: '聯絡我們', href: '/contact' },
  ],
  // 學員專用網址:/m/<memberCode>/ — 不用密碼就能看全部文章分類,從 memberEntryCategory 進入。
  // 網站上沒有任何連結通到這裡,這段代碼不要公開。
  memberCode: 'wk739yetx6',
  memberEntryCategory: '每月祝福',
  memberAppName: '每月祝福學員版',
};

// localStorage key set by the member page; password gates skip when it's '1'.
export const MEMBER_ACCESS_KEY = 'member-access';
