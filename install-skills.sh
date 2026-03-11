#!/bin/bash

# OpenYIDA Skills 安装脚本
# 功能：从 Git 仓库获取 skills 并安装到 .claude 目录

set -e

# 配置
SKILLS_REPO="https://github.com/openyida/yida-skills.git"
SKILLS_REPO_SSH="git@github.com:openyida/yida-skills.git"
SKILLS_BRANCH="main"
CLAUDE_DIR=".claude"
CACHE_DIR=".cache"

# 检测是否可以使用 SSH
if ssh -T -o BatchMode=yes git@github.com 2>/dev/null; then
    SKILLS_REPO="$SKILLS_REPO_SSH"
    echo "🔑 检测到 SSH 认证可用，使用 SSH 方式克隆"
else
    echo "📝 使用 HTTP 方式克隆（可能需要输入密码）"
fi

echo "🚀 开始安装 OpenYIDA Skills..."

# 获取绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE_PATH="$SCRIPT_DIR/$CACHE_DIR"
CLAUDE_PATH="$SCRIPT_DIR/$CLAUDE_DIR"

# 确保 .cache 目录存在
mkdir -p "$CACHE_PATH"

REPO_CACHE_PATH="$CACHE_PATH/yida-skills"

# 克隆或更新 skills 仓库到 .cache 目录
if [ -d "$REPO_CACHE_PATH/.git" ] && [ -d "$REPO_CACHE_PATH/skills" ]; then
    echo "🔄 检测到已缓存的仓库，正在拉取最新代码..."
    cd "$REPO_CACHE_PATH"
    git pull origin "$SKILLS_BRANCH"
    cd "$SCRIPT_DIR"
    echo "✅ 仓库已更新到最新版本！"
else
    echo "📦 克隆 skills 仓库到缓存目录..."
    echo "   仓库地址：$SKILLS_REPO"
    echo "   分支：$SKILLS_BRANCH"
    rm -rf "$REPO_CACHE_PATH"
    git clone -b "$SKILLS_BRANCH" --depth 1 "$SKILLS_REPO" "$REPO_CACHE_PATH"
    echo "✅ 仓库克隆成功！"
fi

# 确保 .claude 目录存在
mkdir -p "$CLAUDE_PATH"

# 将 skills 目录移动到 .claude 中（覆盖已有内容）
echo "📂 移动 skills 目录到 $CLAUDE_DIR..."
if [ -d "$REPO_CACHE_PATH/skills" ]; then
    rm -rf "$CLAUDE_PATH/skills"
    mv "$REPO_CACHE_PATH/skills" "$CLAUDE_PATH/skills"
    echo "✅ skills 目录移动完成！"
else
    echo "❌ 缓存仓库中未找到 skills 目录"
    exit 1
fi

# 验证安装
if [ -d "$CLAUDE_PATH/skills" ]; then
    echo "✅ Skills 安装成功！"
    echo ""
    echo "📂 安装位置：$CLAUDE_PATH/skills"
    echo ""

    # 显示安装的 skills 列表
    echo "📦 已安装的 Skills:"
    ls -1 "$CLAUDE_PATH/skills" | cat
else
    echo "❌ 安装失败"
    exit 1
fi

echo ""
echo "🎉 安装完成！"
