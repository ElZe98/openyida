#!/usr/bin/env node
/**
 * postinstall 钩子：npm install -g openyida 后自动配置 IDE 集成
 *
 * 在各 AI 工具的 skills/ 目录下创建指向 npm 包内 yida-skills/ 的软链接，
 * 各工具通过扫描该目录自动发现技能包，无需额外配置。
 *
 * 支持的工具：Claude Code / OpenCode / Aone Copilot / Cursor / Qoder / iFlow / 悟空
 */

"use strict";

const path = require("path");
const fs = require("fs");
const os = require("os");

const PACKAGE_ROOT = path.resolve(__dirname, "..");
const SKILLS_DIR = path.join(PACKAGE_ROOT, "yida-skills");
const HOME_DIR = os.homedir();

/**
 * 静默执行，不抛错
 */
function safeExec(fn) {
  try { fn(); } catch { /* ignore */ }
}

/**
 * 确保目录存在
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 在指定 IDE skills 目录下创建/更新指向 yida-skills/ 的软链接。
 * 软链接名固定为 "yida-skills"，各 IDE 通过此名称识别技能包。
 * 若目标路径已是正确的软链接则跳过；
 * 若是错误的软链接或实际目录/文件，则删除后重新创建软链接。
 */
function installSymlink(ideSkillsDir) {
  const symlinkPath = path.join(ideSkillsDir, "yida-skills");

  ensureDir(ideSkillsDir);

  // 检查目标路径是否已存在
  let existingStat = null;
  try { existingStat = fs.lstatSync(symlinkPath); } catch { /* 不存在，继续创建 */ }

  if (existingStat) {
    if (existingStat.isSymbolicLink()) {
      const currentTarget = fs.readlinkSync(symlinkPath);
      if (currentTarget === SKILLS_DIR) return; // 已正确链接，跳过
      fs.unlinkSync(symlinkPath); // 旧链接指向错误，删除后重建
    } else {
      // 是实际目录或文件，删除后创建软链接
      fs.rmSync(symlinkPath, { recursive: true, force: true });
    }
  }

  fs.symlinkSync(SKILLS_DIR, symlinkPath, "junction");
}

// ── 1. 软链接集成（各 IDE skills 目录）────────────────────────────────

// Claude Code
safeExec(() => {
  installSymlink(path.join(HOME_DIR, ".claude", "skills"));
});

// OpenCode
safeExec(() => {
  if (fs.existsSync(path.join(HOME_DIR, ".opencode"))) {
    installSymlink(path.join(HOME_DIR, ".opencode", "skills"));
  }
});

// Aone Copilot
safeExec(() => {
  if (fs.existsSync(path.join(HOME_DIR, ".aone_copilot"))) {
    installSymlink(path.join(HOME_DIR, ".aone_copilot", "skills"));
  }
});

// Cursor
safeExec(() => {
  if (fs.existsSync(path.join(HOME_DIR, ".cursor"))) {
    installSymlink(path.join(HOME_DIR, ".cursor", "skills"));
  }
});

// Qoder
safeExec(() => {
  if (fs.existsSync(path.join(HOME_DIR, ".qoder"))) {
    installSymlink(path.join(HOME_DIR, ".qoder", "skills"));
  }
});

// iFlow
safeExec(() => {
  if (fs.existsSync(path.join(HOME_DIR, ".iflow"))) {
    installSymlink(path.join(HOME_DIR, ".iflow", "skills"));
  }
});

// ── 2. 悟空（Wukong）集成 ────────────────────────────────────────────

safeExec(() => {
  if (fs.existsSync(path.join(HOME_DIR, ".real"))) {
    installSymlink(path.join(HOME_DIR, ".real", ".skills"));
  }
});

// ── 3. 首次安装欢迎引导 ──────────────────────────────────────────────

