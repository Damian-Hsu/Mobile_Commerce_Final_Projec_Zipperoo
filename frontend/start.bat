@echo off
echo Starting Zipperoo Frontend Server...
echo.

:: 檢查並終止佔用 2004 端口的進程
echo Checking for processes using port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING"') do (
    echo Terminating process with PID: %%a
    taskkill /PID %%a /F >nul 2>&1
)

:: 等待端口釋放
timeout /t 2 /nobreak >nul

:: 啟動伺服器
echo Starting server on http://localhost:3000
echo Press Ctrl+C to stop the server
echo.
npm start

pause 