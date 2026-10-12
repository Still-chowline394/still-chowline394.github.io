import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
// Astro 6 起 zod 从 astro/zod 导入（Zod 4）。旧教程写 astro:content 会失败。
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    // max 让过长的 SEO 标题变成构建失败，而不是上线后才发现
    title: z.string().max(60),
    description: z.string().max(160),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    // slug 显式：URL 与文件名解耦——改标题不动已发布的地址。
    // 缺省回退到 id（即文件名去扩展名）。
    slug: z
      .string()
      .regex(/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/, 'slug 只能含小写字母/数字/连字符/斜杠')
      .optional(),
  }),
});

export const collections = { posts };
