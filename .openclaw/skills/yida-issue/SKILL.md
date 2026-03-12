---
name: yida-issue
description: 一句话给 OpenYida 提需求，自动判断路由到 openyida/openyida 还是 openyida/yida-skills，并创建格式规范的 GitHub Issue。触发词：给 OpenYida 提需求、提个 issue、报个 bug、希望支持 xxx、建议 xxx。
---

# 一句话提需求

用自然语言描述需求，自动路由到正确仓库并创建 GitHub Issue。

## 路由规则

| 关键词/场景 | 目标仓库 |
|---|---|
| CLI、命令行、安装、CI/CD、贡献者、npm | `openyida/openyida` |
| 登录、创建应用/页面/表单、发布、Schema、宜搭 API | `openyida/yida-skills` |
| 无法判断 | 提示用户手动指定 `--repo` |

## 使用方式

```bash
node scripts/create-issue.js "<需求描述>" [--repo openyida|yida-skills] [--type feature|bug] [--dry-run]
```

## 前置依赖

- Node.js ≥ 16
- GitHub CLI（`gh`）已安装并已登录（`gh auth login`）
