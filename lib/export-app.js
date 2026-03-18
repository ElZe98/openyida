/**
 * export-app.js - 宜搭应用导出命令
 *
 * 导出应用的所有表单 Schema，生成可移植的迁移包（yida-export.json）。
 *
 * 用法：openyida export <appType> [output]
 */

"use strict";

const fs = require("fs");
const path = require("path");
const {
  loadCookieData,
  triggerLogin,
  resolveBaseUrl,
  httpGet,
  requestWithAutoLogin,
} = require("./utils");

// ── 获取应用下所有表单页面列表 ────────────────────────

async function fetchFormPageList(appType, authRef) {
  const result = await requestWithAutoLogin((auth) => {
    return httpGet(
      auth.baseUrl,
      `/alibaba/web/${appType}/_view/query/app/getAppItemList.json`,
      { appType },
      auth.cookies
    );
  }, authRef);

  if (!result || result.success === false) {
    throw new Error(`获取表单列表失败: ${result ? result.errorMsg || "未知错误" : "请求失败"}`);
  }

  // 过滤出表单类型的页面（formType 为 form 或 report）
  const items = result.content || result.data || [];
  const formPages = [];

  function collectFormPages(nodes) {
    for (const node of nodes) {
      if (node.formType === "form" || node.formType === "report" || node.formType === "subForm") {
        formPages.push({
          formUuid: node.formUuid || node.pageId,
          name: node.name || node.formName || node.pageTitle || "未命名表单",
          formType: node.formType,
        });
      }
      if (node.children && node.children.length > 0) {
        collectFormPages(node.children);
      }
    }
  }

  collectFormPages(Array.isArray(items) ? items : [items]);
  return formPages;
}

// ── 获取单个表单 Schema ───────────────────────────────

async function fetchFormSchema(appType, formUuid, authRef) {
  const result = await requestWithAutoLogin((auth) => {
    return httpGet(
      auth.baseUrl,
      `/alibaba/web/${appType}/_view/query/formdesign/getFormSchema.json`,
      { formUuid, schemaVersion: "V5" },
      auth.cookies
    );
  }, authRef);

  if (!result || result.success === false) {
    return null;
  }

  return result;
}

// ── 主逻辑 ────────────────────────────────────────────

async function run(args) {
  if (args.length < 1) {
    console.error("用法: openyida export <appType> [output]");
    console.error("示例: openyida export APP_XXXXXXXXXXXXX");
    console.error("      openyida export APP_XXXXXXXXXXXXX ./my-app-backup.json");
    process.exit(1);
  }

  const appType = args[0];
  const outputPath = args[1] || path.join(process.cwd(), "yida-export.json");

  console.error("=".repeat(50));
  console.error("  openyida export - 宜搭应用导出工具");
  console.error("=".repeat(50));
  console.error(`\n  应用 ID:  ${appType}`);
  console.error(`  输出文件: ${outputPath}`);

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

  // Step 2: 获取表单页面列表
  console.error("\n📋 Step 2: 获取应用表单列表");
  let formPages;
  try {
    formPages = await fetchFormPageList(appType, authRef);
  } catch (err) {
    console.error(`  ❌ ${err.message}`);
    process.exit(1);
  }

  if (formPages.length === 0) {
    console.error("  ⚠️  未找到任何表单页面，请确认应用 ID 是否正确");
    process.exit(1);
  }

  console.error(`  ✅ 找到 ${formPages.length} 个表单页面`);
  formPages.forEach((page, index) => {
    console.error(`     ${index + 1}. ${page.name} (${page.formUuid})`);
  });

  // Step 3: 逐个导出表单 Schema
  console.error("\n📦 Step 3: 导出表单 Schema");
  const exportedForms = [];
  let successCount = 0;
  let failCount = 0;

  for (const page of formPages) {
    console.error(`\n  正在导出: ${page.name} (${page.formUuid})`);
    const schema = await fetchFormSchema(appType, page.formUuid, authRef);
    if (schema) {
      exportedForms.push({
        formUuid: page.formUuid,
        name: page.name,
        formType: page.formType,
        schema,
      });
      console.error(`    ✅ 导出成功`);
      successCount++;
    } else {
      console.error(`    ⚠️  导出失败，跳过`);
      failCount++;
    }
  }

  // Step 4: 写入导出文件
  console.error("\n💾 Step 4: 写入导出文件");
  const exportData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    sourceAppType: appType,
    baseUrl: authRef.baseUrl,
    forms: exportedForms,
  };

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), "utf-8");

  // 输出结果
  console.error("\n" + "=".repeat(50));
  console.error("  ✅ 导出完成！");
  console.error(`  成功: ${successCount} 个表单`);
  if (failCount > 0) {
    console.error(`  失败: ${failCount} 个表单（已跳过）`);
  }
  console.error(`  输出文件: ${outputPath}`);
  console.error("=".repeat(50));

  console.log(
    JSON.stringify({
      success: true,
      appType,
      outputPath,
      totalForms: formPages.length,
      successCount,
      failCount,
    })
  );
}

module.exports = { run };
