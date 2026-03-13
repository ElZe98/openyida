# 宜搭 AI 应用开发指南

本项目通过 AI Coding 工具（Claude/Open Code 等）+ 宜搭低代码平台，实现一句话生成完整应用。

---

## 项目结构

```
项目根目录/
├── CLAUDE.md                    # 本文档
├── README_zh.md                 # 项目说明
├── config.json                  # 全局配置（loginUrl、defaultBaseUrl）
├── .cache/
│   ├── cookies.json             # 登录态缓存（运行时自动生成）
│   └── <项目名>-schema.json     # 表单 Schema ID 缓存（运行时生成）
├── pages/
│   ├── src/<项目名>.js          # 自定义页面 JSX 源码
│   └── dist/<项目名>.js         # 编译后产物（自动生成）
├── prd/
│   └── <项目名>.md              # 需求文档（含应用配置、字段设计）
└── .claude/
    └── skills/                  # AI 技能目录（通过 install-skills.sh 安装，来源：openyida/yida-skills）
```

---

## 环境依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| Node.js | ≥ 16 | 页面编译与发布脚本 |
| Python | ≥ 3.8 | 登录态管理 |
| Playwright | latest | 浏览器自动化（扫码登录） |

```bash
# 安装 Python 依赖
pip install playwright && playwright install chromium

# 安装 Node 依赖（首次发布前执行）
cd .claude/skills/skills/yida-publish-page/scripts && npm install
```

---

## 完整开发流程

```
创建应用（yida-create-app）
    ↓
需求分析 → 写入 prd/<项目名>.md
    ↓
创建自定义页面（yida-create-page）
    ↓
（按需）创建表单（yida-create-form-page）→ 更新 prd 文档 + .cache/schema.json
    ↓
编写自定义页面代码（yida-custom-page 规范）→ pages/src/<项目名>.js
    ↓
发布代码（yida-publish-page）
    ↓
输出访问链接并用系统浏览器打开
```

> **登录态说明**：所有脚本自动读取 `.cache/cookies.json`，首次运行或 Cookie 失效时自动弹出浏览器引导扫码登录，无需手动执行登录命令。

---

## 技能（Skills）速查

| 技能 | 调用命令 | 用途 |
|------|---------|------|
| `yida-login` | `python3 .claude/skills/skills/yida-login/scripts/login.py` | 登录态管理（通常自动触发） |
| `yida-logout` | `echo -n "" > .cache/cookies.json` | 退出登录 / 切换账号 |
| `yida-create-app` | `node .claude/skills/skills/yida-create-app/scripts/create-app.js "<名称>"` | 创建应用，获取 appType |
| `yida-create-page` | `node .claude/skills/skills/yida-create-page/scripts/create-page.js <appType> "<页面名>"` | 创建自定义页面，获取 pageId |
| `yida-create-form-page` | `node .claude/skills/skills/yida-create-form-page/scripts/create-form-page.js create <appType> "<表单名>" <字段JSON>` | 创建/更新表单页面 |
| `yida-get-schema` | `node .claude/skills/skills/yida-get-schema/scripts/get-schema.js <appType> <formUuid>` | 获取表单 Schema，确认字段 ID |
| `yida-custom-page` | 详见 `.claude/skills/skills/yida-custom-page/SKILL.md` | 编写自定义页面 JSX 代码（React 16 规范、状态管理、27 个 API） |
| `yida-publish-page` | `node .claude/skills/skills/yida-publish-page/scripts/publish.js <appType> <formUuid> <源文件路径>` | 编译并发布自定义页面 |

---

## 关键规则

### corpId 一致性检查（必须遵守）

在创建页面前，**必须对比 prd 文档中的 corpId 与 `.cache/cookies.json` 中的 corpId 是否一致**：

- **一致** → 继续执行
- **不一致** → 询问用户：重新登录到正确组织，还是在当前组织新建应用？

### 配置信息分两处存储

| 信息类型 | 存储位置 | 内容示例 |
|---------|---------|---------|
| 业务语义信息 | `prd/<项目名>.md` | 字段名称、字段类型、字段说明 |
| Schema ID | `.cache/<项目名>-schema.json` | `appType`、`formUuid`、`fieldId` |

> **prd 文档不记录 `formUuid`、`fieldId` 等 ID**，这些写入 `.cache/` 临时文件。

### 临时文件规范

所有临时文件（cookies、schema 缓存等）**必须写在项目根目录的 `.cache/` 文件夹中**，不要写在系统其他位置。

---

---

## 表单字段类型速查

| 类型 | 说明 | 特殊属性 |
|------|------|---------|
| `TextField` | 单行文本 | — |
| `TextareaField` | 多行文本 | — |
| `NumberField` | 数字 | `precision`（小数位）、`innerAfter`（单位） |
| `RadioField` | 单选 | `options` |
| `CheckboxField` | 多选 | `options` |
| `SelectField` | 下拉单选 | `options` |
| `MultiSelectField` | 下拉多选 | `options` |
| `DateField` | 日期 | `format`（如 `"YYYY-MM-DD"`） |
| `CascadeDateField` | 级联日期（范围） | `format` |
| `EmployeeField` | 成员选择 | `multiple` |
| `DepartmentSelectField` | 部门选择 | `multiple` |
| `AddressField` | 地址 | — |
| `AttachmentField` | 附件上传 | — |
| `ImageField` | 图片上传 | — |
| `TableField` | 子表格 | `children`（子字段列表） |
| `AssociationFormField` | 关联表单 | `associationForm` |
| `SerialNumberField` | 流水号 | `serialNumberRule` |
| `RateField` | 评分 | `count`（星级数） |
| `CountrySelectField` | 国家选择 | `multiple` |

---

## 宜搭应用 URL 规则

| 页面类型 | URL 格式 |
|---------|---------|
| 应用首页 | `{base_url}/{appType}/workbench` |
| 表单提交页 | `{base_url}/{appType}/submission/{formUuid}` |
| 自定义页面 | `{base_url}/{appType}/custom/{formUuid}` |
| 自定义页面（隐藏导航） | `{base_url}/{appType}/custom/{formUuid}?isRenderNav=false` |
| 表单详情页 | `{base_url}/{appType}/formDetail/{formUuid}?formInstId={formInstId}` |
| 表单详情页（编辑模式） | `{base_url}/{appType}/formDetail/{formUuid}?formInstId={formInstId}&mode=edit` |

> 所有地址拼接 `&corpid={corpId}` 可自动切换到对应组织。

---

## 常见问题

**Q：发布时提示登录失效？**
```bash
echo -n "" > .cache/cookies.json
node .claude/skills/skills/yida-publish-page/scripts/publish.js <appType> <formUuid> <源文件路径>
```

**Q：如何查看已有表单的字段 ID？**
使用 `yida-get-schema` 技能获取表单 Schema，从中读取各字段的 `fieldId`。

**Q：如何更新已有表单字段？**
使用 `yida-create-form-page` 的 update 模式：
```bash
node .claude/skills/skills/yida-create-form-page/scripts/create-form-page.js update <appType> <formUuid> '[{"action":"add","field":{"type":"TextField","label":"新字段"}}]'
```

**Q：发布时提示 corpId 不匹配？**
询问用户是否在当前组织创建新应用发布。
