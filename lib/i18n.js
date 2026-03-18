/**
 * i18n.js - 国际化支持模块
 *
 * 支持语言：zh（中文）、en（英文）、ja（日文）
 *
 * 语言检测优先级：
 *   1. OPENYIDA_LANG 环境变量（如：OPENYIDA_LANG=en）
 *   2. LANG / LC_ALL 系统环境变量
 *   3. 默认：zh（中文）
 *
 * 用法：
 *   const { t } = require('./i18n');
 *   console.log(t('login.success'));
 *   console.log(t('create_app.usage', 'yidacli'));
 */

"use strict";

const SUPPORTED_LANGUAGES = ["zh", "en", "ja"];
const DEFAULT_LANGUAGE = "zh";

/**
 * 从环境变量或系统 locale 中检测当前语言。
 * @returns {"zh"|"en"|"ja"}
 */
function detectLanguage() {
  // 优先级1：OPENYIDA_LANG 环境变量
  const envLang = process.env.OPENYIDA_LANG;
  if (envLang) {
    const normalized = envLang.toLowerCase().split(/[-_]/)[0];
    if (SUPPORTED_LANGUAGES.includes(normalized)) {
      return normalized;
    }
  }

  // 优先级2：系统 LANG / LC_ALL 环境变量
  const systemLang = process.env.LC_ALL || process.env.LANG || "";
  const systemLangCode = systemLang.toLowerCase().split(/[-_.]/)[0];

  if (systemLangCode === "ja") return "ja";
  if (systemLangCode === "en") return "en";
  if (systemLangCode === "zh") return "zh";

  // 优先级3：默认中文
  return DEFAULT_LANGUAGE;
}

let currentLanguage = detectLanguage();
let translations = null;

/**
 * 懒加载翻译文件。
 * @returns {object} 翻译字典
 */
function loadTranslations() {
  if (translations) return translations;
  try {
    translations = require(`./locales/${currentLanguage}`);
  } catch {
    // 加载失败时回退到中文
    translations = require("./locales/zh");
  }
  return translations;
}

/**
 * 翻译函数，支持 {0} {1} 占位符插值。
 * @param {string} key - 翻译键（支持点号分隔的嵌套路径，如 "login.success"）
 * @param {...string} args - 插值参数
 * @returns {string}
 */
function t(key, ...args) {
  const dict = loadTranslations();

  // 支持嵌套路径：如 "login.success" → dict.login.success
  const value = key.split(".").reduce((obj, segment) => {
    return obj && typeof obj === "object" ? obj[segment] : undefined;
  }, dict);

  if (typeof value !== "string") {
    // 找不到翻译时，尝试中文兜底
    if (currentLanguage !== "zh") {
      const zhDict = require("./locales/zh");
      const zhValue = key.split(".").reduce((obj, segment) => {
        return obj && typeof obj === "object" ? obj[segment] : undefined;
      }, zhDict);
      if (typeof zhValue === "string") {
        return interpolate(zhValue, args);
      }
    }
    // 最终兜底：返回 key 本身
    return key;
  }

  return interpolate(value, args);
}

/**
 * 将 {0} {1} 占位符替换为实际参数。
 * @param {string} template
 * @param {string[]} args
 * @returns {string}
 */
function interpolate(template, args) {
  if (!args || args.length === 0) return template;
  return template.replace(/\{(\d+)\}/g, (match, index) => {
    const argValue = args[parseInt(index, 10)];
    return argValue !== undefined ? String(argValue) : match;
  });
}

/**
 * 获取当前语言。
 * @returns {string}
 */
function getLanguage() {
  return currentLanguage;
}

/**
 * 手动设置语言（主要用于测试）。
 * @param {"zh"|"en"|"ja"} lang
 */
function setLanguage(lang) {
  if (SUPPORTED_LANGUAGES.includes(lang)) {
    currentLanguage = lang;
    translations = null; // 清空缓存，下次 t() 时重新加载
  }
}

module.exports = { t, getLanguage, setLanguage, detectLanguage, SUPPORTED_LANGUAGES };
