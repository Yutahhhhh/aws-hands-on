import AWSXRay from 'aws-xray-sdk-core'
import { Context, Next } from 'hono'

// X-Rayの初期化
AWSXRay.config([
  AWSXRay.plugins.ECSPlugin,
])

// タスク定義の環境変数からサービス名を取得
const serviceName = process.env.AWS_XRAY_TRACING_NAME || ''

// VPCエンドポイント経由で送信するための設定
AWSXRay.setContextMissingStrategy('LOG_ERROR')

export const xrayMiddleware = () => {
  return async (c: Context, next: Next) => {
    // X-Rayが有効でない場合はスキップ
    if (!AWSXRay.getSegment()) {
      await next()
      return
    }

    const segment = AWSXRay.getSegment()
    const subsegment = segment?.addNewSubsegment('hono-handler')
    
    try {
      // リクエスト情報を記録
      subsegment?.addAnnotation('path', c.req.path)
      subsegment?.addAnnotation('method', c.req.method)
      subsegment?.addAnnotation('service', serviceName)
      
      await next()
      
      // レスポンス情報を記録
      subsegment?.addAnnotation('statusCode', c.res.status)
    } catch (error) {
      subsegment?.addError(error as Error)
      throw error
    } finally {
      subsegment?.close()
    }
  }
}

// データベースクエリのトレース例
export const traceDatabase = async (queryName: string, fn: () => Promise<any>) => {
  // X-Rayトレーシングが有効でない場合は通常実行
  if (!AWSXRay.getSegment()) {
    return await fn()
  }

  const subsegment = AWSXRay.getSegment()?.addNewSubsegment(`db-${queryName}`)
  
  try {
    subsegment?.addAnnotation('query', queryName)
    subsegment?.addAnnotation('service', serviceName)
    const result = await fn()
    return result
  } catch (error) {
    subsegment?.addError(error as Error)
    throw error
  } finally {
    subsegment?.close()
  }
}
