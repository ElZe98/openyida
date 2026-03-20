/**
 * validate-deps.js - CI 路径依赖校验
 *
 * 扫描 lib/ 和 bin/ 下所有 .js 文件中的相对路径 require()，
 * 验证每个引用的目标文件或目录是否实际存在。
 *
 * 用法：
 *   node scripts/validate-deps.js          # 默认检查 lib/ 和 bin/
 *   node scripts/validate-deps.js --strict  # 严格模式（同默认，保留扩展入口）
 *
 * 退出码：
 *   0 - 全部通过
 *   1 - 存在路径错误
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ── 配置 ──────────────────────────────────────────────

const SCAN_DIRS = ['lib', 'bin'];
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ── 工具函数 ──────────────────────────────────────────

/**
 * 递归收集目录下所有 .js 文件的绝对路径
 * @param {string} dir
 * @returns {string[]}
 */
function collectJsFiles(dir) {
  const absoluteDir = path.resolve(PROJECT_ROOT, dir);
  if (!fs.existsSync(absoluteDir)) {return [];}

  const results = [];
  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(absoluteDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectJsFiles(path.relative(PROJECT_ROOT, fullPath)));
    } else if (entry.name.endsWith('.js')) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * 从文件内容中提取所有相对路径 require() 的引用路径
 * 支持单引号和双引号，匹配 ./ 和 ../ 开头的路径
 * @param {string} content
 * @returns {string[]}
 */
function extractRelativeRequires(content) {
  const results = [];
  // 匹配 require('./xxx') 和 require('../xxx')，支持单双引号
  const pattern = /require\(\s*(['"])(\.\.?\/[^'"]+)\1\s*\)/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    results.push(match[2]);
  }
  return results;
}

/**
 * 判断 require 路径解析后的目标是否存在
 * Node.js 解析规则：
 *   1. 精确文件路径
 *   2. 路径 + .js 扩展名
 *   3. 路径作为目录，查找 index.js
 * @param {string} resolvedPath - 已解析的绝对路径
 * @returns {boolean}
 */
function resolvedPathExists(resolvedPath) {
  return (
    fs.existsSync(resolvedPath) ||
    fs.existsSync(resolvedPath + '.js') ||
    fs.existsSync(path.join(resolvedPath, 'index.js'))
  );
}

// ── 主流程 ────────────────────────────────────────────

function main() {
  const errors = [];
  const warnings = [];
  let totalFiles = 0;
  let totalRequires = 0;

  // 收集所有待扫描文件
  const allFiles = [];
  for (const scanDir of SCAN_DIRS) {
    allFiles.push(...collectJsFiles(scanDir));
  }

  for (const absoluteFilePath of allFiles) {
    totalFiles++;
    const fileDir = path.dirname(absoluteFilePath);
    const relativeFilePath = path.relative(PROJECT_ROOT, absoluteFilePath);

    let content;
    try {
      content = fs.readFileSync(absoluteFilePath, 'utf-8');
    } catch (readError) {
      warnings.push(`  ⚠️  无法读取文件: ${relativeFilePath} (${readError.message})`);
      continue;
    }

    const relativeRequires = extractRelativeRequires(content);

    for (const requirePath of relativeRequires) {
      totalRequires++;
      const resolvedAbsPath = path.resolve(fileDir, requirePath);

      if (!resolvedPathExists(resolvedAbsPath)) {
        const resolvedRelPath = path.relative(PROJECT_ROOT, resolvedAbsPath);
        errors.push({
          file: relativeFilePath,
          require: requirePath,
          resolved: resolvedRelPath,
        });
      }
    }
  }

  // ── 输出结果 ──────────────────────────────────────────

  const SEP = '─'.repeat(60);
  console.log(SEP);
  console.log('🔍 路径依赖校验');
  console.log(SEP);
  console.log(`扫描目录: ${SCAN_DIRS.join(', ')}`);
  console.log(`扫描文件: ${totalFiles} 个`);
  console.log(`相对路径引用: ${totalRequires} 处`);
  console.log('');

  if (warnings.length > 0) {
    console.log('警告:');
    for (const warning of warnings) {
      console.log(warning);
    }
    console.log('');
  }

  if (errors.length === 0) {
    console.log('✅ 所有路径引用均有效，未发现错误');
    console.log(SEP);
    process.exit(0);
  }

  console.error(`❌ 发现 ${errors.length} 处无效路径引用:\n`);
  for (const error of errors) {
    console.error(`  文件:   ${error.file}`);
    console.error(`  引用:   ${error.require}`);
    console.error(`  解析为: ${error.resolved}`);
    console.error('');
  }

  console.error('修复建议：');
  console.error('  - 核心工具模块（utils/i18n/babel-transform）位于 lib/core/');
  console.error('  - 登录认证模块（login/auth/org）位于 lib/auth/');
  console.error('  - 请根据文件所在目录调整相对路径');
  console.error(SEP);
  process.exit(1);
}

main();
