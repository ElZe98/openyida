/**
 * copy.js - 复制 project 工作目录模板 / 创建 yida-skills 软链接到当前 AI 工具环境
 *
 * 用法：
 *   openyida copy                → 复制 project/ 目录模板（默认，合并模式）
 *   openyida copy --force        → 复制 project/ 目录模板（强制覆盖，先清空目标目录）
 *   openyida copy -skills        → 创建 yida-skills/ 软链接（如果存在实际目录则先删除）
 *   openyida copy -project       → 复制 project/ 目录模板（与默认行为相同，显式指定）
 *   openyida copy -project --force → 复制 project/ 目录模板（强制覆盖）
 *
 * 目标策略：
 *   - 悟空（Wukong）：复制/链接到 ~/.real/workspace/（专属 workspace，路径固定）
 *   - 其他 AI 工具：复制/链接到当前工程目录（process.cwd()）下
 *
 * 源路径：npm 全局安装包根目录（通过 require.resolve 定位）
 *
 * project/ 合并模式（默认）：已存在的文件强制覆盖，目标目录中多余的文件保留不动
 * project/ 强制模式（--force）：先清空目标目录，再完整复制
 * yida-skills/：始终创建软链接，如目标存在实际目录则先删除
 */

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { detectEnvironment } = require("./env");

/**
 * 查找 npm 全局安装包根目录。
 * 优先通过 require.resolve 定位（适用于正式全局安装），
 * 失败时 fallback 到 __dirname 向上查找（适用于 npm link 本地开发）。
 * @returns {string|null} 包根目录的绝对路径，找不到则返回 null
 */
function findPackageRoot() {
  try {
    const packageJsonPath = require.resolve("openyida/package.json");
    return path.dirname(packageJsonPath);
  } catch {
    // fallback：从当前文件向上查找包含 package.json 的目录
    let dir = path.resolve(__dirname);
    while (dir !== path.dirname(dir)) {
      if (fs.existsSync(path.join(dir, "package.json"))) {
        return dir;
      }
      dir = path.dirname(dir);
    }
    return null;
  }
}

/**
 * 合并复制目录：源文件强制覆盖，目标目录多余文件保留。
 * @returns {number} 复制的文件数量
 */
function mergeCopyDir(sourceDir, destDir) {
  if (!fs.existsSync(sourceDir)) return 0;

  fs.mkdirSync(destDir, { recursive: true });

  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  let copiedCount = 0;

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copiedCount += mergeCopyDir(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`    复制: ${destPath}`);
      copiedCount++;
    }
  }

  return copiedCount;
}

/**
 * 强制复制目录：先清空目标目录，再完整复制。
 * @returns {number} 复制的文件数量
 */
function forceCopyDir(sourceDir, destDir) {
  if (!fs.existsSync(sourceDir)) return 0;

  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
    console.log(`    🗑️  已清空: ${destDir}`);
  }

  return mergeCopyDir(sourceDir, destDir);
}

/**
 * 创建软链接：如果目标存在实际目录则先删除，再创建软链接。
 * @returns {boolean} 是否成功创建
 */
function createSymlink(sourceDir, destLink) {
  if (!fs.existsSync(sourceDir)) return false;

  // 如果目标已存在，判断是目录还是软链接
  if (fs.existsSync(destLink)) {
    const stats = fs.lstatSync(destLink);
    if (stats.isSymbolicLink()) {
      // 已是软链接，删除后重新创建（确保指向正确）
      fs.unlinkSync(destLink);
      console.log(`    🗑️  已移除旧软链接: ${destLink}`);
    } else if (stats.isDirectory()) {
      // 是实际目录，删除后创建软链接
      fs.rmSync(destLink, { recursive: true, force: true });
      console.log(`    🗑️  已删除实际目录: ${destLink}`);
    } else {
      // 其他类型（文件等），直接删除
      fs.unlinkSync(destLink);
      console.log(`    🗑️  已移除: ${destLink}`);
    }
  }

  // 创建软链接（使用相对路径或绝对路径，这里用绝对路径确保稳定）
  fs.symlinkSync(sourceDir, destLink, "junction");
  console.log(`    🔗 软链接: ${destLink} -> ${sourceDir}`);
  return true;
}

/**
 * 检测 AI 工具环境，返回目标根目录。
 * @returns {string} 目标根目录路径
 */
