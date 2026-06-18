@echo off
setlocal

cd /d "%~dp0"

if not exist "logs" mkdir logs

start "" /MIN cmd /c "cd /d ""%cd%"" && node server.js > logs\server.log 2>&1"

endlocal