/**
 * login.js - 宜搭登录态管理（Playwright 扫码登录）
 *
 * 导出函数：
 *   ensureLogin()          - 确保有效登录态（优先缓存，否则扫码）
 *   checkLoginOnly()       - 仅检查登录态，不触发登录
 *   refreshCsrfFromCache() - 从缓存 Cookie 重新提取 csrf_token
 *   interactiveLogin()     - 打开浏览器扫码登录（需要 playwright）
 *   logout()               - 退出登录，清空 Cookie 缓存
 */

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");
const { findProjectRoot, extractInfoFromCookies, loadCookieData, resolveBaseUrl } = require("./utils");

const DEFAULT_BASE_URL = "https://www.aliwork.com";
const DEFAULT_LOGIN_URL = "https://www.aliwork.com/workPlatform";

// ── 配置读取 ──────────────────────────────────────────

function loadConfig() {
  const projectRoot = findProjectRoot();
  const configPath = path.join(projectRoot, "config.json");
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, "utf-8"));
    } catch {
      // ignore
    }
  }
  return {
    loginUrl: DEFAULT_LOGIN_URL,
    defaultBaseUrl: DEFAULT_BASE_URL,
  };
}

// ── Cookie 持久化 ─────────────────────────────────────

function saveCookieCache(cookies, baseUrl) {
  const projectRoot = findProjectRoot();
  const cacheDir = path.join(projectRoot, ".cache");
  const cookieFile = path.join(cacheDir, "cookies.json");

  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cookieFile, JSON.stringify({ cookies, base_url: baseUrl }, null, 2), "utf-8");
  console.error(`  Cookie 已保存到 ${cookieFile}`);
}

// ── 仅检查登录态 ──────────────────────────────────────

/**
 * 仅检查登录态，不触发登录。
 * @returns {object} 含 can_auto_use 字段的状态对象
 */
function checkLoginOnly() {
  const cookieData = loadCookieData();

  if (!cookieData || !cookieData.cookies) {
    return {
      status: "not_logged_in",
      can_auto_use: false,
      message: "本地无 Cookie 缓存，需要扫码登录",
    };
  }

  const { csrfToken, corpId, userId } = extractInfoFromCookies(cookieData.cookies);

  if (!csrfToken) {
    return {
      status: "not_logged_in",
      can_auto_use: false,
      message: "Cookie 中无 tianshu_csrf_token，需要重新登录",
    };
  }

  const baseUrl = resolveBaseUrl(cookieData);
  return {
    status: "ok",
    can_auto_use: true,
    csrf_token: csrfToken,
    corp_id: corpId,
    user_id: userId,
    base_url: baseUrl,
    cookies: cookieData.cookies,
    message: `✅ 已有有效登录态，可直接使用\n  组织: ${corpId}\n  用户: ${userId}\n  域名: ${baseUrl}`,
  };
}

// ── 从缓存刷新 csrf_token ─────────────────────────────

/**
 * 从本地缓存 Cookie 中重新提取 csrf_token，无需重新扫码。
 * @returns {object} loginResult
 */
function refreshCsrfFromCache() {
  const cookieData = loadCookieData();

  if (!cookieData || !cookieData.cookies) {
    console.error("  ❌ 本地无有效 Cookie，无法刷新，需要重新登录。");
    process.exit(1);
  }

  const { csrfToken, corpId, userId } = extractInfoFromCookies(cookieData.cookies);

  if (!csrfToken) {
    console.error("  ❌ Cookie 中无 tianshu_csrf_token，需要重新登录。");
    process.exit(1);
  }

  const baseUrl = resolveBaseUrl(cookieData);
  console.error(`  ✅ csrf_token 提取成功: ${csrfToken.slice(0, 16)}...`);

  return {
    csrf_token: csrfToken,
    corp_id: corpId,
    user_id: userId,
    base_url: baseUrl,
    cookies: cookieData.cookies,
  };
}

// ── 确保登录态（优先缓存） ────────────────────────────

/**
 * 确保拥有有效的登录态。优先从本地缓存 Cookie 中提取，否则触发扫码登录。
 * @returns {object} loginResult
 */
function ensureLogin() {
  const cookieData = loadCookieData();

  if (cookieData && cookieData.cookies) {
    const { csrfToken, corpId, userId } = extractInfoFromCookies(cookieData.cookies);
    if (csrfToken) {
      console.error("🔍 检测到本地 Cookie，直接使用...");
      console.error(`  ✅ csrf_token: ${csrfToken.slice(0, 16)}...`);
      if (corpId) console.error(`  ✅ corpId: ${corpId}`);
      const baseUrl = resolveBaseUrl(cookieData);
      return {
        csrf_token: csrfToken,
        corp_id: corpId,
        user_id: userId,
        base_url: baseUrl,
        cookies: cookieData.cookies,
      };
    }
  }

  return interactiveLogin();
}

// ── Playwright 扫码登录 ───────────────────────────────

