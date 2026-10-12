/**
 * 站点身份 —— 单一真相来源
 * ----------------------------------------------------------------------------
 * 名字、头像、GitHub 地址只在本文件出现一次。
 * 改 GITHUB_HANDLE 即整体换名：页头名字、指向的地址、以及头像都会跟着变
 *（头像取 GitHub 直链 `<user>.png`，所以**你在 GitHub 换头像，站点 logo 跟着换**）。
 */

/** GitHub 用户名。改名只需改这一行。 */
export const GITHUB_HANDLE = 'rustin-beep';

/** 站名（GitHub 昵称）。 */
export const SITE_NAME = '不吃谢谢';

/** 一句话简介，用于首页与 RSS 描述。 */
export const SITE_DESCRIPTION = '工程向随笔与思考';

/** GitHub 主页。 */
export const GITHUB_URL = `https://github.com/${GITHUB_HANDLE}`;

/**
 * 站点绝对地址，用于 sitemap 与 RSS 的绝对链接。
 *
 * 当前形态是 GitHub Pages 的**用户主页**（仓库名必须恰好等于
 * `<user>.github.io`），所以地址就是根路径、**不需要 base 前缀**。
 * 若改用普通项目仓库（如 `blog`），这里保持域名不变、但必须同时
 * 在 astro.config.mjs 里加 `base: '/blog'`，否则全站资源都会 404。
 * 若换自定义域名，只改这一行。
 */
export const SITE_URL = `https://${GITHUB_HANDLE}.github.io`;

/**
 * 头像直链。GitHub 会把它 302 到 avatars.githubusercontent.com。
 *
 * 注意：这是**外链**——好处是"跟着头像走"，代价是首页 logo 依赖 GitHub 可达性。
 * 若要摆脱这个依赖，可改为构建期抓取并自托管到 public/（构建多一步网络请求）。
 */
export const avatarUrl = (size = 64) =>
  `https://github.com/${GITHUB_HANDLE}.png?size=${size}`;
