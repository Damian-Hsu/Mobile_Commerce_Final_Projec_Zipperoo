@echo off
echo 🌐 Starting Zipperoo E-commerce Platform...
echo.

REM Check if Docker is running
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo 🚀 Starting services...
docker-compose up -d

echo.
echo ⏳ Waiting for services to initialize...
timeout /t 15 >nul

echo.
echo 📊 Checking service status...
docker-compose ps

echo.
echo 📋 Checking backend logs...
docker-compose logs backend --tail=10

echo.
echo ✅ Services are running:
echo    🌐 Zipperoo Platform: http://localhost
echo    📋 API Tester: http://localhost/api-tester.html
echo    📱 Direct Backend API: http://localhost:3001
echo    🗄️  PostgreSQL: localhost:5433 (local data storage)
echo    📝 Redis: localhost:6380 (local data storage)
echo.
echo 💾 Data is stored locally in: .\data\
echo 🔄 To reset database: delete the .\data\ folder
echo.
echo Press any key to continue...
pause >nul 