function resolveDestBase() {
  const { activeToolName, activeProjectRoot, results } = detectEnvironment();
  const activeResult = results.find((r) => r.displayName === activeToolName);
  const isWukong = activeResult && activeResult.dirName === ".real";

  if (isWukong) {
    return activeProjectRoot
      ? path.dirname(activeProjectRoot)
      : path.join(os.homedir(), ".real", "workspace");
  }

  if (activeToolName) {
    return process.cwd();
  }

  // 未检测到活跃工具
  console.error("\n❌ 未检测到活跃的 AI 工具环境");
  console.error("   支持的工具：悟空、OpenCode、Claude Code、Aone Copilot、Cursor、Qoder、iFlow");
  console.error("\n   当前检测结果：");
  results.forEach((r) => {
    console.error(`     ${r.isActive ? "✅" : "⬜"} ${r.displayName}`);
  });
  console.error("\n   如需强制复制到当前目录，请运行：");
  console.error("   openyida copy --force");
  process.exit(1);
}

/**
 * 执行单项复制任务，打印结果。
 */
function copyItem(label, sourceDir, destDir, isForce) {
  console.log(`\n📂 复制 ${label}...`);
  const count = isForce
    ? forceCopyDir(sourceDir, destDir)
    : mergeCopyDir(sourceDir, destDir);
  return count;
}

/**
 * 执行 copy 命令主逻辑。
 */
function run() {
  const SEP = "=".repeat(55);
  console.log(SEP);
  console.log("  openyida copy - 初始化宜搭工作目录");
  console.log(SEP);

  const args = process.argv.slice(3);
  const isForce = args.includes("--force");
  const wantsSkills = args.includes("-skills");
  const wantsProject = args.includes("-project");

  // 1. 查找 npm 包根目录
  const packageRoot = findPackageRoot();
  if (!packageRoot) {
    console.error("\n❌ 未找到 openyida 安装包目录");
    console.error("   请确认 openyida 已正确全局安装：");
    console.error("   npm install -g openyida");
    process.exit(1);
  }

  const packageProjectDir = path.join(packageRoot, "project");
  const packageYidaSkillsDir = path.join(packageRoot, "yida-skills");

  console.log(`\n📦 包根目录: ${packageRoot}`);

  // 2. 确定目标根目录（检测 AI 工具环境）
  const destBase = resolveDestBase();
  console.log(`🤖 目标根目录: ${destBase}`);
  if (isForce) {
    console.log("⚠️  --force 模式：目标目录将被清空后重新复制");
  }

  // 3. 确定要复制/链接的内容
  //    - 指定了 -skills：只创建 yida-skills/ 软链接
  //    - 指定了 -project：只复制 project/
  //    - 两者都没指定（默认）：只复制 project/
  //    - 两者都指定：同时处理两项
  const shouldCopyProject = wantsProject || (!wantsSkills);
  const shouldLinkSkills = wantsSkills;

  const results = [];

  if (shouldCopyProject) {
    const count = copyItem(
      "project/ 工作目录模板",
      packageProjectDir,
      path.join(destBase, "project"),
      isForce
    );
    results.push({ label: "project/", dest: path.join(destBase, "project"), count, type: "copy" });
  }

  if (shouldLinkSkills) {
    console.log(`\n📂 创建 yida-skills/ 软链接...`);
    const success = createSymlink(
      packageYidaSkillsDir,
      path.join(destBase, "yida-skills")
    );
    results.push({
      label: "yida-skills/",
      dest: path.join(destBase, "yida-skills"),
      count: success ? 1 : 0,
      type: "symlink"
    });
  }

  // 4. 打印汇总
  const copyCount = results.filter(r => r.type === "copy").reduce((sum, r) => sum + r.count, 0);
  const linkCount = results.filter(r => r.type === "symlink").length;
  console.log(`\n${SEP}`);
  console.log(`✅ 完成！`);
  if (copyCount > 0) {
    console.log(`   复制文件: ${copyCount} 个`);
  }
  if (linkCount > 0) {
    console.log(`   创建软链接: ${linkCount} 个`);
  }
  results.forEach((r) => {
    if (r.type === "symlink") {
      console.log(`   ${r.label.padEnd(14)} → ${r.dest} (软链接)`);
    } else {
      console.log(`   ${r.label.padEnd(14)} → ${r.dest} (${r.count} 个文件)`);
    }
  });
  console.log(SEP);
}

module.exports = { run };
