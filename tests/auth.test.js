"use strict";

const path = require("path");
const os = require("os");
const fs = require("fs");

// ── 测试辅助：创建临时项目目录 ──────────────────────────

function createTempProject() {
  const tmpDir = path.join(os.tmpdir(), `yida-auth-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const cacheDir = path.join(tmpDir, ".cache");
  fs.mkdirSync(cacheDir, { recursive: true });

  // 创建 config.json（findProjectRoot 需要）
  fs.writeFileSync(
    path.join(tmpDir, "config.json"),
    JSON.stringify({ loginUrl: "https://www.aliwork.com/workPlatform", defaultBaseUrl: "https://www.aliwork.com" }),
    "utf-8"
  );

  return { tmpDir, cacheDir };
}

function cleanupTempProject(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

/**
 * 在隔离的模块环境中加载 auth/login 模块，确保 mock 生效。
 * auth.js 和 login.js 通过解构 require 绑定了 utils 的函数引用，
 * 必须在 require 之前就设置好 mock，所以使用 jest.isolateModules。
 */
function loadModulesWithMocks(tmpDir, cookieDataMock) {
  let authModule;
  let loginModule;

  jest.isolateModules(() => {
    // 先加载 utils 并 mock
    const utils = require("../lib/core/utils");
    jest.spyOn(utils, "findProjectRoot").mockReturnValue(tmpDir);
    if (cookieDataMock !== undefined) {
      jest.spyOn(utils, "loadCookieData").mockReturnValue(cookieDataMock);
    }

    // 然后加载依赖 utils 的模块（此时它们会拿到 mock 后的引用）
    authModule = require("../lib/auth/auth");
    loginModule = require("../lib/auth/login");
  });

  return { authModule, loginModule };
}

// ── loadAuthConfig / saveAuthConfig ───────────────────────

describe("loadAuthConfig / saveAuthConfig", () => {
  let tempProject;

  beforeEach(() => {
    tempProject = createTempProject();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    cleanupTempProject(tempProject.tmpDir);
  });

  test("无 auth.json 时返回 null", () => {
    const { authModule } = loadModulesWithMocks(tempProject.tmpDir);
    const result = authModule.loadAuthConfig();
    expect(result).toBeNull();
  });

  test("保存后可读取 auth 配置", () => {
    const { authModule } = loadModulesWithMocks(tempProject.tmpDir);
    const config = { loginType: "qrcode", loginTime: "2026-01-01T00:00:00.000Z", corpId: "corp1" };
    authModule.saveAuthConfig(config);
    const loaded = authModule.loadAuthConfig();
    expect(loaded.loginType).toBe("qrcode");
    expect(loaded.corpId).toBe("corp1");
  });

  test("auth.json 内容为空字符串时返回 null", () => {
    const { authModule } = loadModulesWithMocks(tempProject.tmpDir);
    const authPath = path.join(tempProject.tmpDir, ".cache", "auth.json");
    fs.writeFileSync(authPath, "", "utf-8");
    const result = authModule.loadAuthConfig();
    expect(result).toBeNull();
  });

  test("auth.json 内容为非法 JSON 时返回 null", () => {
    const { authModule } = loadModulesWithMocks(tempProject.tmpDir);
    const authPath = path.join(tempProject.tmpDir, ".cache", "auth.json");
    fs.writeFileSync(authPath, "not-json", "utf-8");
    const result = authModule.loadAuthConfig();
    expect(result).toBeNull();
  });
});

// ── authStatus ────────────────────────────────────────────

describe("authStatus", () => {
  let tempProject;

  beforeEach(() => {
    tempProject = createTempProject();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    cleanupTempProject(tempProject.tmpDir);
  });

  test("无 Cookie 缓存时返回 not_logged_in", () => {
    const { authModule } = loadModulesWithMocks(tempProject.tmpDir, null);
    const result = authModule.authStatus();
    expect(result.status).toBe("not_logged_in");
    expect(result.canAutoUse).toBe(false);
  });

  test("有有效 Cookie 时返回 ok", () => {
    const cookies = [
      { name: "tianshu_csrf_token", value: "test-csrf-token-12345" },
      { name: "tianshu_corp_user", value: "corpABC_user001" },
    ];
    const { authModule } = loadModulesWithMocks(tempProject.tmpDir, {
      cookies,
      csrf_token: "test-csrf-token-12345",
      corp_id: "corpABC",
      user_id: "user001",
      base_url: "https://www.aliwork.com",
    });

    const result = authModule.authStatus();
    expect(result.status).toBe("ok");
    expect(result.canAutoUse).toBe(true);
    expect(result.csrfToken).toBe("test-csrf-token-12345");
    expect(result.corpId).toBe("corpABC");
  });

  test("Cookie 中无 csrfToken 时返回 invalid", () => {
    const { authModule } = loadModulesWithMocks(tempProject.tmpDir, {
      cookies: [{ name: "other_cookie", value: "abc" }],
      csrf_token: null,
      corp_id: null,
      user_id: null,
      base_url: "https://www.aliwork.com",
    });

    const result = authModule.authStatus();
    expect(result.status).toBe("invalid");
    expect(result.canAutoUse).toBe(false);
  });
});

// ── authRefresh ───────────────────────────────────────────

describe("authRefresh", () => {
  let tempProject;

  beforeEach(() => {
    tempProject = createTempProject();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    cleanupTempProject(tempProject.tmpDir);
  });

  test("无 Cookie 缓存时返回 error", () => {
    const { authModule } = loadModulesWithMocks(tempProject.tmpDir, null);
    const result = authModule.authRefresh();
    expect(result.status).toBe("error");
    expect(result.message).toContain("No cookie cache");
  });

  test("Cookie 中无 csrf_token 时返回 error", () => {
    const { authModule } = loadModulesWithMocks(tempProject.tmpDir, {
      cookies: [{ name: "other", value: "val" }],
    });
    const result = authModule.authRefresh();
    expect(result.status).toBe("error");
    expect(result.message).toContain("No csrf_token");
  });

  test("有效 Cookie 时刷新成功并保存 auth 配置", () => {
    const { authModule } = loadModulesWithMocks(tempProject.tmpDir, {
      cookies: [
        { name: "tianshu_csrf_token", value: "refreshed-token" },
        { name: "tianshu_corp_user", value: "corpX_userY" },
      ],
      base_url: "https://custom.aliwork.com",
    });

    const result = authModule.authRefresh();
    expect(result.status).toBe("ok");
    expect(result.csrfToken).toBe("refreshed-token");
    expect(result.corpId).toBe("corpX");
    expect(result.userId).toBe("userY");
    expect(result.baseUrl).toBe("https://custom.aliwork.com");

    // 验证 auth.json 被写入
    const authPath = path.join(tempProject.tmpDir, ".cache", "auth.json");
    expect(fs.existsSync(authPath)).toBe(true);
    const saved = JSON.parse(fs.readFileSync(authPath, "utf-8"));
    expect(saved.refreshTime).toBeDefined();
    expect(saved.corpId).toBe("corpX");
  });
});

// ── login.js: checkLoginOnly ──────────────────────────────

describe("checkLoginOnly", () => {
  let tempProject;

  beforeEach(() => {
    tempProject = createTempProject();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    cleanupTempProject(tempProject.tmpDir);
  });

  test("无 Cookie 缓存时返回 not_logged_in", () => {
    const { loginModule } = loadModulesWithMocks(tempProject.tmpDir, null);
    const result = loginModule.checkLoginOnly();
    expect(result.status).toBe("not_logged_in");
    expect(result.can_auto_use).toBe(false);
  });

  test("Cookie 中无 csrf_token 时返回 not_logged_in", () => {
    const { loginModule } = loadModulesWithMocks(tempProject.tmpDir, {
      cookies: [{ name: "other", value: "val" }],
    });
    const result = loginModule.checkLoginOnly();
    expect(result.status).toBe("not_logged_in");
    expect(result.can_auto_use).toBe(false);
  });

  test("有效 Cookie 时返回 ok", () => {
    const { loginModule } = loadModulesWithMocks(tempProject.tmpDir, {
      cookies: [
        { name: "tianshu_csrf_token", value: "valid-token" },
        { name: "tianshu_corp_user", value: "corp1_user1" },
      ],
      base_url: "https://www.aliwork.com",
    });

    const result = loginModule.checkLoginOnly();
    expect(result.status).toBe("ok");
    expect(result.can_auto_use).toBe(true);
    expect(result.csrf_token).toBe("valid-token");
    expect(result.corp_id).toBe("corp1");
    expect(result.user_id).toBe("user1");
  });
});

// ── login.js: saveCookieCache ─────────────────────────────

describe("saveCookieCache", () => {
  let tempProject;

  beforeEach(() => {
    tempProject = createTempProject();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    cleanupTempProject(tempProject.tmpDir);
  });

  test("保存 Cookie 到 .cache/cookies.json", () => {
    const { loginModule } = loadModulesWithMocks(tempProject.tmpDir);
    const cookies = [{ name: "test", value: "cookie" }];
    const baseUrl = "https://www.aliwork.com";

    loginModule.saveCookieCache(cookies, baseUrl);

    const cookieFile = path.join(tempProject.tmpDir, ".cache", "cookies.json");
    expect(fs.existsSync(cookieFile)).toBe(true);

    const saved = JSON.parse(fs.readFileSync(cookieFile, "utf-8"));
    expect(saved.cookies).toEqual(cookies);
    expect(saved.base_url).toBe(baseUrl);
  });
});

// ── login.js: logout ──────────────────────────────────────

describe("logout", () => {
  let tempProject;

  beforeEach(() => {
    tempProject = createTempProject();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    cleanupTempProject(tempProject.tmpDir);
  });

  test("删除 cookies.json 文件", () => {
    const { loginModule } = loadModulesWithMocks(tempProject.tmpDir);
    const cookieFile = path.join(tempProject.tmpDir, ".cache", "cookies.json");
    fs.writeFileSync(cookieFile, '{"cookies":[]}', "utf-8");
    expect(fs.existsSync(cookieFile)).toBe(true);

    loginModule.logout();
    expect(fs.existsSync(cookieFile)).toBe(false);
  });

  test("cookies.json 不存在时不报错", () => {
    const { loginModule } = loadModulesWithMocks(tempProject.tmpDir);
    expect(() => loginModule.logout()).not.toThrow();
  });
});
