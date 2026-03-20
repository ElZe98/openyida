# OpenYida — AI Agent 开发指引

本文件为 AI 编程助手（Claude Code、Aone Copilot、Cursor、OpenCode 等）提供项目上下文，帮助 AI 更准确地理解项目结构和开发规范。

## 项目简介

OpenYida 是一个 CLI 工具，让开发者通过 AI 对话驱动宜搭低代码平台，实现应用的创建、表单管理、页面发布等全流程操作。

**核心定位**：AI 编程工具 × 宜搭低代码平台 的桥接层。

## 项目结构

```
openyida/
├── bin/
│   └── yida.js              # CLI 入口，解析命令并路由到 lib/
├── lib/
│   ├── env.js               # 检测 AI 工具环境（Claude/Cursor/Copilot 等）
│   ├── login.js             # 宜搭登录（扫码 + Cookie 缓存）
│   ├── logout.js            # 退出登录
│   ├── copy.js              # 初始化工作目录
│   ├── create-app.js        # 创建宜搭应用
│   ├── create-page.js       # 创建自定义展示页面
│   ├── create-form.js       # 创建 / 更新表单页面
│   ├── get-schema.js        # 获取表单 Schema
│   ├── publish.js           # 编译并发布自定义页面（Babel 转译）
│   ├── verify-short-url.js  # 验证短链接 URL
│   ├── save-share-config.js # 保存公开访问 / 分享配置
│   ├── get-page-config.js   # 查询页面公开访问 / 分享配置
│   ├── update-form-config.js# 更新表单配置
│   ├── export-app.js        # 导出应用
│   ├── import-app.js        # 导入应用
│   ├── check-update.js      # 版本检测（每天一次）
│   ├── babel-transform/     # Babel 编译器（用于自定义页面）
│   ├── i18n.js              # 国际化支持
│   ├── locales/             # 语言包
│   └── utils.js             # 公共工具函数
├── project/
│   ├── config.json          # 应用配置（appType、pageId 等）
│   └── pages/               # 自定义页面源码目录
├── yida-skills/
│   ├── SKILL.md             # 技能入口（AI 工具读取此文件获取能力描述）
│   ├── skills/              # 子技能目录
│   └── reference/           # 宜搭 API 参考文档
└── scripts/
    └── postinstall.js       # 安装后脚本（环境检测 + 配置注入）
```

## 关键约定

### 命令实现规范
- 每个 CLI 命令对应 `lib/` 下一个独立的 `.js` 文件
- 所有命令通过 `bin/yida.js` 统一路由，新增命令需在此注册
- 命令函数导出为 `module.exports = async function commandName(args) {}`
- 错误处理：使用 `process.exit(1)` 退出，错误信息输出到 `stderr`

### 宜搭 API 调用
- 所有宜搭 API 调用需携带 Cookie（从 `login.js` 获取缓存）
- API 基础路径：`https://www.aliwork.com`
- 参考 `yida-skills/reference/yida-api.md` 了解完整 API 列表

### 环境检测
- `lib/env.js` 负责检测当前运行的 AI 工具环境
- 支持环境：Claude Code、Aone Copilot、Cursor、OpenCode、Qoder、悟空
- 不同环境的 Cookie 提取方式不同（CDP 协议 / 文件读取 / 扫码）

### 自定义页面
- 源码位于 `project/pages/src/`，使用 React + 宜搭 SDK
- 发布前通过 `lib/babel-transform/` 进行 Babel 编译
- 编译产物输出到 `project/pages/dist/`

## 开发注意事项

1. **不要修改 `yida-skills/` 下的文档**，除非是在更新技能描述
2. **新增 CLI 命令**时，同步更新 `README.md` 的命令一览表
3. **登录态**存储在本地缓存，不要在代码中硬编码任何凭证
4. **测试**：运行 `npm test` 执行 `tests/` 下的单元测试
5. **JS 语法检查**：`node --check <file>` 验证语法正确性

## 常见任务示例

### 添加新 CLI 命令
1. 在 `lib/` 下创建 `new-command.js`
2. 在 `bin/yida.js` 中注册命令路由
3. 在 `README.md` 的 CLI 命令一览表中添加说明
4. 在 `yida-skills/SKILL.md` 中更新技能描述

### 调试登录问题
- 检查 `lib/login.js` 中的 Cookie 缓存逻辑
- 使用 `openyida env` 确认当前环境检测是否正确
- 悟空环境使用 CDP 协议，其他环境使用扫码登录
