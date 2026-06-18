@echo off
echo ================================================
echo   html2image-server - Stop
echo ================================================
echo.

REM Method 1: Terminate by port
echo 1. Trying to terminate by port 3001...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
    echo    Found process PID: %%p
    taskkill /F /PID %%p
)

REM Method 2: Terminate by process name
echo.
echo 2. Trying to terminate node.exe with server.js...
wmic process where "name='node.exe' and commandline like '%server.js%'" call terminate >nul 2>&1

REM Method 3: Force terminate all node.exe processes (last resort)
echo.
echo 3. Force terminating all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

REM Clean up PID file
if exist ".app.pid" (
    del ".app.pid"
    echo.
    echo Cleaned up PID file
)

echo.
echo ================================================
echo   Stop completed!
echo ================================================
pause