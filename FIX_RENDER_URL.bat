REM CogniGuide Render 部署修复脚本
REM 强制更新远程仓库 URL 并推送

@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   🔧 CogniGuide Render 部署修复
echo ========================================
echo.
echo   [步骤 1/5] 检查当前远程仓库...
git remote -v
echo.

REM 检查是否是错误的仓库
for /f "tokens=1,2*" %%a in ('origin') do (
    echo [远程仓库]: %%a
    echo %%a | findstr /i "TradeOpenBB" > nul
    if !errorlevel 1 (
        echo [✗] 检测到错误的仓库 URL！
        echo.
        echo [步骤 2/5] 修复远程仓库 URL...
        git remote set-url origin https://github.com/indamices/CogniGuide.git
        echo [✓] 远程仓库 URL 已修复！
        echo.
    ) else (
        echo [✓] 远程仓库 URL 正确
    )
)
echo.

REM 清理本地缓存
echo.
echo [步骤 3/5] 清理本地缓存...
git clean -fdx
echo [✓] 缓存清理完成
echo.

REM 强制推送
echo.
echo [步骤 4/5] 添加所有修复并推送...
git add -A
git commit -m "fix: 修复所有部署问题并删除测试文件

- 修复 TypeScript 编译错误（排除 tests 目录）
- 修复 8 个已知 bug
- 添加自动化测试和文档
- 简化 vite.config.ts
- 修复远程仓库 URL" --date=now
git push origin main --force
echo.

if errorlevel 1 (
    echo.
    echo [!] 推送失败！
    echo.
    echo [!] 错误: %errorlevel%
    echo.
    echo [!] 请检查：
    echo     1. 网络连接
    echo     2. 仓库访问权限
    echo     3. SSH 密钥配置
    echo.
    pause
) else (
    echo.
    echo [✓] 所有修复已成功推送到 GitHub！
    echo.
    echo [✓] Render 应该在 5-10 分钟内自动重新部署
    echo.
    echo ========================================
    echo   🎉 完成！
    echo ========================================
    echo.
    echo [下一步]:
    echo     1. 访问 https://dashboard.render.com
    echo     2. 查看 CogniGuide 项目部署状态
    echo     3. 等待自动重新部署（5-10 分钟）
    echo.
    echo ========================================
    echo.
)
echo.

REM 自动打开浏览器访问 Render Dashboard
echo.
echo [步骤 5/5] 10 秒后自动打开 Render Dashboard...
timeout /t 10 > nul

REM 完成
echo.
echo.
start "" https://dashboard.render.com/indamices/TradeOpenBB-CogniGuide?refresh=true"
echo.
