import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  // シンプルな生存確認
  // アプリケーションが応答できる状態かどうかをチェック
  return json({
    status: "alive",
    timestamp: new Date().toISOString(),
  }, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}