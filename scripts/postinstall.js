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
