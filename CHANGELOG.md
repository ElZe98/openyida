# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

> **版本规则**：从 v2026.03.19 起，版本号采用日期格式 `vYYYY.MM.DD`，每次发布以当天日期为版本号，Git tag 格式为 `v2026.03.19`，npm 包版本格式为 `2026.03.19`。

## [Unreleased]

## [2026.03.22] - 2026-03-22

### Added
- `yida-report` 技能：支持创建宜搭报表及图表追加
- `yida-chart` 技能：增强 ECharts 图表构建能力，支持多种图表类型
- `yida-ppt-slider` 技能：支持演示文稿幻灯片开发
- `yida-create-report` 技能文档
- `integration create` 子命令：支持创建集成&自动化逻辑流
- 表单页面和自定义页面支持创建 HTTP 连接器数据源并调用
- 多个示例页面及报表工具脚本

### Fixed
- 修复 CLAUDE_CODE 环境检测问题
- 修复 integration 子命令 i18n 硬编码问题

### Changed
- `yida-custom-page` 技能描述优化
- `yida-skills` 安装到所有 AI 工具的 skills 目录

## [2026.03.21] - 2026-03-21

### Added
- `yida-data-management` 技能替换 `yida-query-data`，统一数据管理入口
- `report` 模块：支持 append-chart 和 filter 功能
- 流程 SKILL 新增 AI 自动生成字段权限和跳转规则的指导规则
- 测试覆盖率补充：新增 6 个测试文件共 156 个测试用例

### Fixed
- 修复流程保存失败的两个关键 bug（请求头缺失 + 草稿 processId 解析错误）
- 修复 NumberField 条件分支规则构建失败
- 修复 report 模块多处问题
- 修复 validate-structure 递归统计 lib/ 子目录模块数

### Changed
- 按功能模块重组 `lib/` 目录结构
- 优化 create-form 字段解析，支持多列布局和对象格式
- CI 自动更新 contributors 改为手动命令 `npm run contributors`

## [2026.03.20] - 2026-03-20

### Added
- `yida-connector` 技能：支持宜搭自定义连接器及从系统文档快速生成
- `yida-table-form` 技能：支持批量表格表单提交
- `yida-density` 技能：信息密度设计指南
- `create-app` 命令支持 `themeColor` 参数
- `configure-process` 支持 `processDetailUrl` 参数

### Fixed
- 专属域名（exclusive domain）4 项兼容性修复
- `save-share-config` 支持 `/s/` 组织内分享 URL
- `create-form.js` 三个关键 bug 修复
- ECharts 图表升级至 5.5.0，修复图表不渲染问题
- 修正 `.gitignore` 中工作区路径前缀
- 移除 iFlow 相关代码和文档（iFlow 已下线）

### Changed
- 公开访问配置从主流程中移除，改为按需执行
- OpenCode 在 Windows 上配置目录改为 `~/.config/opencode`

## [2026.03.19] - 2026-03-19

### Added
- 多语言 README 支持（13 种语言）：简体中文、繁體中文（台灣/香港）、日本語、한국어、Français、Deutsch、Español、Português、Tiếng Việt、हिन्दी、العربية
- i18n 国际化扩展：新增 ko、fr、de、es、pt、vi、hi、ar、zh-TW 语言包，支持 12 种语言
- CI 新增 `concurrency` 配置（自动取消重复运行）和 `permissions: contents: read` 最小权限声明
- README 顶部添加封面图和 Vernor Vinge 引言
- README 新增「How OpenYida Differs from Other AI App Builders」对比表格，并同步到所有语言版本

### Changed
- 版本号规则改为日期格式（`vYYYY.MM.DD`），告别语义化版本
- README.md 改为英文作为默认语言，原中文内容迁移至 `README.zh-CN.md`

## [1.0.0-beta.0] - 2026-03-18

### Added
- 支持多 AI 工具环境：悟空、Aone Copilot、OpenCode、Claude Code、Cursor、Qoder、iFlow
- `openyida env` 命令：检测当前 AI 工具环境和登录态
- `openyida copy` 命令：初始化 openyida 工作目录到当前 AI 工具环境
- 内置自动版本检测（每天检查一次新版本）
- 悟空环境支持 CDP 协议从内置浏览器提取 Cookie
- 完整开发流程文档和子技能 `SKILL.md`
- `AGENTS.md` / `CLAUDE.md` AI 协作开发指引

### Changed
- 架构重构：CLI 命令统一收归 `openyida` 包，安装即用
- 多 AI 工具环境自动检测，无需手动配置

### Fixed
- 修复 `get-page-config.js` 严重 bug（引用未定义变量、GET/POST 路径写反）
- 修复 `postinstall.js` 复用 `env.js` 的环境检测逻辑，避免重复维护
- `prepublish.js` 增加 diff 校验，确保 project 模板拷贝完整性

## [0.1.0] - 2026-03-11

### Added
- 初始版本发布
- `openyida login` / `logout` 登录管理
- `openyida create-app` 创建应用
- `openyida create-page` 创建自定义展示页面
- `openyida create-form` 创建 / 更新表单页面
- `openyida publish` 编译并发布自定义页面
- `openyida get-schema` 获取表单 Schema
- GitHub Actions CI/CD 流程（多平台测试 + npm 发布）
- 最佳实践文档和留资表单完整示例

### Fixed
- `create-form` 支持 JSON 字符串格式输入
- 优化 Babel 编译错误提示信息
- 修复 `SKILL.md` 编号问题

[Unreleased]: https://github.com/openyida/openyida/compare/v2026.3.22...HEAD
[2026.03.22]: https://github.com/openyida/openyida/compare/v2026.03.21-1...v2026.3.22
[2026.03.21]: https://github.com/openyida/openyida/compare/v2026.03.20-2...v2026.03.21
[2026.03.20]: https://github.com/openyida/openyida/compare/v2026.03.19...v2026.03.20
[2026.03.19]: https://github.com/openyida/openyida/compare/v1.0.0-beta.0...v2026.03.19
[1.0.0-beta.0]: https://github.com/openyida/openyida/compare/v0.1.0...v1.0.0-beta.0
[0.1.0]: https://github.com/openyida/openyida/releases/tag/v0.1.0
