"use strict";

const { spawnSync } = require("child_process");
const path = require("path");

const SCRIPT_PATH = path.resolve(
  __dirname,
  "../../.claude/skills/yida-issue/scripts/create-issue.js"
);

function runScript(args = []) {
  const result = spawnSync("node", [SCRIPT_PATH, ...args], {
    encoding: "utf-8",
  });
  return {
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    status: result.status ?? 1,
  };
}

const OPENYIDA_KEYWORDS = [
  "cli", "命令行", "命令", "install", "安装脚本", "安装",
  "workflow", "ci", "cd", "github action", "贡献者", "contributor",
  "readme", "文档", "package", "npm", "发布工具", "版本管理",
  "openclaw", "openyida", "bin/yida", "yida shell", "yida config",
  "yida login命令", "yida logout命令",
];

const YIDA_SKILLS_KEYWORDS = [
  "登录", "登出", "login", "logout", "扫码", "cookie", "token", "csrf",
  "创建应用", "创建页面", "创建表单", "发布页面", "发布", "publish",
  "schema", "宜搭 api", "宜搭api", "skill", "表单", "应用", "页面",
  "宜搭", "aliwork", "yida-create", "yida-publish", "yida-get",
  "get-schema", "create-app", "create-page", "create-form",
  "批量", "导出", "字段", "数据", "接口",
];

function detectTargetRepo(description) {
  const lowerDesc = description.toLowerCase();
  let openyidaScore = 0;
  let yidaSkillsScore = 0;

  for (const keyword of OPENYIDA_KEYWORDS) {
    if (lowerDesc.includes(keyword.toLowerCase())) openyidaScore++;
  }
  for (const keyword of YIDA_SKILLS_KEYWORDS) {
    if (lowerDesc.includes(keyword.toLowerCase())) yidaSkillsScore++;
  }

  if (openyidaScore === 0 && yidaSkillsScore === 0) return null;
  if (openyidaScore > yidaSkillsScore) return "openyida/openyida";
  if (yidaSkillsScore > openyidaScore) return "openyida/yida-skills";
  return null;
}

function detectIssueType(description) {
  const lowerDesc = description.toLowerCase();
  const bugKeywords = ["bug", "错误", "报错", "失败", "异常", "不生效", "不显示", "崩溃", "修复", "fix"];
  for (const keyword of bugKeywords) {
    if (lowerDesc.includes(keyword)) return "bug";
  }
  return "feature";
}

function generateTitle(description, issueType) {
  const cleanDesc = description
    .replace(/^(bug|feat|feature|fix)\s*[:：]\s*/i, "")
    .trim();
  if (issueType === "bug") return `bug: ${cleanDesc}`;
  return `[Feature] ${cleanDesc}`;
}

describe("detectTargetRepo - 路由判断", () => {
  test("宜搭操作类：批量导出表单数据 → yida-skills", () => {
    expect(detectTargetRepo("希望支持批量导出表单数据到 Excel")).toBe("openyida/yida-skills");
  });

  test("宜搭操作类：创建应用 → yida-skills", () => {
    expect(detectTargetRepo("创建应用时图标颜色不生效")).toBe("openyida/yida-skills");
  });

  test("宜搭操作类：登录态失效 → yida-skills", () => {
    expect(detectTargetRepo("登录态失效时希望自动重新登录")).toBe("openyida/yida-skills");
  });

  test("宜搭操作类：发布页面 → yida-skills", () => {
    expect(detectTargetRepo("发布页面时希望支持进度显示")).toBe("openyida/yida-skills");
  });

  test("宜搭操作类：获取 schema → yida-skills", () => {
    expect(detectTargetRepo("get-schema 命令返回结果格式优化")).toBe("openyida/yida-skills");
  });

  test("平台工具类：CLI list 命令 → openyida", () => {
    expect(detectTargetRepo("希望 yida CLI 支持 list 命令列出所有应用")).toBe("openyida/openyida");
  });

  test("平台工具类：CI workflow → openyida", () => {
    expect(detectTargetRepo("希望 CI workflow 自动检查代码规范")).toBe("openyida/openyida");
  });

  test("平台工具类：贡献者管理 → openyida", () => {
    expect(detectTargetRepo("贡献者头像显示错误")).toBe("openyida/openyida");
  });

  test("平台工具类：安装脚本 → openyida", () => {
    expect(detectTargetRepo("安装脚本在 Windows 上执行失败")).toBe("openyida/openyida");
  });

  test("平台工具类：npm 包 → openyida", () => {
    expect(detectTargetRepo("希望 npm 包支持全局安装后自动更新")).toBe("openyida/openyida");
  });

  test("无关键词时返回 null", () => {
    expect(detectTargetRepo("希望有更好的体验")).toBeNull();
  });

  test("空字符串返回 null", () => {
    expect(detectTargetRepo("")).toBeNull();
  });
});

describe("detectIssueType - Issue 类型判断", () => {
  test("包含 bug 关键词 → bug", () => {
    expect(detectIssueType("bug: 创建应用时图标颜色不生效")).toBe("bug");
  });

  test("包含 错误 关键词 → bug", () => {
    expect(detectIssueType("登录时出现错误提示")).toBe("bug");
  });

  test("包含 不生效 关键词 → bug", () => {
    expect(detectIssueType("图标颜色设置不生效")).toBe("bug");
  });

  test("包含 修复 关键词 → bug", () => {
    expect(detectIssueType("修复登录态失效问题")).toBe("bug");
  });

  test("包含 fix 关键词 → bug", () => {
    expect(detectIssueType("fix: cookie parsing error")).toBe("bug");
  });

  test("普通功能需求 → feature", () => {
    expect(detectIssueType("希望支持批量导出表单数据")).toBe("feature");
  });

  test("新增命令需求 → feature", () => {
    expect(detectIssueType("CLI 新增 list 命令")).toBe("feature");
  });
});

