@echo off
REM ============================================================================
REM html2image-server - Stop script (Windows)
REM Thin wrapper that delegates to `node stop.js`.
REM The Node.js script handles all platform-specific process-scanning logic
REM (PID file, wmic, netstat, etc.) and is not affected by cmd.exe encoding /
REM codepage issues (important when project path contains non-ASCII chars).
REM ============================================================================
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found in PATH.
    pause
    exit /b 1
)

node "%~dp0stop.js"

REM Pause only when double-clicked from Explorer
if "%cmdcmdline%" neq "" (
    echo "%cmdcmdline%" | findstr /I /C:"%~nx0" | findstr /I /C:"start "" " >nul
    if not errorlevel 1 pause
)
endlocal
exit /b %ERRORLEVEL%
