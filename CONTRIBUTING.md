# Contributing to OpenYiDA

Welcome! We're excited that you're interested in contributing. Please read this guide to get started.

## Ways to Contribute

- **Report bugs** - Open an issue with details about the problem
- **Suggest features** - Share your ideas in the issue tracker
- **Improve documentation** - Help make the docs clearer and more complete
- **Add new skills** - Extend the skill package for more capabilities
- **Submit code changes** - Fix bugs or add new features

## Development Setup

```bash
# Fork and clone the repository
git clone git@github.com:your-username/openyida.git
cd openyida

# 安装 Skills（无需 Node 环境，自动检测网络，国内自动使用加速源）
# Mac / Linux：
bash install-skills.sh
# Mac / Linux（强制使用国内加速源）：
# bash install-skills.sh --cn
# Windows（PowerShell）：
# .\install-skills.ps1
# Windows（强制使用国内加速源）：
# .\install-skills.ps1 --cn

# 安装 Python 依赖
# 国内用户推荐使用阿里云镜像加速：
pip install playwright -i https://mirrors.aliyun.com/pypi/simple/
playwright install chromium
# 海外用户：
# pip install playwright && playwright install chromium

# 安装 Node 依赖（发布页面时需要）
# 国内用户推荐使用淘宝镜像加速：
cd .claude/skills/skills/yida-publish-page/scripts && npm install --registry https://registry.npmmirror.com
# 海外用户：
# cd .claude/skills/skills/yida-publish-page/scripts && npm install
```

## Submitting Changes

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and commit: `git commit -m "Add your feature"`
3. Push to your fork: `git push origin feature/your-feature`
4. Open a Pull Request

## Code Style

- Follow existing code conventions in the project
- Keep changes focused and minimal
- Write clear commit messages

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
