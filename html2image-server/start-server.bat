@echo off
REM ============================================================================
REM html2image-server - Start script (Windows)
REM Thin wrapper that delegates to `node start.js`.
REM Doing the real work in Node.js avoids all cmd.exe encoding / escaping /
REM codepage issues that plague .bat files, especially on systems where the
REM project path contains non-ASCII characters.
REM ============================================================================
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found in PATH.
    pause
    exit /b 1
)

node "%~dp0start.js"

REM Pause only if the user double-clicked the .bat (so they can see the result)
REM If launched from an already-open cmd, no pause is needed.
if "%cmdcmdline%" neq "" (
    echo "%cmdcmdline%" | findstr /I /C:"%~nx0" | findstr /I /C:"start "" " >nul
    if not errorlevel 1 pause
)
endlocal
exit /b %ERRORLEVEL%
