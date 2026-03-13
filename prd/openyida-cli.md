# OpenYida CLI - 命令行工具

> 创建时间：2026-03-12

## 需求概述

为 OpenYida 开发命令行工具（CLI），支持在终端中直接使用宜搭功能，类似 OpenClaw 的本地部署体验。开发者可以通过命令行完成应用创建、表单开发、页面发布等操作。

## 背景

OpenClaw 是一个开源的个人 AI 助手，可以通过命令行或消息平台交互。它的核心特点是：
- 本地部署，终端交互
- 无需打开浏览器
- 支持技能（Skills）扩展

当前 OpenYida 主要通过 AI Coding 工具（OpenCode/ClaudeCode）调用 Skills 来操作宜搭，缺乏独立的命令行入口。对于习惯终端操作的开发者不够友好。

## 功能清单

### 1. 核心功能

| 功能 | 说明 | 优先级 |
|------|------|--------|
| 登录 | `yida login` 扫码登录宜搭 | P0 |
| 退出 | `yida logout` 清除登录态 | P0 |
| 创建应用 | `yida create-app <name>` 创建宜搭应用 | P0 |
| 创建页面 | `yida create-page <app> <name>` 创建自定义页面 | P0 |
| 创建表单 | `yida create-form <app> <form> <fields>` 创建表单 | P1 |
| 发布页面 | `yida publish <file>` 编译并发布页面 | P0 |
| 获取 Schema | `yida get-schema <app> <form>` 获取表单结构 | P1 |
| 应用列表 | `yida list` 列出当前账号应用 | P1 |

### 2. 交互式模式

| 功能 | 说明 | 优先级 |
|------|------|--------|
| REPL 模式 | `yida shell` 进入交互式终端 | P2 |
| 提示补全 | 支持命令自动补全 | P2 |
| 历史记录 | 支持上下键查看历史命令 | P2 |

### 3. 配置管理

| 功能 | 说明 | 优先级 |
|------|------|--------|
| 配置查看 | `yida config` 查看当前配置 | P1 |
| 环境切换 | `--env` 切换测试/生产环境 | P2 |
| 多账户 | 支持多账号切换 | P2 |

## 使用示例

### 安装

```bash
npm install -g openyida
# 或
pnpm add -g openyida
```

### 登录

```bash
$ yida login
正在打开浏览器，请扫码登录...
登录成功！已保存登录态
```

### 创建应用

```bash
$ yida create-app "我的测试应用"
✅ 应用创建成功
appType: APP_XXXXXXXXXXXXX
名称: 我的测试应用
```

### 创建表单

```bash
$ yida create-form APP_XXXXXXXXXXXXX "客户信息" \
  --fields "姓名:text, 电话:number, 邮箱:email"
✅ 表单创建成功
formUuid: FORM_XXXXXXXXXXXXX
```

### 发布页面

```bash
$ yida publish ./pages/dist/myapp.js
🔄 正在编译...
🔄 正在上传...
✅ 发布成功
访问链接: https://www.aliwork.com/dingtalk/APP_XXXXXXXXXXXXX/custom/FORM_XXXXXXXXXXXXX
```

### 交互式模式

```bash
$ yida shell
🤖 OpenYida Shell (输入 help 查看命令)

> list
APP_XXXXXXXX 销售管理系统
APP_XXXXXXXX 客户管理

> create-page APP_XXXXXXXX "首页"
✅ 页面创建成功

> publish ./dist/index.js
✅ 发布成功
```

## 命令结构

```
yida [全局选项] <命令> [参数] [选项]

全局选项:
  --env <env>      运行环境 (test/prod)
  --config <path>  配置文件路径
  --verbose        显示详细日志
  --help           显示帮助

命令:
  login             登录宜搭
  logout            退出登录
  create-app        创建应用
  create-page       创建页面
  create-form       创建表单
  publish           发布页面
  get-schema        获取表单 Schema
  list              列出应用/表单
  config            查看/修改配置
  shell             进入交互式模式
  help              显示帮助
```

## 技术方案

### 技术选型

- **CLI 框架**: Commander.js / oclif
- **登录态**: 复用现有 yida-login Skills 的登录逻辑
- **API 调用**: 复用现有 Skills 的接口封装

### 目录结构

```
openyida-cli/
├── bin/
│   └── yida              # 入口文件
├── src/
│   ├── commands/         # 命令实现
│   │   ├── login.ts
│   │   ├── logout.ts
│   │   ├── create-app.ts
│   │   ├── create-page.ts
│   │   ├── publish.ts
│   │   └── ...
│   ├── lib/
│   │   ├── api.ts        # API 封装
│   │   ├── auth.ts       # 登录态管理
│   │   └── config.ts     # 配置管理
│   └── index.ts
├── package.json
└── tsconfig.json
```

### 复用现有能力

CLI 工具将复用 yida-skills 中已实现的：
- 登录逻辑（yida-login）
- API 接口封装
- 发布编译能力（yida-publish-page）

## 交付物

1. **openyida-cli** npm 包
2. 完整命令行工具源码
3. 使用文档

## 备注

- CLI 工具与现有 Skills 解耦，可独立使用
- 登录态存储在 ~/.yida/ 目录
- 支持 Linux、macOS、Windows
