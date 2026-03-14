"use strict";

/**
 * 安装脚本测试
 *
 * 验证 install-skills.sh 和 install-skills.ps1 的关键行为：
 * - 脚本文件存在且语法正确
 * - 包含必要的环境检测逻辑
 * - 包含正确的镜像源配置
 * - 包含正确的错误处理
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const INSTALL_SH = path.join(PROJECT_ROOT, "install-skills.sh");
const INSTALL_PS1 = path.join(PROJECT_ROOT, "install-skills.ps1");

// ── 公共辅助 ─────────────────────────────────────────────────────────

function readScript(filePath) {
  return fs.readFileSync(filePath, "utf-8");
}

// ── install-skills.sh 测试 ────────────────────────────────────────────

describe("install-skills.sh", () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = readScript(INSTALL_SH);
  });

  test("脚本文件存在", () => {
    expect(fs.existsSync(INSTALL_SH)).toBe(true);
  });

  test("包含 shebang 头", () => {
    expect(scriptContent.startsWith("#!/usr/bin/env sh")).toBe(true);
  });

  test("包含项目根目录检查", () => {
    expect(scriptContent).toContain("config.json");
    expect(scriptContent).toContain("请在项目根目录下运行此脚本");
  });

  // ── git 检测 ────────────────────────────────────────────────────

  test("包含 git 环境检测", () => {
    expect(scriptContent).toContain("command -v git");
  });

  test("git 缺失时退出并给出提示", () => {
    expect(scriptContent).toContain("未找到 git");
    expect(scriptContent).toMatch(/exit 1/);
  });

  // ── Node.js 检测与安装 ───────────────────────────────────────────

  test("包含 Node.js 环境检测", () => {
    expect(scriptContent).toContain("command -v node");
  });

  test("Node.js 缺失时支持 Homebrew 自动安装", () => {
    expect(scriptContent).toContain("brew install node");
  });

  test("Node.js 缺失时支持 apt 自动安装（阿里云镜像）", () => {
    expect(scriptContent).toContain("apt-get install -y nodejs");
    expect(scriptContent).toContain("mirrors.aliyun.com/nodesource");
  });

  test("Node.js 缺失时支持 yum 自动安装（阿里云镜像）", () => {
    expect(scriptContent).toContain("yum install -y nodejs");
    expect(scriptContent).toContain("mirrors.aliyun.com/nodesource");
  });

  test("Node.js 安装后配置 npm 淘宝镜像", () => {
    expect(scriptContent).toContain("npm config set registry https://registry.npmmirror.com");
  });

  test("Node.js 版本过低时给出升级提示", () => {
    expect(scriptContent).toContain("NODE_MAJOR");
    expect(scriptContent).toContain("版本过低");
  });

  // ── Python 检测与安装 ────────────────────────────────────────────

  test("包含 Python 环境检测", () => {
    expect(scriptContent).toContain("command -v python3");
  });

  test("Python 缺失时支持 Homebrew 自动安装", () => {
    expect(scriptContent).toContain("brew install python");
  });

  test("Python 缺失时支持 apt 自动安装", () => {
    expect(scriptContent).toContain("apt-get install -y python3");
  });

  test("Python 缺失时支持 yum 自动安装", () => {
    expect(scriptContent).toContain("yum install -y python3");
  });

  test("Python 安装后配置 pip 阿里云镜像", () => {
    expect(scriptContent).toContain("pip3 config set global.index-url https://mirrors.aliyun.com/pypi/simple/");
    expect(scriptContent).toContain("pip3 config set global.trusted-host mirrors.aliyun.com");
  });

  test("Python 版本过低时给出升级提示", () => {
    expect(scriptContent).toContain("PYTHON_MAJOR");
    expect(scriptContent).toContain("PYTHON_MINOR");
    expect(scriptContent).toContain("版本过低");
  });

  // ── 网络源检测 ───────────────────────────────────────────────────

  test("支持 --cn 参数强制使用国内加速源", () => {
    expect(scriptContent).toContain('--cn');
    expect(scriptContent).toContain("ghproxy.com");
  });

  test("支持 --global 参数强制使用原始 GitHub 地址", () => {
    expect(scriptContent).toContain('--global');
    expect(scriptContent).toContain("github.com/openyida/yida-skills.git");
  });

  test("自动检测网络环境（curl 超时检测）", () => {
    expect(scriptContent).toContain("connect-timeout");
    expect(scriptContent).toContain("github.com");
  });

  // ── Skills 安装 ──────────────────────────────────────────────────

  test("Skills 目录路径正确（.claude/skills）", () => {
    expect(scriptContent).toContain('.claude/skills');
  });

  test("Skills 已存在时执行 git pull 更新", () => {
    expect(scriptContent).toContain("git -C");
    expect(scriptContent).toContain("pull origin");
  });

  test("Skills 不存在时执行 git clone", () => {
    expect(scriptContent).toContain("git clone --branch");
    expect(scriptContent).toContain("--depth 1");
  });

  test("安装完成后列出已安装的 Skills", () => {
    expect(scriptContent).toContain("已安装的 Skills");
  });
});

// ── install-skills.ps1 测试 ───────────────────────────────────────────

describe("install-skills.ps1", () => {
  let scriptContent;

  beforeAll(() => {
    scriptContent = readScript(INSTALL_PS1);
  });

  test("脚本文件存在", () => {
    expect(fs.existsSync(INSTALL_PS1)).toBe(true);
  });

  test("包含 param 声明（支持 --cn/--global 参数）", () => {
    expect(scriptContent).toContain("param(");
    expect(scriptContent).toContain('$Mode');
  });

  test("ErrorActionPreference 设置为 Continue（避免 winget 非零退出码中断）", () => {
    expect(scriptContent).toContain('$ErrorActionPreference = "Continue"');
    expect(scriptContent).not.toContain('$ErrorActionPreference = "Stop"');
  });

  test("包含项目根目录检查", () => {
    expect(scriptContent).toContain("config.json");
    expect(scriptContent).toContain("请在项目根目录下运行此脚本");
  });

  // ── git 检测 ────────────────────────────────────────────────────

  test("包含 git 环境检测", () => {
    expect(scriptContent).toContain("Get-Command git");
  });

  test("git 缺失时退出并给出提示", () => {
    expect(scriptContent).toContain("未找到 git");
    expect(scriptContent).toContain("exit 1");
  });

  // ── Node.js 检测与安装 ───────────────────────────────────────────

  test("包含 Node.js 环境检测", () => {
    expect(scriptContent).toContain("Get-Command node");
  });

  test("Node.js 缺失时使用 winget 自动安装", () => {
    expect(scriptContent).toContain("winget install OpenJS.NodeJS.LTS");
    expect(scriptContent).toContain("--accept-source-agreements");
  });

  test("Node.js 安装后刷新环境变量", () => {
    expect(scriptContent).toContain("GetEnvironmentVariable");
    expect(scriptContent).toContain('"Path"');
  });

  test("Node.js 安装后配置 npm 淘宝镜像", () => {
    expect(scriptContent).toContain("npm config set registry https://registry.npmmirror.com");
  });

  test("Node.js 版本过低时给出升级提示", () => {
    expect(scriptContent).toContain("nodeMajor");
    expect(scriptContent).toContain("版本过低");
  });

  // ── Python 检测与安装 ────────────────────────────────────────────

  test("包含 Python 环境检测", () => {
    expect(scriptContent).toContain("Get-Command python");
  });

  test("Python 缺失时使用 winget 自动安装", () => {
    expect(scriptContent).toContain("winget install Python.Python.3.12");
    expect(scriptContent).toContain("--accept-source-agreements");
  });

  test("Python 安装后配置 pip 阿里云镜像", () => {
    expect(scriptContent).toContain("pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/");
    expect(scriptContent).toContain("pip config set global.trusted-host mirrors.aliyun.com");
  });

  test("Python 版本过低时给出升级提示", () => {
    expect(scriptContent).toContain("pythonMajor");
    expect(scriptContent).toContain("pythonMinor");
    expect(scriptContent).toContain("版本过低");
  });

  // ── 网络源检测 ───────────────────────────────────────────────────

  test("支持 --cn 参数强制使用国内加速源", () => {
    expect(scriptContent).toContain('"--cn"');
    expect(scriptContent).toContain("ghproxy.com");
  });

  test("支持 --global 参数强制使用原始 GitHub 地址", () => {
    expect(scriptContent).toContain('"--global"');
    expect(scriptContent).toContain("github.com/openyida/yida-skills.git");
  });

  test("自动检测网络环境（Invoke-WebRequest 超时检测）", () => {
    expect(scriptContent).toContain("Invoke-WebRequest");
    expect(scriptContent).toContain("TimeoutSec");
  });

  // ── Skills 安装 ──────────────────────────────────────────────────

  test("Skills 目录路径正确（.claude\\skills）", () => {
    expect(scriptContent).toContain('.claude\\skills');
  });

  test("Skills 已存在时执行 git pull 更新", () => {
    expect(scriptContent).toContain("git -C");
    expect(scriptContent).toContain("pull origin");
  });

  test("Skills 不存在时执行 git clone", () => {
    expect(scriptContent).toContain("git clone --branch");
    expect(scriptContent).toContain("--depth 1");
  });

  test("安装完成后列出已安装的 Skills", () => {
    expect(scriptContent).toContain("已安装的 Skills");
  });
});
