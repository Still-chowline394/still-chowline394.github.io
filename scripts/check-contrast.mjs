#!/usr/bin/env node
/**
 * 对比度审计 —— 零第三方依赖，fail loud
 * ----------------------------------------------------------------------------
 * 规则：
 *   1. 颜色字面量只允许出现在 src/styles/tokens.css，且必须是
 *      light-dark(浅色, 深色) 双值形态；否则本脚本判红（防漏检）。
 *   2. 每对前景/背景有显式阈值；不满足且**未登记豁免理由** → 非零退出。
 *      "不足要有兜底说明"——exempt 字段就是那个说明。
 *   3. 令牌名写错 / 缺失 → 非零退出，不静默跳过。
 *
 * 用法：npm run contrast
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'src/styles/tokens.css'), 'utf8');

/* ---------------------------------------------------------------- 解析令牌 */

const LIGHT_DARK_RE =
  /--([\w-]+)\s*:\s*light-dark\(\s*(#[0-9a-fA-F]{3,8})\s*,\s*(#[0-9a-fA-F]{3,8})\s*\)/g;
// 非全局副本：带 g 的正则配 test() 会推进 lastIndex，导致漏判（本脚本踩过）
const LIGHT_DARK_VALUE_ONCE =
  /^\s*light-dark\(\s*(#[0-9a-fA-F]{3,8})\s*,\s*(#[0-9a-fA-F]{3,8})\s*\)\s*$/;
const ANY_DECL_RE = /--([\w-]+)\s*:\s*([^;]+);/g;

const light = new Map();
const dark = new Map();
for (const m of css.matchAll(LIGHT_DARK_RE)) {
  light.set(m[1], m[2].toLowerCase());
  dark.set(m[1], m[3].toLowerCase());
}

// 每个颜色令牌都必须是 light-dark 双值形态，否则漏检
const problems = [];
for (const m of css.matchAll(ANY_DECL_RE)) {
  const name = m[1];
  const value = m[2].trim();
  if (!name.startsWith('color-')) continue;
  if (!LIGHT_DARK_VALUE_ONCE.test(value)) {
    problems.push(`令牌 --${name} 不是 light-dark(浅, 深) 双值形态：${value}`);
  }
}

if (light.size === 0) {
  problems.push('没有解析到任何 light-dark 颜色令牌——tokens.css 结构可能已变');
}

/* ---------------------------------------------------------------- WCAG 计算 */

function parseHex(hex) {
  const h = hex.replace('#', '');
  if (h.length === 3) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    };
  }
  if (h.length === 6 || h.length === 8) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  throw new Error(`无法解析颜色：${hex}`);
}

function toLinear(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex) {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* ---------------------------------------------------------------- 检查表 */

// min: WCAG 阈值。exempt: 不满足时的兜底说明——必须有，否则判红。
// scope: 'both' 表示浅色与深色都查。
// 分组对应 tokens.css 的两组令牌：chrome（四周）与 surface（文章区）。
const CHECKS = [
  /* ── chrome 组：页面四周与按键 ── */
  { fg: 'color-chrome-fg', bg: 'color-bg', min: 4.5, scope: 'both' },
  { fg: 'color-chrome-muted', bg: 'color-bg', min: 4.5, scope: 'both' },
  { fg: 'color-chrome-fg', bg: 'color-chrome', min: 4.5, scope: 'both' },
  { fg: 'color-chrome-muted', bg: 'color-chrome', min: 4.5, scope: 'both' },
  { fg: 'color-chrome-fg', bg: 'color-chrome-subtle', min: 4.5, scope: 'both' },
  {
    fg: 'color-chrome-muted',
    bg: 'color-chrome-subtle',
    min: 4.5,
    scope: 'both',
  },
  {
    // 阈值按 WCAG 1.4.11「图形件 ≥ 3:1」给，实测不满足 → 走下面的豁免登记
    fg: 'color-chrome-border',
    bg: 'color-bg',
    min: 3,
    scope: 'both',
    exempt:
      '装饰性分隔线（页头/页脚横线），不承担识别 UI 组件或状态的功能（WCAG 1.4.11 不适用）',
  },

  /* ── surface 组：文章区那张中性白纸 ── */
  { fg: 'color-surface-fg', bg: 'color-surface', min: 4.5, scope: 'both' },
  { fg: 'color-surface-muted', bg: 'color-surface', min: 4.5, scope: 'both' },
  { fg: 'color-code-fg', bg: 'color-code-bg', min: 4.5, scope: 'both' },
  {
    fg: 'color-surface-border',
    bg: 'color-surface',
    min: 3,
    scope: 'both',
    exempt:
      '文章区块与表格的描边，不用于识别交互控件（WCAG 1.4.11 不适用）',
  },

  /* ── 重音：褪色的红 ── */
  { fg: 'color-accent', bg: 'color-bg', min: 4.5, scope: 'both' },
  { fg: 'color-accent', bg: 'color-surface', min: 4.5, scope: 'both' },
  { fg: 'color-accent', bg: 'color-chrome-subtle', min: 4.5, scope: 'both' },
  { fg: 'color-accent', bg: 'color-accent-subtle', min: 4.5, scope: 'both' },
  { fg: 'color-surface-fg', bg: 'color-accent-subtle', min: 4.5, scope: 'both' },
  { fg: 'color-fg-on-accent', bg: 'color-accent', min: 4.5, scope: 'both' },
];

/* ---------------------------------------------------------------- 执行 */

const rows = [];
let failed = 0;

function run(scope, table) {
  for (const check of CHECKS) {
    if (check.scope !== 'both' && check.scope !== scope) continue;

    const fg = table.get(check.fg);
    const bg = table.get(check.bg);
    if (!fg) {
      problems.push(`[${scope}] 检查表引用了不存在的令牌 --${check.fg}`);
      failed++;
      continue;
    }
    if (!bg) {
      problems.push(`[${scope}] 检查表引用了不存在的令牌 --${check.bg}`);
      failed++;
      continue;
    }

    const ratio = contrast(fg, bg);
    const ok = ratio >= check.min;
    if (!ok && !check.exempt) failed++;

    rows.push({
      scope,
      fg: check.fg,
      bg: check.bg,
      fgHex: fg,
      bgHex: bg,
      min: check.min,
      ratio,
      ok,
      exempt: check.exempt,
    });
  }
}

run('light', light);
run('dark', dark);

/* ---------------------------------------------------------------- 输出 */

const pad = (s, n) => String(s).padEnd(n);
console.log('对比度审计 —— src/styles/tokens.css');
console.log('-'.repeat(76));
console.log(
  pad('模式', 6) +
    pad('前景', 22) +
    pad('背景', 22) +
    pad('实测', 8) +
    pad('阈值', 6) +
    '结论',
);
console.log('-'.repeat(76));

for (const r of rows) {
  const verdict = r.ok ? '通过' : r.exempt ? '豁免' : '不通过';
  console.log(
    pad(r.scope, 6) +
      pad(r.fg.replace('color-', ''), 22) +
      pad(r.bg.replace('color-', ''), 22) +
      pad(r.ratio.toFixed(2) + ':1', 8) +
      pad(r.min.toFixed(1), 6) +
      verdict,
  );
}

console.log('-'.repeat(76));

const exempted = rows.filter((r) => !r.ok && r.exempt);
for (const r of exempted) {
  console.log(`豁免登记：--${r.fg} / --${r.bg}（${r.scope}） ${r.exempt}`);
}

if (problems.length > 0) {
  console.error('\n结构问题（fail loud）：');
  for (const p of problems) console.error('  - ' + p);
}

if (failed > 0) {
  console.error(`\n共 ${failed} 项不通过且无豁免理由。`);
  process.exit(1);
}
if (problems.length > 0) {
  console.error('\n存在结构问题。');
  process.exit(1);
}

console.log(
  `\n全部通过：${rows.length} 项检查，${exempted.length} 项登记豁免。`,
);
