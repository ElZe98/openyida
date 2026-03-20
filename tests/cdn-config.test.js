"use strict";

const path = require("path");
const os = require("os");
const fs = require("fs");

// ── 测试辅助 ──────────────────────────────────────────────

const REAL_OPENYIDA_DIR = path.join(os.homedir(), ".openyida");
const REAL_CDN_CONFIG = path.join(REAL_OPENYIDA_DIR, "cdn-config.json");

let backupContent = null;
let backupExists = false;

beforeAll(() => {
  // 备份真实的 cdn-config.json（如果存在）
  backupExists = fs.existsSync(REAL_CDN_CONFIG);
  if (backupExists) {
    backupContent = fs.readFileSync(REAL_CDN_CONFIG, "utf-8");
  }
});

afterAll(() => {
  // 恢复真实的 cdn-config.json
  if (backupExists && backupContent !== null) {
    fs.writeFileSync(REAL_CDN_CONFIG, backupContent, "utf-8");
  } else if (!backupExists && fs.existsSync(REAL_CDN_CONFIG)) {
    fs.unlinkSync(REAL_CDN_CONFIG);
  }
});

afterEach(() => {
  // 每个测试后清理测试写入的配置
  if (fs.existsSync(REAL_CDN_CONFIG) && !backupExists) {
    fs.unlinkSync(REAL_CDN_CONFIG);
  } else if (backupExists && backupContent !== null) {
    fs.writeFileSync(REAL_CDN_CONFIG, backupContent, "utf-8");
  }
});

const {
  loadCdnConfig,
  saveCdnConfig,
  initCdnConfig,
  validateCdnConfig,
  hasCdnConfig,
  getCdnConfigPath,
  DEFAULT_CONFIG,
} = require("../lib/cdn/cdn-config");

// ── DEFAULT_CONFIG ────────────────────────────────────────

describe("DEFAULT_CONFIG", () => {
  test("包含所有必要的默认字段", () => {
    expect(DEFAULT_CONFIG.accessKeyId).toBe("");
    expect(DEFAULT_CONFIG.accessKeySecret).toBe("");
    expect(DEFAULT_CONFIG.cdnDomain).toBe("");
    expect(DEFAULT_CONFIG.ossRegion).toBe("oss-cn-hangzhou");
    expect(DEFAULT_CONFIG.ossBucket).toBe("");
    expect(DEFAULT_CONFIG.uploadPath).toBe("yida-images/");
    expect(DEFAULT_CONFIG.enableCompress).toBe(true);
    expect(DEFAULT_CONFIG.maxImageWidth).toBe(1920);
    expect(DEFAULT_CONFIG.imageQuality).toBe(85);
  });
});

// ── getCdnConfigPath ──────────────────────────────────────

describe("getCdnConfigPath", () => {
  test("返回 ~/.openyida/cdn-config.json 路径", () => {
    const configPath = getCdnConfigPath();
    expect(configPath).toContain(".openyida");
    expect(configPath).toContain("cdn-config.json");
    expect(configPath).toBe(path.join(os.homedir(), ".openyida", "cdn-config.json"));
  });
});

// ── validateCdnConfig ─────────────────────────────────────

