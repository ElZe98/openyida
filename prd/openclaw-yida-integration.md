# OpenClaw 宜搭 API 集成

> 创建时间：2026-03-12

## 需求概述

为 OpenClaw 扩展宜搭 API 能力，使其能够通过自然语言指令自动操作宜搭平台的数据，实现业务流程的智能化自动化。

## 背景

OpenClaw 是一个开源的 AI Agent 框架，能够执行各种电脑操作和任务。宜搭是企业级低代码平台，提供丰富的表单、流程、数据管理能力。通过集成，宜搭用户可以使用自然语言让 OpenClaw 完成：
- 表单数据的查询、创建、更新、删除
- 审批流程的发起、审批、查询
- 应用和页面信息的获取

## 功能清单

### 1. 宜搭 API Skill 开发

开发 OpenClaw 可调用的宜搭技能模块（Skill），封装以下能力：

| 能力 | 说明 | 优先级 |
|------|------|--------|
| 查询表单数据 | 根据条件查询宜搭表单实例 | P0 |
| 创建表单数据 | 向指定表单提交新数据 | P0 |
| 更新表单数据 | 修改已有表单实例的数据 | P0 |
| 删除表单数据 | 删除指定的表单实例 | P1 |
| 批量操作 | 批量创建/更新/删除表单数据 | P1 |
| 查询流程实例 | 获取审批流程的状态和详情 | P1 |
| 发起审批流程 | 触发宜搭审批流程 | P2 |
| 获取应用列表 | 查询当前账户下的宜搭应用 | P2 |

### 2. 认证与安全

- 支持通过钉钉开放平台获取 access_token
- 支持配置多个宜搭应用（appType）的访问权限
- 实现敏感操作确认机制（如删除数据需要用户确认）

### 3. 自然语言映射

将用户的自然语言指令转换为 API 调用：

| 用户指令 | 执行的操作 |
|----------|------------|
| "查询本月销售数据" | 调用 queryFormData 查询表单 |
| "创建一个新的报销单" | 调用 saveFormData 创建数据 |
| "更新客户信息" | 调用 updateFormData 更新数据 |
| "删除这条记录" | 调用 deleteFormData 删除数据 |

## 技术方案

### 架构设计

```
用户 (消息平台) → OpenClaw → 宜搭 Skill → 宜搭 OpenAPI → 宜搭平台
```

### API 调用方式

宜搭 OpenAPI 调用需要：
1. 获取 access_token（钉钉开放平台）
2. 构造请求参数（appType、formUuid、formDataJson 等）
3. 调用对应接口

### 核心接口参考

```typescript
// 查询表单数据
POST /dingtalk/openapi/v2/form/data/search
参数：appType, formUuid, currentPage, pageSize, searchFieldParamsJson

// 保存表单数据  
POST /dingtalk/openapi/v1/form/data/save
参数：appType, formUuid, formDataJson

// 更新表单数据
POST /dingtalk/openapi/v1/form/data/update
参数：appType, formUuid, formInstId, formDataJson

// 删除表单数据
POST /dingtalk/openapi/v1/form/data/delete
参数：appType, formUuid, formInstId
```

## 配置项

用户在 OpenClaw 中配置宜搭连接：

| 配置项 | 说明 | 示例 |
|--------|------|------|
| dd_client_id | 钉钉应用 ClientId | dingxxxx |
| dd_client_secret | 钉钉应用 ClientSecret | xxxxxxxxx |
| default_appType | 默认宜搭应用 ID | APP_xxxxx |
| corpId | 企业 ID | dingxxxx |

## 使用示例

```
用户：帮我查询上个月的报销单
OpenClaw：[正在调用宜搭 API 查询报销表单...]
         找到 23 条报销记录，总金额 ¥15,680
         
用户：创建一个新的客户跟进记录
OpenClaw：[请提供以下信息：客户名称、跟进内容、下次跟进时间]
用户：客户名称是"阿里巴巴"，跟进内容"首次拜访"，下次跟进时间"2026-03-15"
OpenClaw：[正在创建表单数据...]
         ✅ 创建成功，表单实例ID：FORM-xxxxxxxx
```

## 交付物

1. 宜搭 API Skill 源码包
2. 安装配置文档
3. 使用示例和常见问题 FAQ

## 备注

- 宜搭 OpenAPI 调用需要企业钉钉管理员授权
- 建议优先支持企业内部应用类型
- 复杂表单（如含子表单、关联表单）需要额外处理
