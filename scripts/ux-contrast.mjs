/* One-off UX audit: WCAG contrast ratios for theme color pairs from globals.css. */
import { readFileSync } from "node:fs";

// OKLCH -> OKLab -> linear sRGB -> relative luminance (WCAG)
function oklchToLinearSrgb(L, C, H) {
  const hr = (H * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return {
    r: +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

function parseOklch(value) {
  const m = value.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\)/);
  if (!m) return null;
  return {
    L: +m[1],
    C: +m[2],
    H: +m[3],
    alpha: m[4] ? parseFloat(m[4]) / (m[4].includes("%") ? 100 : 1) : 1,
  };
}

function luminance({ r, g, b }) {
  const f = (c) => Math.pow(Math.min(1, Math.max(0, c)), 2.2); // linear -> gamma approx via luminance formula below uses linear values directly
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function blendOver(fg, bg, alpha) {
  return {
    r: fg.r * alpha + bg.r * (1 - alpha),
    g: fg.g * alpha + bg.g * (1 - alpha),
    b: fg.b * alpha + bg.b * (1 - alpha),
  };
}

function contrast(fgLin, bgLin) {
  const l1 = luminance(fgLin);
  const l2 = luminance(bgLin);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

const css = readFileSync("app/globals.css", "utf8");
function parseBlock(name) {
  const block = css.match(new RegExp(`${name.replace(":", "\\:")}\\s*\\{([^}]*)\\}`))[1];
  const vars = {};
  for (const m of block.matchAll(/--([\w-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
  return vars;
}

const light = parseBlock(":root");
const dark = parseBlock(".dark");

const PAIRS = [
  ["foreground", "background", "основной текст"],
  ["muted-foreground", "background", "второстепенный текст на фоне"],
  ["muted-foreground", "card", "второстепенный текст на карточке"],
  ["card-foreground", "card", "текст карточки"],
  ["primary-foreground", "primary", "текст на primary-кнопке"],
  ["secondary-foreground", "secondary", "текст на secondary"],
  ["accent-foreground", "accent", "текст на accent (hover)"],
  ["destructive", "background", "destructive (просрочка/ошибки)"],
  ["destructive-foreground", "destructive", "текст на destructive-кнопке/бейдже"],
  ["sidebar-foreground", "sidebar", "текст сайдбара"],
  ["sidebar-primary-foreground", "sidebar-primary", "primary сайдбара"],
  ["border", "background", "границы (не текст, цель 3:1)"],
];

function report(themeName, vars) {
  console.log(`\n=== ${themeName} ===`);
  for (const [fgName, bgName, label] of PAIRS) {
    const fg = parseOklch(vars[fgName]);
    const bgv = parseOklch(vars[bgName]);
    if (!fg || !bgv) continue;
    let fgLin = oklchToLinearSrgb(fg.L, fg.C, fg.H);
    const bgLin = oklchToLinearSrgb(bgv.L, bgv.C, bgv.H);
    if (fg.alpha < 1) fgLin = blendOver(fgLin, bgLin, fg.alpha);
    const ratio = contrast(fgLin, bgLin);
    const isUiElement = label.includes("границ");
    const aa = isUiElement ? ratio >= 3 : ratio >= 4.5;
    const aaLarge = ratio >= 3;
    const verdict = aa ? "OK AA" : aaLarge && !isUiElement ? "только крупный текст" : "FAIL";
    console.log(
      `${ratio.toFixed(2).padStart(6)}:1  ${verdict.padEnd(22)} ${label} (${fgName} on ${bgName})`,
    );
  }
}

report("LIGHT", light);
report("DARK", dark);
