/**
 * create-page.js - 宜搭自定义页面创建命令
 *
 * 用法：yidacli create-page <appType> "<pageName>"
 */

"use strict";

const querystring = require("querystring");
const {
  loadCookieData,
  triggerLogin,
  resolveBaseUrl,
  httpPost,
  requestWithAutoLogin,
} = require("./utils");

async function run(args) {
  if (args.length < 2) {
    console.error('用法: yidacli create-page <appType> "<pageName>"');
    console.error('示例: yidacli create-page "APP_XXX" "游戏主页"');
    process.exit(1);
  }

  const appType = args[0];
  const pageName = args[1];

  console.error("=".repeat(50));
  console.error("  yidacli create-page - 宜搭自定义页面创建工具");
  console.error("=".repeat(50));
  console.error(`\n  应用 ID:  ${appType}`);
  console.error(`  页面名称: ${pageName}`);

  // Step 1: 读取登录态
  console.error("\n🔑 Step 1: 读取登录态");
  let cookieData = loadCookieData();
  if (!cookieData) {
    console.error("  ⚠️  未找到本地登录态，触发登录...");
    cookieData = triggerLogin();
  }

  const authRef = {
    csrfToken: cookieData.csrf_token,
    cookies: cookieData.cookies,
    baseUrl: resolveBaseUrl(cookieData),
    cookieData,
  };
  console.error(`  ✅ 登录态已就绪（${authRef.baseUrl}）`);

  // Step 2: 创建自定义页面
  console.error("\n📄 Step 2: 创建自定义页面\n");
  console.error("  发送 saveFormSchemaInfo 请求...");

  const response = await requestWithAutoLogin((auth) => {
    const postData = querystring.stringify({
      _csrf_token: auth.csrfToken,
      formType: "display",
      title: JSON.stringify({ zh_CN: pageName, en_US: pageName, type: "i18n" }),
    });
    return httpPost(
      auth.baseUrl,
      `/dingtalk/web/${appType}/query/formdesign/saveFormSchemaInfo.json`,
      postData,
      auth.cookies
    );
  }, authRef);

  // 输出结果
  console.error("\n" + "=".repeat(50));
  if (response && response.success && response.content) {
    const pageId = response.content.formUuid || response.content;
    const pageUrl = `${authRef.baseUrl}/${appType}/workbench/${pageId}`;

    console.error("  ✅ 页面创建成功！");
    console.error(`  pageId:   ${pageId}`);
    console.error(`  访问地址: ${pageUrl}`);
    console.error("=".repeat(50));

    console.log(JSON.stringify({ success: true, pageId, pageName, appType, url: pageUrl }));
  } else {
    const errorMsg = response ? response.errorMsg || "未知错误" : "请求失败";
    console.error(`  ❌ 创建失败: ${errorMsg}`);
    console.error("=".repeat(50));
    console.log(JSON.stringify({ success: false, error: errorMsg }));
    process.exit(1);
  }
}

module.exports = { run };
