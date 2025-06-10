@echo off
echo 🛑 Stopping Zipperoo E-commerce Platform...
echo.

echo 📦 Stopping Docker services...
docker-compose down

echo.
echo ✅ All services stopped.
echo 💾 Data is preserved in: .\data\
echo.
pause 