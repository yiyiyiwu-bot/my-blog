import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  output: 'static',
  site: 'https://my-blog.yiyiyiwu.workers.dev',
  integrations: [sitemap()],
});
