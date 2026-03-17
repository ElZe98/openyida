/**
 * copy.js - 初始化/复制 openyida 工作目录到当前 AI 工具环境
 *
 * 用途：
 *   首次在某个 AI 工具中使用宜搭，或切换到新的 AI 工具时，
 *   运行 `yidacli copy` 将 openyida/ 工作目录复制到当前工具对应的位置。
 *
 * 复制目标策略：
 *   - 悟空（Wukong）：复制到 ~/.real/workspace/openyida（专属 workspace，路径固定）
 *   - 其他 AI 工具：复制到当前工程目录（process.cwd()）下的 openyida/
 *
 * 复制源：npm 全局安装包内的 openyida/ 目录（通过 require.resolve 定位）
 *
 * 文件覆盖策略：
 *   - 已存在的文件：强制覆盖（更新到最新版本）
 *   - 目标目录中已有但源目录没有的文件：保留（不删除用户数据）
 */

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { detectEnvironment } = require("./env");

/**
 * 查找 npm 全局安装包内的 openyida/ 目录。
 * 通过 require.resolve 定位包的 package.json，从而找到包根目录。
 * @returns {string|null} openyida 目录的绝对路径，找不到则返回 null
 */
function findPackageOpenyidaDir() {
  try {
    const packageJsonPath = require.resolve("@openyida/yidacli/package.json");
    const packageRoot = path.dirname(packageJsonPath);
    const openyidaDir = path.join(packageRoot, "openyida");
    return fs.existsSync(openyidaDir) ? openyidaDir : null;
  } catch {
    return null;
  }
}

/**
 * 合并复制目录：
 *   - 源目录中的文件 → 强制覆盖到目标目录
 *   - 目标目录中已有但源目录没有的文件 → 保留不动
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
      console.log(`    覆盖: ${destPath}`);
      copiedCount++;
    }
  }

  return copiedCount;
}

/**
 * 执行 copy 命令主逻辑。
 *
 * 支持 --force 参数：跳过工具检测，强制复制到 process.cwd()/openyida。
 */
function run() {
  const SEP = "=".repeat(55);
  console.log(SEP);
  console.log("  yidacli copy - 初始化 openyida 工作目录");
  console.log(SEP);

  const args = process.argv.slice(3);
  const isForce = args.includes("--force");

  // 1. 查找 npm 包内的 openyida/ 目录
  const packageOpenyidaDir = findPackageOpenyidaDir();
  if (!packageOpenyidaDir) {
    console.error("\n❌ 未找到 npm 包内的 openyida/ 目录");
    console.error("   请确认 @openyida/yidacli 已正确全局安装：");
    console.error("   npm install -g @openyida/yidacli");
    process.exit(1);
  }

  console.log(`\n📦 源目录: ${packageOpenyidaDir}`);

  // 2. --force 模式：跳过检测，直接复制到当前目录
  if (isForce) {
    const destOpenyidaDir = path.join(process.cwd(), "openyida");
    console.log("⚠️  --force 模式：强制复制到当前目录");
    console.log(`📁 目标目录: ${destOpenyidaDir}\n`);
    const copiedCount = mergeCopyDir(packageOpenyidaDir, destOpenyidaDir);
    console.log(`\n${SEP}`);
    console.log(`✅ 完成！共复制/更新 ${copiedCount} 个文件`);
    console.log(`   目标目录: ${destOpenyidaDir}`);
    console.log(SEP);
    return;
  }

  // 3. 检测当前 AI 工具环境
  const { activeToolName, activeProjectRoot, results } = detectEnvironment();
  const activeResult = results.find((r) => r.displayName === activeToolName);
  const isWukong = activeResult && activeResult.dirName === ".real";

  // 4. 确定目标目录
  let destOpenyidaDir;
  if (isWukong) {
    // 悟空：目标路径固定为专属 workspace
    destOpenyidaDir = activeProjectRoot || path.join(os.homedir(), ".real", "workspace", "openyida");
  } else if (activeToolName) {
    // 其他 AI 工具：复制到当前工程目录下的 openyida/
    destOpenyidaDir = path.join(process.cwd(), "openyida");
  } else {
    // 未检测到活跃工具
    console.error("\n❌ 未检测到活跃的 AI 工具环境");
    console.error("   支持的工具：悟空、OpenCode、Claude Code、Aone Copilot、Cursor、Qoder、iFlow");
    console.error("\n   当前检测结果：");
    results.forEach((r) => {
      console.error(`     ${r.isActive ? "✅" : "⬜"} ${r.displayName}`);
    });
    console.error("\n   如需强制复制到当前目录，请运行：");
    console.error("   yidacli copy --force");
    process.exit(1);
  }

  console.log(`🤖 当前 AI 工具: ${activeToolName}`);
  console.log(`📁 目标目录: ${destOpenyidaDir}\n`);

  // 5. 执行复制
  const copiedCount = mergeCopyDir(packageOpenyidaDir, destOpenyidaDir);

  console.log(`\n${SEP}`);
  console.log(`✅ 完成！共复制/更新 ${copiedCount} 个文件`);
  console.log(`   目标目录: ${destOpenyidaDir}`);
  console.log(SEP);
}

module.exports = { run };
