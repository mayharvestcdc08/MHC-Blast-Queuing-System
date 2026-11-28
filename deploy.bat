@echo off
title Cloudflare Worker Deploy - MHC Blast Queuing System
cd /d "%~dp0"
echo ========================================================
echo  MHC Blast Queuing System - Cloudflare Deployment
echo ========================================================
echo.

echo [1/2] Checking Wrangler authentication...
call npx.cmd wrangler whoami >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ----------------------------------------------------
    echo  Wrangler needs login. Opening Cloudflare in browser...
    echo  Pindutin lamang ang 'Allow' sa magbubukas na web browser.
    echo ----------------------------------------------------
    echo.
    call npx.cmd wrangler login
)

echo.
echo [2/2] Deploying latest updates to Cloudflare Workers...
echo.
call npx.cmd wrangler deploy

echo.
echo ========================================================
echo  Deployment process finished!
echo ========================================================
echo.
pause
