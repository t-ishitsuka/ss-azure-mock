#!/bin/sh

# エラーが発生したら即座に終了
set -e

echo "Starting application initialization..."

# DATABASE_URLが設定されているか確認
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set"
  exit 1
fi

# 本番環境の場合のみマイグレーションを実行
if [ "$NODE_ENV" = "production" ]; then
  echo "Production environment detected. Running database migrations..."
  
  # データベース接続を待機（最大30秒）
  echo "Waiting for database connection..."
  for i in $(seq 1 30); do
    if npx prisma migrate status 2>/dev/null; then
      echo "Database connection successful"
      break
    fi
    if [ $i -eq 30 ]; then
      echo "Error: Database connection timeout"
      exit 1
    fi
    echo "Attempt $i/30: Waiting for database..."
    sleep 1
  done
  
  # マイグレーションを実行
  echo "Applying database migrations..."
  npx prisma migrate deploy
  echo "Migrations completed successfully"
else
  echo "Non-production environment. Skipping migrations."
fi

# アプリケーションを起動
echo "Starting application..."
exec "$@"