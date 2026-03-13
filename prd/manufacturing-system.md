# 制造业全流程管理系统 需求文档

## 应用配置

| 配置项 | 值 |
| --- | --- |
| appType | APP_E2J5TYFZBOZ12OX1T42P |
| corpId | ding9a0954b4f9d9d40ef5bf40eda33b7ba0 |
| baseUrl | https://www.aliwork.com |

## 功能需求

基于制造业全流程管理流程图，覆盖 CRM、合同管理、排产管理、报工系统四大模块的完整数字化管理平台。

### CRM 系统（AI表格搭建）
- **客户信息管理**：统一管理客户基础信息，支持客户分级与来源追踪
- **项目线索跟踪**：记录并跟踪项目线索从发现到转化的全过程
- **商机管理**：管理商机阶段推进，支持赢单/输单分析
- **客户沟通记录**：记录每次客户沟通内容，形成完整客户互动历史

### 合同管理系统（AI表格搭建）
- **项目评审**：含设计文档评审和 BOM 评审，客户项目信息作为合同评审输入
- **合同生成与审批**：发起合同审批流程，支持合同变更
- **物料清单（BOM）管理**：管理产品物料清单，支持 BOM 同步至 U8 系统
- **合同执行状态跟踪**：跟踪合同各阶段执行进度

### 排产管理系统
- **生产计划制定**：基于合同 BOM 制定生产计划，实时库存数据支撑排产决策
- **资源调度**：管理设备和人力资源的调度分配
- **排产甘特图可视化**：可视化展示排产计划（页面展示）
- **物料齐套检查**：对接 U8 库存，检查物料齐套情况

### 报工系统（AI表格搭建）
- **班组任务接收**：接收排产下发的生产任务
- **工人报工录入**：记录工时、数量、质量等报工数据
- **实际进度反馈**：反馈实际生产进度，形成排产闭环
- **异常上报**：记录生产过程中的异常情况

## 页面与表单配置

### CRM 系统

#### 1. 客户信息管理表（表单页面）

| 字段名称 | 字段类型 | 说明 |
| --- | --- | --- |
| 客户编号 | SerialNumberField / 流水号 | 自动生成，格式：KH+年份+4位序号 |
| 客户名称 | TextField / 单行文本 | 必填 |
| 客户来源 | SelectField / 下拉单选 | 必填，选项：直销、渠道合作、展会、网络推广、老客户转介绍、其他 |
| 联系人 | TextField / 单行文本 | 必填 |
| 联系电话 | TextField / 单行文本 | 必填 |
| 所在地区 | AddressField / 地址 | 选填 |
| 行业类型 | SelectField / 下拉单选 | 选填，选项：汽车制造、电子制造、机械制造、食品加工、化工、其他 |
| 客户等级 | RadioField / 单选 | 选填，选项：A级、B级、C级 |
| 负责销售 | EmployeeField / 成员 | 必填 |
| 备注 | TextareaField / 多行文本 | 选填 |

#### 2. 项目线索跟踪表（表单页面）

| 字段名称 | 字段类型 | 说明 |
| --- | --- | --- |
| 线索编号 | SerialNumberField / 流水号 | 自动生成 |
| 线索名称 | TextField / 单行文本 | 必填 |
| 关联客户 | TextField / 单行文本 | 必填 |
| 线索来源 | SelectField / 下拉单选 | 必填，选项：主动开发、客户推荐、展会、网络、其他 |
| 线索状态 | SelectField / 下拉单选 | 必填，选项：新建、跟进中、已转商机、已关闭 |
| 预计需求 | TextareaField / 多行文本 | 选填 |
| 预计金额 | NumberField / 数字 | 选填，单位：元 |
| 首次接触日期 | DateField / 日期 | 必填 |
| 下次跟进日期 | DateField / 日期 | 选填 |
| 负责销售 | EmployeeField / 成员 | 必填 |
| 跟进记录 | TextareaField / 多行文本 | 选填 |

#### 3. 商机管理表（表单页面）

