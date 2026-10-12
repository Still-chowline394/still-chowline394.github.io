import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_NAME, SITE_DESCRIPTION } from '../site.config';

export async function GET(context: APIContext) {
  // fail loud：site 未配置时 RSS 无法生成绝对地址，禁静默兜底
  const site = context.site;
  if (!site) {
    throw new Error(
      'astro.config.mjs 未设置 site——RSS 与 sitemap 需要绝对地址。部署前必须改成真实域名。',
    );
  }

  const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

  return rss({
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      // 与路由同源：slug 显式优先，缺省回退 id
      link: `/posts/${post.data.slug ?? post.id}/`,
    })),
    customData: '<language>zh-CN</language>',
  });
}
