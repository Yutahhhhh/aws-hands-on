# aws-hands-on

## 開発環境 (Devcontainer)

このプロジェクトはDevcontainerに対応しています。
VS Codeでプロジェクトを開き、"Reopen in Container"を選択することで、開発環境が自動的に構築されます。

- **コンテナ**: `backend`サービスが開発コンテナとして起動します。
- **データベース**: `db`サービス (PostgreSQL) も同時に起動します。
- **ポートフォワード**:
    - `3000`: Honoアプリケーション
    - `5432`: PostgreSQLデータベース

初回起動時に`pnpm install`が実行され、必要な依存関係がインストールされます。

## 本番用コンテナのビルドと実行 (ECR向け)

ECR (Elastic Container Registry) にプッシュするための本番用コンテナイメージをビルドし、ローカルで動作確認する手順です。
DB接続周りの環境変数はシークレットマネージャーを利用する想定です。

### 1. イメージのビルド

`backend`ディレクトリに移動して、Dockerイメージをビルドします。

```bash
cd backend
docker build -t hono-api:latest .

# Apple Siliconの場合でECR対応（CORS設定あり）
DOCKER_BUILDKIT=0 docker build --platform linux/amd64 -t xxxxxx.dkr.ecr.ap-northeast-1.amazonaws.com/xxxxx:latest \
  --build-arg ALLOWED_ORIGINS=https://your-cloudfront-domain.cloudfront.net .
```

### CORS設定について

フロントエンドをCloudFrontにデプロイした際のCORSエラーを防ぐため、バックエンドのビルド時にCloudFrontドメインを許可する必要があります。

**本番環境でのDockerビルド例:**
```bash
cd backend
docker build -t your-backend-app:latest \
  --build-arg ALLOWED_ORIGINS=https://d1234567890abc.cloudfront.net .
```

**複数ドメインを許可する場合:**
```bash
docker build -t your-backend-app:latest \
  --build-arg ALLOWED_ORIGINS=https://d1234567890abc.cloudfront.net,https://your-custom-domain.com .
```

ビルドが成功したことを確認します。

```bash
docker images | grep hono-api
```

### 2. ローカルでの動作確認

ビルドしたイメージをローカルで実行して、基本的な動作を確認します。
ここでは、データベースへの接続をスキップしてコンテナを起動します。

```bash
docker run --rm \
  --name hono-api-test \
  -p 3001:3000 \
  -e NODE_ENV=production \
  -e DB_HOST=dummy \
  -e DB_PORT=5432 \
  -e DB_USER=dummy \
  -e DB_PASSWORD=dummy \
  -e DB_NAME=dummy \
  -e PORT=3000 \
  -e SKIP_DB_WAIT=true \
  hono-api:latest
```

コンテナが起動したら、別のターミナルから`curl`でアクセスするか、ヘルスチェックエンドポイントを確認します。

```bash
# ルートエンドポイント
curl http://localhost:3001/

# ヘルスチェック
curl http://localhost:3001/health
```

### 3. コンテナの停止と削除

動作確認が終わったら、以下のコマンドでコンテナを停止・削除します。

```bash
docker rm -f hono-api-test
```

## ECSへのデプロイ手順

ECSにアプリケーションをデプロイする際は、以下の順序で実行してください：

### 1. ECRにログイン

```bash
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin <YOUR_ACCOUNT_ID>.dkr.ecr.ap-northeast-1.amazonaws.com
```

### 2. Dockerイメージのビルド

```bash
cd backend
docker build -t <YOUR_APP_NAME>:latest --build-arg ALLOWED_ORIGINS=https://<YOUR_CLOUDFRONT_DOMAIN>.cloudfront.net .
```

### 3. イメージにタグを付与

```bash
docker tag <YOUR_APP_NAME>:latest <YOUR_ACCOUNT_ID>.dkr.ecr.ap-northeast-1.amazonaws.com/<YOUR_ECR_REPO_NAME>:latest
```

### 4. ECRにプッシュ

```bash
docker push <YOUR_ACCOUNT_ID>.dkr.ecr.ap-northeast-1.amazonaws.com/<YOUR_ECR_REPO_NAME>:latest
```

### 5. ECSサービスの更新

ECSサービスを手動で更新するか、CI/CDパイプラインで自動デプロイします。

**重要**: この順序（ログイン → ビルド → タグ付け → プッシュ）で、最新のコードがECSにデプロイされます。タグ付けを忘れると、古いイメージがデプロイされる可能性があります。

**実行例:**
```bash
# 1. ログイン
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.ap-northeast-1.amazonaws.com

# 2. ビルド
cd backend
docker build -t my-app:latest --build-arg ALLOWED_ORIGINS=https://dfwe9xxxxxx.cloudfront.net .

# 3. タグ付け
docker tag my-app:latest 123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/my-app-repo:latest

# 4. プッシュ
docker push 123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/my-app-repo:latest
```

## フロントエンドのデプロイ (S3 + CloudFront)

フロントエンドアプリケーションをS3とCloudFrontにデプロイする手順です。

### 前提条件

- AWS CLIがインストールされ、適切な権限で設定されていること
- S3バケットとCloudFrontディストリビューションが作成済みであること
- 以下の環境変数が設定されていること：
  - `S3_BUCKET_NAME`: デプロイ先のS3バケット名
  - `CLOUDFRONT_DISTRIBUTION_ID`: CloudFrontディストリビューションID

### 環境変数の設定

デプロイスクリプトを実行する前に、必要な環境変数を設定してください：

```bash
export S3_BUCKET_NAME="your-frontend-bucket-name"
export CLOUDFRONT_DISTRIBUTION_ID="E1234567890ABC"
```

### デプロイスクリプトの実行権限設定

初回実行時は、スクリプトに実行権限を付与する必要があります：

```bash
chmod +x scripts/deploy-frontend.sh
```

### デプロイの実行

環境変数を設定し、実行権限を付与した後、以下のコマンドでデプロイを実行します：

```bash
./scripts/deploy-frontend.sh
```

### デプロイスクリプトの動作

`scripts/deploy-frontend.sh`は以下の処理を自動で実行します：

1. **環境変数の確認**: `S3_BUCKET_NAME`と`CLOUDFRONT_DISTRIBUTION_ID`が設定されているかチェック
2. **フロントエンドのビルド**: `npm run build`でプロダクション用ビルドを実行
3. **S3へのアップロード**: 
   - 静的ファイル（CSS、JS等）は長期キャッシュ設定でアップロード
   - `index.html`とJSONファイルは短期キャッシュ設定でアップロード
4. **CloudFrontキャッシュの無効化**: 全てのパス（`/*`）のキャッシュを無効化

### 実行例

```bash
# 環境変数の設定
export S3_BUCKET_NAME="my-frontend-app-bucket"
export CLOUDFRONT_DISTRIBUTION_ID="E1A2B3C4D5E6F7"

# 実行権限の付与（初回のみ）
chmod +x scripts/deploy-frontend.sh

# デプロイの実行
./scripts/deploy-frontend.sh
```

### 注意事項

- デプロイ前に、バックエンドのCORS設定でCloudFrontドメインが許可されていることを確認してください
- CloudFrontのキャッシュ無効化には数分かかる場合があります
- S3バケットは静的ウェブサイトホスティングが有効になっている必要があります

※AIに書かせています