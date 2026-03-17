/**
 * 单元测试：src/login.js 登录态管理
 *
 * 覆盖：
 * - checkLoginOnly：仅检查登录态，不触发登录
 * - refreshCsrfFromCache：从缓存 Cookie 重新提取 csrf_token
 * - logout：清空 Cookie 文件
 */

"use strict";

const path = require("path");

// ── Mock 依赖，避免真实文件系统和 playwright 调用 ─────────────────────

jest.mock("fs", () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

jest.mock("os", () => ({
  homedir: jest.fn(() => "/fake/home"),
  tmpdir: jest.fn(() => "/tmp"),
}));

jest.mock("child_process", () => ({
  execSync: jest.fn(),
}));

// Mock utils.js 中的 loadCookieData / findProjectRoot / resolveBaseUrl
jest.mock("../../src/utils", () => ({
  findProjectRoot: jest.fn(() => "/fake/project"),
  extractInfoFromCookies: jest.requireActual("../../src/utils").extractInfoFromCookies,
  loadCookieData: jest.fn(),
  resolveBaseUrl: jest.requireActual("../../src/utils").resolveBaseUrl,
}));

const mockFs = require("fs");
const mockUtils = require("../../src/utils");

beforeEach(() => {
  mockFs.existsSync.mockReset();
  mockFs.readFileSync.mockReset();
  mockFs.writeFileSync.mockReset();
  mockUtils.loadCookieData.mockReset();
  mockUtils.findProjectRoot.mockReturnValue("/fake/project");
});

const login = require("../../src/login");

// ── checkLoginOnly ────────────────────────────────────────────────────

describe("checkLoginOnly", () => {
  test("无本地 Cookie 时返回 not_logged_in 状态", () => {
    mockUtils.loadCookieData.mockReturnValue(null);

    const result = login.checkLoginOnly();
    expect(result.status).toBe("not_logged_in");
    expect(result.can_auto_use).toBe(false);
  });

  test("Cookie 中无 tianshu_csrf_token 时返回 not_logged_in 状态", () => {
    mockUtils.loadCookieData.mockReturnValue({
      cookies: [{ name: "other_cookie", value: "value" }],
      base_url: "https://www.aliwork.com",
    });

    const result = login.checkLoginOnly();
    expect(result.status).toBe("not_logged_in");
    expect(result.can_auto_use).toBe(false);
  });

  test("有有效 Cookie 时返回 ok 状态，包含 csrf_token / corp_id / user_id", () => {
    mockUtils.loadCookieData.mockReturnValue({
      cookies: [
        { name: "tianshu_csrf_token", value: "valid_token_abc" },
        { name: "tianshu_corp_user", value: "CORP001_USER001" },
      ],
      base_url: "https://www.aliwork.com",
    });

    const result = login.checkLoginOnly();
    expect(result.status).toBe("ok");
    expect(result.can_auto_use).toBe(true);
    expect(result.csrf_token).toBe("valid_token_abc");
    expect(result.corp_id).toBe("CORP001");
    expect(result.user_id).toBe("USER001");
    expect(result.base_url).toBe("https://www.aliwork.com");
  });

  test("有有效 Cookie 但无 corpUser 时，corp_id 和 user_id 为 null", () => {
    mockUtils.loadCookieData.mockReturnValue({
      cookies: [{ name: "tianshu_csrf_token", value: "token_only" }],
      base_url: "https://www.aliwork.com",
    });

    const result = login.checkLoginOnly();
    expect(result.status).toBe("ok");
    expect(result.can_auto_use).toBe(true);
    expect(result.csrf_token).toBe("token_only");
    expect(result.corp_id).toBeNull();
    expect(result.user_id).toBeNull();
  });
});

// ── refreshCsrfFromCache ──────────────────────────────────────────────

describe("refreshCsrfFromCache", () => {
  test("无本地 Cookie 时调用 process.exit(1)", () => {
    mockUtils.loadCookieData.mockReturnValue(null);
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    expect(() => login.refreshCsrfFromCache()).toThrow("process.exit called");
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  test("Cookie 中无 csrf_token 时调用 process.exit(1)", () => {
    mockUtils.loadCookieData.mockReturnValue({
      cookies: [{ name: "other_cookie", value: "value" }],
    });
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    expect(() => login.refreshCsrfFromCache()).toThrow("process.exit called");
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  test("有有效 Cookie 时返回包含 csrf_token 的登录态对象", () => {
    mockUtils.loadCookieData.mockReturnValue({
      cookies: [
        { name: "tianshu_csrf_token", value: "refreshed_token" },
        { name: "tianshu_corp_user", value: "CORP001_USER001" },
      ],
      base_url: "https://www.aliwork.com",
    });

    const result = login.refreshCsrfFromCache();
    expect(result.csrf_token).toBe("refreshed_token");
    expect(result.corp_id).toBe("CORP001");
    expect(result.user_id).toBe("USER001");
    expect(result.base_url).toBe("https://www.aliwork.com");
    expect(Array.isArray(result.cookies)).toBe(true);
  });
});

// ── logout ────────────────────────────────────────────────────────────

describe("logout", () => {
  test("Cookie 文件存在时清空文件内容", () => {
    const cookieFile = "/fake/project/.cache/cookies.json";
    mockFs.existsSync.mockImplementation((p) => p === cookieFile);

    login.logout();

    expect(mockFs.writeFileSync).toHaveBeenCalledWith(cookieFile, "", "utf-8");
  });

  test("Cookie 文件不存在时不报错，不调用 writeFileSync", () => {
    mockFs.existsSync.mockReturnValue(false);

    expect(() => login.logout()).not.toThrow();
    expect(mockFs.writeFileSync).not.toHaveBeenCalled();
  });
});
