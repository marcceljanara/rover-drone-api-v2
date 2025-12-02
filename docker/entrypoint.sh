#!/bin/sh
set -e

echo "⏳ Waiting for Postgres..."
until nc -z "$PGHOST" "$PGPORT"; do
  echo "Waiting for $PGHOST:$PGPORT..."
  sleep 1
done
echo "✅ Postgres is up!"

echo "🚀 Running migrations..."
npm run migrate up || true

echo "👤 Generating default admin (skip if exists)..."
npm run generate-admin || true

echo "🔗 Starting server..."
npm run start
