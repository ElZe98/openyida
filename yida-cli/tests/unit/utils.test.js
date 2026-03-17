/**
 * 单元测试：src/utils.js 公共工具函数
 *
 * 覆盖：
 * - extractInfoFromCookies：Cookie 解析
 * - resolveBaseUrl：base_url 解析
 * - isLoginExpired / isCsrfTokenExpired：响应状态检测
 * - findProjectRoot：项目根目录查找（mock fs）
 * - loadCookieData：Cookie 文件加载（mock fs）
 */

"use strict";

const path = require("path");
const os = require("os");

// ── Mock fs 和 os，避免真实文件系统调用 ──────────────────────────────

jest.mock("fs", () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

jest.mock("os", () => ({
  homedir: jest.fn(() => "/fake/home"),
}));

// Mock login.js，避免 triggerLogin / refreshCsrfToken 触发真实登录
jest.mock("../../src/login", () => ({
  ensureLogin: jest.fn(),
  refreshCsrfFromCache: jest.fn(),
}));

const mockFs = require("fs");

beforeEach(() => {
  mockFs.existsSync.mockReset();
  mockFs.readFileSync.mockReset();
});

const utils = require("../../src/utils");

// ── extractInfoFromCookies ────────────────────────────────────────────

describe("extractInfoFromCookies", () => {
  test("正常提取 csrfToken、corpId 和 userId", () => {
    const cookies = [
      { name: "tianshu_csrf_token", value: "abc123" },
      { name: "tianshu_corp_user", value: "CORP001_USER001" },
    ];
    const result = utils.extractInfoFromCookies(cookies);
    expect(result.csrfToken).toBe("abc123");
    expect(result.corpId).toBe("CORP001");
    expect(result.userId).toBe("USER001");
  });

  test("corpId 含多个下划线时，按最后一个下划线分割", () => {
    const cookies = [
      { name: "tianshu_corp_user", value: "CORP_WITH_UNDERSCORES_userId123" },
    ];
    const result = utils.extractInfoFromCookies(cookies);
    expect(result.corpId).toBe("CORP_WITH_UNDERSCORES");
    expect(result.userId).toBe("userId123");
  });

  test("tianshu_corp_user 没有下划线时，corpId 和 userId 均为 null", () => {
    const cookies = [{ name: "tianshu_corp_user", value: "NOUNDERSCORE" }];
    const result = utils.extractInfoFromCookies(cookies);
    expect(result.corpId).toBeNull();
    expect(result.userId).toBeNull();
  });

  test("tianshu_corp_user 以下划线开头时（lastIndexOf=0），corpId 和 userId 均为 null", () => {
    const cookies = [{ name: "tianshu_corp_user", value: "_USERID" }];
    const result = utils.extractInfoFromCookies(cookies);
    expect(result.corpId).toBeNull();
    expect(result.userId).toBeNull();
  });

  test("Cookie 列表为空时，三个字段均为 null", () => {
    const result = utils.extractInfoFromCookies([]);
    expect(result.csrfToken).toBeNull();
    expect(result.corpId).toBeNull();
    expect(result.userId).toBeNull();
  });

  test("只有 csrfToken，没有 corpUser Cookie 时", () => {
    const cookies = [{ name: "tianshu_csrf_token", value: "token_xyz" }];
    const result = utils.extractInfoFromCookies(cookies);
    expect(result.csrfToken).toBe("token_xyz");
    expect(result.corpId).toBeNull();
    expect(result.userId).toBeNull();
  });

  test("多个同名 Cookie 时，以最后一个为准", () => {
    const cookies = [
      { name: "tianshu_csrf_token", value: "first_token" },
      { name: "tianshu_csrf_token", value: "second_token" },
    ];
    const result = utils.extractInfoFromCookies(cookies);
    expect(result.csrfToken).toBe("second_token");
  });

  test("不包含目标 Cookie 时，三个字段均为 null", () => {
    const cookies = [{ name: "other_cookie", value: "some_value" }];
    const result = utils.extractInfoFromCookies(cookies);
    expect(result.csrfToken).toBeNull();
    expect(result.corpId).toBeNull();
    expect(result.userId).toBeNull();
  });
});

// ── resolveBaseUrl ────────────────────────────────────────────────────

describe("resolveBaseUrl", () => {
  test("正常 base_url 直接返回", () => {
    expect(utils.resolveBaseUrl({ base_url: "https://example.aliwork.com" })).toBe(
      "https://example.aliwork.com"
    );
  });

  test("末尾有斜杠时去掉", () => {
    expect(utils.resolveBaseUrl({ base_url: "https://example.aliwork.com/" })).toBe(
      "https://example.aliwork.com"
    );
  });

  test("末尾有多个斜杠时全部去掉", () => {
    expect(utils.resolveBaseUrl({ base_url: "https://example.aliwork.com///" })).toBe(
      "https://example.aliwork.com"
    );
  });

  test("cookieData 为 null 时返回默认 URL", () => {
    expect(utils.resolveBaseUrl(null)).toBe("https://www.aliwork.com");
  });

  test("cookieData 没有 base_url 时返回默认 URL", () => {
    expect(utils.resolveBaseUrl({})).toBe("https://www.aliwork.com");
  });

  test("base_url 为空字符串时返回默认 URL", () => {
    expect(utils.resolveBaseUrl({ base_url: "" })).toBe("https://www.aliwork.com");
  });

  test("传入自定义 defaultBaseUrl，cookieData 为 null 时使用自定义默认值", () => {
    expect(utils.resolveBaseUrl(null, "https://custom.aliwork.com")).toBe(
      "https://custom.aliwork.com"
    );
  });

  test("传入自定义 defaultBaseUrl，cookieData 有 base_url 时优先使用 base_url", () => {
    expect(
      utils.resolveBaseUrl({ base_url: "https://actual.aliwork.com/" }, "https://custom.aliwork.com")
    ).toBe("https://actual.aliwork.com");
  });

  test("http 协议的 base_url 正常处理", () => {
    expect(utils.resolveBaseUrl({ base_url: "http://localhost:8080/" })).toBe(
      "http://localhost:8080"
    );
  });
});

// ── isLoginExpired ────────────────────────────────────────────────────

describe("isLoginExpired", () => {
  test("errorCode=307 时返回 true", () => {
    expect(utils.isLoginExpired({ success: false, errorCode: "307" })).toBe(true);
  });

  test("errorCode=302 时返回 true", () => {
    expect(utils.isLoginExpired({ success: false, errorCode: "302" })).toBe(true);
  });

  test("成功响应返回 false", () => {
    expect(utils.isLoginExpired({ success: true, content: "APP_XXX" })).toBe(false);
  });

  test("其他错误码返回 false", () => {
    expect(utils.isLoginExpired({ success: false, errorCode: "500" })).toBe(false);
  });

  test("null 返回 falsy", () => {
    expect(utils.isLoginExpired(null)).toBeFalsy();
  });

  test("undefined 返回 falsy", () => {
    expect(utils.isLoginExpired(undefined)).toBeFalsy();
  });

  test("success=true 但 errorCode=307 时返回 false", () => {
    expect(utils.isLoginExpired({ success: true, errorCode: "307" })).toBe(false);
  });
});

// ── isCsrfTokenExpired ────────────────────────────────────────────────

describe("isCsrfTokenExpired", () => {
  test("errorCode=TIANSHU_000030 时返回 true", () => {
    expect(
      utils.isCsrfTokenExpired({ success: false, errorCode: "TIANSHU_000030" })
    ).toBe(true);
  });

  test("成功响应返回 false", () => {
    expect(utils.isCsrfTokenExpired({ success: true })).toBe(false);
  });

  test("其他错误码返回 false", () => {
    expect(utils.isCsrfTokenExpired({ success: false, errorCode: "307" })).toBe(false);
  });

  test("null 返回 falsy", () => {
    expect(utils.isCsrfTokenExpired(null)).toBeFalsy();
  });

  test("undefined 返回 falsy", () => {
    expect(utils.isCsrfTokenExpired(undefined)).toBeFalsy();
  });
});

// ── findProjectRoot ───────────────────────────────────────────────────

describe("findProjectRoot", () => {
  beforeEach(() => {
    mockFs.existsSync.mockReset();
    // 重置模块缓存，让 findProjectRoot 重新执行（它依赖 os.homedir()）
    jest.resetModules();
    jest.mock("fs", () => ({
      existsSync: jest.fn(),
      readFileSync: jest.fn(),
      writeFileSync: jest.fn(),
      mkdirSync: jest.fn(),
    }));
    jest.mock("os", () => ({ homedir: jest.fn(() => "/fake/home") }));
    jest.mock("../../src/login", () => ({
      ensureLogin: jest.fn(),
      refreshCsrfFromCache: jest.fn(),
    }));
  });

  test("找到第一个存在的 workspace 目录时返回该路径", () => {
    const freshFs = require("fs");
    const realPath = "/fake/home/.real/workspace/openyida";
    freshFs.existsSync.mockImplementation((p) => p === realPath);

    const freshUtils = require("../../src/utils");
    expect(freshUtils.findProjectRoot()).toBe(realPath);
  });

  test("所有 workspace 目录都不存在时，返回 process.cwd()", () => {
    const freshFs = require("fs");
    freshFs.existsSync.mockReturnValue(false);

    const freshUtils = require("../../src/utils");
    expect(freshUtils.findProjectRoot()).toBe(process.cwd());
  });

  test("优先返回排在前面的工具目录（.real 优先于 .opencode）", () => {
    const freshFs = require("fs");
    const realPath = "/fake/home/.real/workspace/openyida";
    const opencodePath = "/fake/home/.opencode/workspace/openyida";
    freshFs.existsSync.mockImplementation((p) => p === realPath || p === opencodePath);

    const freshUtils = require("../../src/utils");
    expect(freshUtils.findProjectRoot()).toBe(realPath);
  });
});

// ── loadCookieData ────────────────────────────────────────────────────

describe("loadCookieData", () => {
  const fakeRoot = "/fake/project";
  const cookieFilePath = path.join(fakeRoot, ".cache", "cookies.json");

  beforeEach(() => {
    mockFs.existsSync.mockReset();
    mockFs.readFileSync.mockReset();
  });

  test("Cookie 文件不存在时返回 null", () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(utils.loadCookieData(fakeRoot)).toBeNull();
  });

  test("Cookie 文件为空时返回 null", () => {
    mockFs.existsSync.mockImplementation((p) => p === cookieFilePath);
    mockFs.readFileSync.mockReturnValue("   ");
    expect(utils.loadCookieData(fakeRoot)).toBeNull();
  });

  test("Cookie 文件内容为无效 JSON 时返回 null", () => {
    mockFs.existsSync.mockImplementation((p) => p === cookieFilePath);
    mockFs.readFileSync.mockReturnValue("not-json");
    expect(utils.loadCookieData(fakeRoot)).toBeNull();
  });

  test("旧版纯数组格式：自动包装为对象格式，并提取 csrf_token / corp_id / user_id", () => {
    const cookies = [
      { name: "tianshu_csrf_token", value: "token123" },
      { name: "tianshu_corp_user", value: "CORP001_USER001" },
    ];
    mockFs.existsSync.mockImplementation((p) => p === cookieFilePath);
    mockFs.readFileSync.mockReturnValue(JSON.stringify(cookies));

    const result = utils.loadCookieData(fakeRoot);
    expect(result).not.toBeNull();
    expect(result.base_url).toBe("https://www.aliwork.com");
    expect(result.csrf_token).toBe("token123");
    expect(result.corp_id).toBe("CORP001");
    expect(result.user_id).toBe("USER001");
  });

  test("新版对象格式：保留 base_url，提取 csrf_token / corp_id / user_id", () => {
    const cookieData = {
      cookies: [
        { name: "tianshu_csrf_token", value: "token456" },
        { name: "tianshu_corp_user", value: "CORP002_USER002" },
      ],
      base_url: "https://custom.aliwork.com",
    };
    mockFs.existsSync.mockImplementation((p) => p === cookieFilePath);
    mockFs.readFileSync.mockReturnValue(JSON.stringify(cookieData));

    const result = utils.loadCookieData(fakeRoot);
    expect(result.base_url).toBe("https://custom.aliwork.com");
    expect(result.csrf_token).toBe("token456");
    expect(result.corp_id).toBe("CORP002");
    expect(result.user_id).toBe("USER002");
  });

  test("Cookie 列表为空时，不设置 csrf_token / corp_id / user_id", () => {
    const cookieData = { cookies: [], base_url: "https://www.aliwork.com" };
    mockFs.existsSync.mockImplementation((p) => p === cookieFilePath);
    mockFs.readFileSync.mockReturnValue(JSON.stringify(cookieData));

    const result = utils.loadCookieData(fakeRoot);
    expect(result).not.toBeNull();
    expect(result.csrf_token).toBeUndefined();
  });

  test("传入自定义 defaultBaseUrl 时，旧版数组格式使用自定义默认值", () => {
    const cookies = [{ name: "tianshu_csrf_token", value: "token" }];
    mockFs.existsSync.mockImplementation((p) => p === cookieFilePath);
    mockFs.readFileSync.mockReturnValue(JSON.stringify(cookies));

    const result = utils.loadCookieData(fakeRoot, "https://custom.aliwork.com");
    expect(result.base_url).toBe("https://custom.aliwork.com");
  });
});
