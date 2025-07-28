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

### 1. イメージのビルド

`backend`ディレクトリに移動して、Dockerイメージをビルドします。

```bash
cd backend
docker build -t hono-api:latest .

# Apple Siliconの場合でECR対応
DOCKER_BUILDKIT=0 docker build --platform linux/amd64 -t xxxxxx.dkr.ecr.ap-northeast-1.amazonaws.com/xxxxx:latest .
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
