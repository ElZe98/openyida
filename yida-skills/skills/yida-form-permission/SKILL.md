---
name: yida-form-permission
description: 宜搭表单权限配置技能，支持查询权限组、新增权限组、更新数据权限/操作权限/成员配置。
license: MIT
compatibility:
- opencode
- claude-code
metadata:
  audience: developers
  workflow: yida-development
  version: 2.0.0
  tags:
  - yida
  - low-code
  - permission
  - form-permission
---

# 宜搭表单权限配置技能

## 概述

本技能提供宜搭表单的权限组管理功能，支持查询、新增权限组，以及配置三种维度的权限：

| 权限维度 | 说明 |
|---------|------|
| **成员（roleData）** | 控制哪些人属于该权限组：全部人员、管理员、指定人员（钉钉 userId） |
| **数据权限（dataPermit）** | 控制该权限组可访问的数据范围：全部数据、本人数据、本部门数据等 |
| **操作权限（operatePermit）** | 控制该权限组对表单的操作能力：查看、编辑、删除、导出等 |

> ⚠️ **当前限制**：
> - **字段权限**：暂不支持自定义字段权限配置，如需配置请通过宜搭管理后台手动操作
> - **数据范围**：暂不支持「自定义部门」（`CUSTOM_DEPARTMENT`）和「自定义过滤条件」（`FORMULA`/`CUSTOM`）

## 何时使用

当以下场景发生时使用此技能：

- 用户需要查看当前表单的权限组配置
- 用户需要新增一个权限组（指定名称、成员、数据范围、操作权限）
- 用户需要修改已有权限组的数据权限（如改为只能看本部门数据）
- 用户需要修改已有权限组的操作权限（如只保留查看和编辑）
- 用户需要修改已有权限组的成员（如指定某几个人）

## 命令说明

### 1. get-permission — 查询权限组列表

```bash
openyida get-permission <appType> <formUuid>
```

**输出示例**：

```json
{
  "success": true,
  "totalPackages": 2,
  "permissions": [
    {
      "packageUuid": "GOE66B91TJ24Y1E3JB3O4CSI3IRF31GNMOVMMUOQ",
      "packageName": "全部成员可管理本人提交的数据",
      "roleMembers": [
        { "roleType": "DEFAULT", "label": "默认" },
        { "roleType": "PERSONS", "label": "人员", "roleValue": [{ "key": "54255850977641", "label": "晓浮" }] }
      ],
      "dataPermit": { "rule": [{ "type": "ORIGINATOR_DEPARTMENT", "value": "y" }] },
      "operatePermit": { "OPERATE_VIEW": "y", "OPERATE_EDIT": "y" }
    }
  ]
}
```

---

### 2. save-permission — 保存权限配置（更新已有权限组）

```bash
openyida save-permission <appType> <formUuid> [参数...]
```

**参数说明**：

| 参数 | 必填 | 说明 |
|------|------|------|
| `--data-permission <json>` | 否 | 修改数据权限范围 |
| `--action-permission <json>` | 否 | 修改操作权限（完全替换，只保留 true 的项） |
| `--members <userIds>` | 否 | 修改成员，多个 userId 逗号分隔 |

**`--data-permission` 格式**：

```json
{ "role": "DEFAULT", "dataRange": "ORIGINATOR_DEPARTMENT" }
```

`dataRange` 可选值：

| 值 | 说明 |
|---|------|
| `ALL` | 全部数据 |
| `SELF` / `ORIGINATOR` | 本人提交的数据 |
| `DEPARTMENT` / `ORIGINATOR_DEPARTMENT` | 本部门提交的数据 |
| `SAME_LEVEL_DEPARTMENT` | 同级部门提交的数据 |
| `SUBORDINATE_DEPARTMENT` | 下级部门提交的数据 |

**`--action-permission` 格式**：

```json
{
  "role": "DEFAULT",
  "operations": {
    "OPERATE_VIEW": true,
    "OPERATE_EDIT": true,
    "OPERATE_DELETE": false
  }
}
```

