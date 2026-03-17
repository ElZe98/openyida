#!/usr/bin/env node
/**
 * prepublish.js - npm 发布前钩子
 *
 * 将项目根目录的 openyida/ 目录完整拷贝到 yida-cli/openyida/，
 * 使其随 npm 包一起发布，供 postinstall 脚本使用。
 */

"use strict";

const fs = require("fs");
const path = require("path");

const YIDA_CLI_DIR = path.resolve(__dirname, "..");
const SOURCE_DIR = path.resolve(YIDA_CLI_DIR, "..", "openyida");
const DEST_DIR = path.resolve(YIDA_CLI_DIR, "openyida");

/**
 * 递归复制目录（强制覆盖已有文件）
 */
function copyDirRecursive(sourceDir, destDir) {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`源目录不存在: ${sourceDir}`);
  }

  fs.mkdirSync(destDir, { recursive: true });

  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  let copiedCount = 0;

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copiedCount += copyDirRecursive(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`  复制: ${path.relative(YIDA_CLI_DIR, destPath)}`);
      copiedCount++;
    }
  }

  return copiedCount;
}

/**
 * 递归收集目录下所有文件的相对路径（相对于 baseDir）。
 * @returns {string[]} 排序后的相对路径列表
 */
function collectAllRelativePaths(baseDir, currentDir) {
  const dir = currentDir || baseDir;
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectAllRelativePaths(baseDir, fullPath));
    } else {
      results.push(path.relative(baseDir, fullPath));
    }
  }

  return results.sort();
}

/**
 * 校验拷贝结果：逐文件对比源目录和目标目录的内容是否完全一致。
 * 有差异则打印详情并抛出错误。
 */
function verifyDiff(sourceDir, destDir) {
  const sourcePaths = collectAllRelativePaths(sourceDir);
  const destPaths = collectAllRelativePaths(destDir);

  const missingInDest = sourcePaths.filter((p) => !destPaths.includes(p));
  const extraInDest = destPaths.filter((p) => !sourcePaths.includes(p));
  const contentMismatches = [];

  for (const relativePath of sourcePaths) {
    if (missingInDest.includes(relativePath)) continue;
    const sourceContent = fs.readFileSync(path.join(sourceDir, relativePath));
    const destContent = fs.readFileSync(path.join(destDir, relativePath));
    if (!sourceContent.equals(destContent)) {
      contentMismatches.push(relativePath);
    }
  }

  const hasErrors = missingInDest.length > 0 || extraInDest.length > 0 || contentMismatches.length > 0;

  if (!hasErrors) {
    console.log(`\n✅ diff 校验通过，共 ${sourcePaths.length} 个文件内容完全一致`);
    return;
  }

  console.error("\n❌ diff 校验失败，拷贝结果与源目录不一致：");

  if (missingInDest.length > 0) {
    console.error(`\n  缺失文件（源有，目标无）：`);
    missingInDest.forEach((p) => console.error(`    - ${p}`));
  }
  if (extraInDest.length > 0) {
    console.error(`\n  多余文件（目标有，源无）：`);
    extraInDest.forEach((p) => console.error(`    + ${p}`));
  }
  if (contentMismatches.length > 0) {
    console.error(`\n  内容不一致的文件：`);
    contentMismatches.forEach((p) => console.error(`    ≠ ${p}`));
  }

  throw new Error("openyida 拷贝校验失败，请检查上方 diff 详情");
}

function cleanup() {
  console.log("=".repeat(50));
  console.log("  postpublish - 清理临时 openyida 目录");
  console.log("=".repeat(50));
  console.log(`\n  目标目录: ${DEST_DIR}\n`);

  if (fs.existsSync(DEST_DIR)) {
    fs.rmSync(DEST_DIR, { recursive: true, force: true });
    console.log("✅ 已删除临时 openyida/ 目录");
  } else {
    console.log("⚠️  目录不存在，无需清理");
  }
  console.log("=".repeat(50));
}

function main() {
  const isCleanup = process.argv.includes("--cleanup");

  if (isCleanup) {
    cleanup();
    return;
  }

  console.log("=".repeat(50));
  console.log("  prepublish - 拷贝 openyida 到 yida-cli");
  console.log("=".repeat(50));
  console.log(`\n  源目录: ${SOURCE_DIR}`);
  console.log(`  目标目录: ${DEST_DIR}\n`);

  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ 源目录不存在: ${SOURCE_DIR}`);
    console.error("   请确保在项目根目录下存在 openyida/ 目录");
    process.exit(1);
  }

  // 清空目标目录（确保不残留旧文件）
  if (fs.existsSync(DEST_DIR)) {
    fs.rmSync(DEST_DIR, { recursive: true, force: true });
    console.log("  🗑️  已清空旧的 openyida/ 目录");
  }

  const copiedCount = copyDirRecursive(SOURCE_DIR, DEST_DIR);

  console.log(`\n  共复制 ${copiedCount} 个文件，开始 diff 校验...`);
  verifyDiff(SOURCE_DIR, DEST_DIR);
  console.log("=".repeat(50));
}

main();
