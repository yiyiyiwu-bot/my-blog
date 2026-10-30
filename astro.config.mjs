import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  output: 'static',
  site: 'https://my-blog.yiyiyiwu.workers.dev',
  // The member pages (/m/...) and the bless-tree admin page are reachable only by their link, so keep them out of the sitemap.
  integrations: [sitemap({ filter: (page) => { const p = new URL(page).pathname; return !p.startsWith('/m/') && !p.startsWith('/bless-admin'); } })],
});
