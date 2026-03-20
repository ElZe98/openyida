# OpenYida — Claude Code 开发指引

> 本文件专为 Claude Code 优化，提供快速上手所需的关键信息。
> 更完整的项目上下文请参考 [AGENTS.md](./AGENTS.md)。

## 快速上手

```bash
npm install          # 安装依赖
npm link             # 全局链接，本地调试用
npm test             # 运行测试
node --check lib/xxx.js  # 语法检查
```

## 核心文件速查

| 文件 | 用途 |
|------|------|
| `bin/yida.js` | CLI 入口，所有命令在此注册 |
| `lib/env.js` | AI 工具环境检测 |
| `lib/login.js` | 宜搭登录 + Cookie 缓存 |
| `lib/utils.js` | 公共工具函数 |
| `project/config.json` | 应用配置（appType、pageId） |
| `yida-skills/SKILL.md` | AI 技能入口文档 |

## 关键约定

- 模块系统：**CommonJS**（`require` / `module.exports`），不使用 ESM
- Node.js 原生 API 优先，尽量不引入新依赖
- 错误处理：`console.error()` + `process.exit(1)`
- 新增命令需同步更新 `README.md` 的命令一览表

## 禁止事项

- 不要在代码中硬编码任何 Cookie、Token 或凭证
- 不要修改 `yida-skills/` 文档（除非明确要求更新技能）
- 不要引入需要编译的依赖（项目是纯 JS，无构建步骤）
- 不要直接推送 main 分支