| 字段名称 | 字段类型 | 说明 |
| --- | --- | --- |
| 商机编号 | SerialNumberField / 流水号 | 自动生成 |
| 商机名称 | TextField / 单行文本 | 必填 |
| 关联客户 | TextField / 单行文本 | 必填 |
| 商机阶段 | SelectField / 下拉单选 | 必填，选项：初步接触、需求确认、方案设计、报价阶段、合同谈判、已赢单、已输单 |
| 预计金额 | NumberField / 数字 | 必填，单位：元 |
| 预计成交日期 | DateField / 日期 | 选填 |
| 产品类型 | TextField / 单行文本 | 选填 |
| 竞争对手 | TextField / 单行文本 | 选填 |
| 赢单/输单原因 | TextareaField / 多行文本 | 选填 |
| 负责销售 | EmployeeField / 成员 | 必填 |
| 跟进记录 | TextareaField / 多行文本 | 选填 |

#### 4. 客户沟通记录表（表单页面）

| 字段名称 | 字段类型 | 说明 |
| --- | --- | --- |
| 记录编号 | SerialNumberField / 流水号 | 自动生成 |
| 关联客户 | TextField / 单行文本 | 必填 |
| 沟通日期 | DateField / 日期 | 必填 |
| 沟通方式 | RadioField / 单选 | 必填，选项：电话、拜访、视频会议、邮件、微信 |
| 沟通主题 | TextField / 单行文本 | 必填 |
| 沟通内容 | TextareaField / 多行文本 | 必填 |
| 客户反馈 | TextareaField / 多行文本 | 选填 |
| 后续行动 | TextareaField / 多行文本 | 选填 |
| 下次跟进日期 | DateField / 日期 | 选填 |
| 记录人 | EmployeeField / 成员 | 必填 |

### 合同管理系统

#### 5. 项目评审表（表单页面）

| 字段名称 | 字段类型 | 说明 |
| --- | --- | --- |
| 评审编号 | SerialNumberField / 流水号 | 自动生成 |
| 关联客户 | TextField / 单行文本 | 必填 |
| 项目名称 | TextField / 单行文本 | 必填 |
| 评审类型 | CheckboxField / 多选 | 必填，选项：设计文档评审、BOM评审 |
| 设计文档 | AttachmentField / 附件 | 选填 |
| BOM清单 | AttachmentField / 附件 | 选填 |
| 评审日期 | DateField / 日期 | 必填 |
| 评审结果 | RadioField / 单选 | 必填，选项：通过、有条件通过、不通过 |
| 评审意见 | TextareaField / 多行文本 | 选填 |
| 评审人员 | EmployeeField / 成员 | 必填，支持多选 |
| 整改要求 | TextareaField / 多行文本 | 选填 |

#### 6. 合同生成与审批表（表单页面）

| 字段名称 | 字段类型 | 说明 |
| --- | --- | --- |
| 合同编号 | SerialNumberField / 流水号 | 自动生成 |
| 合同名称 | TextField / 单行文本 | 必填 |
| 关联客户 | TextField / 单行文本 | 必填 |
| 关联项目评审 | TextField / 单行文本 | 选填，填写评审编号 |
| 合同类型 | RadioField / 单选 | 必填，选项：新签合同、变更合同、续签合同 |
| 合同金额 | NumberField / 数字 | 必填，单位：元 |
| 签订日期 | DateField / 日期 | 必填 |
| 交货日期 | DateField / 日期 | 必填 |
| 付款方式 | SelectField / 下拉单选 | 必填，选项：一次性付款、分期付款、按里程碑付款 |
| 合同附件 | AttachmentField / 附件 | 选填 |
| 审批状态 | SelectField / 下拉单选 | 必填，选项：待审批、审批中、已通过、已拒绝 |
| 负责销售 | EmployeeField / 成员 | 必填 |
| 备注 | TextareaField / 多行文本 | 选填 |

#### 7. 物料清单（BOM）管理表（表单页面）

