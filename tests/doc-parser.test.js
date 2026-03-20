"use strict";

const path = require("path");
const fs = require("fs");
const os = require("os");

const { MarkdownParser, DocParserFactory, convertToOperationConfig } = require("../lib/connector/doc-parser");

// ── MarkdownParser: parseBasicInfo ────────────────────────

describe("MarkdownParser - parseBasicInfo", () => {
  test("提取标题", () => {
    const parser = new MarkdownParser("# 获取用户列表\n\n这是描述");
    const result = parser.parse();
    expect(result.basicInfo.title).toBe("获取用户列表");
  });

  test("无标题时 title 为 undefined", () => {
    const parser = new MarkdownParser("没有标题的文档");
    const result = parser.parse();
    expect(result.basicInfo.title).toBeUndefined();
  });

  test("提取 Source URL", () => {
    const parser = new MarkdownParser("# API\nSource: https://api.example.com/docs");
    const result = parser.parse();
    expect(result.basicInfo.sourceUrl).toBe("https://api.example.com/docs");
  });
});

// ── MarkdownParser: parseServerInfo ───────────────────────

describe("MarkdownParser - parseServerInfo", () => {
  test("提取 URL 和 Method", () => {
    const content = `# API
- URL:
  https://api.example.com/v1/users
- Method:
  POST
`;
    const parser = new MarkdownParser(content);
    const result = parser.parse();
    expect(result.serverInfo.host).toBe("api.example.com");
    expect(result.serverInfo.method).toBe("POST");
    expect(result.serverInfo.protocol).toBe("https");
    expect(result.serverInfo.path).toBe("/v1/users");
  });

  test("无 URL 时 serverInfo 为空", () => {
    const parser = new MarkdownParser("# API\n没有 URL");
    const result = parser.parse();
    expect(result.serverInfo.host).toBeUndefined();
  });
});

// ── MarkdownParser: parseAuthInfo ─────────────────────────

describe("MarkdownParser - parseAuthInfo", () => {
  test("检测 Bearer Token 鉴权", () => {
    const content = "# API\nAuthorization: Bearer <token>";
    const parser = new MarkdownParser(content);
    const result = parser.parse();
    expect(result.authInfo.type).toBe("API密钥");
    expect(result.authInfo.scheme).toBe("bearer");
  });

  test("检测 Basic Auth 鉴权", () => {
    const content = "# API\n使用 Basic Auth 进行基本身份验证";
    const parser = new MarkdownParser(content);
    const result = parser.parse();
    expect(result.authInfo.type).toBe("基本身份验证");
    expect(result.authInfo.scheme).toBe("basic");
  });

  test("检测钉钉鉴权", () => {
    const content = "# API\n需要 x-acs-dingtalk-access-token 头";
    const parser = new MarkdownParser(content);
    const result = parser.parse();
    expect(result.authInfo.type).toBe("钉钉开放平台验证");
    expect(result.authInfo.scheme).toBe("dingtalk");
  });

  test("无鉴权信息时 authInfo 为空对象", () => {
    const content = "# API\n普通接口";
    const parser = new MarkdownParser(content);
    const result = parser.parse();
    expect(result.authInfo.type).toBeUndefined();
  });
});

// ── MarkdownParser: parseResponseSchema ───────────────────

describe("MarkdownParser - parseResponseSchema", () => {
  test("从 JSON 代码块推断响应 Schema", () => {
    const content = `# API

## 响应

\`\`\`json
{
  "success": true,
  "data": "hello",
  "count": 42
}
\`\`\`
`;
    const parser = new MarkdownParser(content);
    const result = parser.parse();
    expect(result.responseInfo.schema).toBeDefined();
    expect(result.responseInfo.schema.properties.success.type).toBe("boolean");
    expect(result.responseInfo.schema.properties.data.type).toBe("string");
    expect(result.responseInfo.schema.properties.count.type).toBe("integer");
    expect(result.responseInfo.examples).toHaveLength(1);
  });

  test("无响应部分时 schema 为 null", () => {
    const content = "# API\n## 请求\nGET /api/test";
    const parser = new MarkdownParser(content);
    const result = parser.parse();
    expect(result.responseInfo.schema).toBeNull();
  });
});

// ── MarkdownParser: inferType ─────────────────────────────

