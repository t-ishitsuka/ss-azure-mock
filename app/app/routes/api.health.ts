import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const hostname = url.hostname;
  
  // 基本的なヘルスチェック情報
  const healthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "ss-azure-app",
    version: process.env.APP_VERSION || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    hostname: hostname,
    uptime: process.uptime(),
    memory: {
      used: process.memoryUsage().heapUsed,
      total: process.memoryUsage().heapTotal,
    },
  };

  // 将来的にデータベース接続チェックを追加する場合のプレースホルダー
  const checks = {
    app: "ok",
    // database: "ok", // 将来的に追加
  };

  return json({
    ...healthStatus,
    checks,
  }, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}