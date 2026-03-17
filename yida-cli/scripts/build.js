#!/usr/bin/env node
/**
 * build.js - 构建脚本
 *
 * 将 src/ 目录下所有 JS 文件用 UglifyJS 压缩后输出到 dist/，
 * 保持原有目录结构。
 */

"use strict";

const fs = require("fs");
const path = require("path");
const UglifyJS = require("uglify-js");

const YIDA_CLI_DIR = path.resolve(__dirname, "..");
const SRC_DIR = path.resolve(YIDA_CLI_DIR, "src");
const DIST_DIR = path.resolve(YIDA_CLI_DIR, "dist");

/**
 * 递归收集目录下所有 .js 文件
 */
function collectJsFiles(dir, baseDir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectJsFiles(fullPath, baseDir));
    } else if (entry.name.endsWith(".js")) {
      results.push(fullPath);
    }
  }
  return results;
}

function main() {
  console.log("=".repeat(50));
  console.log("  build - 构建 yida-cli（uglify src/ → dist/）");
  console.log("=".repeat(50));

  // 清空并重建 dist 目录
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
    console.log("\n  🗑️  已清空旧的 dist/ 目录");
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });

  const jsFiles = collectJsFiles(SRC_DIR, SRC_DIR);
  console.log(`\n  📦 共发现 ${jsFiles.length} 个源文件，开始压缩...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const srcFile of jsFiles) {
    const relativePath = path.relative(SRC_DIR, srcFile);
    const distFile = path.join(DIST_DIR, relativePath);

    // 确保目标目录存在
    fs.mkdirSync(path.dirname(distFile), { recursive: true });

    const sourceCode = fs.readFileSync(srcFile, "utf-8");
    const result = UglifyJS.minify(sourceCode, {
      // 保留 require 调用，不做模块打包
      compress: { passes: 1 },
      mangle: true,
    });

    if (result.error) {
      console.error(`  ❌ 压缩失败: ${relativePath}`);
      console.error(`     ${result.error.message}`);
      errorCount++;
      // 压缩失败时原样复制，保证可用性
      fs.copyFileSync(srcFile, distFile);
    } else {
      fs.writeFileSync(distFile, result.code, "utf-8");
      console.log(`  ✅ ${relativePath}`);
      successCount++;
    }
  }

  console.log("\n" + "=".repeat(50));
  if (errorCount === 0) {
    console.log(`✅ 构建完成，共压缩 ${successCount} 个文件`);
  } else {
    console.log(`⚠️  构建完成，${successCount} 个成功，${errorCount} 个失败（已原样复制）`);
  }
  console.log("=".repeat(50));

  if (errorCount > 0) {
    process.exit(1);
  }
}

main();
