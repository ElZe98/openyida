#!/usr/bin/env node
/**
 * validate-i18n.js - 国际化完整性校验脚本
 *
 * 在 CI 中运行，确保：
 * 1. 所有语言包的 key 与基准语言包 (zh.js) 一致
 * 2. bin/yida.js 中不存在未通过 t() 的硬编码中文字符串
 * 3. 语言包文件数量与 SUPPORTED_LANGUAGES 一致
 *
 * 用法：
 *   node scripts/validate-i18n.js           # 默认模式（key 缺失为 warning）
 *   node scripts/validate-i18n.js --strict  # 严格模式（key 缺失为 error）
 *
 * 退出码：0 = 通过，1 = 存在问题
 */
'use strict';

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'lib', 'core', 'locales');
const BIN_YIDA = path.join(__dirname, '..', 'bin', 'yida.js');

const EXPECTED_LOCALES = [
  'zh', 'en', 'ja', 'ko', 'fr', 'de', 'es', 'pt', 'vi', 'hi', 'ar', 'zh-TW',
];

const isStrictMode = process.argv.includes('--strict');

let errorCount = 0;
let warningCount = 0;

function logError(message) {
  console.error(`  ❌ ${message}`);
  errorCount++;
}

function logWarning(message) {
  console.warn(`  ⚠️  ${message}`);
  warningCount++;
}

function logSuccess(message) {
  console.log(`  ✅ ${message}`);
}

/**
 * 递归提取对象的所有 key 路径（点号分隔）
 */
