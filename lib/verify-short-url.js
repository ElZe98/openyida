/**
 * verify-short-url.js - 宜搭公开访问/分享 URL 验证命令
 *
 * 用法：yidacli verify-short-url <appType> <formUuid> <url>
 *
 * 参数：
 *   appType  - 应用 ID（必填），如 APP_XXX
 *   formUuid - 表单 UUID（必填），如 FORM-XXX
 *   url      - 公开访问或分享路径（必填），如 /o/xxx 或 /s/xxx
 *
 * URL 格式要求：
 *   - /o/xxx：公开访问（对外）
 *   - /s/xxx：组织内分享（对内）
 *   - 路径部分只支持英文、数字、- 和 _
 *
 * 示例：
 *   yidacli verify-short-url APP_XXX FORM-XXX /o/myapp
 */

"use strict";

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const querystring = require("querystring");

const { findProjectRoot, loadCookieData, triggerLogin, refreshCsrfToken, resolveBaseUrl, isLoginExpired, isCsrfTokenExpired } = require('./utils');

// ── 配置读取 ──────────────────────────────────────────
const PROJECT_ROOT = findProjectRoot();
const CONFIG_PATH = path.resolve(PROJECT_ROOT, "config.json");
const CONFIG = fs.existsSync(CONFIG_PATH) ? JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8")) : {};
const DEFAULT_BASE_URL = CONFIG.defaultBaseUrl || "https://www.aliwork.com";

// ── 参数解析 ─────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error("用法: node verify-short-url.js <appType> <formUuid> <url>");
    console.error("示例: node .claude/skills/yida-verify-short-url/scripts/verify-short-url.js \"APP_XXX\" \"FORM-XXX\" \"/o/aaa\"");
    console.error("  支持两种格式：");
    console.error("    /o/xxx - 公开访问（对外）");
    console.error("    /s/xxx - 组织内分享（对内）");
    process.exit(1);
  }
  const url = args[2];
  const urlType = url.startsWith("/o/") ? "open" : url.startsWith("/s/") ? "share" : null;
  return {
    appType: args[0],
    formUuid: args[1],
    url: url,
    urlType: urlType,
  };
}

/**
 * 验证 URL 格式
 * - /o/xxx - 公开访问（对外）
 * - /s/xxx - 组织内分享（对内）
 */
function validateUrl(url, urlType) {
  if (!urlType) {
    throw new Error(`URL 必须以 /o/ 或 /s/ 开头，当前值: ${url}`);
  }
  const pathPart = url.slice(3);
  if (!/^[a-zA-Z0-9_-]+$/.test(pathPart)) {
    throw new Error(`URL 路径部分只支持 a-z A-Z 0-9 _ -，当前值: ${url}`);
  }
  if (pathPart.length === 0) {
    throw new Error(`URL 路径部分不能为空: ${url}`);
  }
  return true;
}

// ── 登录态管理 ───────────────────────────────────────


// ── 发送 GET 请求（支持 302 自动重登录） ─────────────

function sendGetRequest(baseUrl, cookies, requestPath, queryParams) {
  return new Promise((resolve, reject) => {
    const queryString = querystring.stringify(queryParams);
    const fullPath = `${requestPath}?${queryString}`;

    const cookieHeader = cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const parsedUrl = new URL(baseUrl);
    const isHttps = parsedUrl.protocol === "https:";
    const requestModule = isHttps ? https : http;

    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: fullPath,
      method: "GET",
      headers: {
        Origin: baseUrl,
        Referer: baseUrl + "/",
        Cookie: cookieHeader,
        Accept: "application/json, text/json",
        "x-requested-with": "XMLHttpRequest",
      },
      timeout: 30000,
    };

    const request = requestModule.request(requestOptions, (response) => {
      let responseData = "";
      response.on("data", (chunk) => { responseData += chunk; });
      response.on("end", () => {
        console.error(`  HTTP 状态码: ${response.statusCode}`);
        let parsed;
        try {
          parsed = JSON.parse(responseData);
        } catch (parseError) {
          console.error(`  响应内容: ${responseData.substring(0, 500)}`);
          resolve({ success: false, errorMsg: `HTTP ${response.statusCode}: 响应非 JSON` });
          return;
        }
        // 检测登录过期（errorCode: "307"）
        if (isLoginExpired(parsed)) {
          console.error(`  检测到登录过期: ${parsed.errorMsg}`);
          resolve({ __needLogin: true });
          return;
        }
        // 检测 csrf_token 过期（errorCode: "TIANSHU_000030"）
        if (isCsrfTokenExpired(parsed)) {
          console.error(`  检测到 csrf_token 过期: ${parsed.errorMsg}`);
          resolve({ __csrfExpired: true });
          return;
        }
        resolve(parsed);
      });
    });

    request.on("timeout", () => {
      console.error("  ❌ 请求超时");
      request.destroy();
      reject(new Error("请求超时"));
    });

    request.on("error", (requestError) => {
      reject(requestError);
    });

    request.end();
  });
}

