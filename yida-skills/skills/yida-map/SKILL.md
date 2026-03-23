---
name: yida-map
description: 宜搭业务关系地图技能，重建并可视化页面、表单、流程、自动化、规则之间的业务关系，支持右侧详情栏字段预览与关系筛选。
license: MIT
compatibility:
  - opencode
  - claude-code
metadata:
  audience: developers
  workflow: yida-development
  version: 1.0.0
  tags:
    - yida
    - map
    - relation
    - architecture
    - visualize
---

# 宜搭业务关系地图技能

## 概述

本技能用于构建新的 `yida-map`，避免产生“字段毛线球”式可视化。

核心目标：

- 主图只展示业务对象，不默认展开字段
- 右侧固定详情栏展示字段、关联页面、关系摘要
- 自动化 / 规则在主图聚合显示，点开后看详情流图
- 支持跨应用关系，默认按外部应用聚合显示

## 何时使用

当用户提出以下需求时使用：

- 想看宜搭应用的页面 / 表单 / 流程关系
- 想在全局页面里预览某张表单有哪些字段
- 想沉淀 AI 开发过程中的业务结构，避免后续无法维护
- 想查看某个页面读写了哪些表单
- 想把自动化、规则、表关联关系可视化

## 命令

### 1. 重建地图

```bash
openyida map rebuild <appType>
```

作用：

- 扫描应用导航
- 重建页面、表单、流程基础节点
- 提取表单字段元数据
- 识别页面源码中的读写表、页面跳转、流程引用

### 1.1 推断业务关系

```bash
openyida map infer <appType>
```

作用：

- 读取页面源码与表单字段
- 根据字段名中的“实例ID”等语义推断表间关系
- 根据页面中的读写逻辑补充 `reads / writes / jumps_to / relates_to`

> 当前阶段 `infer` 与 `rebuild` 共用实现，后续会增强为更强的关系推断模式。

### 2. 查看摘要

```bash
openyida map show <appType>
openyida map show <appType> --json
```

输出内容：

- 页面数量
- 表单数量
- 流程数量
- 自动化数量
- 规则数量
- 地图文件路径

### 3. 导出 HTML 可视化

```bash
openyida map visualize <appType>
openyida map visualize <appType> ./map.html
```

输出：

- 默认导出到 `.cache/maps/<appType>.html`
- 可直接浏览器打开

### 4. 挂接自动化详情流图

```bash
openyida map attach-automation <appType> <automationId> <jsonOrFile>
```

适用场景：

- 当前自动化未实现自动提取时，先手工挂接结构化详情
- 详情流图支持：触发器、条件、分支、并行、动作链

### 5. 挂接规则详情流图

```bash
openyida map attach-rule <appType> <ruleId> <jsonOrFile>
```

适用场景：

- 当前业务规则未实现自动提取时，先手工挂接 submit 等触发链路

## 文件位置

### 地图 JSON

```bash
.cache/maps/<appType>.json
```

### 地图 HTML

```bash
.cache/maps/<appType>.html
```

## 运行目录说明

`openyida map` 命令会基于**当前项目根目录**查找 `.cache/maps/`。

因此需要在**目标宜搭项目目录**执行，而不是在 `openyida` 源码仓库目录执行。

### 例如

当前前置下单项目应在这里运行：

```bash
/Users/kako/DevProject/opencyida/ims/project
```

例如：

```bash
cd /Users/kako/DevProject/opencyida/ims/project
openyida map show APP_YH5NM3R033BIIPUW4FJ7 --json
```

`openyida` 源码开发目录在这里：

```bash
/Users/kako/DevProject/opencyida/test/openyida
```

这个目录适合：

- 改 `openyida` 源码
- 开发 `yida-map`
- 安装本地调试版本

但**不适合直接查看业务项目的地图数据**，否则会读到源码仓库自己的 `project/.cache/maps/`。

## 当前节点模型

主图默认节点：

- `app`
- `page`
- `form`
- `process`
- `automation`
- `rule`

不默认进入主图的内容：

- `field`
- `automation_action`
- `rule_action`
- `branch`
- `parallel`

这些内容通过右侧详情栏或详情流图查看。

## 当前边模型

主图支持的关系类型：

- `reads`
- `writes`
- `relates_to`
- `jumps_to`
- `triggers`
- `updates`
- `submits`
- `uses_process`
- `copies_to`
- `snapshot_to`

> 业务上展示名称可进一步做中文化，例如 `reads -> 读取`、`writes -> 写入`。

## 可视化规则

### 主图

- 默认只显示业务节点
- 同一对节点之间多条关系聚合成一根线
- 不同关系类型用不同颜色
- 可通过右侧顶部标签筛选关系类型，例如隐藏 `jumps_to`

### 右侧详情栏

使用 Tab 切换：

