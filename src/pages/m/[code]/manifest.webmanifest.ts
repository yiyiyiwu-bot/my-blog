import type { APIRoute } from 'astro';
import { siteConfig } from '../../../site.config';

export function getStaticPaths() {
  return [{ params: { code: siteConfig.memberCode } }];
}

// Name and icon used when a member adds the page to their phone's home screen.
export const GET: APIRoute = () => {
  const manifest = {
    name: siteConfig.memberAppName,
    short_name: siteConfig.memberAppName,
    id: `/m/${siteConfig.memberCode}/`,
    start_url: `/m/${siteConfig.memberCode}/`,
    scope: '/',
    // minimal-ui (not browser) so Android Chrome offers its one-tap install
    // prompt; it keeps a small back/forward bar. iPhone treats it as a bookmark.
    display: 'minimal-ui',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      { src: '/icons/member-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/member-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
};
