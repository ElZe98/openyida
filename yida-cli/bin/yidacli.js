#!/usr/bin/env node
/**
 * yidacli - 宜搭命令行工具
 *
 * 命令列表：
 *   yidacli env                                        检测当前 AI 工具环境和登录态
 *   yidacli copy [--force]                             复制 openyida 工作目录到当前 AI 工具环境
 *   yidacli login                                      登录态管理
 *   yidacli logout                                     退出登录
 *   yidacli create-app "<名称>" [desc] [icon] [color]  创建应用
 *   yidacli create-page <appType> "<页面名>"            创建自定义页面
 *   yidacli create-form create <appType> "<表单名>" <字段JSON>  创建表单页面
 *   yidacli create-form update <appType> <formUuid> <修改JSON>  更新表单页面
 *   yidacli get-schema <appType> <formUuid>            获取表单 Schema
 *   yidacli publish <源文件路径> <appType> <formUuid>   编译并发布自定义页面
 *   yidacli verify-short-url <appType> <formUuid> <url>           验证短链接 URL 是否可用
 *   yidacli save-share-config <appType> <formUuid> <url> <isOpen> [openAuth]  保存公开访问/分享配置
 *   yidacli get-page-config <appType> <formUuid>       查询页面公开访问/分享配置
 *   yidacli update-form-config <appType> <formUuid> <isRenderNav> <title>  更新表单配置
 */

"use strict";

const { checkUpdate } = require('../dist/check-update');
const { version: currentVersion } = require('../package.json');

// 异步检查更新，fire-and-forget，不阻塞主流程
const updateCheckPromise = checkUpdate(currentVersion);

const command = process.argv[2];
const args = process.argv.slice(3);

function printHelp() {
  console.log(`
yidacli - 宜搭命令行工具

用法：
  yidacli <命令> [参数...]

命令：
  env                                                          检测当前 AI 工具环境和登录态
  copy [--force]                                               复制 openyida 工作目录到当前 AI 工具环境
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

示例：
  yidacli login
  yidacli logout
  yidacli create-app "考勤管理"
  yidacli create-page APP_XXX "游戏主页"
  yidacli create-form create APP_XXX "员工信息" fields.json
  yidacli create-form update APP_XXX FORM-XXX '[{"action":"add","field":{"type":"TextField","label":"备注"}}]'
  yidacli get-schema APP_XXX FORM-XXX
  yidacli publish pages/src/home.jsx APP_XXX FORM-XXX
  yidacli verify-short-url APP_XXX FORM-XXX /o/myapp
  yidacli save-share-config APP_XXX FORM-XXX /o/myapp y n
  yidacli get-page-config APP_XXX FORM-XXX
  yidacli update-form-config APP_XXX FORM-XXX false "页面标题"
`);
}

async function main() {
  if (!command || command === '--help' || command === '-h') {
    printHelp();
    process.exit(0);
  }

  if (command === '--version' || command === '-v') {
    console.log(currentVersion);
    process.exit(0);
  }

  switch (command) {
    case 'env': {
      const { run } = require('../dist/env');
      run();
      break;
    }

    case 'copy': {
      const { run } = require('../dist/copy');
      run();
      break;
    }

    case 'login': {
      const { ensureLogin, checkLoginOnly } = require('../dist/login');
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
      const { logout } = require('../dist/login');
      logout();
      break;
    }

    case 'create-app': {
      const { run } = require('../dist/create-app');
      await run(args);
      break;
    }

    case 'create-page': {
      const { run } = require('../dist/create-page');
      await run(args);
      break;
    }

    case 'create-form': {
      // 透传所有参数给 create-form.js（它自己处理 create/update 模式）
      // 原脚本通过 process.argv.slice(2) 读取参数，需要注入到 argv
      process.argv = [process.argv[0], process.argv[1], ...args];
      require('../dist/create-form');
      break;
    }

    case 'get-schema': {
      const { run } = require('../dist/get-schema');
      await run(args);
      break;
    }

    case 'publish': {
      // 原 publish.js 参数顺序：<appType> <formUuid> <源文件路径>
      // yidacli 新顺序：<源文件路径> <appType> <formUuid>
      // 需要重排参数
      if (args.length < 3) {
        console.error('用法: yidacli publish <源文件路径> <appType> <formUuid>');
        console.error('示例: yidacli publish pages/src/home.jsx APP_XXX FORM-XXX');
        process.exit(1);
      }
      const [sourceFile, appType, formUuid] = args;
      // 注入重排后的参数（原脚本读取 argv[2]=appType, argv[3]=formUuid, argv[4]=sourceFile）
      process.argv = [process.argv[0], process.argv[1], appType, formUuid, sourceFile];
      require('../dist/publish');
      break;
    }

    case 'verify-short-url': {
      if (args.length < 3) {
        console.error('用法: yidacli verify-short-url <appType> <formUuid> <url>');
        console.error('示例: yidacli verify-short-url APP_XXX FORM-XXX /o/myapp');
        process.exit(1);
      }
      process.argv = [process.argv[0], process.argv[1], ...args];
      require('../dist/verify-short-url');
      break;
    }

    case 'save-share-config': {
      if (args.length < 4) {
        console.error('用法: yidacli save-share-config <appType> <formUuid> <url> <isOpen> [openAuth]');
        console.error('示例: yidacli save-share-config APP_XXX FORM-XXX /o/myapp y n');
        process.exit(1);
      }
      process.argv = [process.argv[0], process.argv[1], ...args];
      require('../dist/save-share-config');
      break;
    }

    case 'get-page-config': {
      if (args.length < 2) {
        console.error('用法: yidacli get-page-config <appType> <formUuid>');
        console.error('示例: yidacli get-page-config APP_XXX FORM-XXX');
        process.exit(1);
      }
      process.argv = [process.argv[0], process.argv[1], ...args];
      require('../dist/get-page-config');
      break;
    }

    case 'update-form-config': {
      if (args.length < 4) {
        console.error('用法: yidacli update-form-config <appType> <formUuid> <isRenderNav> <title>');
        console.error('示例: yidacli update-form-config APP_XXX FORM-XXX false "页面标题"');
        process.exit(1);
      }
      process.argv = [process.argv[0], process.argv[1], ...args];
      require('../dist/update-form-config');
      break;
    }

    default: {
      console.error(`未知命令: ${command}`);
      console.error('运行 yidacli --help 查看帮助');
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
