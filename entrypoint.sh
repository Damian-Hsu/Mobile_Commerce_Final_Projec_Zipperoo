#!/bin/bash
set -e

echo ">> Starting Zipperoo Backend..."

# Wait for database to be ready
echo ">> Waiting for database connection..."
until pg_isready -h postgres -p 5432 -U zipperoo -d zipperoo_db; do
  echo "Database not ready, waiting 2 seconds..."
  sleep 2
done

echo ">> Database connection established!"

# Generate Prisma client
echo ">> Generating Prisma client..."
npx prisma generate

# Check and initialize database if needed
echo ">> Checking if database needs initialization..."
if npx prisma db execute --stdin <<< "SELECT 1 FROM users LIMIT 1;" 2>/dev/null; then
    echo ">> Database already initialized, skipping..."
else
    echo ">> Database empty, initializing tables..."
    npx prisma db push
    echo ">> Database initialized successfully!"
fi

# Start the application
echo ">>Starting NestJS application..."
exec "$@" 