/**
 * 获取 playwright 模块的绝对路径，用于临时脚本中 require。
 * 
 * 查找策略（按优先级）：
 *   1. yidacli 包自身的 node_modules/playwright（最可靠）
 *   2. require.resolve 标准解析
 *   3. 全局 npm root 路径
 * 
 * @returns {string|null} playwright index.js 的绝对路径
 */
function getPlaywrightPath() {
  // 策略1：从 __dirname 向上找到 yidacli 包根目录下的 node_modules/playwright
  // __dirname 是 dist/ 或 src/，向上一级是包根目录
  const candidates = [
    path.join(__dirname, "..", "node_modules", "playwright", "index.js"),
    path.join(__dirname, "..", "..", "node_modules", "playwright", "index.js"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // 策略2：require.resolve 标准解析
  try {
    return require.resolve("playwright");
  } catch {
    // ignore
  }

  // 策略3：全局 npm root 路径
  try {
    const globalRoot = execSync("npm root -g", { encoding: "utf-8" }).trim();
    const globalPlaywright = path.join(globalRoot, "playwright", "index.js");
    if (fs.existsSync(globalPlaywright)) {
      return globalPlaywright;
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * 打开有头浏览器让用户扫码登录（需要安装 playwright）。
 * @returns {object} loginResult
 */
function interactiveLogin() {
  const config = loadConfig();
  const loginUrl = config.loginUrl || DEFAULT_LOGIN_URL;

  // 检查 playwright 是否可用
  const playwrightPath = getPlaywrightPath();
  if (!playwrightPath) {
    console.error("\n❌ 未找到 playwright 模块，请先安装：");
    console.error("   npm install -g playwright");
    console.error("   npx playwright install chromium");
    process.exit(1);
  }

  console.error("\n🔐 正在打开浏览器，请扫码登录...");
  console.error(`  登录地址: ${loginUrl}`);

  // 通过子进程运行异步 playwright 逻辑，避免顶层 await 兼容性问题
  // 使用 require.resolve 获取的绝对路径，确保临时脚本能找到 playwright
  const scriptContent = `
const playwright = require(${JSON.stringify(playwrightPath)});
const { chromium } = playwright;
const { URL } = require('url');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(${JSON.stringify(loginUrl)}, { timeout: 120000 });

  console.error('  等待登录完成（最长等待 10 分钟）...');
  try {
    await page.waitForURL('**/workPlatform**', { timeout: 600000 });
  } catch {
    console.error('  ⏰ 登录超时（10分钟），请重试。');
    await browser.close();
    process.exit(1);
  }

  await page.waitForLoadState('networkidle');
  console.error('  ✅ 登录成功！');

  const postLoginParsed = new URL(page.url());
  const baseUrl = postLoginParsed.origin;
  const cookies = await context.cookies();
  await browser.close();

  console.log(JSON.stringify({ cookies, base_url: baseUrl }));
})();
`;

  const tmpScript = path.join(os.tmpdir(), `yidacli-login-${Date.now()}.js`);
  fs.writeFileSync(tmpScript, scriptContent, "utf-8");

  try {
    const stdout = execSync(`node "${tmpScript}"`, {
      encoding: "utf-8",
      stdio: ["inherit", "pipe", "inherit"],
      timeout: 660000,
    });

    const lines = stdout.trim().split("\n");
    const jsonLine = lines[lines.length - 1];
    const result = JSON.parse(jsonLine);

    const { csrfToken, corpId, userId } = extractInfoFromCookies(result.cookies);
    if (!csrfToken) {
      console.error("  ❌ 登录成功但 Cookie 中无 tianshu_csrf_token，请重试。");
      process.exit(1);
    }

    saveCookieCache(result.cookies, result.base_url);

    console.error(`  ✅ csrf_token: ${csrfToken.slice(0, 16)}...`);
    if (corpId) console.error(`  ✅ corpId: ${corpId}`);

    return {
      csrf_token: csrfToken,
      corp_id: corpId,
      user_id: userId,
      base_url: result.base_url,
      cookies: result.cookies,
    };
  } finally {
    try { fs.unlinkSync(tmpScript); } catch { /* ignore */ }
  }
}

// ── 退出登录 ──────────────────────────────────────────

/**
 * 退出登录：清空项目级 Cookie 文件。
 */
function logout() {
  console.error("=".repeat(50));
  console.error("  yidacli logout - 宜搭退出登录工具");
  console.error("=".repeat(50));

  const projectRoot = findProjectRoot();
  const projectCookieFile = path.join(projectRoot, ".cache", "cookies.json");
  console.error(`\n  Cookie 文件: ${projectCookieFile}`);

  if (fs.existsSync(projectCookieFile)) {
    fs.writeFileSync(projectCookieFile, "", "utf-8");
    console.error("  ✅ 已清空 Cookie，登录态已失效。");
    console.error("  下次调用 yidacli login 时将重新触发扫码登录。");
  } else {
    console.error("  ℹ️  Cookie 文件不存在，无需清空。");
  }

  console.error("=".repeat(50));
}

module.exports = {
  ensureLogin,
  checkLoginOnly,
  refreshCsrfFromCache,
  interactiveLogin,
  logout,
};
