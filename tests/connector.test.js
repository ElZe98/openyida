"use strict";

const { parseCurl, detectAuthType, filterBrowserHeaders, BROWSER_HEADERS } = require("../lib/connector/curl-parser");
const { generateConnectorDesc } = require("../lib/connector/desc-generator");
const { generateChildList, generateExample, generateOutputs, TYPE_MAP } = require("../lib/connector/response-parser");
const { generateActionInfo, generateOperation } = require("../lib/connector/action-generator");

// ══════════════════════════════════════════════════════════
// curl-parser.js
// ══════════════════════════════════════════════════════════

describe("parseCurl", () => {
  test("解析基本 GET 请求", () => {
    const result = parseCurl('curl "https://api.example.com/users?page=1"');
    expect(result.url).toBe("https://api.example.com/users?page=1");
    expect(result.method).toBe("GET");
    expect(result.protocol).toBe("https");
    expect(result.host).toBe("api.example.com");
    expect(result.path).toBe("/users?page=1");
  });

  test("解析带 -X 指定方法的请求", () => {
    const result = parseCurl('curl "https://api.example.com/users" -X DELETE');
    expect(result.method).toBe("DELETE");
  });

  test("带 --data 时自动推断为 POST", () => {
    const result = parseCurl('curl "https://api.example.com/users" --data \'{"name":"test"}\'');
    expect(result.method).toBe("POST");
  });

  test("带 -d 时自动推断为 POST", () => {
    const result = parseCurl('curl "https://api.example.com/users" -d \'{"name":"test"}\'');
    expect(result.method).toBe("POST");
  });

  test("解析请求头", () => {
    const result = parseCurl('curl "https://api.example.com/data" -H "Content-Type: application/json" -H "Authorization: Bearer token123"');
    expect(result.headers["Content-Type"]).toBe("application/json");
    expect(result.headers["Authorization"]).toBe("Bearer token123");
  });

  test("解析 http 协议", () => {
    const result = parseCurl('curl "http://localhost:3000/api"');
    expect(result.protocol).toBe("http");
    expect(result.host).toBe("localhost");
  });

  test("无 URL 时返回空字符串", () => {
    const result = parseCurl("curl --help");
    expect(result.url).toBe("");
    expect(result.method).toBe("GET");
  });
});

// ── detectAuthType ────────────────────────────────────────

describe("detectAuthType", () => {
  test("检测 Bearer Token", () => {
    const result = detectAuthType({ Authorization: "Bearer abc123" });
    expect(result.type).toBe("API密钥");
    expect(result.code).toBe("ApiKeyAuth");
  });

  test("检测 Basic Auth", () => {
    const result = detectAuthType({ Authorization: "Basic dXNlcjpwYXNz" });
    expect(result.type).toBe("基本身份验证");
    expect(result.code).toBe("BasicAuth");
  });

  test("检测钉钉 Token", () => {
    const result = detectAuthType({ "x-acs-dingtalk-access-token": "ding-token" });
    expect(result.type).toBe("钉钉开放平台验证");
    expect(result.code).toBe("DingAuth");
  });

  test("检测 x-api-key 类型的 header", () => {
    const result = detectAuthType({ "x-api-key": "my-key" });
    expect(result.type).toBe("API密钥");
    expect(result.code).toBe("ApiKeyAuth");
    expect(result.headerName).toBe("x-api-key");
  });

  test("无鉴权 header 时返回 NONE", () => {
    const result = detectAuthType({ "Content-Type": "application/json" });
    expect(result.type).toBe("无身份验证");
    expect(result.code).toBe("NONE");
  });

  test("空 headers 时返回 NONE", () => {
    const result = detectAuthType({});
    expect(result.code).toBe("NONE");
  });
});

// ── filterBrowserHeaders ──────────────────────────────────

describe("filterBrowserHeaders", () => {
  test("过滤浏览器自动添加的 headers", () => {
    const headers = {
      "User-Agent": "Mozilla/5.0",
      "Accept": "text/html",
      "Authorization": "Bearer token",
      "X-Custom-Header": "custom-value",
    };
    const result = filterBrowserHeaders(headers);
    const names = result.map(([key]) => key);
    expect(names).toContain("Authorization");
    expect(names).toContain("X-Custom-Header");
    expect(names).not.toContain("User-Agent");
    expect(names).not.toContain("Accept");
  });

  test("过滤 content-type", () => {
    const headers = { "Content-Type": "application/json", "X-Token": "abc" };
    const result = filterBrowserHeaders(headers);
    const names = result.map(([key]) => key);
    expect(names).not.toContain("Content-Type");
    expect(names).toContain("X-Token");
  });

  test("过滤 sec- 开头的 headers", () => {
    const headers = { "sec-custom": "val", "X-Real": "val2" };
    const result = filterBrowserHeaders(headers);
    const names = result.map(([key]) => key);
    expect(names).not.toContain("sec-custom");
    expect(names).toContain("X-Real");
  });

  test("空 headers 返回空数组", () => {
    expect(filterBrowserHeaders({})).toEqual([]);
  });

  test("BROWSER_HEADERS 常量包含常见浏览器 header", () => {
    expect(BROWSER_HEADERS).toContain("user-agent");
    expect(BROWSER_HEADERS).toContain("accept");
    expect(BROWSER_HEADERS).toContain("referer");
  });
});

