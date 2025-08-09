#!/bin/bash
set -e

# 環境変数の確認
if [ -z "$S3_BUCKET_NAME" ] || [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo "Error: S3_BUCKET_NAME and CLOUDFRONT_DISTRIBUTION_ID must be set"
    exit 1
fi

# フロントエンドディレクトリへ移動
cd frontend

# ビルド
echo "Building frontend..."
npm run build

# S3へのデプロイ
echo "Deploying to S3..."
aws s3 sync ./dist s3://$S3_BUCKET_NAME \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "index.html" \
    --exclude "*.json"

# index.htmlとJSONファイルは短いキャッシュで個別アップロード
aws s3 cp ./dist/index.html s3://$S3_BUCKET_NAME/ \
    --cache-control "public, max-age=300"

aws s3 cp ./dist s3://$S3_BUCKET_NAME/ \
    --recursive \
    --exclude "*" \
    --include "*.json" \
    --cache-control "public, max-age=300"

# CloudFrontのキャッシュ無効化
echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text

echo "Deployment completed!"