- `概览`
- `字段`
- `关联`
- `关系`

点击表单后，右侧可查看：

- 字段清单
- 读取该表单的页面
- 写入该表单的页面
- 相关业务关系

### 自动化 / 规则详情

主图中仅显示聚合节点。

点击节点后可在右侧详情中进入详情流图，查看：

- 触发条件
- 动作链
- 操作类型（query / save / update / delete）
- 目标表单
- 字段命中关系

## 跨应用支持

`yida-map` 从设计上支持跨应用：

- 所有节点记录 `appType`
- 所有边记录 `sourceAppType / targetAppType`
- 关系范围区分：
  - `internal`
  - `cross_app`

默认展示策略：

- 当前应用正常展开
- 外部应用默认只显示应用聚合节点

## 推荐使用方式

### 新应用工作流

如果是一个全新应用，初始没有表单、页面、流程、自动化、规则，此时不需要先做全量理解，推荐采用**边开发边建图**的方式：

1. 创建应用
2. 创建表单 / 页面 / 流程
3. 每次成功创建或发布后，立即更新地图
4. 在开发过程中根据新增的读写关系、表关联、页面跳转不断补充关系

也就是：

- 先有节点
- 再逐步增加关系
- 地图和应用一起生长

当前接入的自动更新命令：

- `create-form`
- `create-page`
- `publish`
- `create-process`
- `configure-process`

### 已有应用工作流

如果是一个已经存在的应用，正确流程不是只跑一次结构扫描，而是：

1. 先完整读取页面源码
2. 再读取相关表单 schema
3. 识别页面读写哪些表、页面之间如何跳转
4. 推断表单之间通过哪些字段关联
5. 建立初始业务关系地图
6. 后续每次改代码、改表单、改自动化、改规则时继续补充关系

也就是：

- 先“通读一遍”现有应用
- 建出第一版完整关系图
- 再随着后续开发持续维护

### 对 AI 的要求

`yida-map` skill 的理想目标不是只做静态扫描，而是让 AI 在开发过程中承担“关系维护者”的角色：

- 修改页面时，判断读写了哪些表单
- 修改表单时，判断新增字段是否构成新的表关联
- 修改自动化时，判断触发了哪些表、更新了哪些字段
- 修改业务规则时，判断提交链影响了哪些表单

这样地图才不会在项目变大后失去维护价值。

### 最小工作流

```bash
openyida map rebuild APP_XXX
openyida map infer APP_XXX
openyida map show APP_XXX
openyida map visualize APP_XXX
```

### 补自动化 / 规则详情

```bash
openyida map attach-automation APP_XXX auto_sync automation.json
openyida map attach-rule APP_XXX submit_rule rule.json
openyida map rebuild APP_XXX
openyida map visualize APP_XXX
```

## 当前边界

当前版本仍处于早期阶段，建议认知如下：

- 页面源码读写识别目前以源码模式匹配为主，不是 AST 级别解析
- 自动化 / 规则详情当前优先通过 `attach-*` 手工挂接
- 跨应用聚合与复杂布局仍可继续增强

## 自动维护规则

为了让 `yida-map` 适合所有通过 `openyida` 开发的应用，而不是只适合某一个项目，建议默认遵循下面的维护策略：

- 创建表单后，立即更新地图
- 更新表单后，立即更新地图
- 创建自定义页面后，立即更新地图
- 发布页面后，立即更新地图
- 创建流程或配置流程后，立即更新地图
- 新增自动化 / 业务规则后，立即更新地图或详情结构

当前代码已经接入以下命令成功后的自动地图刷新：

- `create-form`
- `create-page`
- `publish`
- `create-process`
- `configure-process`

后续如果新增自动化或业务规则命令，也应在成功后自动执行地图更新。

## 推荐的关系维护策略

建议把地图数据拆成两层来维护：

- `rebuild` 层：负责结构重建（节点、字段、基础读写关系）
- `infer / AI` 层：负责理解业务并补充更准确的关系

理想情况下：

- 新应用：边创建边补关系
- 老应用：先完整理解后建立首版地图，再持续维护

后续实现上建议继续增加：

- `map infer` 的独立 AI 推断能力
- 精修关系 overlay 层，避免 `rebuild` 覆盖 AI 已确认关系

## 与其他技能配合

- `yida-get-schema`：获取字段结构后，可补充更准的字段信息
- `yida-custom-page`：页面开发完成并发布后，适合重建地图
- `yida-create-form-page`：创建/更新表单后，适合立即刷新地图
- `yida-data-management`：理解数据流转后，可手工补充更准确的业务关系

## 推荐更新时机

建议在以下动作成功后更新地图：

- 创建表单
- 更新表单
- 创建页面
- 发布页面
- 新增自动化
- 新增业务规则
- 修改页面对表单的读写逻辑