// ══════════════════════════════════════════════════════════
// desc-generator.js
// ══════════════════════════════════════════════════════════

describe("generateConnectorDesc", () => {
  test("识别宜搭平台", () => {
    const desc = generateConnectorDesc(
      { host: "www.aliwork.com", method: "POST" },
      { summary: "查询数据" }
    );
    expect(desc).toContain("宜搭");
    expect(desc).toContain("查询数据");
    expect(desc).toContain("POST");
  });

  test("识别钉钉平台", () => {
    const desc = generateConnectorDesc(
      { host: "api.dingtalk.com", method: "GET" },
      { summary: "获取用户" }
    );
    expect(desc).toContain("钉钉");
  });

  test("识别阿里云平台", () => {
    const desc = generateConnectorDesc(
      { host: "ecs.aliyun.com", method: "GET" },
      { summary: "查询实例" }
    );
    expect(desc).toContain("阿里云");
  });

  test("未知平台使用通用描述", () => {
    const desc = generateConnectorDesc(
      { host: "api.github.com", method: "GET" },
      { summary: "获取仓库" }
    );
    expect(desc).toContain("HTTP API");
    expect(desc).toContain("获取仓库");
  });
});

// ══════════════════════════════════════════════════════════
// response-parser.js
// ══════════════════════════════════════════════════════════

describe("TYPE_MAP", () => {
  test("包含所有基本类型映射", () => {
    expect(TYPE_MAP.string).toBe("String");
    expect(TYPE_MAP.number).toBe("Number");
    expect(TYPE_MAP.integer).toBe("Number");
    expect(TYPE_MAP.boolean).toBe("Boolean");
    expect(TYPE_MAP.object).toBe("Object");
    expect(TYPE_MAP.array).toBe("Array");
  });
});

describe("generateExample", () => {
  test("生成字符串类型示例", () => {
    expect(generateExample({ type: "string", description: "用户名" })).toBe("用户名");
  });

  test("生成数字类型示例", () => {
    expect(generateExample({ type: "number" })).toBe(0);
    expect(generateExample({ type: "integer" })).toBe(0);
  });

  test("生成布尔类型示例", () => {
    expect(generateExample({ type: "boolean" })).toBe(false);
  });

  test("生成数组类型示例", () => {
    const result = generateExample({ type: "array", items: { type: "string", description: "item" } });
    expect(result).toEqual(["item"]);
  });

  test("生成空数组（无 items）", () => {
    expect(generateExample({ type: "array" })).toEqual([]);
  });

  test("生成对象类型示例", () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string", description: "姓名" },
        age: { type: "number" },
      },
    };
    const result = generateExample(schema);
    expect(result).toEqual({ name: "姓名", age: 0 });
  });

  test("生成空对象（无 properties）", () => {
    expect(generateExample({ type: "object" })).toEqual({});
  });

  test("null schema 返回 null", () => {
    expect(generateExample(null)).toBeNull();
  });

  test("未知类型返回 null", () => {
    expect(generateExample({ type: "unknown" })).toBeNull();
  });
});

describe("generateChildList", () => {
  test("生成扁平字段列表", () => {
    const schema = {
      type: "object",
      properties: {
        id: { type: "integer", description: "ID" },
        name: { type: "string", description: "名称" },
      },
    };
    const result = generateChildList(schema, "op1");
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("id");
    expect(result[0].paramType).toBe("Number");
    expect(result[0]._key).toBe("op1%id");
    expect(result[1].name).toBe("name");
    expect(result[1].paramType).toBe("String");
  });

  test("处理嵌套对象", () => {
    const schema = {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            name: { type: "string" },
          },
        },
      },
    };
    const result = generateChildList(schema, "op1");
    expect(result[0].name).toBe("user");
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].name).toBe("name");
    expect(result[0].children[0].__level).toBe(1);
  });

  test("处理数组中的对象", () => {
    const schema = {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "integer" },
            },
          },
        },
      },
    };
    const result = generateChildList(schema, "op1");
    expect(result[0].name).toBe("items");
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].name).toBe("id");
  });

  test("非 object 类型 schema 返回空数组", () => {
    expect(generateChildList({ type: "string" }, "op1")).toEqual([]);
    expect(generateChildList(null, "op1")).toEqual([]);
  });
});

