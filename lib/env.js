/**
 * env.js - 宜搭 CLI 环境检测
 *
 * 通过环境变量 + 文件特征检测当前运行环境，并输出环境信息。
 */

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { detectActiveTool, loadCookieData, resolveBaseUrl, extractInfoFromCookies } = require("./utils");

const home = os.homedir();

/**
 * 获取所有已安装的 AI 工具列表（用于展示）。
 * 不判断当前是否活跃，只判断是否安装过。
 * 
 * @returns {Array} 已安装工具列表
 */
function getInstalledTools() {
  const tools = [
    { dirName: ".real", displayName: "悟空（Wukong）" },
    { dirName: ".opencode", displayName: "OpenCode" },
    { dirName: ".claudecode", displayName: "Claude Code" },
    { dirName: ".aone_copilot", displayName: "Aone Copilot" },
    { dirName: ".cursor", displayName: "Cursor" },
    { dirName: ".qoder", displayName: "Qoder" },
    { dirName: ".iflow", displayName: "iFlow" },
  ];
  
  return tools.filter(({ dirName }) => {
    return fs.existsSync(path.join(home, dirName));
  });
}

/**
 * 检测当前 AI 工具环境。
 * 返回当前活跃工具信息和所有已安装工具列表。
 */
function detectEnvironment() {
  const activeTool = detectActiveTool();
  const installedTools = getInstalledTools();
  const cwdProject = path.join(process.cwd(), "project");
  
  // 构建结果列表
  const results = installedTools.map(({ dirName, displayName }) => {
    const isWukong = dirName === ".real";
    const isActive = activeTool && activeTool.dirName === dirName;
    const workspaceRoot = isWukong
      ? path.join(home, ".real", "workspace", "project")
      : cwdProject;
    const hasProject = fs.existsSync(workspaceRoot);
    
    return {
      displayName,
      dirName,
      isActive: !!isActive,
      hasProject,
      workspaceRoot,
    };
  });
  
  // 当前生效环境
  const activeToolName = activeTool ? activeTool.displayName : null;
  const activeProjectRoot = activeTool ? activeTool.workspaceRoot : null;
  
  return { activeToolName, activeProjectRoot, results };
}
/**
 * 检测登录态信息。
 */
function detectLoginStatus(projectRoot) {
  const cookieData = loadCookieData(projectRoot);
  if (!cookieData || !cookieData.cookies) {
    return { loggedIn: false, csrfToken: null, corpId: null, userId: null, baseUrl: null };
  }

  const { csrfToken, corpId, userId } = extractInfoFromCookies(cookieData.cookies);
  const baseUrl = resolveBaseUrl(cookieData);

  return { loggedIn: !!csrfToken, csrfToken, corpId, userId, baseUrl };
}

/**
 * 执行环境检测并打印结果。
 */
function run() {
  const SEP = "=".repeat(55);
  console.log(SEP);
  console.log("  yidacli env - 环境检测");
  console.log(SEP);

  // ── 系统信息 ──────────────────────────────────────
  console.log("\n📋 系统信息");
  console.log(`  操作系统:   ${process.platform} (${os.arch()})`);
  console.log(`  Node.js:    ${process.version}`);
  console.log(`  主目录:     ${os.homedir()}`);
  console.log(`  工作目录:   ${process.cwd()}`);

  // ── AI 工具检测 ────────────────────────────────────
  console.log("\n🤖 AI 工具检测");
  const { activeToolName, activeProjectRoot, results } = detectEnvironment();

  if (results.length === 0) {
    console.log("  ⚠️  未检测到任何已知 AI 工具");
  } else {
    for (const { displayName, isActive, hasProject, workspaceRoot } of results) {
      let icon, note;
      if (isActive && hasProject) {
        icon = "✅";
        note = "← 当前活跃，项目已就绪";
      } else if (isActive && !hasProject) {
        icon = "🟡";
        note = "← 当前活跃，但无 project 工作目录";
      } else if (!isActive && hasProject) {
        icon = "⬜";
        note = "(已安装，项目存在，但未活跃)";
      } else {
        icon = "⬜";
        note = "(已安装，未活跃)";
      }
      console.log(`  ${icon} ${displayName.padEnd(18)} ${note}`);
    }
  }

  // ── 当前生效环境 ───────────────────────────────────
  console.log("\n🎯 当前生效环境");
  if (activeToolName && activeProjectRoot) {
    console.log(`  AI 工具:    ${activeToolName}`);
    console.log(`  项目根目录: ${activeProjectRoot}`);
  } else {
    const activeOnly = results.filter((r) => r.isActive);
    if (activeOnly.length > 0) {
      console.log(`  AI 工具:    ${activeOnly.map((r) => r.displayName).join(", ")} (活跃，但无 project 工作目录)`);
    } else {
      console.log(`  AI 工具:    未检测到活跃工具`);
    }
    console.log(`  项目根目录: ${process.cwd()} (fallback)`);
  }

  // ── 登录态检测 ─────────────────────────────────────
  console.log("\n🔐 登录态检测");
  // 修复：检查 activeProjectRoot 是否存在，与 login.js 的 findProjectRoot() 行为保持一致
  const projectRoot = (activeProjectRoot && fs.existsSync(activeProjectRoot))
    ? activeProjectRoot
    : process.cwd();
  const loginStatus = detectLoginStatus(projectRoot);

  if (loginStatus.loggedIn) {
    console.log(`  状态:       ✅ 已登录`);
    console.log(`  域名:       ${loginStatus.baseUrl}`);
    console.log(`  组织 ID:    ${loginStatus.corpId || "(未知)"}`);
    console.log(`  用户 ID:    ${loginStatus.userId || "(未知)"}`);
    console.log(`  csrf_token: ${loginStatus.csrfToken.slice(0, 16)}...`);
  } else {
    console.log(`  状态:       ❌ 未登录（运行 yidacli login 进行登录）`);
  }

  console.log("\n" + SEP);
}

module.exports = { run, detectEnvironment, detectLoginStatus };
