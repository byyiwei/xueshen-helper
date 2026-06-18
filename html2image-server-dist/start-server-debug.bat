@echo off
echo ================================================
echo   html2image-server - Debug Start
echo ================================================
echo.

cd /d "%~dp0"

echo [DEBUG] Current directory: %cd%
echo.

echo [DEBUG] Checking Node.js...
where node
echo.

echo [DEBUG] Checking server.js exists...
if exist "server.js" (
    echo [OK] server.js exists
) else (
    echo [ERROR] server.js not found
)
echo.

echo [DEBUG] Checking node_modules...
if exist "node_modules" (
    echo [OK] node_modules exists
) else (
    echo [ERROR] node_modules not found
)
echo.

echo [DEBUG] Checking config.json...
if exist "config.json" (
    echo [OK] config.json exists
) else (
    echo [ERROR] config.json not found
)
echo.

echo [DEBUG] Creating logs directory...
mkdir logs >nul 2>&1
echo [OK] Logs directory created
echo.

echo [DEBUG] Starting server...
node server.js
echo.
echo [DEBUG] Server exited with code: %errorlevel%
pause