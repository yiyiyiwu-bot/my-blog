import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    coverImage: z.string().optional(),
    coverImage2: z.string().optional(),
    coverImageAlt: z.string().default(''),
    excerpt: z.string().default(''),
    draft: z.boolean().default(false),
    fontFamily: z.enum(['default', 'pmingliu', 'biaukai', 'jhenghei', 'notoserif']).default('default'),
    fontSize: z.enum(['small', 'normal', 'large', 'xlarge']).default('normal'),
  }),
});

const categories = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/categories' }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    password: z.string().optional(),
    passwordHint: z.string().default(''),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string().default(''),
    intro: z.string().default(''),
    sidebarLabel: z.string().default('文章首頁'),
    qrImage: z.string().optional(),
    fontFamily: z.enum(['default', 'pmingliu', 'biaukai', 'jhenghei']).default('default'),
    fontSize: z.enum(['small', 'normal', 'large', 'xlarge']).default('normal'),
  }),
});

const home = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/home' }),
  schema: z.object({
    title: z.string().default(''),
    homeText: z.string().default(''),
    image: z.string().optional(),
    imagePosition: z.enum(['left', 'right']).default('left'),
    pageIntro: z.string().default(''),
    detailImage: z.string().optional(),
    order: z.number().default(0),
    linkUrl: z.string().optional(),
  }),
});

export const collections = { blog, categories, pages, home };
