---
name: yida-app
description: Build 钉钉宜搭 (Yida) applications using AI. This is the main orchestration skill that loads sub-skills from yida-skills to handle the complete workflow: login, app creation, page development, and publishing.
---

# Yida App - Build Enterprise Apps with AI

## Overview

This is the **main orchestration skill** for building 钉钉宜搭 (Yida) applications. It loads sub-skills from the [yida-skills](https://github.com/openyida/yida-skills) repository to automate the complete development workflow.

**Use when:** User wants to create, modify, or publish Yida applications using AI.

## Architecture

```
yida-app (main orchestration)
    │
    └── Loads from yida-skills:
          ├── yida-login ─────────── Login state management
          ├── yida-logout ────────── Logout & clear cache
          ├── yida-create-app ─────── Create Yida app
          ├── yida-create-page ────── Create custom display page
          ├── yida-create-form-page ─ Create form page
          ├── yida-custom-page ────── JSX development guide
          ├── yida-publish-page ────── Compile & publish
          └── yida-get-schema ──────── Get form schema
```

## Prerequisites

### Environment Requirements

| Dependency | Version | Purpose |
|------------|---------|---------|
| Node.js | ≥ 16 | Page compilation & publish scripts |
| Python | ≥ 3.8 | Login state management |
| Playwright | latest | Browser automation (QR login) |

### Installation

Skills are automatically loaded from yida-skills. The main skill expects:

```
项目根目录/
├── config.json              # loginUrl, defaultBaseUrl
├── .cache/
│   ├── cookies.json         # Login state cache
│   └── <项目名>-schema.json # Schema ID cache
├── pages/
│   ├── src/<项目名>.js     # Custom page JSX source
│   └── dist/<项目名>.js    # Compiled output
├── prd/
│   └── <项目名>.md         # Requirements document
└── .claude/skills/         # (from yida-skills)
```

If using standalone, run installation:

```bash
# Clone yida-skills to .claude/skills
git clone https://github.com/openyida/yida-skills.git .claude/skills

# Install dependencies
pip install playwright && playwright install chromium
cd .claude/skills/yida-publish-page/scripts && npm install
```

## Workflow

### Complete Process

```
User Request → Login → Create App → Create Page → Write Code → Publish → Open Browser
```

## Usage Patterns

### Pattern 1: Create New App

**Trigger phrases:**
- "帮我创建一个xxx应用"
- "搭建一个生日祝福小游戏"
- "创建一个企业 landing page"

**Execute:**
1. Check login state (read `.cache/cookies.json`)
2. If invalid → invoke yida-login
3. Create app → get appType
4. Create page → get formUuid
5. Analyze requirements, write JSX code
6. Publish → get URL

### Pattern 2: Create from PRD

**Trigger phrases:**
- "根据需求文档生成应用"
- "按照 prd/xxx.md 生成"

**Execute:**
1. Read prd/<项目名>.md
2. Check/login
3. Create app/page
4. Generate code from PRD
5. Publish

### Pattern 3: Modify Existing

**Trigger phrases:**
- "修改某个页面"
- "添加一个新字段"

**Execute:**
1. Read existing code/schema
2. Make modifications
3. Republish

### Pattern 4: Login Management

**Trigger phrases:**
- "重新登录"
- "退出登录"

**Execute:**
- yida-login: Check cookies → prompt QR if needed
- yida-logout: Clear cookies.json

## Configuration

### config.json

```json
{
  "loginUrl": "https://www.aliwork.com/workPlatform",
  "defaultBaseUrl": "https://www.aliwork.com"
}
```

**For 集团宜搭 (Group Yida):**
```json
{
  "loginUrl": "https://yida-group.alibaba-inc.com/workPlatform",
  "defaultBaseUrl": "https://yida-group.alibaba-inc.com"
}
```

### Cache Files

| File | Purpose |
|------|---------|
| `.cache/cookies.json` | Login session & CSRF token |
| `.cache/<name>-schema.json` | appType, formUuid, fieldIds |

## Development Guide

### Custom Page (yida-custom-page)

Reference `yida-custom-page` skill for:
- JSX syntax (React 16 compatible)
- Component lifecycle (onMount, onUnmount)
- State management (this.state, this.setState)
- 27 built-in APIs (this.utils.*)
- CSS styling

### Form Fields

19 field types supported:
- TextField, TextareaField, NumberField
- RadioField, CheckboxField, SelectField, MultiSelectField
- DateField, CascadeDateField
- EmployeeField, DepartmentSelectField
- AddressField, AttachmentField, ImageField
- TableField, AssociationFormField
- SerialNumberField, RateField, CountrySelectField

## Key Rules

### CorpId Consistency Check (MUST follow)

Before creating pages, **MUST verify corpId in prd matches corpId in cookies.json**:
- **Match** → Continue
- **Mismatch** → Ask user: Re-login to correct org, or create app in current org?

### Storage Rules

| Data Type | Location | Example |
|-----------|----------|---------|
| Business logic | `prd/<name>.md` | Field names, types, descriptions |
| System IDs | `.cache/<name>-schema.json` | appType, formUuid, fieldId |

> **DO NOT write formUuid/fieldId in PRD documents** - these go in `.cache/`.

### Temp Files

All temp files (cookies, schema cache) **MUST be in project root `.cache/` directory**.

## Yida URL Patterns

| Page Type | URL Format |
|-----------|------------|
| App home | `{base_url}/{appType}/workbench` |
| Form submission | `{base_url}/{appType}/submission/{formUuid}` |
| Custom page | `{base_url}/{appType}/custom/{formUuid}` |
| Custom page (no nav) | `{base_url}/{appType}/custom/{formUuid}?isRenderNav=false` |
| Form detail | `{base_url}/{appType}/formDetail/{formUuid}?formInstId={id}` |

> Append `&corpid={corpId}` to switch organizations.

## Troubleshooting

### Login Issues
- **QR not scanning**: Check network to yida.alibaba-inc.com
- **Cookie expired**: Clear `.cache/cookies.json`, re-run login
- **Permission denied**: Ensure user has Yida admin access

### Publish Issues
- **Compilation errors**: Check JSX syntax, component names
- **Schema errors**: Verify component props match Yida API
- **Upload failed**: Check file size (typically 2MB max)

### CorpId Mismatch
- Ask user: Re-login to correct org, or create new app in current org?

## Examples

### Example 1: Salary Calculator

```
User: 帮我创建一个个人薪资计算器应用
```

**Steps:**
1. Check login state (yida-login)
2. Create app "个人薪资计算器" → appType: APP_xxx
3. Create custom display page → formUuid: FORM_xxx
4. Write calculator JSX to pages/src/salary-calculator.js
5. Publish → URL: https://ding.aliwork.com/APP_xxx/custom/FORM_xxx

### Example 2: Contact Form

```
User: 创建一个留资表单，包含姓名、电话、邮箱
```

**Steps:**
1. Check login
2. Create app
3. Create form page with fields: name, phone, email
4. Write form handler code
5. Publish

### Example 3: Update Existing

```
User: 给薪资计算器添加税后反推功能
```

**Steps:**
1. Read existing pages/src/salary-calculator.js
2. Add "税后反推" feature
3. Republish

## Integration

### With OpenCLAW

This skill enables OpenCLAW users to use Yida skills directly:

```bash
# Clone and use
git clone https://github.com/openyida/openyida.git
cd openyida

# OpenCLAW auto-discovers .openclaw/skills/
```

### Skill Dependencies

```
yida-app (this skill)
  └── yida-skills (sub-skills repo)
        ├── yida-login ─────── Login check & QR login
        ├── yida-create-app ── Create app → appType
        ├── yida-create-page ── Create page → formUuid
        ├── yida-custom-page ─ JSX spec & API
        └── yida-publish-page ─ Compile → Build → Publish
```

## Notes

- This skill is for 钉钉宜搭 (Alibaba Yida) platform
- Requires valid Alibaba corporate account
- Some features require Yida enterprise edition
- API rate limits apply

## See Also

- [Yida Official Docs](https://yida.alibaba-inc.com)
- [openyida Template](https://github.com/openyida/openyida)
- [yida-skills Repository](https://github.com/openyida/yida-skills)