// ── 主流程 ────────────────────────────────────────────

async function main() {
  const { appType, formUuid, url, urlType } = parseArgs();
  const urlLabel = urlType === "open" ? "公开访问路径" : "组织内分享路径";

  console.error("=".repeat(50));
  console.error("  verify-short-url - 宜搭 URL 验证工具");
  console.error("=".repeat(50));
  console.error(`\n  应用 ID:      ${appType}`);
  console.error(`  表单 UUID:    ${formUuid}`);
  console.error(`  ${urlLabel}: ${url}`);

  // Step 0: 验证 URL 格式
  console.error("\n📋 Step 0: 验证 URL 格式");
  try {
    validateUrl(url, urlType);
    console.error("  ✅ 格式验证通过");
  } catch (err) {
    console.error(`  ❌ 格式验证失败: ${err.message}`);
    process.exit(1);
  }

  // Step 1: 读取本地登录态
  console.error("\n🔑 Step 1: 读取登录态");
  let cookieData = loadCookieData();
  if (!cookieData) {
    console.error("  ⚠️  未找到本地登录态，触发登录...");
    cookieData = triggerLogin();
  }
  let { cookies } = cookieData;
  let baseUrl = resolveBaseUrl(cookieData);
  console.error(`  ✅ 登录态已就绪（${baseUrl}）`);

  // Step 2: 验证 URL
  console.error("\n🔍 Step 2: 验证 URL");
  console.error("  发送 verifyShortUrl 请求...");
  let { csrf_token: csrfToken } = cookieData;
  
  // 构建请求参数（根据 URL 类型选择参数名）
  const requestParams = {
    _api: "App.verifyShortUrlForm",
    formUuid: formUuid,
    _csrf_token: csrfToken,
    _locale_time_zone_offset: "28800000",
    _stamp: Date.now().toString(),
  };
  
  if (urlType === "open") {
    requestParams.openUrl = url;
  } else {
    requestParams.shareUrl = url;
  }

  let result = await sendGetRequest(
    baseUrl,
    cookies,
    `/dingtalk/web/${appType}/query/formdesign/verifyShortUrl.json`,
    requestParams
  );

  if (result && result.__csrfExpired) {
    cookieData = refreshCsrfToken();
    csrfToken = cookieData.csrf_token;
    cookies = cookieData.cookies;
    baseUrl = resolveBaseUrl(cookieData);
    requestParams._csrf_token = csrfToken;
    requestParams._stamp = Date.now().toString();
    console.error("  🔄 重新发送 verifyShortUrl 请求（csrf_token 已刷新）...");
    result = await sendGetRequest(
      baseUrl,
      cookies,
      `/dingtalk/web/${appType}/query/formdesign/verifyShortUrl.json`,
      requestParams
    );
  }

  if (result && result.__needLogin) {
    cookieData = triggerLogin();
    csrfToken = cookieData.csrf_token;
    cookies = cookieData.cookies;
    baseUrl = resolveBaseUrl(cookieData);
    requestParams._csrf_token = csrfToken;
    requestParams._stamp = Date.now().toString();
    console.error("  🔄 重新发送 verifyShortUrl 请求...");
    result = await sendGetRequest(
      baseUrl,
      cookies,
      `/dingtalk/web/${appType}/query/formdesign/verifyShortUrl.json`,
      requestParams
    );
  }

  // 输出结果
  console.error("\n" + "=".repeat(50));
  if (result && !result.__needLogin && !result.__csrfExpired) {
    if (result.success && result.content) {
      console.error("  ✅ URL 可用！");
      console.error("=".repeat(50));
      console.log(JSON.stringify({
        available: true,
        url: url,
        urlType: urlType,
        message: urlType === "open" ? "该公开访问路径可用" : "该组织内分享路径可用"
      }, null, 2));
    } else {
      console.error("  ❌ URL 被占用");
      console.error("=".repeat(50));
      console.log(JSON.stringify({
        available: false,
        url: url,
        urlType: urlType,
        message: result.errorMsg || "该短链接已被占用",
        errorCode: result.errorCode
      }, null, 2));
    }
  } else {
    console.error("  ❌ 验证请求失败");
    console.error("=".repeat(50));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`\n❌ 验证异常: ${error.message}`);
  process.exit(1);
});