function extractKeyPaths(obj, prefix) {
  const keys = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...extractKeyPaths(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// ── 检查 1：语言包文件是否齐全 ──────────────────────────────────────

console.log('\n📋 检查 1：语言包文件完整性');

const missingFiles = [];
const localeModules = {};

for (const locale of EXPECTED_LOCALES) {
  const filePath = path.join(LOCALES_DIR, `${locale}.js`);
  if (!fs.existsSync(filePath)) {
    logError(`缺少语言包文件: ${locale}.js`);
    missingFiles.push(locale);
  } else {
    try {
      localeModules[locale] = require(filePath);
    } catch (loadError) {
      logError(`语言包加载失败: ${locale}.js - ${loadError.message}`);
      missingFiles.push(locale);
    }
  }
}

const existingLocaleFiles = fs.readdirSync(LOCALES_DIR)
  .filter((fileName) => fileName.endsWith('.js'))
  .map((fileName) => fileName.replace('.js', ''));

const unexpectedFiles = existingLocaleFiles.filter(
  (locale) => !EXPECTED_LOCALES.includes(locale)
);
if (unexpectedFiles.length > 0) {
  logWarning(`发现未注册的语言包文件: ${unexpectedFiles.join(', ')}`);
}

if (missingFiles.length === 0) {
  logSuccess(`所有 ${EXPECTED_LOCALES.length} 个语言包文件存在且可加载`);
}

// ── 检查 2：语言包 key 一致性 ────────────────────────────────────────

console.log('\n📋 检查 2：语言包 key 一致性（基准: zh.js）');

if (localeModules['zh']) {
  const baseKeys = extractKeyPaths(localeModules['zh'], '');
  const baseKeySet = new Set(baseKeys);

  for (const locale of EXPECTED_LOCALES) {
    if (locale === 'zh' || !localeModules[locale]) {continue;}

    const localeKeys = extractKeyPaths(localeModules[locale], '');
    const localeKeySet = new Set(localeKeys);

    const missingKeys = baseKeys.filter((key) => !localeKeySet.has(key));
    const extraKeys = localeKeys.filter((key) => !baseKeySet.has(key));

    if (missingKeys.length > 0) {
      // 严格模式下 key 缺失为 error，默认模式为 warning
      const reportMissing = isStrictMode ? logError : logWarning;
      reportMissing(`${locale}.js 缺少 ${missingKeys.length} 个 key:`);
      const logFn = isStrictMode ? console.error : console.warn;
      for (const key of missingKeys.slice(0, 10)) {
        logFn(`         - ${key}`);
      }
      if (missingKeys.length > 10) {
        logFn(`         ... 还有 ${missingKeys.length - 10} 个`);
      }
    }

    if (extraKeys.length > 0) {
      logWarning(`${locale}.js 多出 ${extraKeys.length} 个 key:`);
      for (const key of extraKeys.slice(0, 5)) {
        console.warn(`         - ${key}`);
      }
      if (extraKeys.length > 5) {
        console.warn(`         ... 还有 ${extraKeys.length - 5} 个`);
      }
    }

    if (missingKeys.length === 0 && extraKeys.length === 0) {
      logSuccess(`${locale}.js - ${localeKeys.length} 个 key 全部匹配`);
    }
  }
} else {
  logError('基准语言包 zh.js 不可用，跳过 key 一致性检查');
}

// ── 检查 3：bin/yida.js 硬编码中文检测 ──────────────────────────────

console.log('\n📋 检查 3：bin/yida.js 硬编码中文检测');

if (fs.existsSync(BIN_YIDA)) {
  const yidaContent = fs.readFileSync(BIN_YIDA, 'utf8');
  const lines = yidaContent.split('\n');

  // 匹配包含中文字符的行（排除注释和合理的场景）
  const chinesePattern = /[\u4e00-\u9fff]/;
  const hardcodedLines = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const trimmed = line.trim();

    // 跳过注释行
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      continue;
    }

    // 跳过 require 语句
    if (trimmed.includes('require(')) {continue;}

    // 检测 console.log/console.error 中的硬编码中文
    if (chinesePattern.test(trimmed)) {
      // 检查是否在字符串字面量中（排除 t() 调用内的）
      // 简单策略：如果行中有中文且不是注释，就标记
      if (
        (trimmed.includes('console.log') || trimmed.includes('console.error')) &&
        !trimmed.includes('t(')
      ) {
        hardcodedLines.push({ line: lineIndex + 1, content: trimmed });
      }
    }
  }

  if (hardcodedLines.length > 0) {
    logWarning(`发现 ${hardcodedLines.length} 处可能的硬编码中文:`);
    for (const item of hardcodedLines.slice(0, 10)) {
      console.warn(`         L${item.line}: ${item.content.substring(0, 80)}`);
    }
    if (hardcodedLines.length > 10) {
      console.warn(`         ... 还有 ${hardcodedLines.length - 10} 处`);
    }
  } else {
    logSuccess('bin/yida.js 未发现硬编码中文（console 输出）');
  }
} else {
  logError('bin/yida.js 文件不存在');
}

// ── 检查 4：翻译值非空检测 ───────────────────────────────────────────

console.log('\n📋 检查 4：翻译值非空检测');

for (const locale of EXPECTED_LOCALES) {
  if (!localeModules[locale]) {continue;}

  const keys = extractKeyPaths(localeModules[locale], '');
  const emptyKeys = [];

  for (const keyPath of keys) {
    const parts = keyPath.split('.');
    let value = localeModules[locale];
    for (const part of parts) {
      value = value[part];
    }
    if (typeof value === 'string' && value.trim() === '') {
      emptyKeys.push(keyPath);
    }
  }

  if (emptyKeys.length > 0) {
    logWarning(`${locale}.js 有 ${emptyKeys.length} 个空翻译值:`);
    for (const key of emptyKeys.slice(0, 5)) {
      console.warn(`         - ${key}`);
    }
  }
}

logSuccess('翻译值非空检测完成');

// ── 汇总结果 ─────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(50));

if (errorCount > 0) {
  console.error(`\n❌ 校验失败: ${errorCount} 个错误, ${warningCount} 个警告`);
  console.error('请修复以上错误后重新提交。\n');
  process.exit(1);
} else if (warningCount > 0) {
  console.log(`\n⚠️  校验通过（有 ${warningCount} 个警告）`);
  console.log('建议关注以上警告信息。\n');
  process.exit(0);
} else {
  console.log('\n✅ i18n 校验全部通过！\n');
  process.exit(0);
}
