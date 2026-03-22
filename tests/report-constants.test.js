"use strict";

const {
  CHART_COMPONENT_MAP,
  randomId,
  genNodeId,
  genFieldAlias,
  genFieldId,
  inferDataType,
  deriveFilterFieldCode,
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

// ── inferDataType ───────────────────────────────────────────

describe("inferDataType", () => {
  test("EmployeeField 推断为 ARRAY", () => {
    expect(inferDataType("EmployeeField")).toBe("ARRAY");
  });

  test("DepartmentSelectField 推断为 ARRAY", () => {
    expect(inferDataType("DepartmentSelectField")).toBe("ARRAY");
  });

  test("MultiSelectField 推断为 ARRAY", () => {
    expect(inferDataType("MultiSelectField")).toBe("ARRAY");
  });

  test("CheckboxField 推断为 ARRAY", () => {
    expect(inferDataType("CheckboxField")).toBe("ARRAY");
  });

  test("DateField 推断为 DATE", () => {
    expect(inferDataType("DateField")).toBe("DATE");
  });

  test("CascadeDateField 推断为 DATE", () => {
    expect(inferDataType("CascadeDateField")).toBe("DATE");
  });

  test("NumberField 推断为 DOUBLE", () => {
    expect(inferDataType("NumberField")).toBe("DOUBLE");
  });

  test("RateField 推断为 DOUBLE", () => {
    expect(inferDataType("RateField")).toBe("DOUBLE");
  });

  test("TextField 推断为 STRING", () => {
    expect(inferDataType("TextField")).toBe("STRING");
  });

  test("TextareaField 推断为 STRING", () => {
    expect(inferDataType("TextareaField")).toBe("STRING");
  });

  test("SelectField 推断为 STRING", () => {
    expect(inferDataType("SelectField")).toBe("STRING");
  });

  test("RadioField 推断为 STRING", () => {
    expect(inferDataType("RadioField")).toBe("STRING");
  });

  test("未知类型默认返回 STRING", () => {
    expect(inferDataType("UnknownField")).toBe("STRING");
  });

  test("显式指定 dataType 时优先使用", () => {
    expect(inferDataType("TextField", "NUMBER")).toBe("NUMBER");
    expect(inferDataType("NumberField", "STRING")).toBe("STRING");
  });
});

// ── deriveFilterFieldCode ──────────────────────────────────

describe("deriveFilterFieldCode", () => {
  test("selectField_xxx 自动添加 _value 后缀", () => {
    expect(deriveFilterFieldCode("selectField_abc123")).toBe("selectField_abc123_value");
  });

  test("multiSelectField_xxx 自动添加 _value 后缀", () => {
    expect(deriveFilterFieldCode("multiSelectField_xyz")).toBe("multiSelectField_xyz_value");
  });

  test("radioField_xxx 自动添加 _value 后缀", () => {
    expect(deriveFilterFieldCode("radioField_test")).toBe("radioField_test_value");
  });

  test("checkboxField_xxx 自动添加 _value 后缀", () => {
    expect(deriveFilterFieldCode("checkboxField_opt")).toBe("checkboxField_opt_value");
  });

  test("employeeField_xxx 自动添加 _value 后缀", () => {
    expect(deriveFilterFieldCode("employeeField_emp")).toBe("employeeField_emp_value");
  });

  test("departmentSelectField_xxx 自动添加 _value 后缀", () => {
    expect(deriveFilterFieldCode("departmentSelectField_dept")).toBe("departmentSelectField_dept_value");
  });

  test("textField_xxx 不添加后缀", () => {
    expect(deriveFilterFieldCode("textField_text")).toBe("textField_text");
  });

  test("numberField_xxx 不添加后缀", () => {
    expect(deriveFilterFieldCode("numberField_num")).toBe("numberField_num");
  });

  test("未知类型无后缀", () => {
    expect(deriveFilterFieldCode("unknownField_xxx")).toBe("unknownField_xxx");
  });

  test("显式传入 SelectField 类型时添加后缀", () => {
    expect(deriveFilterFieldCode("anyField_xxx", "SelectField")).toBe("anyField_xxx_value");
  });

  test("显式传入 TextField 类型时不添加后缀", () => {
    expect(deriveFilterFieldCode("anyField_xxx", "TextField")).toBe("anyField_xxx");
  });

  test("显式传入 MultiSelectField 类型时添加后缀", () => {
    expect(deriveFilterFieldCode("anyField_xxx", "MultiSelectField")).toBe("anyField_xxx_value");
  });
});
