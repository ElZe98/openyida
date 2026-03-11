# 通过 Claude Code 等 AI 工具 + 宜搭快速生成应用

> 非常稳定、支持数据存储、生成后可二次加工 🚀

## 简介

本项目演示如何借助 **Claude Code** 等 AI coding 工具，通过自然语言描述，全自动完成宜搭应用的创建、页面开发与发布部署，整个过程无需手动操作宜搭平台。

## 环境依赖

| 依赖 | 版本要求 | 用途 |
| --- | --- | --- |
| Node.js | 20+ | JSX 编译 & 发布脚本 |
| Python | 3.12+ | 登录态管理（Playwright） |
| playwright | 最新版 | 扫码登录 & Cookie 持久化 |

```bash
# 安装 Python 依赖
pip install playwright && playwright install chromium

# 安装 Node 依赖
cd .claude/skills/yida-publish/scripts && npm install
```

## 快速开始

只需一句话，即可让 AI 全自动完成应用搭建：

```
帮我创建一个个人薪资计算器应用
```

AI 会自动执行以下流程：

```
创建应用 → 检查登录态 → 创建页面 → 分析需求 → 编写代码 → 发布部署
```

**集团宜搭需要去 config.json 中更改对应的访问域名**： `https://yida-group.alibaba-inc.com`

---

## DEMO 展示

### 💰 小工具 - 个人薪资计算器

- 🔗 [在线体验](https://ding.aliwork.com/APP_ICUBVUPDEJ3MIFJ0701X/custom/FORM-5776BEF941604870A814608C4CE0D23C146W?isRenderNav=false&corpid=ding9a0954b4f9d9d40ef5bf40eda33b7ba0)

![薪资计算器](https://gw.alicdn.com/imgextra/i2/O1CN017TeJuE1reVH2Dj7b7_!!6000000005656-2-tps-5114-2468.png)

---

### 🌐  Landing Page - 智联协同

企业级产品介绍页，一句话生成完整 Landing Page。

- 🔗 [在线体验](https://ding.aliwork.com/s/63E1E?isRenderNav=false&corpid=ding8196cd9a2b2405da24f2f5cc6abecb85&ddtab=true)

![智联协同](https://gw.alicdn.com/imgextra/i1/O1CN01EZtvfs1cxXV00UaXi_!!6000000003667-2-tps-5118-2470.png)

---

### 🏮 运营场景 - 看图猜灯谜

AI 生成灯谜图片，用户猜答案，猜错了有 AI 幽默提示。

- **亮点**：宜搭 × DEAP 打通，调用宜搭表单 API 触发后端自动生成 AI 图片
- 🔗 [在线体验](https://ding.aliwork.com/s/93ED6?isRenderNav=false&corpid=ding8196cd9a2b2405da24f2f5cc6abecb85)

![看图猜灯谜-2](https://img.alicdn.com/imgextra/i3/O1CN01dCoscP25jSAtAB9o3_!!6000000007562-2-tps-2144-1156.png)

---

### 🎂 组织关怀 - 生日祝福小游戏

点击蜡烛将其吹灭，许下心愿，送出专属生日祝福卡片。

- **玩法**：输入寿星姓名 → 15 秒内点击吹灭所有蜡烛 → 写下祝福语 → 彩带飘落庆祝
- 🔗 [在线体验](https://ding.aliwork.com/s/0D49?corpid=ding8196cd9a2b2405da24f2f5cc6abecb85&isRenderNav=false)

---

## Yida-AI-Skill 技能包

本项目沉淀了一套完整的宜搭开发技能包，配合本地 AI Coding 工具后即可全自动驱动：

| 技能 | 说明 |
| --- | --- |
| **`yida-app`** | 完整应用开发流程编排（总入口） |
| **`yida-login`** | 登录态管理（Cookie 持久化 + 扫码登录） |
| **`yida-logout`** | 退出登录，清空 Cookie 缓存 |
| **`yida-create-app`** | 创建宜搭应用，获取 appType |
| **`yida-create-page`** | 创建自定义展示页面，获取 pageId |
| **`yida-create-form-page`** | 创建表单页面，支持 18 种字段类型 |
| **`yida-custom-page`** | 自定义页面 JSX 开发规范与 API 参考 |
| **`yida-publish`** | 编译 JSX 源码并发布到宜搭平台 |
| **`get-schema`** | 获取已有表单的完整 Schema 结构 |

### 技能协作流程

```
yida-app（总编排）
  ├── yida-login ─────── 登录态检查 & 扫码登录
  ├── yida-create-app ── 创建应用 → appType
  ├── yida-create-page ─ 创建页面 → formUuid
  ├── yida-custom-page ─ JSX 开发规范 & API
  └── yida-publish ───── Babel 编译 → Schema 构建 → 接口发布
```

---

## 项目结构

```
yida-ai-page/
├── src/                                 # 页面源码
│   ├── salary-calculator.js             # 💰 个人薪资计算器
│   ├── salary-calculator.compile.js     #    └─ 编译产物
│   ├── demo.js                          # 🏮 看图猜灯谜
│   ├── demo.compile.js                  #    └─ 编译产物
│   ├── birthday-game.js                 # 🎂 生日祝福小游戏
│   └── birthday-game.compile.js         #    └─ 编译产物
├── RD/                                  # 需求文档
│   ├── salary-calculator.md             # 💰 薪资计算器 需求 & 配置
│   ├── birthday-game.md                 # 🎂 生日游戏 需求 & 配置
│   └── GLR.md                           # 🏮 猜灯谜 需求 & 配置
└── .claude/skills/                      # Yida-AI-Skill 技能包
    ├── yida-app/                        #   完整流程编排
    ├── yida-login/                      #   登录态管理
    ├── yida-logout/                     #   退出登录
    ├── yida-create-app/                 #   创建应用
    ├── yida-create-page/                #   创建自定义页面
    ├── yida-create-form-page/           #   创建表单页面
    ├── yida-custom-page/                #   JSX 开发规范
    ├── yida-publish/                    #   编译发布
    └── get-schema/                      #   获取表单 Schema
```

