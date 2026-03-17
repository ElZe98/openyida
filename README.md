## 快速开始

### 第一步：安装技能

**目前 skills 还未发布到市场，先手动下载 yida-skills.zip，然后：**

* 悟空 (Wukong): 直接上传技能，选择 yida-skills.zip

* OpenCode: 手动解压到 ~/.opencode/skills/

* Claude Code: 手动解压到 ~/.claudecode/skills/

* Cursor: 手动解压到 ~/.cursor/skills/

* Qoder: 手动解压到 ~/.qoder/skills/

* iFlow: 手动解压到 ~/.iflow/skills/

* Aone Copilot: 手动解压到 ~/.aone-copilot/skills/

### 第二步：使用

直接对话：

- `帮我创建一个访客系统应用`
- `帮我搭建一个生日祝福小游戏应用`
- `帮我搭建个人薪资计算器应用`

---

## 依赖环境

| 依赖 | 版本要求 | 用途 |
|------|----------|------|
| Node.js | ≥ 16 | yidacli 运行环境 |

---

## DEMO 展示

### 业务系统 - IPD/CRM

![IPD](https://img.alicdn.com/imgextra/i2/O1CN01YBEMa929J7sD9v8U1_!!6000000008046-2-tps-3840-3366.png)

![CRM](https://img.alicdn.com/imgextra/i3/O1CN01kn0Vcn1H5OkbQaizA_!!6000000000706-2-tps-3840-2168.png)

### 💰 小工具 - 个人薪资计算器

![薪资计算器](https://gw.alicdn.com/imgextra/i2/O1CN017TeJuE1reVH2Dj7b7_!!6000000005656-2-tps-5114-2468.png)

---

### 🌐  Landing Page - 智联协同

企业级产品介绍页，一句话生成完整 Landing Page。

![智联协同](https://gw.alicdn.com/imgextra/i1/O1CN01EZtvfs1cxXV00UaXi_!!6000000003667-2-tps-5118-2470.png)

---

### 🏮 运营场景 - 看图猜灯谜

AI 生成灯谜图片，用户猜答案，猜错了有 AI 幽默提示。

![看图猜灯谜-2](https://img.alicdn.com/imgextra/i3/O1CN01dCoscP25jSAtAB9o3_!!6000000007562-2-tps-2144-1156.png)

---

## 常用问法

> 技能定义详见 [openyida-skills](https://github.com/openyida/openyida-skills) 仓库

1. 帮我搭建一个 xxx 应用
2. 根据需求文档生成应用
3. 帮我创建一个 xxx 表单页面
4. 帮我给 xxx 页面添加一个 xxx 字段，字段名称：字段类型 xxx
5. 帮我给 xxx 页面 xxx 字段改为必填
6. 帮我发布 xxx 页面
7. 帮我把页面发布为公开访问
8. 重新登录
9. 退出登录

## 项目架构

```
openyida/
├── yida-cli/         # CLI 工具源码（npm 包 @openyida/yidacli）
│   ├── src/              # 核心逻辑
│   ├── bin/              # 可执行入口
│   ├── scripts/          # 构建 / 发布脚本
│   └── tests/            # 单元测试
├── openyida/             # 用户工作区（运行时生成）
│   ├── pages/src/        # 自定义页面源码
│   ├── pages/dist/       # 编译产物（自动生成）
│   ├── prd/              # 需求文档
│   └── .cache/           # 登录态 & Schema 缓存
└── package.json          # 根包（openyida / yida 命令入口）
```

## OpenYida 社区

钉钉扫描加入 OpenYida 社区

![扫描加入 OpenYida 社区](https://img.alicdn.com/imgextra/i4/O1CN01RAlxmO1qF1cxRguyj_!!6000000005465-2-tps-350-356.png)

## 贡献者

感谢所有为 OpenYida 做出贡献的开发者！

### 贡献者
<p align="left">
  <a href="https://github.com/yize"><img src="https://avatars.githubusercontent.com/u/1011681?v=4&s=48" width="48" height="48" alt="yize" title="yize"/></a> <a href="https://github.com/alex-mm"><img src="https://avatars.githubusercontent.com/u/3302053?v=4&s=48" width="48" height="48" alt="alex-mm" title="alex-mm"/></a> <a href="https://github.com/nicky1108"><img src="https://avatars.githubusercontent.com/u/4279283?v=4&s=48" width="48" height="48" alt="nicky1108" title="nicky1108"/></a>
</p>

## License

[MIT](./LICENSE) © 2026 Alibaba Group