#!/bin/sh
set -e

# データベース接続
echo "データベース接続を待機しています..."
until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do
  echo "データベースは利用できません - sleeping for 1 second"
  sleep 1
done

echo "データベースが起動しました - コマンドを実行します"

if [ "$NODE_ENV" = "production" ]; then
  echo "DBマイグレーションを実行中..."
  npx drizzle-kit push:pg --config=drizzle.config.js
fi

# 引数で渡されたコマンドを実行
exec "$@"