| 字段名称 | 字段类型 | 说明 |
| --- | --- | --- |
| BOM编号 | SerialNumberField / 流水号 | 自动生成 |
| 关联合同 | TextField / 单行文本 | 必填 |
| 产品名称 | TextField / 单行文本 | 必填 |
| 产品型号 | TextField / 单行文本 | 必填 |
| BOM版本 | TextField / 单行文本 | 必填 |
| BOM明细 | TableField / 子表 | 必填，含：物料编码、物料名称、规格型号、单位、数量、备注 |
| U8同步状态 | RadioField / 单选 | 选填，选项：待同步、已同步、同步失败 |
| 创建日期 | DateField / 日期 | 必填 |
| 负责人 | EmployeeField / 成员 | 必填 |
| 备注 | TextareaField / 多行文本 | 选填 |

#### 8. 合同执行状态跟踪表（表单页面）

| 字段名称 | 字段类型 | 说明 |
| --- | --- | --- |
| 跟踪编号 | SerialNumberField / 流水号 | 自动生成 |
| 关联合同 | TextField / 单行文本 | 必填 |
| 关联客户 | TextField / 单行文本 | 必填 |
| 执行阶段 | SelectField / 下拉单选 | 必填，选项：评审中、生产准备、生产中、质检中、发货中、已交付、已验收 |
| 计划交货日期 | DateField / 日期 | 必填 |
| 实际交货日期 | DateField / 日期 | 选填 |
| 收款状态 | SelectField / 下拉单选 | 必填，选项：未收款、部分收款、已收款 |
| 已收金额 | NumberField / 数字 | 选填，单位：元 |
| 问题记录 | TextareaField / 多行文本 | 选填 |
| 负责人 | EmployeeField / 成员 | 必填 |
| 备注 | TextareaField / 多行文本 | 选填 |

### 排产管理系统

#### 9. 生产计划制定表（表单页面）

| 字段名称 | 字段类型 | 说明 |
| --- | --- | --- |
| 计划编号 | SerialNumberField / 流水号 | 自动生成 |
| 关联合同 | TextField / 单行文本 | 必填 |
| 关联BOM | TextField / 单行文本 | 必填 |
| 产品名称 | TextField / 单行文本 | 必填 |
| 计划数量 | NumberField / 数字 | 必填 |
| 计划开始日期 | DateField / 日期 | 必填 |
| 计划完成日期 | DateField / 日期 | 必填 |
| 优先级 | RadioField / 单选 | 必填，选项：紧急、高、中、低 |
| 生产工序 | TableField / 子表 | 选填，含：工序名称、计划工时、负责班组、计划开始、计划完成 |
| 计划状态 | SelectField / 下拉单选 | 必填，选项：草稿、已下达、生产中、已完成、已取消 |
| 负责人 | EmployeeField / 成员 | 必填 |
| 备注 | TextareaField / 多行文本 | 选填 |

#### 10. 资源调度表（表单页面）

| 字段名称 | 字段类型 | 说明 |
| --- | --- | --- |
| 调度编号 | SerialNumberField / 流水号 | 自动生成 |
| 关联生产计划 | TextField / 单行文本 | 必填 |
| 调度日期 | DateField / 日期 | 必填 |
| 资源类型 | RadioField / 单选 | 必填，选项：设备、人力 |
| 设备资源 | TableField / 子表 | 选填，含：设备名称、设备编号、计划使用时段、实际使用时段、状态 |
| 人力资源 | TableField / 子表 | 选填，含：人员姓名、岗位、计划工时、实际工时 |
| 调度状态 | SelectField / 下拉单选 | 必填，选项：待确认、已确认、执行中、已完成 |
| 负责人 | EmployeeField / 成员 | 必填 |
| 备注 | TextareaField / 多行文本 | 选填 |

#### 11. 物料齐套检查表（表单页面）