> ⚠️ 操作权限为**完全替换**：只有值为 `true` 的项才会保留，其余全部清除。

支持的操作权限 key：`OPERATE_VIEW`、`OPERATE_EDIT`、`OPERATE_DELETE`、`OPERATE_HISTORY`、`OPERATE_COMMENT`、`OPERATE_PRINT`、`OPERATE_CREATE`、`OPERATE_BATCH_EDIT`、`OPERATE_BATCH_EXPORT`、`OPERATE_BATCH_IMPORT`、`OPERATE_BATCH_DELETE`、`OPERATE_BATCH_PRINT`、`OPERATE_BATCH_DOWNLOAD`、`OPERATE_BATCH_DOWNLOAD_QRCODE`

**`--members` 格式**：

```bash
--members "54255850977641,12345678901234"
```

> 钉钉 userId 为纯数字 ID。不传则保持原有成员配置不变。

**示例**：

```bash
# 修改全部成员组的数据权限为本部门数据
openyida save-permission APP_XXX FORM-XXX --data-permission '{"role":"DEFAULT","dataRange":"ORIGINATOR_DEPARTMENT"}'

# 修改全部成员组的操作权限为只能查看和编辑
openyida save-permission APP_XXX FORM-XXX --action-permission '{"role":"DEFAULT","operations":{"OPERATE_VIEW":true,"OPERATE_EDIT":true}}'

# 同时修改数据权限和成员
openyida save-permission APP_XXX FORM-XXX \
  --members "54255850977641,12345678901234" \
  --data-permission '{"role":"DEFAULT","dataRange":"ORIGINATOR_DEPARTMENT"}'
```

---

### 3. save-permission --create — 新增权限组

```bash
openyida save-permission <appType> <formUuid> --create --name <权限组名称> [参数...]
```

**参数说明**：

| 参数 | 必填 | 说明 |
|------|------|------|
| `--create` | 是 | 新增模式标志 |
| `--name <名称>` | 是 | 权限组名称 |
| `--members <userIds>` | 否 | 指定成员（钉钉 userId，逗号分隔）；不传则仅包含管理员 |
| `--data-permission <json>` | 否 | 数据权限（不含 `role` 字段）；默认为全部数据（`ALL`） |
| `--action-permission <json>` | 否 | 操作权限（不含 `role` 字段）；默认仅查看 |

**示例**：

```bash
# 新增一个只有晓浮和天晟可以查看本部门数据的权限组
openyida save-permission APP_XXX FORM-XXX \
  --create --name "部门数据查看组" \
  --members "54255850977641,天晟userId" \
  --data-permission '{"dataRange":"ORIGINATOR_DEPARTMENT"}' \
  --action-permission '{"operations":{"OPERATE_VIEW":true}}'
```

**输出示例**：

```json
{
  "success": true,
  "packageUuid": "4N966P61E924CHPPO4CAC4PB6B132QXO0AXMMFC",
  "summary": {
    "name": "部门数据查看组",
    "dataPermission": "数据范围: ORIGINATOR_DEPARTMENT",
    "actionPermission": "操作权限: OPERATE_VIEW",
    "members": "成员: 54255850977641,天晟userId"
  },
  "message": "权限组已新增"
}
```

---

## 接口说明

| 接口 | 方法 | 路径 |
|------|------|------|
| 查询权限组列表 | GET | `/{appType}/permission/manage/listPermitPackages.json` |
| 新增/更新权限组 | POST | `/{appType}/permission/manage/saveOrUpdatePermit.json` |

> 新增与更新使用同一个接口，区别是新增时**不传 `packageUuid`**，服务端返回新生成的 UUID。

## 与其他技能配合

- **创建表单** → 使用 `yida-create-form-page` 技能
- **获取表单 Schema** → 使用 `yida-get-schema` 技能（获取 fieldId）
- **页面配置** → 使用 `yida-page-config` 技能
