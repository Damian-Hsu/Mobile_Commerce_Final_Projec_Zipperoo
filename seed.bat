@echo off
echo.
echo ===============================================
echo 🌱 Seeding Database in Docker Container
echo ===============================================
echo.
echo 1/3: Checking if backend container is running...
docker-compose ps backend | findstr /R " Up .*running" >nul
if errorlevel 1 (
    echo [ERROR] Backend container is not running.
    echo Please start all services with 'start.bat' first.
    pause
    exit /b 1
)
echo [OK] Backend container is running.
echo.

echo 2/3: Building project inside the container...
docker-compose exec backend npm run build
if errorlevel 1 (
    echo [ERROR] Build failed! Please check the logs above.
    pause
    exit /b 1
)
echo [OK] Project built successfully.
echo.

echo 3/3: Running seed script...
docker-compose exec backend npm run seed
if errorlevel 0 (
    echo.
    echo ===============================================
    echo ✅ Database seeding completed successfully!
    echo ===============================================
    echo.
    echo Test accounts created:
    echo   - Admin:  admin / 123456
    echo   - Seller: seller / 123456
    echo   - Buyer:  buyer / 123456
    echo.
) else (
    echo.
    echo ===============================================
    echo ❌ Database seeding failed!
    echo ===============================================
    echo.
)

pause 