'use strict';

/**
 * compile.js - 宜搭自定义页面仅编译工具（不发布）
 *
 * 用法：
 *   openyida compile <源文件路径>
 *
 * 示例：
 *   openyida compile pages/src/demo.js
 *
 * 编译逻辑复用 publish.js 中的 compileSource，产物输出到 project/pages/dist/<name>.js。
 */

const fs = require('fs');
const path = require('path');
const { compileSource } = require('./publish');
const { t } = require('../core/i18n');

/**
 * 主流程：编译源文件，产物已由 compileSource 写入 dist 目录
 * @param {string[]} args - CLI 参数，args[0] 为源文件路径
 */
async function run(args) {
  const sourceFile = args[0];
  if (!sourceFile) {
    console.error(t('compile.usage'));
    console.error(t('compile.example'));
    process.exit(1);
  }

  const sourcePath = path.resolve(sourceFile);
  if (!fs.existsSync(sourcePath)) {
    console.error(t('compile.source_not_found', sourcePath));
    process.exit(1);
  }

  try {
    compileSource(sourcePath);
  } catch (error) {
    console.error(t('compile.exception', error.message));
    process.exit(1);
  }
}

module.exports = { run };
