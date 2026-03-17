/**
 * check-update.js - yidacli 版本更新检查
 *
 * 每天最多向 npm registry 查询一次最新版本，有新版本时在命令结束后打印提示。
 * 全程异步，不阻塞主命令流程。
 */

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require("https");

const CACHE_FILE = path.join(os.homedir(), ".yidacli-update-check.json");
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 小时
const REGISTRY_URL = "https://registry.npmjs.org/yidacli/latest";

/**
 * 从 npm registry 获取最新版本号。
 * @returns {Promise<string|null>}
 */
function fetchLatestVersion() {
  return new Promise((resolve) => {
    const req = https.get(REGISTRY_URL, { timeout: 5000 }, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.version || null);
        } catch {
          resolve(null);
        }
      });
    });
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
  });
}

/**
 * 读取本地缓存的检查记录。
 * @returns {{ lastCheck: number, latestVersion: string } | null}
 */
function readCache() {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
  } catch {
    return null;
  }
}

/**
 * 写入检查记录到本地缓存。
 */
function writeCache(latestVersion) {
  try {
    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify({ lastCheck: Date.now(), latestVersion }),
      "utf-8"
    );
  } catch {
    // 写缓存失败不影响主流程
  }
}

/**
 * 比较版本号，返回 latestVersion 是否比 currentVersion 更新。
 * 仅支持 semver 格式（major.minor.patch）。
 */
function isNewer(currentVersion, latestVersion) {
  const parseParts = (v) => (v || "").split(".").map((n) => parseInt(n, 10) || 0);
  const [cMajor, cMinor, cPatch] = parseParts(currentVersion);
  const [lMajor, lMinor, lPatch] = parseParts(latestVersion);

  if (lMajor !== cMajor) return lMajor > cMajor;
  if (lMinor !== cMinor) return lMinor > cMinor;
  return lPatch > cPatch;
}

/**
 * 异步检查更新，命令结束后打印提示（若有新版本）。
 * 调用方无需 await，直接 fire-and-forget。
 *
 * @param {string} currentVersion - 当前版本号（来自 package.json）
 */
async function checkUpdate(currentVersion) {
  try {
    const cache = readCache();
    const now = Date.now();

    let latestVersion;

    if (cache && now - cache.lastCheck < CHECK_INTERVAL_MS) {
      // 今天已经检查过，直接用缓存结果
      latestVersion = cache.latestVersion;
    } else {
      // 超过 24 小时，重新查询
      latestVersion = await fetchLatestVersion();
      if (latestVersion) {
        writeCache(latestVersion);
      }
    }

    if (latestVersion && isNewer(currentVersion, latestVersion)) {
      // 用 process.nextTick 确保在主命令输出完成后再打印
      process.nextTick(() => {
        console.error(
          `\n💡 发现新版本 ${latestVersion}（当前 ${currentVersion}）` +
          `\n   运行以下命令更新：\n   npm install -g yidacli@latest\n`
        );
      });
    }
  } catch {
    // 版本检查失败静默忽略，不影响主流程
  }
}

module.exports = { checkUpdate };
