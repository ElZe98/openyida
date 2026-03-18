#!/usr/bin/env node
/**
 * openyida - 宜搭命令行工具
 *
 * 安装：npm install -g openyida
 * 用法：openyida <命令> [参数]（别名：yida）
 *
 * 命令列表：
 *   openyida env                                        检测当前 AI 工具环境和登录态
 *   openyida copy [--force]                             复制 project 工作目录到当前 AI 工具环境
 *   openyida login                                      登录态管理
 *   openyida logout                                     退出登录
 *   openyida create-app "<名称>" [desc] [icon] [color]  创建应用
 *   openyida create-page <appType> "<页面名>"            创建自定义页面
 *   openyida create-form create <appType> "<表单名>" <字段JSON>  创建表单页面
 *   openyida create-form update <appType> <formUuid> <修改JSON>  更新表单页面
 *   openyida get-schema <appType> <formUuid>            获取表单 Schema
 *   openyida publish <源文件路径> <appType> <formUuid>   编译并发布自定义页面
 *   openyida verify-short-url <appType> <formUuid> <url>           验证短链接 URL 是否可用
 *   openyida save-share-config <appType> <formUuid> <url> <isOpen> [openAuth]  保存公开访问/分享配置
 *   openyida get-page-config <appType> <formUuid>       查询页面公开访问/分享配置
 *   openyida update-form-config <appType> <formUuid> <isRenderNav> <title>  更新表单配置
 *   openyida export <appType> [output]                  导出应用所有表单 Schema（生成迁移包）
 *   openyida import <file> [name]                       导入迁移包，在目标环境重建应用
 */

"use strict";

const { checkUpdate } = require('../lib/check-update');
const { version: currentVersion } = require('../package.json');

// 异步检查更新，fire-and-forget，不阻塞主流程
const updateCheckPromise = checkUpdate(currentVersion);

const command = process.argv[2];
const args = process.argv.slice(3);

function printHelp() {
  console.log(`
openyida - 宜搭命令行工具

用法：
  openyida <命令> [参数...]（别名：yida）

命令：
  env                                                          检测当前 AI 工具环境和登录态
  copy [--force]                                               复制 project 工作目录到当前 AI 工具环境
  login                                                        登录态管理（优先缓存，否则扫码）
  logout                                                       退出登录 / 切换账号
  create-app "<名称>" [描述] [图标] [颜色]                      创建应用，输出 appType
  create-page <appType> "<页面名>"                             创建自定义页面，输出 pageId
  create-form create <appType> "<表单名>" <字段JSON>            创建表单页面
  create-form update <appType> <formUuid> <修改JSON>           更新表单页面
  get-schema <appType> <formUuid>                              获取表单 Schema
  publish <源文件路径> <appType> <formUuid>                    编译并发布自定义页面
  verify-short-url <appType> <formUuid> <url>                  验证短链接 URL 是否可用
  save-share-config <appType> <formUuid> <url> <isOpen> [auth] 保存公开访问/分享配置
  get-page-config <appType> <formUuid>                         查询页面公开访问/分享配置
  update-form-config <appType> <formUuid> <isRenderNav> <title> 更新表单配置
  export <appType> [output]                                    导出应用所有表单 Schema（生成迁移包）
  import <file> [name]                                         导入迁移包，在目标环境重建应用

示例：
  openyida login
  openyida logout
  openyida create-app "考勤管理"
  openyida create-page APP_XXX "游戏主页"
  openyida create-form create APP_XXX "员工信息" fields.json
  openyida create-form update APP_XXX FORM-XXX '[{"action":"add","field":{"type":"TextField","label":"备注"}}]'
  openyida get-schema APP_XXX FORM-XXX
  openyida publish pages/src/home.jsx APP_XXX FORM-XXX
  openyida verify-short-url APP_XXX FORM-XXX /o/myapp
  openyida save-share-config APP_XXX FORM-XXX /o/myapp y n
  openyida get-page-config APP_XXX FORM-XXX
  openyida update-form-config APP_XXX FORM-XXX false "页面标题"
  openyida export APP_XXX
  openyida export APP_XXX ./my-app-backup.json
  openyida import ./yida-export.json
  openyida import ./yida-export.json "质量追溯系统（生产环境）"
`);
}

