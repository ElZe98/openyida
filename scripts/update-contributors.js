#!/usr/bin/env node

/**
 * 手动更新 README contributors 的脚本
 * 
 * 使用方法：
 *   node scripts/update-contributors.js
 * 
 * 或者添加到 package.json scripts：
 *   npm run contributors
 * 
 * 需要设置环境变量 GITHUB_TOKEN（可选，不设置会使用 gh auth 状态）
 *   export GITHUB_TOKEN=your_token
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO = process.env.GITHUB_REPOSITORY || 'openyida/openyida';

// 获取 GitHub Token
function getGitHubToken() {
  // 优先使用环境变量
  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }
  
  // 尝试从 gh auth 获取
  try {
    const token = execSync('gh auth token', { encoding: 'utf-8' }).trim();
    if (token) return token;
  } catch (e) {
    // gh auth token 命令失败，继续使用匿名请求
  }
  
  return null;
}

// 执行 gh api 命令
function ghApi(endpoint, token) {
  const env = { ...process.env };
  if (token) {
    env.GH_TOKEN = token;
  }
  
  try {
    const result = execSync(
      `gh api "${endpoint}" --paginate`,
      { encoding: 'utf-8', env, maxBuffer: 10 * 1024 * 1024 }
    );
    return JSON.parse(result);
  } catch (e) {
    console.error(`⚠️  API 请求失败: ${e.message}`);
    return null;
  }
}

// 主函数
async function main() {
  console.log('📋 获取仓库所有贡献者...');
  
  const token = getGitHubToken();
  if (!token) {
    console.log('ℹ️  未设置 GITHUB_TOKEN，使用 gh auth 状态或匿名请求');
  }
  
  // 获取所有贡献者
  const contributors = ghApi(`repos/${REPO}/contributors?per_page=100&anon=false`, token);
  
  if (!contributors || contributors.length === 0) {
    console.log('⚠️  未获取到贡献者数据');
    process.exit(1);
  }
  
  console.log(`✅ 共获取到 ${contributors.length} 位贡献者`);
  
  // 读取当前 README
  const readmePath = path.join(process.cwd(), 'README.md');
  let readmeContent;
  try {
    readmeContent = fs.readFileSync(readmePath, 'utf-8');
  } catch (e) {
    console.error(`⚠️  读取 README.md 失败: ${e.message}`);
    process.exit(1);
  }
  
  // 提取 README 中已有的贡献者用户名（小写，去重）
  const existingUsers = new Set(
    [...readmeContent.matchAll(/href="https:\/\/github\.com\/([^"]+)"/g)]
      .map(m => m[1].toLowerCase())
  );
  
  console.log('\n=== 当前 README 中已有贡献者 ===');
  [...existingUsers].sort().forEach(u => console.log(`  - ${u}`));
  
  // 机器人账号关键词（跳过）
  const botPatterns = /\[bot\]|dependabot|github-actions|renovate|actions-user/i;
  
  // 找出新贡献者
  const newContributors = [];
  
  for (const contributor of contributors) {
    const login = contributor.login;
    const avatarUrl = contributor.avatar_url;
    const htmlUrl = contributor.html_url || `https://github.com/${login}`;
    
    if (!login) continue;
    
    // 跳过机器人
    if (botPatterns.test(login)) {
      console.log(`  🤖 跳过机器人: ${login}`);
      continue;
    }
    
    // 跳过已在 README 中的贡献者
    if (existingUsers.has(login.toLowerCase())) {
      console.log(`  ⏭️  已存在: ${login}`);
      continue;
    }
    
    console.log(`  ✨ 新贡献者: ${login}`);
    
    // 构建头像 HTML（与现有格式一致，强制 v=4）
    const avatarV4 = avatarUrl.replace(/\?v=\d+/, '?v=4');
    const avatar48 = `${avatarV4}&s=48`;
    
    newContributors.push({
      login,
      html: `<a href="${htmlUrl}"><img src="${avatar48}" width="48" height="48" alt="${login}" title="${login}"/></a>`
    });
  }
  
  if (newContributors.length === 0) {
    console.log('\n✅ 没有新贡献者需要添加');
    process.exit(0);
  }
  
  console.log(`\n📝 添加 ${newContributors.length} 位新贡献者到 README...`);
  
  // 获取所有 README 文件
  const readmeFiles = fs.readdirSync(process.cwd())
    .filter(f => f.startsWith('README') && f.endsWith('.md'));
  
  console.log(`📋 找到 ${readmeFiles.length} 个 README 文件`);
  
  // 正则匹配 contributors 区域
  const pattern = /(<p align="left" id="contributors">)(.*?)(<\/p>)/gs;
  const newHtmlStr = ' ' + newContributors.map(c => c.html).join(' ');
  
  let updatedCount = 0;
  
  for (const file of readmeFiles) {
    const filePath = path.join(process.cwd(), file);
    let content;
    
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch (e) {
      console.error(`  ⚠️  读取 ${file} 失败: ${e.message}`);
      continue;
    }
    
    const updatedContent = content.replace(pattern, (match, p1, p2, p3) => {
      return p1 + p2.trimEnd() + newHtmlStr + '\n' + p3;
    });
    
    if (updatedContent !== content) {
      fs.writeFileSync(filePath, updatedContent, 'utf-8');
      console.log(`  ✅ ${file} 已更新`);
      updatedCount++;
    } else {
      console.log(`  ⏭️  ${file} 未匹配到 contributors 区域`);
    }
  }
  
  console.log(`\n✅ 共更新 ${updatedCount} 个 README 文件`);
  console.log('\n💡 提示: 请手动检查更改并提交');
  console.log('   git diff README*.md');
  console.log('   git add README*.md && git commit -m "chore: 更新 contributors"');
}

main().catch(e => {
  console.error('❌ 执行失败:', e);
  process.exit(1);
});
