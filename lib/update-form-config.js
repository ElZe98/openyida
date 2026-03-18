const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const querystring = require("querystring");

const { findProjectRoot, loadCookieData, triggerLogin, refreshCsrfToken, resolveBaseUrl, isLoginExpired, isCsrfTokenExpired } = require('./utils');

const PROJECT_ROOT = findProjectRoot();
const CONFIG_PATH = path.resolve(PROJECT_ROOT, "config.json");
const CONFIG = fs.existsSync(CONFIG_PATH) ? JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8")) : {};
const DEFAULT_BASE_URL = CONFIG.defaultBaseUrl || "https://www.aliwork.com";

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.length < 4) {
    console.error("用法: node update-form-config.js <appType> <formUuid> <isRenderNav> <title>");
    console.error("示例: node .claude/skills/yida-page-config/scripts/update-form-config.js \"APP_XXX\" \"FORM_XXX\" \"false\" \"我的页面\"");
    console.error("");
    console.error("参数说明:");
    console.error("  isRenderNav: true=显示顶部导航, false=隐藏顶部导航");
    console.error("  title: 页面标题（必填）");
    process.exit(1);
  }
  return {
    appType: args[0],
    formUuid: args[1],
    isRenderNav: args[2],
    title: args[3],
  };
}

function buildPostData(csrfToken, formUuid, isRenderNav, title) {
  const titleJson = JSON.stringify({
    pureEn_US: title,
    en_US: title,
    zh_CN: title,
    envLocale: null,
    type: "i18n",
    ja_JP: null,
    key: null,
  });

  return querystring.stringify({
    _api: "Form.updateFormSchemaInfo",
    _csrf_token: csrfToken,
    _locale_time_zone_offset: "28800000",
    formUuid: formUuid,
    serialSwitch: "n",
    consultPerson: "",
    defaultManager: "n",
    submissionRule: "RESUBMIT",
    redirectConfig: "",
    pushTask: "y",
    defaultOrder: "cd",
    showPrint: "y",
    relateUuid: "",
    title: titleJson,
    pageType: "web,mobile",
    isInner: "y",
    isNew: "n",
    isAgent: "y",
    showAgent: "n",
    showDingGroup: "y",
    reStart: "n",
    previewConfig: "y",
    formulaType: "n",
    displayTitle: "%24%7Blegao_creator%7D%E5%8F%91%E8%B5%B7%E7%9A%84%24%7Blegao_formname%7D",
    displayType: "RE",
    isRenderNav: isRenderNav,
    manageCustomActionInfo: "[]",
  });
}


function sendPostRequest(baseUrl, cookies, requestPath, postData) {
  return new Promise((resolve, reject) => {
    const cookieHeader = cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const parsedUrl = new URL(baseUrl);
    const isHttps = parsedUrl.protocol === "https:";
    const requestModule = isHttps ? https : http;

    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: requestPath,
      method: "POST",
      headers: {
        Origin: baseUrl,
        Referer: baseUrl + "/",
        Cookie: cookieHeader,
        Accept: "application/json, text/json",
        "Content-Type": "application/x-www-form-urlencoded",
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
        if (isLoginExpired(parsed)) {
          console.error(`  检测到登录过期: ${parsed.errorMsg}`);
          resolve({ __needLogin: true });
          return;
        }
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

    request.write(postData);
    request.end();
  });
}

async function main() {
  const { appType, formUuid, isRenderNav, title } = parseArgs();

  console.error("=".repeat(50));
  console.error("  update-form-config - 宜搭表单配置更新工具");
  console.error("=".repeat(50));
  console.error(`\n  应用 ID:      ${appType}`);
  console.error(`  表单 UUID:    ${formUuid}`);
  console.error(`  显示导航:     ${isRenderNav === "true" ? "是" : "否"}`);
  console.error(`  页面标题:     ${title}`);

  console.error("\n🔑 Step 1: 读取登录态");
  let cookieData = loadCookieData();
  if (!cookieData) {
    console.error("  ⚠️  未找到本地登录态，触发登录...");
    cookieData = triggerLogin();
  }
  let { cookies } = cookieData;
  let baseUrl = resolveBaseUrl(cookieData);
  console.error(`  ✅ 登录态已就绪（${baseUrl}）`);

  console.error("\n💾 Step 2: 更新表单配置（隐藏顶部导航）");
  console.error("  发送 updateFormSchemaInfo 请求...");
  let { csrf_token: csrfToken } = cookieData;

  const postData = buildPostData(csrfToken, formUuid, isRenderNav, title);

  let result = await sendPostRequest(
    baseUrl,
    cookies,
    `/dingtalk/web/${appType}/query/formdesign/updateFormSchemaInfo.json`,
    postData
  );

  if (result && result.__csrfExpired) {
    cookieData = refreshCsrfToken();
    csrfToken = cookieData.csrf_token;
    cookies = cookieData.cookies;
    baseUrl = resolveBaseUrl(cookieData);
    const newPostData = buildPostData(csrfToken, formUuid, isRenderNav, title);
    console.error("  🔄 重新发送请求（csrf_token 已刷新）...");
    result = await sendPostRequest(
      baseUrl,
      cookies,
      `/dingtalk/web/${appType}/query/formdesign/updateFormSchemaInfo.json`,
      newPostData
    );
  }

  if (result && result.__needLogin) {
    cookieData = triggerLogin();
    csrfToken = cookieData.csrf_token;
    cookies = cookieData.cookies;
    baseUrl = resolveBaseUrl(cookieData);
    const newPostData = buildPostData(csrfToken, formUuid, isRenderNav, title);
    console.error("  🔄 重新发送请求...");
    result = await sendPostRequest(
      baseUrl,
      cookies,
      `/dingtalk/web/${appType}/query/formdesign/updateFormSchemaInfo.json`,
      newPostData
    );
  }

  console.error("\n" + "=".repeat(50));
  if (result && !result.__needLogin && !result.__csrfExpired) {
    if (result.success) {
      console.error("  ✅ 配置更新成功！");
      console.error("=".repeat(50));
      console.log(JSON.stringify({
        success: true,
        isRenderNav: isRenderNav === "true",
        message: isRenderNav === "true" ? "已显示顶部导航" : "已隐藏顶部导航"
      }, null, 2));
    } else {
      console.error(`  ❌ 更新失败: ${result.errorMsg || "未知错误"}`);
      console.error("=".repeat(50));
      console.log(JSON.stringify({
        success: false,
        message: result.errorMsg || "更新失败",
        errorCode: result.errorCode
      }, null, 2));
    }
  } else {
    console.error("  ❌ 请求失败");
    console.error("=".repeat(50));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`\n❌ 更新异常: ${error.message}`);
  process.exit(1);
});
