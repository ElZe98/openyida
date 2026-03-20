"use strict";

/**
 * data-management.js 测试
 *
 * data-management.js 的内部纯函数（parseCliOptions, clampPageSize, snakeToCamel 等）
 * 未导出，因此通过读取源码提取函数体并在沙箱中执行来测试。
 */

const fs = require("fs");
const path = require("path");

const SOURCE_PATH = path.join(__dirname, "..", "lib", "data-management.js");
const sourceCode = fs.readFileSync(SOURCE_PATH, "utf-8");

// ── 辅助：从源码中提取并执行函数 ──────────────────────────

function extractFunction(source, functionName) {
  const pattern = new RegExp(`function\\s+${functionName}\\s*\\(`);
  const match = pattern.exec(source);
  if (!match) return null;

  let braceCount = 0;
  let started = false;
  const startIndex = match.index;

  for (let charIndex = match.index; charIndex < source.length; charIndex++) {
    if (source[charIndex] === "{") {
      braceCount++;
      started = true;
    } else if (source[charIndex] === "}") {
      braceCount--;
      if (started && braceCount === 0) {
        return source.slice(startIndex, charIndex + 1);
      }
    }
  }
  return null;
}

// 创建沙箱函数
function createSandboxFunction(functionBody) {
  // eslint-disable-next-line no-new-func
  return new Function(`return (${functionBody})`)();
}

// ── parseCliOptions ───────────────────────────────────────

describe("parseCliOptions (extracted from source)", () => {
  const functionBody = extractFunction(sourceCode, "parseCliOptions");
  const parseCliOptions = createSandboxFunction(functionBody);

  test("解析位置参数", () => {
    const result = parseCliOptions(["APP_XXX", "FORM_YYY"]);
    expect(result.positionals).toEqual(["APP_XXX", "FORM_YYY"]);
    expect(result.options).toEqual({});
  });

  test("解析 --key value 选项", () => {
    const result = parseCliOptions(["--page", "2", "--size", "10"]);
    expect(result.positionals).toEqual([]);
    expect(result.options.page).toBe("2");
    expect(result.options.size).toBe("10");
  });

  test("解析混合的位置参数和选项", () => {
    const result = parseCliOptions(["APP_XXX", "FORM_YYY", "--page", "1", "--size", "20"]);
    expect(result.positionals).toEqual(["APP_XXX", "FORM_YYY"]);
    expect(result.options.page).toBe("1");
    expect(result.options.size).toBe("20");
  });

  test("解析无值的布尔选项", () => {
    const result = parseCliOptions(["--ids-only"]);
    expect(result.options.ids_only).toBe(true);
  });

  test("连续两个 -- 选项时前一个为 true", () => {
    const result = parseCliOptions(["--verbose", "--page", "3"]);
    expect(result.options.verbose).toBe(true);
    expect(result.options.page).toBe("3");
  });

  test("将 kebab-case 转为 snake_case", () => {
    const result = parseCliOptions(["--search-json", '{"key":"value"}']);
    expect(result.options.search_json).toBe('{"key":"value"}');
  });

  test("空数组返回空结果", () => {
    const result = parseCliOptions([]);
    expect(result.positionals).toEqual([]);
    expect(result.options).toEqual({});
  });
});

// ── clampPageSize ─────────────────────────────────────────

describe("clampPageSize (extracted from source)", () => {
  const functionBody = extractFunction(sourceCode, "clampPageSize");
  const clampPageSize = createSandboxFunction(functionBody);

  test("默认 page=1, size=20", () => {
    const options = {};
    clampPageSize(options);
    expect(options.page).toBe(1);
    expect(options.size).toBe(20);
  });

  test("自定义默认 size", () => {
    const options = {};
    clampPageSize(options, 10);
    expect(options.size).toBe(10);
  });

  test("size 超过 100 时限制为 100", () => {
    const options = { size: "200" };
    clampPageSize(options);
    expect(options.size).toBe(100);
  });

  test("size 为负数时使用默认值", () => {
    const options = { size: "-5" };
    clampPageSize(options);
    expect(options.size).toBe(20);
  });

  test("page 为负数时使用 1", () => {
    const options = { page: "-1" };
    clampPageSize(options);
    expect(options.page).toBe(1);
  });

  test("size 为非数字时使用默认值", () => {
    const options = { size: "abc" };
    clampPageSize(options);
    expect(options.size).toBe(20);
  });

  test("正常值保持不变", () => {
    const options = { page: "3", size: "50" };
    clampPageSize(options);
    expect(options.page).toBe(3);
    expect(options.size).toBe(50);
  });
});

// ── snakeToCamel ──────────────────────────────────────────

describe("snakeToCamel (extracted from source)", () => {
  const functionBody = extractFunction(sourceCode, "snakeToCamel");
  const snakeToCamel = createSandboxFunction(functionBody);

  test("单个单词不变", () => {
    expect(snakeToCamel("page")).toBe("page");
  });

  test("snake_case 转 camelCase", () => {
    expect(snakeToCamel("search_json")).toBe("searchJson");
  });

  test("多段 snake_case 转换", () => {
    expect(snakeToCamel("originator_id")).toBe("originatorId");
    expect(snakeToCamel("create_from")).toBe("createFrom");
    expect(snakeToCamel("instance_status")).toBe("instanceStatus");
  });

  test("三段 snake_case 转换", () => {
    expect(snakeToCamel("use_latest_version")).toBe("useLatestVersion");
  });
});

// ── JS 语法检查 ───────────────────────────────────────────

describe("data-management.js syntax", () => {
  test("passes Node.js syntax check", () => {
    const { execSync } = require("child_process");
    expect(() => {
      execSync(`node --check ${SOURCE_PATH}`, { stdio: "pipe" });
    }).not.toThrow();
  });
});

// ── 源码结构验证 ──────────────────────────────────────────

describe("data-management.js structure", () => {
  test("导出 run 函数", () => {
    expect(sourceCode).toContain("module.exports");
    expect(sourceCode).toContain("run");
  });

  test("包含所有支持的 action+resource 组合", () => {
    const expectedCombinations = [
      ["query", "form"],
      ["get", "form"],
      ["create", "form"],
      ["update", "form"],
      ["query", "subform"],
      ["query", "process"],
      ["get", "process"],
      ["create", "process"],
      ["update", "process"],
      ["query", "operation-records"],
      ["execute", "task"],
      ["query", "tasks"],
    ];

    for (const [action, resource] of expectedCombinations) {
      expect(sourceCode).toContain(`"${action}" && resource === "${resource}"`);
    }
  });

  test("包含 USAGE 帮助文本", () => {
    expect(sourceCode).toContain("openyida data query form");
    expect(sourceCode).toContain("openyida data create form");
    expect(sourceCode).toContain("openyida data execute task");
  });
});