/**
 * 检测是否首次运行（安装后第一次执行 openyida 命令）。
 * 通过 ~/.openyida/first-run-done 标记文件判断。
 * 若是首次运行，打印新手引导并写入标记文件。
 */
function handleFirstRunGuide() {
  const os = require('os');
  const path = require('path');
  const fs = require('fs');

  const OPENYIDA_DIR = path.join(os.homedir(), '.openyida');
  const FIRST_RUN_FLAG = path.join(OPENYIDA_DIR, 'first-run-done');

  // 已运行过，跳过引导
  if (fs.existsSync(FIRST_RUN_FLAG)) return;

  // 写入标记，避免重复展示
  try {
    fs.mkdirSync(OPENYIDA_DIR, { recursive: true });
    fs.writeFileSync(FIRST_RUN_FLAG, new Date().toISOString(), 'utf8');
  } catch {
    // 写入失败不影响主流程
  }

  const RESET   = '\x1b[0m';
  const BOLD    = '\x1b[1m';
  const DIM     = '\x1b[2m';
  const CYAN    = '\x1b[36m';
  const GREEN   = '\x1b[32m';
  const YELLOW  = '\x1b[33m';
  const BLUE    = '\x1b[34m';
  const MAGENTA = '\x1b[35m';
  const BG_CYAN = '\x1b[46m';
  const WHITE   = '\x1b[37m';

  const SEP = `${DIM}${'─'.repeat(60)}${RESET}`;

  console.log('');
  console.log(`${BG_CYAN}${WHITE}${BOLD}  🤖 OpenYida - AI 问答模式已开启！                         ${RESET}`);
  console.log(SEP);
  console.log(`  ${GREEN}${BOLD}欢迎首次使用 OpenYida！${RESET} 以下是快速上手指南：`);
  console.log('');
  console.log(`${BOLD}${CYAN}  📝 方式一：直接描述需求${RESET}`);
  console.log(`  在 AI 工具对话框中，直接告诉 AI 你想要什么：`);
  console.log('');
  console.log(`  ${YELLOW}「帮我用宜搭创建一个考勤管理系统」${RESET}`);
  console.log(`  ${YELLOW}「创建一个 CRM 客户管理系统」${RESET}`);
  console.log(`  ${YELLOW}「帮我搭建个人薪资计算器应用」${RESET}`);
  console.log('');
  console.log(`${BOLD}${CYAN}  💡 方式二：指定详细需求${RESET}`);
  console.log('');
  console.log(`  ${YELLOW}「创建一个员工入职流程，包含基本信息填写、部门审批、HR 备案」${RESET}`);
  console.log('');
  console.log(`${BOLD}${CYAN}  📋 示例应用${RESET}`);
  console.log('');
  console.log(`  ${MAGENTA}•${RESET} 薪资计算器    ${MAGENTA}•${RESET} 生日祝福小程序    ${MAGENTA}•${RESET} 企业宣传页`);
  console.log('');
  console.log(SEP);
  console.log(`${BOLD}${BLUE}  🔧 首次使用建议${RESET}`);
  console.log('');
  console.log(`  1. 运行 ${CYAN}openyida env${RESET}   检测环境和登录态`);
  console.log(`  2. 运行 ${CYAN}openyida login${RESET} 登录宜搭账号`);
  console.log(`  3. 在 AI 工具中直接对话，描述你想要的应用 🚀`);
  console.log('');
  console.log(SEP);
  console.log(`  ${DIM}支持的 AI 工具：Claude Code / Aone Copilot / Cursor / OpenCode${RESET}`);
  console.log(`  ${DIM}📚 文档：https://github.com/openyida/openyida${RESET}`);
  console.log('');
  console.log(`  ${DIM}（此引导仅首次运行时显示，运行 openyida --help 查看所有命令）${RESET}`);
  console.log('');
}

