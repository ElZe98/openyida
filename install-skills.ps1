# OpenYIDA Skills 安装脚本 (Windows PowerShell)
# 功能：从 Git 仓库获取 skills 并安装到 .claude 目录

$ErrorActionPreference = "Stop"

# 配置
$SkillsRepoHttps = "https://github.com/openyida/yida-skills.git"
$SkillsRepoSsh = "git@github.com:openyida/yida-skills.git"
$SkillsBranch = "main"
$ClaudeDir = ".claude"
$CacheDir = ".cache"

# 检测是否可以使用 SSH
$SkillsRepo = $SkillsRepoHttps
try {
    $sshResult = & ssh -T -o BatchMode=yes git@github.com 2>&1
    # ssh 返回码 1 表示认证成功但无 shell（GitHub 的正常响应）
    if ($LASTEXITCODE -eq 1 -or ($sshResult -match "successfully authenticated")) {
        $SkillsRepo = $SkillsRepoSsh
        Write-Host "🔑 检测到 SSH 认证可用，使用 SSH 方式克隆"
    } else {
        Write-Host "📝 使用 HTTP 方式克隆（可能需要输入密码）"
    }
} catch {
    Write-Host "📝 使用 HTTP 方式克隆（可能需要输入密码）"
}

Write-Host "🚀 开始安装 OpenYIDA Skills..."

# 获取脚本所在目录的绝对路径
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
if (-not $ScriptDir) {
    $ScriptDir = Get-Location
}
$CachePath = Join-Path $ScriptDir $CacheDir
$ClaudePath = Join-Path $ScriptDir $ClaudeDir

# 确保 .cache 目录存在
if (-not (Test-Path $CachePath)) {
    New-Item -ItemType Directory -Path $CachePath | Out-Null
}

$RepoCachePath = Join-Path $CachePath "yida-skills"

# 克隆或更新 skills 仓库到 .cache 目录
if ((Test-Path (Join-Path $RepoCachePath ".git")) -and (Test-Path (Join-Path $RepoCachePath "skills"))) {
    Write-Host "🔄 检测到已缓存的仓库，正在拉取最新代码..."
    Push-Location $RepoCachePath
    try {
        & git pull origin $SkillsBranch
        if ($LASTEXITCODE -ne 0) {
            throw "git pull 失败"
        }
    } finally {
        Pop-Location
    }
    Write-Host "✅ 仓库已更新到最新版本！"
} else {
    Write-Host "📦 克隆 skills 仓库到缓存目录..."
    Write-Host "   仓库地址：$SkillsRepo"
    Write-Host "   分支：$SkillsBranch"
    if (Test-Path $RepoCachePath) {
        Remove-Item -Recurse -Force $RepoCachePath
    }
    & git clone -b $SkillsBranch --depth 1 $SkillsRepo $RepoCachePath
    if ($LASTEXITCODE -ne 0) {
        throw "git clone 失败，请检查网络连接或仓库地址"
    }
    Write-Host "✅ 仓库克隆成功！"
}

# 确保 .claude 目录存在
if (-not (Test-Path $ClaudePath)) {
    New-Item -ItemType Directory -Path $ClaudePath | Out-Null
}

# 将 skills 目录移动到 .claude 中（覆盖已有内容）
Write-Host "📂 移动 skills 目录到 $ClaudeDir..."
$SourceSkillsPath = Join-Path $RepoCachePath "skills"
$DestSkillsPath = Join-Path $ClaudePath "skills"

if (Test-Path $SourceSkillsPath) {
    if (Test-Path $DestSkillsPath) {
        Remove-Item -Recurse -Force $DestSkillsPath
    }
    Move-Item -Path $SourceSkillsPath -Destination $DestSkillsPath
    Write-Host "✅ skills 目录移动完成！"
} else {
    Write-Host "❌ 缓存仓库中未找到 skills 目录"
    exit 1
}

# 验证安装
if (Test-Path $DestSkillsPath) {
    Write-Host "✅ Skills 安装成功！"
    Write-Host ""
    Write-Host "📂 安装位置：$DestSkillsPath"
    Write-Host ""

    # 显示安装的 skills 列表
    Write-Host "📦 已安装的 Skills:"
    Get-ChildItem -Directory $DestSkillsPath | Select-Object -ExpandProperty Name
} else {
    Write-Host "❌ 安装失败"
    exit 1
}

Write-Host ""
Write-Host "🎉 安装完成！"