describe("MarkdownParser - inferType", () => {
  const parser = new MarkdownParser("");

  test("推断字符串类型", () => {
    expect(parser.inferType("hello").type).toBe("string");
  });

  test("推断整数类型", () => {
    expect(parser.inferType(42).type).toBe("integer");
  });

  test("推断浮点数类型", () => {
    expect(parser.inferType(3.14).type).toBe("number");
  });

  test("推断布尔类型", () => {
    expect(parser.inferType(true).type).toBe("boolean");
  });

  test("推断 null 类型", () => {
    expect(parser.inferType(null).type).toBe("null");
  });

  test("推断数组类型", () => {
    const result = parser.inferType([1, 2, 3]);
    expect(result.type).toBe("array");
    expect(result.items.type).toBe("integer");
  });

  test("推断空数组类型", () => {
    expect(parser.inferType([]).type).toBe("array");
  });

  test("推断对象类型", () => {
    const result = parser.inferType({ name: "test" });
    expect(result.type).toBe("object");
    expect(result.properties.name.type).toBe("string");
  });

  test("日期相关字段名推断为 date-time 格式", () => {
    const result = parser.inferType("2026-01-01", "createTime");
    expect(result.type).toBe("string");
    expect(result.format).toBe("date-time");
  });
});

// ── MarkdownParser: mapType ───────────────────────────────

describe("MarkdownParser - mapType", () => {
  const parser = new MarkdownParser("");

  test("映射标准类型", () => {
    expect(parser.mapType("string")).toBe("string");
    expect(parser.mapType("integer")).toBe("integer");
    expect(parser.mapType("int")).toBe("integer");
    expect(parser.mapType("number")).toBe("number");
    expect(parser.mapType("boolean")).toBe("boolean");
    expect(parser.mapType("bool")).toBe("boolean");
    expect(parser.mapType("array")).toBe("array");
    expect(parser.mapType("object")).toBe("object");
    expect(parser.mapType("file")).toBe("string");
  });

  test("未知类型映射为 string", () => {
    expect(parser.mapType("unknown")).toBe("string");
  });
});

// ── MarkdownParser: parseTable ────────────────────────────

describe("MarkdownParser - parseTable", () => {
  const parser = new MarkdownParser("");

  test("解析 Markdown 表格", () => {
    const table = `
| 名称 | 类型 | 描述 |
| --- | --- | --- |
| id | integer | 用户ID |
| name | string | 用户名 |
`;
    const result = parser.parseTable(table);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("id");
    expect(result[0].type).toBe("integer");
    expect(result[0].description).toBe("用户ID");
    expect(result[1].name).toBe("name");
  });

  test("无表格时返回空数组", () => {
    expect(parser.parseTable("没有表格的内容")).toEqual([]);
  });
});

// ── MarkdownParser: parseFieldType ────────────────────────

describe("MarkdownParser - parseFieldType", () => {
  const parser = new MarkdownParser("");

  test("解析 array[string] 类型", () => {
    const result = parser.parseFieldType("array[string]");
    expect(result.type).toBe("array");
    expect(result.items.type).toBe("string");
  });

  test("解析 object{5} 类型", () => {
    const result = parser.parseFieldType("object{5}");
    expect(result.type).toBe("object");
    expect(result.description).toContain("5");
  });

  test("解析普通类型", () => {
    const result = parser.parseFieldType("string");
    expect(result.type).toBe("string");
  });
});

// ── DocParserFactory ──────────────────────────────────────

describe("DocParserFactory", () => {
  test("创建 .md 文件解析器", () => {
    const parser = DocParserFactory.createParser("test.md", "# Test");
    expect(parser).toBeInstanceOf(MarkdownParser);
  });

  test("创建 .markdown 文件解析器", () => {
    const parser = DocParserFactory.createParser("test.markdown", "# Test");
    expect(parser).toBeInstanceOf(MarkdownParser);
  });

  test("创建 .txt 文件解析器（降级为 Markdown）", () => {
    const parser = DocParserFactory.createParser("test.txt", "# Test");
    expect(parser).toBeInstanceOf(MarkdownParser);
  });

  test("未知扩展名降级为 Markdown 解析器", () => {
    const parser = DocParserFactory.createParser("test.xyz", "# Test");
    expect(parser).toBeInstanceOf(MarkdownParser);
  });

  test(".doc 文件抛出错误", () => {
    expect(() => DocParserFactory.createParser("test.doc", "content")).toThrow("Word");
  });

  test(".pdf 文件抛出错误", () => {
    expect(() => DocParserFactory.createParser("test.pdf", "content")).toThrow("PDF");
  });
});

// ── convertToOperationConfig ──────────────────────────────

