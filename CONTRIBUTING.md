# Contributing to OpenYida

欢迎来到 OpenYida！🎉 感谢你有兴趣参与贡献。

## 快速链接

- **GitHub:** https://github.com/openyida/openyida
- **Issues:** https://github.com/openyida/openyida/issues
- **npm:** https://www.npmjs.com/package/openyida

## 维护者

- **九神 (yize)** — 核心架构、CLI 设计
  GitHub: [@yize](https://github.com/yize)
- **alex-mm** — 功能开发、测试
  GitHub: [@alex-mm](https://github.com/alex-mm)
- **nicky1108** — OpenClaw 集成、技能扩展
  GitHub: [@nicky1108](https://github.com/nicky1108)

## 贡献方式

1. **报告 Bug** → 提 Issue，附上复现步骤和环境信息
2. **功能建议** → 先开 Discussion 或 Issue 讨论，再动手实现
3. **改进文档** → 直接提 PR，文档改进随时欢迎
4. **新增技能** → 扩展 `yida-skills/` 目录下的技能包
5. **修复 Bug / 新功能** → 参考下方开发流程

## 开发环境搭建

```bash
# 1. Fork 并克隆仓库
git clone git@github.com:your-username/openyida.git
cd openyida

# 2. 安装依赖
npm install

# 3. 安装 Playwright（登录功能需要）
npx playwright install chromium

# 4. 全局链接，方便本地调试
npm link

# 5. 运行测试
npm test
```

## 提交 PR 前的检查清单

- [ ] 在本地用真实的宜搭账号测试过相关功能
- [ ] 运行 `npm test` 确保所有测试通过
- [ ] JS 语法检查通过：`node --check bin/yida.js && for f in lib/*.js; do node --check "$f"; done`
- [ ] PR 描述清楚说明了改动内容和原因
- [ ] 如有 UI 或行为变化，附上截图或录屏

## PR 规范

- **一个 PR 只做一件事**，不要混入无关改动
- **PR 标题**格式：`feat: 添加 xxx 功能` / `fix: 修复 xxx 问题` / `docs: 更新 xxx 文档`
- **描述**中说明：做了什么、为什么这样做、如何测试
- 如果 PR 关联某个 Issue，在描述中写 `Closes #123`

## Commit 规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```
feat: 新增 export-app 命令
fix: 修复 get-page-config 路径错误
docs: 更新 CLI 命令说明
refactor: 重构登录模块
test: 添加 utils 单元测试
chore: 升级依赖版本
```

## 代码风格

- 遵循项目现有的代码风格（CommonJS 模块、Node.js 原生 API 优先）
- 变量和函数命名使用有意义的英文名，避免缩写
- 错误处理要完整，不要静默吞掉异常
- 新增命令请同步更新 `README.md` 的 CLI 命令一览表

## 项目结构说明

```
openyida/
├── bin/yida.js          # CLI 入口，命令路由
├── lib/                 # 各命令的实现模块
│   ├── env.js           # 环境检测
│   ├── login.js         # 登录管理
│   ├── create-app.js    # 创建应用
│   └── ...
├── project/             # 用户工作区模板
│   ├── config.json      # 应用配置
│   └── pages/           # 自定义页面模板
├── yida-skills/         # AI 技能包（MCP/Claude/Cursor 等读取）
│   ├── SKILL.md         # 技能入口文档
│   └── skills/          # 子技能目录
└── scripts/             # 构建和发布脚本
```

## AI/Vibe-Coded PR 欢迎！🤖

用 Claude Code、Cursor、Aone Copilot 或其他 AI 工具辅助开发的 PR 完全欢迎！
请在 PR 描述中注明使用了哪个 AI 工具。

## License

参与贡献即表示你同意将贡献内容以 [MIT License](./LICENSE) 授权。