describe("validateCdnConfig", () => {
  test("全部字段为空时返回 invalid 和 4 个缺失字段", () => {
    const result = validateCdnConfig(DEFAULT_CONFIG);
    expect(result.valid).toBe(false);
    expect(result.missing).toHaveLength(4);
    expect(result.missing).toContain("accessKeyId");
    expect(result.missing).toContain("accessKeySecret");
    expect(result.missing).toContain("cdnDomain");
    expect(result.missing).toContain("ossBucket");
  });

  test("全部必填字段填写后返回 valid", () => {
    const config = {
      ...DEFAULT_CONFIG,
      accessKeyId: "LTAI_xxx",
      accessKeySecret: "secret_xxx",
      cdnDomain: "cdn.example.com",
      ossBucket: "my-bucket",
    };
    const result = validateCdnConfig(config);
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  test("部分缺失时返回对应的缺失字段", () => {
    const config = {
      ...DEFAULT_CONFIG,
      accessKeyId: "LTAI_xxx",
      cdnDomain: "cdn.example.com",
    };
    const result = validateCdnConfig(config);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("accessKeySecret");
    expect(result.missing).toContain("ossBucket");
    expect(result.missing).not.toContain("accessKeyId");
    expect(result.missing).not.toContain("cdnDomain");
  });
});

// ── loadCdnConfig ─────────────────────────────────────────

describe("loadCdnConfig", () => {
  test("配置文件不存在时返回默认配置", () => {
    // 确保文件不存在
    if (fs.existsSync(REAL_CDN_CONFIG)) {
      fs.unlinkSync(REAL_CDN_CONFIG);
    }
    const config = loadCdnConfig();
    expect(config.ossRegion).toBe("oss-cn-hangzhou");
    expect(config.uploadPath).toBe("yida-images/");
  });

  test("配置文件存在时合并默认值", () => {
    fs.mkdirSync(REAL_OPENYIDA_DIR, { recursive: true });
    fs.writeFileSync(REAL_CDN_CONFIG, JSON.stringify({ accessKeyId: "test-key" }), "utf-8");

    const config = loadCdnConfig();
    expect(config.accessKeyId).toBe("test-key");
    expect(config.ossRegion).toBe("oss-cn-hangzhou");
  });

  test("配置文件内容为空时返回默认配置", () => {
    fs.mkdirSync(REAL_OPENYIDA_DIR, { recursive: true });
    fs.writeFileSync(REAL_CDN_CONFIG, "", "utf-8");

    const config = loadCdnConfig();
    expect(config.accessKeyId).toBe("");
  });

  test("配置文件内容为非法 JSON 时返回默认配置", () => {
    fs.mkdirSync(REAL_OPENYIDA_DIR, { recursive: true });
    fs.writeFileSync(REAL_CDN_CONFIG, "invalid-json", "utf-8");

    const config = loadCdnConfig();
    expect(config.accessKeyId).toBe("");
  });
});

// ── saveCdnConfig ─────────────────────────────────────────

describe("saveCdnConfig", () => {
  test("保存配置到文件", () => {
    saveCdnConfig({ accessKeyId: "saved-key", cdnDomain: "cdn.test.com" });

    expect(fs.existsSync(REAL_CDN_CONFIG)).toBe(true);
    const saved = JSON.parse(fs.readFileSync(REAL_CDN_CONFIG, "utf-8"));
    expect(saved.accessKeyId).toBe("saved-key");
    expect(saved.cdnDomain).toBe("cdn.test.com");
    // 默认值也应被合并
    expect(saved.ossRegion).toBe("oss-cn-hangzhou");
  });
});

// ── initCdnConfig ─────────────────────────────────────────

describe("initCdnConfig", () => {
  test("初始化配置并去除域名协议前缀", () => {
    const result = initCdnConfig({
      accessKeyId: "LTAI_init",
      accessKeySecret: "secret_init",
      cdnDomain: "https://cdn.example.com/",
      ossBucket: "test-bucket",
      ossRegion: "oss-cn-shanghai",
    });

    expect(result.accessKeyId).toBe("LTAI_init");
    expect(result.cdnDomain).toBe("cdn.example.com");
    expect(result.ossBucket).toBe("test-bucket");
    expect(result.ossRegion).toBe("oss-cn-shanghai");
    expect(result.ossEndpoint).toBe("https://test-bucket.oss-cn-shanghai.aliyuncs.com");
  });

  test("初始化配置并处理 uploadPath 前后斜杠", () => {
    const result = initCdnConfig({
      uploadPath: "/custom-path/",
    });
    expect(result.uploadPath).toBe("custom-path/");
  });

  test("不传的字段保留原有值", () => {
    // 先写入一个已有配置
    saveCdnConfig({ accessKeyId: "existing-key" });

    const result = initCdnConfig({ cdnDomain: "new-cdn.com" });
    expect(result.accessKeyId).toBe("existing-key");
    expect(result.cdnDomain).toBe("new-cdn.com");
  });
});

// ── hasCdnConfig ──────────────────────────────────────────

describe("hasCdnConfig", () => {
  test("配置文件不存在时返回 false", () => {
    if (fs.existsSync(REAL_CDN_CONFIG)) {
      fs.unlinkSync(REAL_CDN_CONFIG);
    }
    expect(hasCdnConfig()).toBe(false);
  });

  test("配置不完整时返回 false", () => {
    saveCdnConfig({ accessKeyId: "partial" });
    expect(hasCdnConfig()).toBe(false);
  });

  test("配置完整时返回 true", () => {
    saveCdnConfig({
      accessKeyId: "LTAI_xxx",
      accessKeySecret: "secret",
      cdnDomain: "cdn.example.com",
      ossBucket: "bucket",
    });
    expect(hasCdnConfig()).toBe(true);
  });
});
