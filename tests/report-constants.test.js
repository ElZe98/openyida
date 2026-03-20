"use strict";

const {
  CHART_COMPONENT_MAP,
  randomId,
  genNodeId,
  genFieldAlias,
  genFieldId,
} = require("../lib/report/constants");

// ── CHART_COMPONENT_MAP ───────────────────────────────────

describe("CHART_COMPONENT_MAP", () => {
  test("包含所有支持的图表类型", () => {
    const expectedTypes = ["bar", "line", "pie", "funnel", "gauge", "combo", "table", "indicator", "pivot"];
    for (const chartType of expectedTypes) {
      expect(CHART_COMPONENT_MAP[chartType]).toBeDefined();
    }
  });

  test("映射值以 Youshu 开头", () => {
    for (const [, componentName] of Object.entries(CHART_COMPONENT_MAP)) {
      expect(componentName).toMatch(/^Youshu/);
    }
  });

  test("bar 映射到 YoushuGroupedBarChart", () => {
    expect(CHART_COMPONENT_MAP.bar).toBe("YoushuGroupedBarChart");
  });

  test("line 映射到 YoushuLineChart", () => {
    expect(CHART_COMPONENT_MAP.line).toBe("YoushuLineChart");
  });

  test("pie 映射到 YoushuPieChart", () => {
    expect(CHART_COMPONENT_MAP.pie).toBe("YoushuPieChart");
  });

  test("table 映射到 YoushuTable", () => {
    expect(CHART_COMPONENT_MAP.table).toBe("YoushuTable");
  });
});

// ── randomId ──────────────────────────────────────────────

describe("randomId", () => {
  test("生成 8 位字符串", () => {
    const id = randomId();
    expect(id).toHaveLength(8);
  });

  test("仅包含小写字母和数字", () => {
    for (let i = 0; i < 50; i++) {
      const id = randomId();
      expect(id).toMatch(/^[a-z0-9]{8}$/);
    }
  });

  test("多次调用生成不同的 ID（概率性验证）", () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(randomId());
    }
    expect(ids.size).toBeGreaterThan(90);
  });
});

// ── genNodeId ─────────────────────────────────────────────

describe("genNodeId", () => {
  test("以 node_oc 开头", () => {
    const nodeId = genNodeId();
    expect(nodeId).toMatch(/^node_oc/);
  });

  test("总长度为 node_oc(7) + 12 = 19", () => {
    const nodeId = genNodeId();
    expect(nodeId.length).toBe(7 + 12);
  });

  test("多次调用生成不同的 ID", () => {
    const id1 = genNodeId();
    const id2 = genNodeId();
    expect(id1).not.toBe(id2);
  });
});

// ── genFieldAlias ─────────────────────────────────────────

describe("genFieldAlias", () => {
  test("以 field_ 开头", () => {
    const alias = genFieldAlias();
    expect(alias).toMatch(/^field_/);
  });

  test("总长度为 field_(6) + 8 = 14", () => {
    const alias = genFieldAlias();
    expect(alias.length).toBe(6 + 8);
  });

  test("多次调用生成不同的别名", () => {
    const a1 = genFieldAlias();
    const a2 = genFieldAlias();
    expect(a1).not.toBe(a2);
  });
});

// ── genFieldId ────────────────────────────────────────────

describe("genFieldId", () => {
  test("以组件名开头", () => {
    const fieldId = genFieldId("YoushuPieChart");
    expect(fieldId).toMatch(/^YoushuPieChart_/);
  });

  test("总长度为 组件名 + 1(_) + 8", () => {
    const componentName = "TestComponent";
    const fieldId = genFieldId(componentName);
    expect(fieldId.length).toBe(componentName.length + 1 + 8);
  });

  test("后缀仅包含小写字母和数字", () => {
    const fieldId = genFieldId("Chart");
    const suffix = fieldId.split("_")[1];
    expect(suffix).toMatch(/^[a-z0-9]{8}$/);
  });
});
