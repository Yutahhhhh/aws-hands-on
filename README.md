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