describe("convertToOperationConfig", () => {
  test("将解析结果转换为操作配置", () => {
    const parseResult = {
      basicInfo: { title: "查询用户", description: "查询用户列表接口" },
      serverInfo: { path: "/api/users", method: "GET", host: "api.example.com", protocol: "https" },
      authInfo: {},
      requestInfo: { headers: [], query: [], body: null },
      responseInfo: { schema: null, examples: [] },
    };

    const config = convertToOperationConfig(parseResult);
    expect(config.operationId).toBe("查询用户");
    expect(config.summary).toBe("查询用户");
    expect(config.description).toBe("查询用户列表接口");
    expect(config.method).toBe("get");
    expect(config.url).toBe("/api/users");
    expect(config.origin).toBe(true);
  });

  test("转换带请求头的配置", () => {
    const parseResult = {
      basicInfo: { title: "API" },
      serverInfo: { path: "/api", method: "POST" },
      authInfo: {},
      requestInfo: {
        headers: [{ name: "X-Token", type: "string", description: "认证令牌" }],
        query: [],
        body: null,
      },
      responseInfo: { schema: null, examples: [] },
    };

    const config = convertToOperationConfig(parseResult);
    const headersInput = config.inputs.find((i) => i.name === "Headers");
    expect(headersInput).toBeDefined();
    expect(headersInput.childList).toHaveLength(1);
    expect(config.parameters.header).toHaveLength(1);
  });

  test("转换带查询参数的配置", () => {
    const parseResult = {
      basicInfo: { title: "API" },
      serverInfo: { path: "/api", method: "GET" },
      authInfo: {},
      requestInfo: {
        headers: [],
        query: [{ name: "page", type: "integer", description: "页码" }],
        body: null,
      },
      responseInfo: { schema: null, examples: [] },
    };

    const config = convertToOperationConfig(parseResult);
    const queryInput = config.inputs.find((i) => i.name === "Query");
    expect(queryInput).toBeDefined();
    expect(queryInput.childList[0].paramType).toBe("Number");
  });

  test("转换带响应 Schema 的配置", () => {
    const parseResult = {
      basicInfo: { title: "API" },
      serverInfo: { path: "/api", method: "GET" },
      authInfo: {},
      requestInfo: { headers: [], query: [], body: null },
      responseInfo: {
        schema: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "string", description: "数据" },
          },
        },
        examples: [],
      },
    };

    const config = convertToOperationConfig(parseResult);
    expect(config.outputs).toHaveLength(1);
    expect(config.outputs[0].childList).toHaveLength(2);
    expect(config.responses.type).toBe("object");
  });

  test("转换带请求 Body 的配置", () => {
    const parseResult = {
      basicInfo: { title: "API" },
      serverInfo: { path: "/api", method: "POST" },
      authInfo: {},
      requestInfo: {
        headers: [],
        query: [],
        body: {
          example: { name: "test" },
          schema: {
            type: "object",
            properties: {
              name: { type: "string", description: "名称" },
            },
          },
        },
      },
      responseInfo: { schema: null, examples: [] },
    };

    const config = convertToOperationConfig(parseResult);
    const bodyInput = config.inputs.find((i) => i.name === "Body");
    expect(bodyInput).toBeDefined();
    expect(config.parameters.body).toBeDefined();
  });
});

// ── parseAPIDoc（集成测试）─────────────────────────────────

describe("parseAPIDoc", () => {
  const { parseAPIDoc } = require("../lib/connector/doc-parser");

  test("解析完整的 Markdown API 文档", () => {
    const tmpFile = path.join(os.tmpdir(), `yida-doc-test-${Date.now()}.md`);
    const content = `# 获取用户信息

## 接口说明

获取指定用户的详细信息。

- URL:
  https://api.example.com/v1/users/info
- Method:
  GET

## 响应

\`\`\`json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "张三"
  }
}
\`\`\`
`;
    fs.writeFileSync(tmpFile, content, "utf-8");

    try {
      const result = parseAPIDoc(tmpFile);
      expect(result.basicInfo.title).toBe("获取用户信息");
      expect(result.serverInfo.host).toBe("api.example.com");
      expect(result.serverInfo.method).toBe("GET");
      expect(result.responseInfo.schema).toBeDefined();
      expect(result.responseInfo.examples).toHaveLength(1);
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });

  test("文件不存在时抛出错误", () => {
    expect(() => parseAPIDoc("/nonexistent/file.md")).toThrow("解析文档失败");
  });
});
