/**
 * get-page-config.js - 宜搭页面公开访问/分享配置查询命令
 *
 * 用法：yidacli get-page-config <appType> <formUuid>
 */

"use strict";

const querystring = require("querystring");
const {
  loadCookieData,
  triggerLogin,
  refreshCsrfToken,
  resolveBaseUrl,
  httpPost,
  requestWithAutoLogin,
} = require("./utils");

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("用法: yidacli get-page-config <appType> <formUuid>");
    console.error('示例: yidacli get-page-config APP_XXX FORM-XXX');
    process.exit(1);
  }
  return { appType: args[0], formUuid: args[1] };
}

async function main() {
  const { appType, formUuid } = parseArgs();

  console.error("=".repeat(50));
  console.error("  get-page-config - 宜搭页面配置查询工具");
  console.error("=".repeat(50));
  console.error(`\n  应用 ID:    ${appType}`);
  console.error(`  表单 UUID:  ${formUuid}`);

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

  // Step 2: 查询分享配置
  console.error("\n🔍 Step 2: 查询页面配置");
  console.error("  发送 getShareConfig 请求...");

  const shareConfig = await requestWithAutoLogin((auth) => {
    const postData = querystring.stringify({
      _api: "Share.getShareConfig",
      _csrf_token: auth.csrfToken,
      _locale_time_zone_offset: "28800000",
      formUuid,
    });
    return httpPost(
      auth.baseUrl,
      `/dingtalk/web/${appType}/query/formdesign/getShareConfig.json`,
      postData,
      auth.cookies
    );
  }, authRef);

  // 输出结果
  console.error("\n" + "=".repeat(50));
  if (shareConfig && shareConfig.success !== false && !shareConfig.__needLogin && !shareConfig.__csrfExpired) {
    const content = shareConfig.content || {};
    const result = {
      isOpen: content.isOpen === "y",
      openUrl: content.openUrl || null,
      shareUrl: content.shareUrl || null,
    };

    console.error("  ✅ 查询成功！");
    console.error("=".repeat(50));

    if (result.openUrl) console.error(`  公开访问: ${authRef.baseUrl}${result.openUrl}`);
    if (result.shareUrl) console.error(`  组织内分享: ${authRef.baseUrl}${result.shareUrl}`);
    if (!result.openUrl && !result.shareUrl) console.error("  （暂未配置公开访问或分享链接）");

    console.log(JSON.stringify(result, null, 2));
  } else {
    const errorMsg = shareConfig ? shareConfig.errorMsg || "未知错误" : "请求失败";
    console.error(`  ❌ 查询失败: ${errorMsg}`);
    console.error("=".repeat(50));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`\n❌ 查询异常: ${error.message}`);
  process.exit(1);
});