describe("generateOutputs", () => {
  test("生成完整的 outputs 配置", () => {
    const schema = {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: { type: "string", description: "数据" },
      },
    };
    const result = generateOutputs(schema, "testOp");
    expect(result.name).toBe("Response");
    expect(result.paramType).toBe("Object");
    expect(result.childList).toHaveLength(2);
    expect(result.defaultValue).toBeDefined();
    const parsed = JSON.parse(result.defaultValue);
    expect(parsed.success).toBe(false);
    expect(parsed.data).toBe("数据");
  });
});

// ══════════════════════════════════════════════════════════
// action-generator.js
// ══════════════════════════════════════════════════════════

describe("generateActionInfo", () => {
  test("识别 query 路径", () => {
    const result = generateActionInfo("/api/v1/queryThroughView.json", "POST");
    expect(result.name).toBe("查询视图数据");
    expect(result.desc).toContain("视图");
  });

  test("识别 create 路径", () => {
    const result = generateActionInfo("/api/create", "POST");
    expect(result.name).toBe("创建数据");
  });

  test("识别 delete 路径", () => {
    const result = generateActionInfo("/api/deleteUser", "DELETE");
    expect(result.name).toBe("删除数据");
  });

  test("识别 upload 路径", () => {
    const result = generateActionInfo("/api/uploadFile", "POST");
    expect(result.name).toBe("上传文件");
  });

  test("未匹配关键词时使用驼峰转换", () => {
    const result = generateActionInfo("/api/customEndpoint", "GET");
    expect(result.name).toBeDefined();
    expect(result.name.length).toBeGreaterThan(0);
  });

  test("空路径时使用方法名", () => {
    const result = generateActionInfo("/", "POST");
    expect(result.name).toBe("POST 请求");
  });
});

describe("generateOperation", () => {
  test("生成基本 GET 操作配置", () => {
    const curlData = {
      url: "https://api.example.com/users",
      method: "GET",
      headers: {},
      body: null,
      protocol: "https",
      host: "api.example.com",
      path: "/users",
    };
    const result = generateOperation(curlData, []);
    expect(result.operationId).toBeDefined();
    expect(result.method).toBe("get");
    expect(result.url).toBe("users");
    expect(result.summary).toBeDefined();
    expect(result.inputs).toEqual([]);
    expect(result.outputs).toHaveLength(1);
  });

  test("生成带 headers 的操作配置", () => {
    const curlData = {
      url: "https://api.example.com/data",
      method: "POST",
      headers: { "X-Token": "abc" },
      body: null,
      protocol: "https",
      host: "api.example.com",
      path: "/data",
    };
    const relevantHeaders = [["X-Token", "abc"]];
    const result = generateOperation(curlData, relevantHeaders);
    const headersInput = result.inputs.find((i) => i.name === "Headers");
    expect(headersInput).toBeDefined();
    expect(headersInput.childList).toHaveLength(1);
    expect(result.parameters.header).toHaveLength(1);
  });

  test("生成带 JSON body 的操作配置", () => {
    const curlData = {
      url: "https://api.example.com/create",
      method: "POST",
      headers: {},
      body: '{"name":"test","age":18}',
      protocol: "https",
      host: "api.example.com",
      path: "/create",
    };
    const result = generateOperation(curlData, []);
    const bodyInput = result.inputs.find((i) => i.name === "Body");
    expect(bodyInput).toBeDefined();
    expect(bodyInput.paramType).toBe("Object");
    expect(bodyInput.childList).toHaveLength(2);
    expect(result.parameters.body).toBeDefined();
  });

  test("生成带非 JSON body 的操作配置", () => {
    const curlData = {
      url: "https://api.example.com/submit",
      method: "POST",
      headers: {},
      body: "key=value&foo=bar",
      protocol: "https",
      host: "api.example.com",
      path: "/submit",
    };
    const result = generateOperation(curlData, []);
    const bodyInput = result.inputs.find((i) => i.name === "Body");
    expect(bodyInput).toBeDefined();
    expect(bodyInput.paramType).toBe("String");
  });

  test("生成带 query 参数的操作配置", () => {
    const curlData = {
      url: "https://api.example.com/search?q=test&page=1",
      method: "GET",
      headers: {},
      body: null,
      protocol: "https",
      host: "api.example.com",
      path: "/search?q=test&page=1",
    };
    const result = generateOperation(curlData, []);
    const queryInput = result.inputs.find((i) => i.name === "Query");
    expect(queryInput).toBeDefined();
    expect(queryInput.childList).toHaveLength(2);
    expect(result.parameters.query).toHaveLength(2);
  });
});