safeExec(() => {
  const FIRST_INSTALL_FLAG = path.join(HOME_DIR, ".openyida", "installed");

  const isFirstInstall = !fs.existsSync(FIRST_INSTALL_FLAG);
  if (isFirstInstall) {
    fs.mkdirSync(path.dirname(FIRST_INSTALL_FLAG), { recursive: true });
    fs.writeFileSync(FIRST_INSTALL_FLAG, new Date().toISOString(), "utf8");
  }

  printWelcomeGuide(isFirstInstall);
});

/**
 * 打印欢迎引导信息
 * @param {boolean} isFirstInstall - 是否首次安装
 */
function printWelcomeGuide(isFirstInstall) {
  const RESET  = "\x1b[0m";
  const BOLD   = "\x1b[1m";
  const DIM    = "\x1b[2m";
  const CYAN   = "\x1b[36m";
  const GREEN  = "\x1b[32m";
  const YELLOW = "\x1b[33m";
  const BLUE   = "\x1b[34m";
  const MAGENTA = "\x1b[35m";
  const BG_CYAN = "\x1b[46m";
  const WHITE  = "\x1b[37m";

  const SEP = `${DIM}${"─".repeat(60)}${RESET}`;

  console.log("");
  console.log(`${BG_CYAN}${WHITE}${BOLD}  🎉 欢迎使用 OpenYida！                                    ${RESET}`);
  console.log(SEP);

  if (isFirstInstall) {
    console.log(`${BOLD}${GREEN}  ✅ 安装成功！${RESET} 宜搭 AI 应用开发工具已就绪。`);
  } else {
    console.log(`${BOLD}${GREEN}  ✅ 更新成功！${RESET} OpenYida 已升级到最新版本。`);
  }

  console.log("");
  console.log(`${BOLD}${CYAN}  🚀 开启 AI 问答模式${RESET}`);
  console.log(`  在 Claude Code / Aone Copilot / Cursor 等 AI 工具中直接对话：`);
  console.log("");

  // 示例 prompt 展示
  const prompts = [
    { icon: "📋", text: "帮我用宜搭创建一个考勤管理系统" },
    { icon: "💰", text: "帮我搭建个人薪资计算器应用" },
    { icon: "🏢", text: "创建一个 CRM 客户管理系统" },
    { icon: "🎂", text: "做一个生日祝福小程序" },
  ];

  prompts.forEach(({ icon, text }) => {
    console.log(`  ${icon}  ${YELLOW}「${text}」${RESET}`);
  });

  console.log("");
  console.log(SEP);
  console.log(`${BOLD}${BLUE}  📖 基础使用步骤${RESET}`);
  console.log("");
  console.log(`  ${BOLD}Step 1${RESET}  打开你的 AI 编程工具（Claude Code / Cursor 等）`);
  console.log(`  ${BOLD}Step 2${RESET}  直接用自然语言描述你想要的应用`);
  console.log(`  ${BOLD}Step 3${RESET}  AI 自动调用 openyida 命令完成创建和发布`);
  console.log(`  ${BOLD}Step 4${RESET}  获得可访问的宜搭应用链接 🎉`);
  console.log("");
  console.log(SEP);
  console.log(`${BOLD}${MAGENTA}  ⚡ 快捷命令${RESET}`);
  console.log("");
  console.log(`  ${CYAN}openyida env${RESET}      ${DIM}# 检测当前 AI 工具环境和登录态${RESET}`);
  console.log(`  ${CYAN}openyida login${RESET}    ${DIM}# 登录宜搭账号${RESET}`);
  console.log(`  ${CYAN}openyida --help${RESET}   ${DIM}# 查看所有命令${RESET}`);
  console.log("");
  console.log(SEP);
  console.log(`  ${DIM}📚 文档：https://github.com/openyida/openyida${RESET}`);
  console.log(`  ${DIM}💬 社区：钉钉扫码加入 OpenYida 社区${RESET}`);
  console.log("");
}
