/**
 * 单元测试：src/env.js 环境检测
 *
 * 覆盖：
 * - detectEnvironment：检测已安装的 AI 工具及活跃状态
 * - detectLoginStatus：检测登录态
 */

"use strict";

const path = require("path");

// ── Mock 依赖 ─────────────────────────────────────────────────────────

jest.mock("fs", () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

jest.mock("os", () => ({
  homedir: jest.fn(() => "/fake/home"),
  arch: jest.fn(() => "x64"),
}));

jest.mock("../../src/utils", () => ({
  findProjectRoot: jest.fn(() => "/fake/project"),
  loadCookieData: jest.fn(),
  resolveBaseUrl: jest.requireActual("../../src/utils").resolveBaseUrl,
  extractInfoFromCookies: jest.requireActual("../../src/utils").extractInfoFromCookies,
}));

const mockFs = require("fs");
const mockUtils = require("../../src/utils");

beforeEach(() => {
  mockFs.existsSync.mockReset();
  mockUtils.loadCookieData.mockReset();
  // 默认：所有目录都不存在
  mockFs.existsSync.mockReturnValue(false);
});

const { detectEnvironment, detectLoginStatus } = require("../../src/env");

// ── detectEnvironment ─────────────────────────────────────────────────

describe("detectEnvironment", () => {
  test("没有任何 AI 工具目录时，results 为空数组", () => {
    mockFs.existsSync.mockReturnValue(false);

    const { results, activeToolName, activeProjectRoot } = detectEnvironment();
    expect(results).toHaveLength(0);
    expect(activeToolName).toBeNull();
    expect(activeProjectRoot).toBeNull();
  });

  test("悟空目录存在且有 daemon.sock 时，检测为活跃", () => {
    const wukongDir = "/fake/home/.real";
    const daemonSock = "/fake/home/.real/daemon.sock";
    const workspaceRoot = "/fake/home/.real/workspace/openyida";

    mockFs.existsSync.mockImplementation((p) => {
      if (p === wukongDir) return true;
      if (p === daemonSock) return true;
      if (p === workspaceRoot) return true;
      return false;
    });

    const { results, activeToolName, activeProjectRoot } = detectEnvironment();
    const wukong = results.find((r) => r.dirName === ".real");
    expect(wukong).toBeDefined();
    expect(wukong.isActive).toBe(true);
    expect(wukong.hasProject).toBe(true);
    expect(activeToolName).toBe("悟空（Wukong）");
    expect(activeProjectRoot).toBe(workspaceRoot);
  });

  test("悟空目录存在但无特有文件时，检测为非活跃", () => {
    const wukongDir = "/fake/home/.real";
    mockFs.existsSync.mockImplementation((p) => p === wukongDir);

    const { results } = detectEnvironment();
    const wukong = results.find((r) => r.dirName === ".real");
    expect(wukong).toBeDefined();
    expect(wukong.isActive).toBe(false);
  });

  test("Aone Copilot 目录存在且有 hardware_id.txt 时，检测为活跃", () => {
    const copilotDir = "/fake/home/.aone_copilot";
    const hardwareId = "/fake/home/.aone_copilot/hardware_id.txt";
    const workspaceRoot = "/fake/home/.aone_copilot/workspace/openyida";

    mockFs.existsSync.mockImplementation((p) => {
      if (p === copilotDir) return true;
      if (p === hardwareId) return true;
      if (p === workspaceRoot) return true;
      return false;
    });

    const { results } = detectEnvironment();
    const copilot = results.find((r) => r.dirName === ".aone_copilot");
    expect(copilot).toBeDefined();
    expect(copilot.isActive).toBe(true);
    expect(copilot.hasProject).toBe(true);
  });

  test("工具目录存在但无 openyida 项目时，hasProject 为 false", () => {
    const wukongDir = "/fake/home/.real";
    const daemonSock = "/fake/home/.real/daemon.sock";

    mockFs.existsSync.mockImplementation((p) => {
      if (p === wukongDir) return true;
      if (p === daemonSock) return true;
      return false; // workspace/openyida 不存在
    });

    const { results, activeToolName } = detectEnvironment();
    const wukong = results.find((r) => r.dirName === ".real");
    expect(wukong.isActive).toBe(true);
    expect(wukong.hasProject).toBe(false);
    // 活跃但无项目，不设为 activeToolName
    expect(activeToolName).toBeNull();
  });

  test("多个工具同时活跃时，activeToolName 取第一个（排在前面的）", () => {
    const wukongDir = "/fake/home/.real";
    const daemonSock = "/fake/home/.real/daemon.sock";
    const wukongWorkspace = "/fake/home/.real/workspace/openyida";

    const copilotDir = "/fake/home/.aone_copilot";
    const hardwareId = "/fake/home/.aone_copilot/hardware_id.txt";
    const copilotWorkspace = "/fake/home/.aone_copilot/workspace/openyida";

    mockFs.existsSync.mockImplementation((p) => {
      return [wukongDir, daemonSock, wukongWorkspace, copilotDir, hardwareId, copilotWorkspace].includes(p);
    });

    const { activeToolName } = detectEnvironment();
    // 悟空（.real）排在 Aone Copilot（.aone_copilot）前面
    expect(activeToolName).toBe("悟空（Wukong）");
  });

  test("OpenCode 目录存在且有 bun.lock 时，检测为活跃", () => {
    const opencodeDir = "/fake/home/.opencode";
    const bunLock = "/fake/home/.opencode/bun.lock";

    mockFs.existsSync.mockImplementation((p) => {
      if (p === opencodeDir) return true;
      if (p === bunLock) return true;
      return false;
    });

    const { results } = detectEnvironment();
    const opencode = results.find((r) => r.dirName === ".opencode");
    expect(opencode).toBeDefined();
    expect(opencode.isActive).toBe(true);
  });

  test("iFlow 目录存在且有 aone_token.json 时，检测为活跃", () => {
    const iflowDir = "/fake/home/.iflow";
    const aoneToken = "/fake/home/.iflow/aone_token.json";

    mockFs.existsSync.mockImplementation((p) => {
      if (p === iflowDir) return true;
      if (p === aoneToken) return true;
      return false;
    });

    const { results } = detectEnvironment();
    const iflow = results.find((r) => r.dirName === ".iflow");
    expect(iflow).toBeDefined();
    expect(iflow.isActive).toBe(true);
  });
});

// ── detectLoginStatus ─────────────────────────────────────────────────

describe("detectLoginStatus", () => {
  test("无 Cookie 数据时返回未登录状态", () => {
    mockUtils.loadCookieData.mockReturnValue(null);

    const result = detectLoginStatus("/fake/project");
    expect(result.loggedIn).toBe(false);
    expect(result.csrfToken).toBeNull();
    expect(result.corpId).toBeNull();
  });

  test("Cookie 中无 csrf_token 时返回未登录状态", () => {
    mockUtils.loadCookieData.mockReturnValue({
      cookies: [{ name: "other_cookie", value: "value" }],
      base_url: "https://www.aliwork.com",
    });

    const result = detectLoginStatus("/fake/project");
    expect(result.loggedIn).toBe(false);
  });

  test("有有效 Cookie 时返回已登录状态，包含完整信息", () => {
    mockUtils.loadCookieData.mockReturnValue({
      cookies: [
        { name: "tianshu_csrf_token", value: "valid_csrf_token" },
        { name: "tianshu_corp_user", value: "CORP001_USER001" },
      ],
      base_url: "https://www.aliwork.com",
    });

    const result = detectLoginStatus("/fake/project");
    expect(result.loggedIn).toBe(true);
    expect(result.csrfToken).toBe("valid_csrf_token");
    expect(result.corpId).toBe("CORP001");
    expect(result.userId).toBe("USER001");
    expect(result.baseUrl).toBe("https://www.aliwork.com");
  });

  test("base_url 末尾有斜杠时自动去除", () => {
    mockUtils.loadCookieData.mockReturnValue({
      cookies: [{ name: "tianshu_csrf_token", value: "token" }],
      base_url: "https://www.aliwork.com/",
    });

    const result = detectLoginStatus("/fake/project");
    expect(result.baseUrl).toBe("https://www.aliwork.com");
  });
});
