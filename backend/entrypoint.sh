#!/bin/sh
set -e

if [ "$SKIP_DB_WAIT" = "true" ]; then
  echo "DB接続チェックをスキップします（動作確認モード）"
else
  echo "データベース接続を待機しています..."
  until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do
    echo "データベースは利用できません - sleeping for 1 second"
    sleep 1
  done
  echo "データベースが起動しました"
fi

if [ "$NODE_ENV" = "production" ] && [ "$SKIP_DB_WAIT" != "true" ]; then
  echo "DBマイグレーションを実行中..."
  pnpm db:push
fi

echo "起動中..."

exec "$@"