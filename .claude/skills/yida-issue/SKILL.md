---
name: yida-issue
description: 一句话给 OpenYida 提需求，自动判断路由到 openyida/openyida 还是 openyida/yida-skills，并创建格式规范的 GitHub Issue。
license: MIT
compatibility:
  - opencode
  - claude-code
metadata:
  audience: developers
  workflow: yida-contribute
  version: 1.0.0
  tags:
    - yida
    - issue
    - github
    - contribute
---

# 一句话提需求技能

## 概述

本技能让你用一句自然语言描述需求，自动判断应该提到哪个仓库，并创建格式规范的 GitHub Issue。

- **openyida/openyida**：CLI 工具、CI/CD、安装脚本、贡献者管理等平台级功能
- **openyida/yida-skills**：宜搭操作能力（登录、创建应用/页面/表单、发布、获取 Schema 等）

## 何时使用

当以下场景发生时使用此技能：
- 用户想给 OpenYida 提一个新功能需求
- 用户发现了一个 bug 想要上报
- 用户不确定需求应该提到哪个仓库

## 使用示例

### 示例 1：宜搭操作类需求
**场景**：用户想要支持批量导出表单数据
**命令**：
```bash
node .claude/skills/yida-issue/scripts/create-issue.js "希望支持批量导出表单数据到 Excel"
```
**输出**：
```
🔍 分析需求...
📦 目标仓库：openyida/yida-skills（宜搭操作能力）
✅ Issue 创建成功：https://github.com/openyida/yida-skills/issues/xxx
```

### 示例 2：平台工具类需求
**场景**：用户想给 CLI 新增 list 命令
**命令**：
```bash
node .claude/skills/yida-issue/scripts/create-issue.js "希望 yida CLI 支持 list 命令列出所有应用"
```
**输出**：
```
🔍 分析需求...
📦 目标仓库：openyida/openyida（平台工具）
✅ Issue 创建成功：https://github.com/openyida/openyida/issues/xxx
```

### 示例 3：指定仓库
**场景**：用户明确指定提到某个仓库
**命令**：
```bash
node .claude/skills/yida-issue/scripts/create-issue.js "登录态失效时自动重新登录" --repo yida-skills
node .claude/skills/yida-issue/scripts/create-issue.js "CLI 新增 yida list 命令" --repo openyida
```

### 示例 4：Bug 上报
**场景**：用户发现了一个 bug
**命令**：
```bash
node .claude/skills/yida-issue/scripts/create-issue.js "bug: 创建应用时图标颜色不生效"
```

## 使用方式

```bash
node .claude/skills/yida-issue/scripts/create-issue.js <需求描述> [--repo openyida|yida-skills] [--type feature|bug]
```

**参数说明**：

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `需求描述` | 是 | 自然语言描述的需求或 bug |
| `--repo` | 否 | 强制指定仓库：`openyida` 或 `yida-skills` |
| `--type` | 否 | Issue 类型：`feature`（默认）或 `bug` |
| `--dry-run` | 否 | 仅预览，不实际创建 Issue |

## 路由规则

脚本通过关键词匹配自动判断目标仓库：

### → openyida/openyida（平台工具）
CLI、命令行、install、安装、workflow、CI、CD、贡献者、contributor、README、文档、package、npm、发布工具、版本管理

### → openyida/yida-skills（宜搭操作能力）
登录、登出、login、logout、创建应用、创建页面、创建表单、发布页面、publish、schema、宜搭 API、skill、表单、应用、页面、cookie、token

> 当关键词无法明确判断时，脚本会提示用户手动选择仓库。

## 前置依赖

- Node.js ≥ 16
- GitHub CLI（`gh`）已安装并已登录（`gh auth login`）

## 文件结构

```
yida-issue/
├── SKILL.md                  # 本文档
└── scripts/
    └── create-issue.js       # Issue 创建脚本
```

## 与其他技能配合

本技能是贡献流程的入口，提完 Issue 后可以：
1. 认领 Issue，开始开发
2. 参考 `yida-skills` 中的其他技能实现相关功能
3. 提交 PR 关联 Issue
