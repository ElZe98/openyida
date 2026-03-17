/**
 * create-app.js - 宜搭应用创建命令
 *
 * 用法：yidacli create-app "<appName>" [description] [icon] [iconColor]
 */

"use strict";

const fs = require("fs");
const path = require("path");
const querystring = require("querystring");
const {
  findProjectRoot,
  loadCookieData,
  triggerLogin,
  refreshCsrfToken,
  resolveBaseUrl,
  httpPost,
  requestWithAutoLogin,
} = require("./utils");

// ── prd 文档更新 ──────────────────────────────────────

function findPrdFile() {
  let currentDir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const prdDir = path.join(currentDir, "prd");
    if (fs.existsSync(prdDir)) {
      const files = fs.readdirSync(prdDir);
      const mdFile = files.find((f) => f.endsWith(".md"));
      if (mdFile) return path.join(prdDir, mdFile);
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }
  return null;
}

function updatePrdCorpId(prdFilePath, corpId, appType, baseUrl) {
  if (!prdFilePath || !fs.existsSync(prdFilePath)) {
    console.error(`\n  ⚠️  未找到 prd 文档，跳过 corpId 写入`);
    return false;
  }

  try {
    let content = fs.readFileSync(prdFilePath, "utf-8");
    const hasAppConfig = content.includes("## 应用配置") || content.includes("| appType |");

    if (hasAppConfig) {
      const corpIdRegex = /\| corpId \| [^\|]*\|/;
      if (corpIdRegex.test(content)) {
        content = content.replace(corpIdRegex, `| corpId | ${corpId} |`);
      } else {
        content = content.replace(
          /(\| appType \| [^\|]*\|)(\r?\n)/,
          `$1$2| corpId | ${corpId} |$2`
        );
      }
      content = content.replace(/\| appType \| [^\|]*\|/, `| appType | ${appType} |`);
      content = content.replace(/\| baseUrl \| [^\|]*\|/, `| baseUrl | ${baseUrl} |`);
    } else {
      const appConfigSection = `## 应用配置\n\n| 配置项 | 值 |\n| --- | --- |\n| appType | ${appType} |\n| corpId | ${corpId} |\n| baseUrl | ${baseUrl} |\n\n`;
      if (content.startsWith("#")) {
        content = content.replace(/^(# .*\r?\n)/, `$1\n${appConfigSection}`);
      } else {
        content = appConfigSection + content;
      }
    }

    fs.writeFileSync(prdFilePath, content, "utf-8");
    console.error(`  ✅ 已更新 prd 文档: ${path.basename(prdFilePath)}`);
    return true;
  } catch (err) {
    console.error(`  ⚠️  更新 prd 文档失败: ${err.message}`);
    return false;
  }
}

// ── 主逻辑 ────────────────────────────────────────────

async function run(args) {
  if (args.length < 1) {
    console.error('用法: yidacli create-app "<appName>" [description] [icon] [iconColor]');
    console.error('示例: yidacli create-app "考勤管理" "员工考勤打卡系统" "xian-daka" "#00B853"');
    console.error("\n可用图标:");
    console.error("  xian-xinwen, xian-zhengfu, xian-yingyong, xian-xueshimao, xian-qiye,");
    console.error("  xian-danju, xian-shichang, xian-jingli, xian-falv, xian-baogao,");
    console.error("  huoche, xian-shenbao, xian-diqiu, xian-qiche, xian-feiji,");
    console.error("  xian-diannao, xian-gongzuozheng, xian-gouwuche, xian-xinyongka,");
    console.error("  xian-huodong, xian-jiangbei, xian-liucheng, xian-chaxun, xian-daka");
    console.error("\n可用颜色:");
    console.error("  #0089FF #00B853 #FFA200 #FF7357 #5C72FF");
    console.error("  #85C700 #FFC505 #FF6B7A #8F66FF #14A9FF");
    process.exit(1);
  }

  const appName = args[0];
  const description = args[1] || appName;
  const icon = args[2] || "xian-yingyong";
  const iconColor = args[3] || "#0089FF";

  console.error("=".repeat(50));
  console.error("  yidacli create-app - 宜搭应用创建工具");
  console.error("=".repeat(50));
  console.error(`\n  应用名称: ${appName}`);
  console.error(`  应用描述: ${description}`);
  console.error(`  图标:     ${icon} (${iconColor})`);

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

  // Step 2: 创建应用
  console.error("\n📦 Step 2: 创建应用\n");

  const iconValue = `${icon}%%${iconColor}`;
  const response = await requestWithAutoLogin((auth) => {
    const postData = querystring.stringify({
      _csrf_token: auth.csrfToken,
      appName: JSON.stringify({ zh_CN: appName, en_US: appName, type: "i18n" }),
      description: JSON.stringify({ zh_CN: description, en_US: description, type: "i18n" }),
      icon: iconValue,
      iconUrl: iconValue,
      colour: "blue",
      defaultLanguage: "zh_CN",
      openExclusive: "n",
      openPhysicColumn: "n",
      openIsolationDatabase: "n",
      openExclusiveUnit: "n",
      group: "全部应用",
    });
    return httpPost(auth.baseUrl, "/query/app/registerApp.json", postData, auth.cookies);
  }, authRef);

  // 输出结果
  console.error("\n" + "=".repeat(50));
  if (response && response.success && response.content) {
    const appType = response.content;
    const appUrl = `${authRef.baseUrl}/${appType}/admin`;
    const corpId = authRef.cookieData.corp_id || "";

    console.error("  ✅ 应用创建成功！");
    console.error(`  appType: ${appType}`);
    console.error(`  corpId:  ${corpId || "未获取"}`);
    console.error(`  访问地址: ${appUrl}`);
    console.error("=".repeat(50));

    const prdFile = findPrdFile();
    if (prdFile) updatePrdCorpId(prdFile, corpId, appType, authRef.baseUrl);

    console.log(JSON.stringify({ success: true, appType, appName, corpId, url: appUrl }));
  } else {
    const errorMsg = response ? response.errorMsg || "未知错误" : "请求失败";
    console.error(`  ❌ 创建失败: ${errorMsg}`);
    console.error("=".repeat(50));
    console.log(JSON.stringify({ success: false, error: errorMsg }));
    process.exit(1);
  }
}

module.exports = { run };
