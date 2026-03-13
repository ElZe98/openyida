# 通过 OpenCode / ClaudeCode 等 AI 编程工具 + 宜搭快速生成应用

> 非常稳定、支持数据存储、生成后可二次加工 🚀

## 快速开始

```bash
# 1. 克隆仓库（含 Skills 子模块）
git clone --recurse-submodules https://github.com/openyida/openyida.git

# 2. 安装 Skills（无需 Node 环境）
# Mac / Linux：
bash install-skills.sh
# Windows（PowerShell）：
.\install-skills.ps1

# 3. 使用代码编辑器打开项目，打开自己的 AI 编程工具
# 4. 一句话生成应用：帮我搭建一个生日祝福小游戏应用
# 5. 根据需求文档生成应用：帮我搭建个人薪资计算器应用
```

> **已克隆但未带子模块？** 执行以下命令补充初始化：
> ```bash
> git submodule update --init --recursive
> # 然后再运行安装脚本：
> bash install-skills.sh        # Mac / Linux
> .\install-skills.ps1          # Windows（PowerShell）
> ```


## 依赖环境

| 依赖 | 版本要求 | 用途 |
|------|----------|------|
| Node.js | ≥ 16 | yida-publish、yida-create-* 系列脚本 |
| Python | ≥ 3.8 | yida-login、yida-logout |
| Playwright | latest | 登录态管理 |

---

## DEMO 展示

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

## 常用问法([yida-skills](https://github.com/openyida/yida-skills))
1. 帮我搭建一个 xxx 应用
2. 根据需求文档生成应用
3. 帮我创建一个 xxx 表单页面
4. 帮我给 xxx 页面添加一个 xxx 字段，字段名称：字段类型 xxx
5. 帮我给 xxx 页面 xxx 字段改为必填
6. 帮我发布 xxx 页面
7. 重新登录
8. 退出登录

## 贡献者

感谢所有为 OpenYida 做出贡献的开发者！

### 贡献者
<p align="left">
  <a href="https://github.com/yize"><img src="https://avatars.githubusercontent.com/u/1011681?v=4&s=48" width="48" height="48" alt="yize" title="yize"/></a> <a href="https://github.com/alex-mm"><img src="https://avatars.githubusercontent.com/u/3302053?v=4&s=48" width="48" height="48" alt="alex-mm" title="alex-mm"/></a> <a href="https://github.com/nicky1108"><img src="https://avatars.githubusercontent.com/u/4279283?v=4&s=48" width="48" height="48" alt="nicky1108" title="nicky1108"/></a>
</p>

## License

[MIT](./LICENSE) © 2026 Alibaba Group
