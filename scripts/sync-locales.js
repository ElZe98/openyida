#!/usr/bin/env node
/**
 * sync-locales.js - 语言包同步脚本
 *
 * 以 zh.js 为基准，确保所有语言包拥有完全一致的 key 结构。
 * - 保留目标语言包中已有的翻译（key 路径匹配时）
 * - 缺失的 key 优先用 en.js 的翻译填充，en.js 也没有则用 zh.js 的值
 * - 删除目标语言包中多余的 key（不在 zh.js 中的）
 *
 * 用法：node scripts/sync-locales.js [--dry-run]
 */
'use strict';

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'lib', 'core', 'locales');
const isDryRun = process.argv.includes('--dry-run');

const TARGET_LOCALES = ['en', 'ja', 'ko', 'fr', 'de', 'es', 'pt', 'vi', 'hi', 'ar', 'zh-TW'];

// ── 工具函数 ─────────────────────────────────────────

/**
 * 递归提取对象的所有叶子节点 key 路径
 */
function extractKeyPaths(obj, prefix) {
  const paths = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      paths.push(...extractKeyPaths(obj[key], fullKey));
    } else {
      paths.push(fullKey);
    }
  }
  return paths;
}

/**
 * 根据点号路径获取嵌套对象的值
 */
function getNestedValue(obj, keyPath) {
  const parts = keyPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

/**
 * 根据点号路径设置嵌套对象的值
 */
function setNestedValue(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === undefined || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

/**
 * 将对象序列化为 JS module.exports 格式的字符串
 */
function serializeToModule(obj, fileHeader) {
  const jsonStr = JSON.stringify(obj, null, 2);

  // 将 JSON 转为 JS 对象字面量格式
  let jsStr = jsonStr
    // 将 JSON key 的双引号去掉（如果 key 是合法标识符）
    .replace(/"([a-zA-Z_$][a-zA-Z0-9_$]*)"\s*:/g, '$1:')
    // 保留含特殊字符的 key 的双引号（如 zh-TW）
    // 将值中的双引号字符串改为单引号（简单字符串）
    .replace(/: "((?:[^"\\]|\\.)*)"/g, function(match, content) {
      // 如果内容包含单引号，保持双引号
      if (content.includes("'")) {
        return ': "' + content + '"';
      }
      // 如果内容包含 \n（实际换行转义），使用模板字符串
      if (content.includes('\\n')) {
        const unescaped = content
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"');
        return ': `' + unescaped + '`';
      }
      return ": '" + content + "'";
    });

  // 处理多行模板字符串值（已经是反引号包裹的）
  // JSON.stringify 会把模板字符串中的换行转为 \n，需要还原
  jsStr = jsStr.replace(/: `([^`]*)`/g, function(match, content) {
    return ': `' + content + '`';
  });

  return fileHeader + 'module.exports = ' + jsStr + ';\n';
}

// ── 主逻辑 ───────────────────────────────────────────

console.log('📦 语言包同步工具');
console.log('   基准: zh.js');
console.log('   模式: ' + (isDryRun ? '预览（不写入文件）' : '写入文件'));
console.log('');

// 加载基准语言包
const zhModule = require(path.join(LOCALES_DIR, 'zh.js'));
const enModule = require(path.join(LOCALES_DIR, 'en.js'));
const baseKeyPaths = extractKeyPaths(zhModule, '');

console.log(`   基准 key 数量: ${baseKeyPaths.length}`);
console.log('');

for (const locale of TARGET_LOCALES) {
  const filePath = path.join(LOCALES_DIR, `${locale}.js`);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${locale}.js 不存在，跳过`);
    continue;
  }

  const existingModule = require(filePath);
  const existingKeyPaths = extractKeyPaths(existingModule, '');

  // 构建新的语言包对象
  const newModule = {};
  let preservedCount = 0;
  let filledFromEnCount = 0;
  let filledFromZhCount = 0;
  let removedCount = 0;

  for (const keyPath of baseKeyPaths) {
    const existingValue = getNestedValue(existingModule, keyPath);

    if (existingValue !== undefined && typeof existingValue === typeof getNestedValue(zhModule, keyPath)) {
      // 目标语言包已有此 key，保留
      setNestedValue(newModule, keyPath, existingValue);
      preservedCount++;
    } else if (locale !== 'en') {
      // 缺失的 key，优先用 en.js 填充
      const enValue = getNestedValue(enModule, keyPath);
      if (enValue !== undefined) {
        setNestedValue(newModule, keyPath, enValue);
        filledFromEnCount++;
      } else {
        // en.js 也没有，用 zh.js 的值
        setNestedValue(newModule, keyPath, getNestedValue(zhModule, keyPath));
        filledFromZhCount++;
      }
    } else {
      // en.js 自身缺失的 key，用 zh.js 的值
      setNestedValue(newModule, keyPath, getNestedValue(zhModule, keyPath));
      filledFromZhCount++;
    }
  }

  // 统计被移除的多余 key
  for (const keyPath of existingKeyPaths) {
    if (getNestedValue(zhModule, keyPath) === undefined) {
      removedCount++;
    }
  }

  const newKeyPaths = extractKeyPaths(newModule, '');

  console.log(`📝 ${locale}.js:`);
  console.log(`   保留: ${preservedCount} | 从 en 填充: ${filledFromEnCount} | 从 zh 填充: ${filledFromZhCount} | 移除多余: ${removedCount}`);
  console.log(`   最终 key 数量: ${newKeyPaths.length} (基准: ${baseKeyPaths.length})`);

  if (!isDryRun) {
    // 读取原文件头部注释
    const originalContent = fs.readFileSync(filePath, 'utf8');
    let fileHeader = '';

    // 提取文件头部（注释 + "use strict"）
    const headerMatch = originalContent.match(/^([\s\S]*?"use strict";\s*\n)/);
    if (headerMatch) {
      fileHeader = headerMatch[1] + '\n';
    } else {
      // 如果没有匹配到，使用默认头部
      const langNames = {
        en: 'English', ja: 'Japanese (日本語)', ko: 'Korean (한국어)',
        fr: 'French (Français)', de: 'German (Deutsch)', es: 'Spanish (Español)',
        pt: 'Portuguese (Português)', vi: 'Vietnamese (Tiếng Việt)',
        hi: 'Hindi (हिन्दी)', ar: 'Arabic (العربية)', 'zh-TW': 'Traditional Chinese (繁體中文)',
      };
      fileHeader = `/**\n * ${locale}.js - ${langNames[locale] || locale} translations\n */\n"use strict";\n\n`;
    }

    // 写入文件 - 使用 JSON 序列化后手动转为 JS 格式
    const output = generateModuleSource(newModule, fileHeader, originalContent);
    fs.writeFileSync(filePath, output, 'utf8');
    console.log(`   ✅ 已写入 ${locale}.js`);
  }

  console.log('');
}

