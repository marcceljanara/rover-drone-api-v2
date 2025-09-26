#!/bin/sh
set -e

echo "⏳ Waiting for Postgres..."
until nc -z db 5432; do
  sleep 1
done
echo "✅ Postgres is up!"

# Jalankan migrasi
echo "🚀 Running migrations..."
npm run migrate up || true

# (Opsional) Generate admin default
echo "👤 Generating default admin (skip if exists)..."
npm run generate-admin || true

# Start server
echo "🔗 Starting server..."
npm run start