async function main() {
  if (!command || command === '--help' || command === '-h') {
    handleFirstRunGuide();
    printHelp();
    process.exit(0);
  }

  if (command === '--version' || command === '-v') {
    console.log(currentVersion);
    process.exit(0);
  }

  switch (command) {
    case 'env': {
      const { run } = require('../lib/env');
      run();
      break;
    }

    case 'copy': {
      const { run } = require('../lib/copy');
      run();
      break;
    }

    case 'login': {
      const { ensureLogin, checkLoginOnly } = require('../lib/login');
      if (args[0] === '--check-only') {
        const result = checkLoginOnly();
        console.log(JSON.stringify(result, null, 2));
      } else {
        const result = ensureLogin();
        console.log(JSON.stringify(result));
      }
      break;
    }

    case 'logout': {
      const { logout } = require('../lib/login');
      logout();
      break;
    }

    case 'create-app': {
      const { run } = require('../lib/create-app');
      await run(args);
      break;
    }

    case 'create-page': {
      const { run } = require('../lib/create-page');
      await run(args);
      break;
    }

    case 'create-form': {
      // create-form.js 通过 process.argv.slice(2) 读取参数，注入子命令及其参数
      process.argv = [process.argv[0], process.argv[1], ...args];
      require('../lib/create-form');
      break;
    }

    case 'get-schema': {
      const { run } = require('../lib/get-schema');
      await run(args);
      break;
    }

    case 'publish': {
      // 参数顺序：<源文件路径> <appType> <formUuid>
      // publish.js 内部读取顺序：argv[2]=appType, argv[3]=formUuid, argv[4]=sourceFile
      if (args.length < 3) {
        console.error('用法: openyida publish <源文件路径> <appType> <formUuid>');
        console.error('示例: openyida publish pages/src/home.jsx APP_XXX FORM-XXX');
        process.exit(1);
      }
      const [sourceFile, appType, formUuid] = args;
      process.argv = [process.argv[0], process.argv[1], appType, formUuid, sourceFile];
      require('../lib/publish');
      break;
    }

    case 'verify-short-url': {
      if (args.length < 3) {
        console.error('用法: openyida verify-short-url <appType> <formUuid> <url>');
        console.error('示例: openyida verify-short-url APP_XXX FORM-XXX /o/myapp');
        process.exit(1);
      }
      process.argv = [process.argv[0], process.argv[1], ...args];
      require('../lib/verify-short-url');
      break;
    }

    case 'save-share-config': {
      if (args.length < 4) {
        console.error('用法: openyida save-share-config <appType> <formUuid> <url> <isOpen> [openAuth]');
        console.error('示例: openyida save-share-config APP_XXX FORM-XXX /o/myapp y n');
        process.exit(1);
      }
      process.argv = [process.argv[0], process.argv[1], ...args];
      require('../lib/save-share-config');
      break;
    }

    case 'get-page-config': {
      if (args.length < 2) {
        console.error('用法: openyida get-page-config <appType> <formUuid>');
        console.error('示例: openyida get-page-config APP_XXX FORM-XXX');
        process.exit(1);
      }
      process.argv = [process.argv[0], process.argv[1], ...args];
      require('../lib/get-page-config');
      break;
    }

    case 'update-form-config': {
      if (args.length < 4) {
        console.error('用法: openyida update-form-config <appType> <formUuid> <isRenderNav> <title>');
        console.error('示例: openyida update-form-config APP_XXX FORM-XXX false "页面标题"');
        process.exit(1);
      }
      process.argv = [process.argv[0], process.argv[1], ...args];
      require('../lib/update-form-config');
      break;
    }

    case 'export': {
      if (args.length < 1) {
        console.error('用法: openyida export <appType> [output]');
        console.error('示例: openyida export APP_XXX');
        console.error('      openyida export APP_XXX ./my-app-backup.json');
        process.exit(1);
      }
      const { run: runExport } = require('../lib/export-app');
      await runExport(args);
      break;
    }

    case 'import': {
      if (args.length < 1) {
        console.error('用法: openyida import <file> [name]');
        console.error('示例: openyida import ./yida-export.json');
        console.error('      openyida import ./yida-export.json "质量追溯系统（生产环境）"');
        process.exit(1);
      }
      const { run: runImport } = require('../lib/import-app');
      await runImport(args);
      break;
    }

    default: {
      console.error(`未知命令: ${command}`);
      console.error('运行 openyida --help 查看帮助');
      process.exit(1);
    }
  }
}

main()
  .then(() => updateCheckPromise)
  .catch((err) => {
    console.error(`\n❌ 执行失败: ${err.message}`);
    process.exit(1);
  });

