@echo off
echo 🚀 Starting Zipperoo Backend Development Environment
echo.

echo 📦 Installing dependencies...
cd ./backend
call npm install

echo.
echo 🗄️ Starting database...
cd ..
docker-compose up -d postgres redis

echo.
echo ⚡ Waiting for database to start...
timeout /t 5 /nobreak >nul

echo.
echo 🔄 Syncing database schema...
cd ./backend
echo y | call npx prisma db push --force-reset

echo.
echo 🌱 Generating Prisma client...
call npx prisma generate

echo.
echo 🌱 Seeding test data...
call npm run seed

echo.
echo 🎯 Starting development server...
call npm run start:dev

pause 