if (isDryRun) {
  console.log('ℹ️  预览模式，未写入任何文件。去掉 --dry-run 参数以实际写入。');
}

console.log('✅ 同步完成！');

/**
 * 生成 module.exports 源码
 * 尽量保持原文件的注释风格
 */
function generateModuleSource(moduleObj, fileHeader, originalContent) {
  // 提取原文件中的分节注释
  const sectionComments = {};
  const commentRegex = /\/\/ ── (lib\/[^\s]+|scripts\/[^\s]+|bin\/[^\s]+|通用) ──/g;
  let commentMatch;
  while ((commentMatch = commentRegex.exec(originalContent)) !== null) {
    sectionComments[commentMatch[1]] = commentMatch[0];
  }

  let output = fileHeader + 'module.exports = {\n';

  // 按 zh.js 的顶层 key 顺序输出
  const zhKeys = Object.keys(zhModule);

  for (let topIdx = 0; topIdx < zhKeys.length; topIdx++) {
    const topKey = zhKeys[topIdx];
    const value = moduleObj[topKey];

    if (value === undefined) {continue;}

    // 尝试添加分节注释
    const sectionComment = findSectionComment(topKey, originalContent);
    if (sectionComment) {
      output += '\n  ' + sectionComment + '\n';
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      output += `  ${formatKey(topKey)}: {\n`;
      const subKeys = Object.keys(value);
      for (let subIdx = 0; subIdx < subKeys.length; subIdx++) {
        const subKey = subKeys[subIdx];
        const subValue = value[subKey];
        output += `    ${formatKey(subKey)}: ${formatValue(subValue)}`;
        if (subIdx < subKeys.length - 1) {
          output += ',';
        } else {
          output += ',';
        }
        output += '\n';
      }
      output += '  }';
    } else {
      output += `  ${formatKey(topKey)}: ${formatValue(value)}`;
    }

    output += ',\n';
  }

  output += '};\n';
  return output;
}

/**
 * 查找某个顶层 key 对应的分节注释
 */
function findSectionComment(topKey, originalContent) {
  // 在原文件中查找紧挨着此 key 定义之前的注释
  const keyPattern = new RegExp(`(// ── [^\\n]+ ──[^\\n]*\\n)\\s*${topKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`);
  const match = originalContent.match(keyPattern);
  if (match) {
    return match[1].trim();
  }

  // 使用 zh.js 原文件的注释映射
  const zhContent = fs.readFileSync(path.join(LOCALES_DIR, 'zh.js'), 'utf8');
  const zhMatch = zhContent.match(keyPattern);
  if (zhMatch) {
    return zhMatch[1].trim();
  }

  return null;
}

/**
 * 格式化 key（如果包含特殊字符则加引号）
 */
function formatKey(key) {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
    return key;
  }
  return `"${key}"`;
}

/**
 * 格式化值为 JS 字面量
 */
function formatValue(value) {
  if (typeof value === 'string') {
    // 多行字符串使用模板字符串
    if (value.includes('\n')) {
      // 转义模板字符串中的反引号和 ${
      const escaped = value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
      return '`' + escaped + '`';
    }
    // 单行字符串
    if (value.includes("'") && !value.includes('"')) {
      return '"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
    }
    if (value.includes("'") && value.includes('"')) {
      return '`' + value.replace(/\\/g, '\\\\').replace(/`/g, '\\`') + '`';
    }
    return "'" + value.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
}
