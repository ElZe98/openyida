/**
 * import-app.js - 宜搭应用导入命令
 *
 * 将 openyida export 生成的迁移包导入到目标宜搭环境，自动重建应用和所有表单页面。
 *
 * 用法：openyida import <file> [name]
 */

"use strict";

const fs = require("fs");
const path = require("path");
const querystring = require("querystring");
const {
  loadCookieData,
  triggerLogin,
  resolveBaseUrl,
  httpPost,
  httpGet,
  requestWithAutoLogin,
} = require("./utils");

// ── 创建新应用 ────────────────────────────────────────

async function createApp(appName, authRef) {
  const postData = querystring.stringify({
    _csrf_token: authRef.csrfToken,
    appName: JSON.stringify({ zh_CN: appName, en_US: appName, type: "i18n" }),
    description: JSON.stringify({ zh_CN: appName, en_US: appName, type: "i18n" }),
    icon: "xian-yingyong%%#0089FF",
    iconUrl: "xian-yingyong%%#0089FF",
    colour: "blue",
    defaultLanguage: "zh_CN",
    openExclusive: "n",
    openPhysicColumn: "n",
    openIsolationDatabase: "n",
    openExclusiveUnit: "n",
    group: "全部应用",
  });

  const result = await requestWithAutoLogin((auth) => {
    return httpPost(auth.baseUrl, "/query/app/registerApp.json", postData, auth.cookies);
  }, authRef);

  if (!result || !result.success || !result.content) {
    throw new Error(`创建应用失败: ${result ? result.errorMsg || "未知错误" : "请求失败"}`);
  }

  return result.content; // appType
}

// ── 创建空白表单页面 ──────────────────────────────────

async function createBlankForm(appType, formTitle, authRef) {
  const postData = querystring.stringify({
    _csrf_token: authRef.csrfToken,
    formType: "receipt",
    title: JSON.stringify({ zh_CN: formTitle, en_US: formTitle, type: "i18n" }),
  });

  const result = await requestWithAutoLogin((auth) => {
    return httpPost(
      auth.baseUrl,
      `/dingtalk/web/${appType}/query/formdesign/saveFormSchemaInfo.json`,
      postData,
      auth.cookies
    );
  }, authRef);

  if (!result || !result.success || !result.content) {
    throw new Error(`创建表单失败: ${result ? result.errorMsg || "未知错误" : "请求失败"}`);
  }

  const content = result.content;
  return content.formUuid || content;
}

// ── 保存表单 Schema ───────────────────────────────────

async function saveFormSchema(appType, formUuid, schema, authRef) {
  const postData = querystring.stringify({
    _csrf_token: authRef.csrfToken,
    appType,
    formUuid,
    content: JSON.stringify(schema),
    schemaVersion: "V5",
  });

  const result = await requestWithAutoLogin((auth) => {
    return httpPost(
      auth.baseUrl,
      `/alibaba/web/${appType}/_view/query/formdesign/saveFormSchema.json`,
      postData,
      auth.cookies
    );
  }, authRef);

  return result;
}

// ── 更新表单配置（发布表单）─────────────────────────────

async function updateFormConfig(appType, formUuid, authRef) {
  const postData = querystring.stringify({
    _csrf_token: authRef.csrfToken,
    appType,
    formUuid,
    setting: JSON.stringify({ MINI_RESOURCE: 0 }),
    version: 1,
  });

  const result = await requestWithAutoLogin((auth) => {
    return httpPost(
      auth.baseUrl,
      `/dingtalk/web/${appType}/query/formdesign/updateFormConfig.json`,
      postData,
      auth.cookies
    );
  }, authRef);

  return result;
}

// ── 适配 SerialNumberField formula ───────────────────
//
// 将 Schema 中所有 SerialNumberField 的 formula 里的旧 appType 替换为新 appType，
// 同时将旧 formUuid 替换为新 formUuid。

