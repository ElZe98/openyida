# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.x     | ✅ Active support   |
| < 1.0   | ❌ No longer supported |

## Reporting a Vulnerability

**请勿通过公开的 GitHub Issue 报告安全漏洞。**

如果你发现了安全漏洞，请通过以下方式私密报告：

1. **GitHub Security Advisories（推荐）**
   前往 [Security Advisories](https://github.com/openyida/openyida/security/advisories/new) 创建私密安全报告。

2. **邮件报告**
   发送邮件至维护者，标题请注明 `[SECURITY] OpenYida`。

## 响应流程

| 阶段 | 时间 |
|------|------|
| 确认收到报告 | 48 小时内 |
| 初步评估与分类 | 5 个工作日内 |
| 修复方案与补丁发布 | 视严重程度，通常 1–2 周 |
| 公开披露 | 修复发布后 |

## 漏洞披露原则

- 我们遵循 **负责任披露（Responsible Disclosure）** 原则
- 在修复发布前，请勿公开漏洞细节
- 修复发布后，我们会在 CHANGELOG 和 GitHub Release 中说明安全修复内容
- 对有效的安全报告，我们会在 README 贡献者列表中致谢（除非报告者要求匿名）

## 安全最佳实践

使用 OpenYida 时，请注意以下安全事项：

- **登录凭证**：Cookie 缓存存储在本地 `project/.cache/cookies.json`，请勿将此文件提交到版本控制
- **`.gitignore`**：项目默认已忽略 `.cache/` 目录，请勿手动移除此规则
- **依赖安全**：定期运行 `npm audit` 检查依赖漏洞
- **环境隔离**：生产环境和开发环境使用不同的宜搭账号

## 范围

以下类型的安全问题在本政策范围内：

- 认证和授权绕过
- Cookie / 凭证泄露
- 代码注入或远程代码执行
- 依赖链中的已知漏洞
- 敏感信息意外暴露

以下不在范围内：

- 社会工程攻击
- 物理攻击
- 已在公开 Issue 中讨论的非安全性 Bug
