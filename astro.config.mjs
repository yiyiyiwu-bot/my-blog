import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  output: 'static',
  site: 'https://my-blog.yiyiyiwu.workers.dev',
  // The member pages (/m/...) are reachable only by their link, so keep them out of the sitemap.
  integrations: [sitemap({ filter: (page) => !new URL(page).pathname.startsWith('/m/') })],
});