describe("generateTitle - 标题生成", () => {
  test("feature 类型添加 [Feature] 前缀", () => {
    expect(generateTitle("希望支持批量导出表单数据", "feature")).toBe(
      "[Feature] 希望支持批量导出表单数据"
    );
  });

  test("bug 类型添加 bug: 前缀", () => {
    expect(generateTitle("创建应用时图标颜色不生效", "bug")).toBe(
      "bug: 创建应用时图标颜色不生效"
    );
  });

  test("去掉原有的 bug: 前缀再重新添加", () => {
    expect(generateTitle("bug: 创建应用时图标颜色不生效", "bug")).toBe(
      "bug: 创建应用时图标颜色不生效"
    );
  });

  test("去掉原有的 feat: 前缀再添加 [Feature]", () => {
    expect(generateTitle("feat: 支持批量导出", "feature")).toBe(
      "[Feature] 支持批量导出"
    );
  });

  test("去掉原有的 feature: 前缀", () => {
    expect(generateTitle("feature: 支持批量导出", "feature")).toBe(
      "[Feature] 支持批量导出"
    );
  });
});

describe("CLI 行为测试", () => {
  test("无参数时输出错误提示并退出", () => {
    const { stderr, status } = runScript([]);
    expect(status).not.toBe(0);
    expect(stderr).toContain("请提供需求描述");
  });

  test("宜搭操作类需求 dry-run 路由到 yida-skills", () => {
    const { stdout, status } = runScript([
      "希望支持批量导出表单数据到 Excel",
      "--dry-run",
    ]);
    expect(status).toBe(0);
    expect(stdout).toContain("openyida/yida-skills");
    expect(stdout).toContain("dry-run 完成");
  });

  test("CLI 平台工具类需求 dry-run 路由到 openyida", () => {
    const { stdout, status } = runScript([
      "希望 yida CLI 支持 list 命令列出所有应用",
      "--dry-run",
    ]);
    expect(status).toBe(0);
    expect(stdout).toContain("openyida/openyida");
    expect(stdout).toContain("dry-run 完成");
  });

  test("bug 类型需求 dry-run 生成 bug 标题", () => {
    const { stdout, status } = runScript([
      "bug: 创建应用时图标颜色不生效",
      "--dry-run",
    ]);
    expect(status).toBe(0);
    expect(stdout).toContain("🐛 Bug");
    expect(stdout).toContain("bug: 创建应用时图标颜色不生效");
  });

  test("--repo openyida 强制路由到 openyida", () => {
    const { stdout, status } = runScript([
      "登录态失效",
      "--repo",
      "openyida",
      "--dry-run",
    ]);
    expect(status).toBe(0);
    expect(stdout).toContain("openyida/openyida");
  });

  test("--repo yida-skills 强制路由到 yida-skills", () => {
    const { stdout, status } = runScript([
      "CLI 新增 list 命令",
      "--repo",
      "yida-skills",
      "--dry-run",
    ]);
    expect(status).toBe(0);
    expect(stdout).toContain("openyida/yida-skills");
  });

  test("--type bug 强制设置为 bug 类型", () => {
    const { stdout, status } = runScript([
      "创建应用",
      "--repo",
      "yida-skills",
      "--type",
      "bug",
      "--dry-run",
    ]);
    expect(status).toBe(0);
    expect(stdout).toContain("🐛 Bug");
  });

  test("无法判断仓库时提示用户手动指定", () => {
    const { stdout, status } = runScript(["希望有更好的体验"]);
    expect(status).not.toBe(0);
    expect(stdout).toContain("无法自动判断目标仓库");
    expect(stdout).toContain("--repo");
  });

  test("--repo 参数无效时报错退出", () => {
    const { stderr, status } = runScript([
      "测试需求",
      "--repo",
      "invalid-repo",
    ]);
    expect(status).not.toBe(0);
    expect(stderr).toContain("无效的 --repo 参数");
  });

  test("--type 参数无效时报错退出", () => {
    const { stderr, status } = runScript([
      "测试需求",
      "--repo",
      "yida-skills",
      "--type",
      "invalid",
    ]);
    expect(status).not.toBe(0);
    expect(stderr).toContain("无效的 --type 参数");
  });

  test("dry-run 模式输出 Issue body 预览", () => {
    const { stdout, status } = runScript([
      "希望支持批量导出表单数据",
      "--repo",
      "yida-skills",
      "--dry-run",
    ]);
    expect(status).toBe(0);
    expect(stdout).toContain("## 需求描述");
    expect(stdout).toContain("## 期望功能");
    expect(stdout).toContain("yida-issue skill");
  });

  test("bug dry-run 模式输出 Bug body 预览", () => {
    const { stdout, status } = runScript([
      "登录失败",
      "--repo",
      "yida-skills",
      "--type",
      "bug",
      "--dry-run",
    ]);
    expect(status).toBe(0);
    expect(stdout).toContain("## Bug 描述");
    expect(stdout).toContain("## 复现步骤");
    expect(stdout).toContain("## 期望行为");
  });
});
