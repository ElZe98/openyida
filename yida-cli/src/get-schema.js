/**
 * get-schema.js - 宜搭表单 Schema 获取命令
 *
 * 用法：yidacli get-schema <appType> <formUuid>
 */

"use strict";

const {
  loadCookieData,
  triggerLogin,
  resolveBaseUrl,
  httpGet,
  requestWithAutoLogin,
} = require("./utils");

async function run(args) {
  if (args.length < 2) {
    console.error("用法: yidacli get-schema <appType> <formUuid>");
    console.error('示例: yidacli get-schema "APP_XXX" "FORM-XXX"');
    process.exit(1);
  }

  const appType = args[0];
  const formUuid = args[1];

  console.error("=".repeat(50));
  console.error("  yidacli get-schema - 宜搭表单 Schema 获取工具");
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

  // Step 2: 获取表单 Schema
  console.error("\n📄 Step 2: 获取表单 Schema");
  console.error("  发送 getFormSchema 请求...");

  const result = await requestWithAutoLogin((auth) => {
    return httpGet(
      auth.baseUrl,
      `/alibaba/web/${appType}/_view/query/formdesign/getFormSchema.json`,
      { formUuid, schemaVersion: "V5" },
      auth.cookies
    );
  }, authRef);

  // 输出结果
  console.error("\n" + "=".repeat(50));
  if (result && result.success !== false && !result.__needLogin && !result.__csrfExpired) {
    console.error("  ✅ Schema 获取成功！");
    console.error("=".repeat(50));
    console.log(JSON.stringify(result, null, 2));
  } else {
    const errorMsg = result ? result.errorMsg || "未知错误" : "请求失败";
    console.error(`  ❌ 获取 Schema 失败: ${errorMsg}`);
    console.error("=".repeat(50));
    process.exit(1);
  }
}

module.exports = { run };