| 字段名称 | 字段类型 | 说明 |
| --- | --- | --- |
| 检查编号 | SerialNumberField / 流水号 | 自动生成 |
| 关联生产计划 | TextField / 单行文本 | 必填 |
| 关联BOM | TextField / 单行文本 | 必填 |
| 检查日期 | DateField / 日期 | 必填 |
| 物料检查明细 | TableField / 子表 | 必填，含：物料编码、物料名称、需求数量、U8库存数量、齐套状态、缺料数量 |
| 整体齐套状态 | RadioField / 单选 | 必填，选项：完全齐套、部分齐套、不齐套 |
| 缺料处理方案 | TextareaField / 多行文本 | 选填 |
| 检查人 | EmployeeField / 成员 | 必填 |
| 备注 | TextareaField / 多行文本 | 选填 |

### 报工系统

#### 12. 班组任务接收表（表单页面）

| 字段名称 | 字段类型 | 说明 |
| --- | --- | --- |
| 任务编号 | SerialNumberField / 流水号 | 自动生成 |
| 关联生产计划 | TextField / 单行文本 | 必填 |
| 班组名称 | TextField / 单行文本 | 必填 |
| 班组长 | EmployeeField / 成员 | 必填 |
| 任务内容 | TextareaField / 多行文本 | 必填 |
| 计划数量 | NumberField / 数字 | 必填 |
| 计划开始日期 | DateField / 日期 | 必填 |
| 计划完成日期 | DateField / 日期 | 必填 |
| 接收状态 | RadioField / 单选 | 必填，选项：待接收、已接收、已拒绝 |
| 拒绝原因 | TextareaField / 多行文本 | 选填 |
| 备注 | TextareaField / 多行文本 | 选填 |

#### 13. 工人报工录入表（表单页面）

| 字段名称 | 字段类型 | 说明 |
| --- | --- | --- |
| 报工编号 | SerialNumberField / 流水号 | 自动生成 |
| 关联任务 | TextField / 单行文本 | 必填 |
| 报工日期 | DateField / 日期 | 必填 |
| 报工人员 | EmployeeField / 成员 | 必填 |
| 工序名称 | TextField / 单行文本 | 必填 |
| 实际工时 | NumberField / 数字 | 必填，单位：H |
| 完成数量 | NumberField / 数字 | 必填 |
| 合格数量 | NumberField / 数字 | 必填 |
| 不合格数量 | NumberField / 数字 | 选填 |
| 不合格原因 | TextareaField / 多行文本 | 选填 |
| 备注 | TextareaField / 多行文本 | 选填 |

#### 14. 实际进度反馈表（表单页面）

| 字段名称 | 字段类型 | 说明 |
| --- | --- | --- |
| 反馈编号 | SerialNumberField / 流水号 | 自动生成 |
| 关联生产计划 | TextField / 单行文本 | 必填 |
| 关联任务 | TextField / 单行文本 | 必填 |
| 反馈日期 | DateField / 日期 | 必填 |
| 累计完成数量 | NumberField / 数字 | 必填 |
| 完成进度 | NumberField / 数字 | 必填，单位：% |
| 预计完成日期 | DateField / 日期 | 选填 |
| 进度说明 | TextareaField / 多行文本 | 选填 |
| 反馈人 | EmployeeField / 成员 | 必填 |

#### 15. 异常上报表（表单页面）

| 字段名称 | 字段类型 | 说明 |
| --- | --- | --- |
| 异常编号 | SerialNumberField / 流水号 | 自动生成 |
| 关联任务 | TextField / 单行文本 | 必填 |
| 异常日期 | DateField / 日期 | 必填 |
| 异常类型 | SelectField / 下拉单选 | 必填，选项：设备故障、物料缺失、质量问题、人员不足、安全事故、其他 |
| 异常描述 | TextareaField / 多行文本 | 必填 |
| 影响程度 | RadioField / 单选 | 必填，选项：严重、较大、一般、轻微 |
| 现场照片 | ImageField / 图片 | 选填 |
| 上报人 | EmployeeField / 成员 | 必填 |
| 处理状态 | SelectField / 下拉单选 | 必填，选项：待处理、处理中、已解决 |
| 处理措施 | TextareaField / 多行文本 | 选填 |
| 处理人 | EmployeeField / 成员 | 选填 |
| 解决日期 | DateField / 日期 | 选填 |