function adaptSerialNumberFormulas(schema, oldAppType, newAppType, oldFormUuid, newFormUuid) {
  const schemaStr = JSON.stringify(schema);
  const adapted = schemaStr
    .replace(new RegExp(escapeRegExp(oldAppType), "g"), newAppType)
    .replace(new RegExp(escapeRegExp(oldFormUuid), "g"), newFormUuid);
  return JSON.parse(adapted);
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── 从 Schema 中提取表单 Schema 内容 ─────────────────
//
// getFormSchema 接口返回的结构可能是 { content: {...} } 或直接是 schema 对象。

function extractSchemaContent(schemaResult) {
  if (!schemaResult) return null;
  if (schemaResult.content && typeof schemaResult.content === "object") {
    return schemaResult.content;
  }
  if (schemaResult.pages) {
    return schemaResult;
  }
  return null;
}

// ── 主逻辑 ────────────────────────────────────────────

async function run(args) {
  if (args.length < 1) {
    console.error("用法: openyida import <file> [name]");
    console.error("示例: openyida import ./yida-export.json");
    console.error("      openyida import ./yida-export.json \"质量追溯系统（生产环境）\"");
    process.exit(1);
  }

  const exportFilePath = path.resolve(args[0]);
  const targetAppName = args[1] || null;

  console.error("=".repeat(50));
  console.error("  openyida import - 宜搭应用导入工具");
  console.error("=".repeat(50));
  console.error(`\n  导入文件: ${exportFilePath}`);

  // Step 1: 读取导出文件
  console.error("\n📂 Step 1: 读取导出文件");
  if (!fs.existsSync(exportFilePath)) {
    console.error(`  ❌ 文件不存在: ${exportFilePath}`);
    process.exit(1);
  }

  let exportData;
  try {
    exportData = JSON.parse(fs.readFileSync(exportFilePath, "utf-8"));
  } catch (err) {
    console.error(`  ❌ 解析导出文件失败: ${err.message}`);
    process.exit(1);
  }

  const { sourceAppType, forms } = exportData;
  if (!sourceAppType || !Array.isArray(forms) || forms.length === 0) {
    console.error("  ❌ 导出文件格式无效，请使用 openyida export 生成");
    process.exit(1);
  }

  const appName = targetAppName || `${sourceAppType}（迁移）`;
  console.error(`  ✅ 读取成功，共 ${forms.length} 个表单`);
  console.error(`  源应用 ID: ${sourceAppType}`);
  console.error(`  目标应用名: ${appName}`);

  // Step 2: 读取登录态
  console.error("\n🔑 Step 2: 读取登录态");
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

  // Step 3: 创建新应用
  console.error("\n📦 Step 3: 创建新应用");
  let newAppType;
  try {
    newAppType = await createApp(appName, authRef);
  } catch (err) {
    console.error(`  ❌ ${err.message}`);
    process.exit(1);
  }
  console.error(`  ✅ 新应用已创建: ${newAppType}`);

  // Step 4: 逐个重建表单页面
  console.error("\n🔨 Step 4: 重建表单页面");
  const migrationReport = {
    version: "1.0",
    migratedAt: new Date().toISOString(),
    sourceAppType,
    targetAppType: newAppType,
    targetAppName: appName,
    baseUrl: authRef.baseUrl,
    forms: [],
  };

  let successCount = 0;
  let failCount = 0;

  for (const form of forms) {
    const { formUuid: oldFormUuid, name: formName, schema: formSchemaResult } = form;
    console.error(`\n  正在迁移: ${formName} (${oldFormUuid})`);

    // 4.1 创建空白表单
    let newFormUuid;
    try {
      newFormUuid = await createBlankForm(newAppType, formName, authRef);
      console.error(`    ✅ 空白表单已创建: ${newFormUuid}`);
    } catch (err) {
      console.error(`    ❌ 创建表单失败: ${err.message}`);
      migrationReport.forms.push({
        oldFormUuid,
        newFormUuid: null,
        name: formName,
        status: "failed",
        error: err.message,
      });
      failCount++;
      continue;
    }

    // 4.2 提取并适配 Schema
    const originalSchema = extractSchemaContent(formSchemaResult);
    if (!originalSchema) {
      console.error(`    ⚠️  Schema 内容为空，跳过`);
      migrationReport.forms.push({
        oldFormUuid,
        newFormUuid,
        name: formName,
        status: "skipped",
        error: "Schema 内容为空",
      });
      failCount++;
      continue;
    }

    // 将 Schema 中所有旧 appType / formUuid 替换为新值
    const adaptedSchema = adaptSerialNumberFormulas(
      originalSchema,
      sourceAppType,
      newAppType,
      oldFormUuid,
      newFormUuid
    );

    // 4.3 保存 Schema
    const saveResult = await saveFormSchema(newAppType, newFormUuid, adaptedSchema, authRef);
    if (!saveResult || !saveResult.success) {
      const errorMsg = saveResult ? saveResult.errorMsg || "未知错误" : "请求失败";
      console.error(`    ❌ 保存 Schema 失败: ${errorMsg}`);
      migrationReport.forms.push({
        oldFormUuid,
        newFormUuid,
        name: formName,
        status: "failed",
        error: `保存 Schema 失败: ${errorMsg}`,
      });
      failCount++;
      continue;
    }
    console.error(`    ✅ Schema 已保存`);

    // 4.4 更新表单配置
    const configResult = await updateFormConfig(newAppType, newFormUuid, authRef);
    if (!configResult || !configResult.success) {
      const errorMsg = configResult ? configResult.errorMsg || "未知错误" : "请求失败";
      console.error(`    ⚠️  配置更新失败（Schema 已保存）: ${errorMsg}`);
    } else {
      console.error(`    ✅ 表单配置已更新`);
    }

    migrationReport.forms.push({
      oldFormUuid,
      newFormUuid,
      name: formName,
      status: "success",
    });
    successCount++;
  }

  // Step 5: 写入迁移报告
  console.error("\n📄 Step 5: 写入迁移报告");
  const reportPath = path.join(process.cwd(), "yida-migration-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(migrationReport, null, 2), "utf-8");
  console.error(`  ✅ 迁移报告已写入: ${reportPath}`);

  // 输出结果
  const appUrl = `${authRef.baseUrl}/${newAppType}/admin`;
  console.error("\n" + "=".repeat(50));
  console.error("  ✅ 迁移完成！");
  console.error(`  新应用 ID:   ${newAppType}`);
  console.error(`  新应用名称:  ${appName}`);
  console.error(`  访问地址:    ${appUrl}`);
  console.error(`  成功迁移:    ${successCount} 个表单`);
  if (failCount > 0) {
    console.error(`  失败/跳过:   ${failCount} 个表单`);
  }
  console.error(`  迁移报告:    ${reportPath}`);
  if (failCount > 0) {
    console.error("\n  ⚠️  注意事项：");
    console.error("  - 关联表单（associationFormField）的跨表单引用需根据迁移报告手动更新");
    console.error("  - 自定义页面需使用 openyida publish 单独重新发布");
  }
  console.error("=".repeat(50));

  console.log(
    JSON.stringify({
      success: true,
      sourceAppType,
      targetAppType: newAppType,
      targetAppName: appName,
      appUrl,
      reportPath,
      totalForms: forms.length,
      successCount,
      failCount,
    })
  );
}

module.exports = { run };
