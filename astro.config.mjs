import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { SITE_URL } from './src/site.config';

// Astro 7 起默认 Markdown 处理器为 Sätteri（Rust），remark/rehype 不再默认安装。
// 本项目**刻意不装** remark/rehype：GFM 与 frontmatter 由 Sätteri 原生提供。
// 若将来确需 unified 插件，须 `npm i @astrojs/markdown-remark` 并改用 processor: unified({...})。
//
// ★ 数学公式必须显式开启。Sätteri 的 Features 里 math 的默认值是 **false**
//   （见 satteri/dist/compile.d.ts：`math?: boolean | MathOptions; // Default: false`）。
//   不开的后果不是"公式不渲染"这么温和——`$...{x}...$` 会当普通文本交给 MDX 的
//   JSX 解析，`{x}` 变成表达式 ⇒ `ReferenceError: x is not defined`，**整页构建失败**。
//   2026-10-13 实测踩到。
export default defineConfig({
  // 部署到 GitHub Pages 用户主页（仓库名 = rustin-beep.github.io）⇒ 根路径，无 base。
  // 地址取自 site.config.ts，避免第二处硬编码。
  site: SITE_URL,
  integrations: [mdx(), sitemap()],
  markdown: {
    processor: satteri({ features: { math: true } }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
});
