import { isRouteErrorResponse, useRouteError } from "@remix-run/react";
import { MainLayout } from "./layout";

export function GeneralErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-lg w-full bg-white p-8 rounded-lg shadow-lg">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-red-600 mb-4">{error.status}</h1>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {error.statusText || "エラーが発生しました"}
              </h2>
              {error.data && (
                <p className="text-gray-600 mb-6">{error.data}</p>
              )}
              <a
                href="/"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ホームに戻る
              </a>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white p-8 rounded-lg shadow-lg">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-red-600 mb-4">500</h1>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              予期しないエラーが発生しました
            </h2>
            <p className="text-gray-600 mb-6">
              申し訳ございません。サーバーでエラーが発生しました。
            </p>
            {error instanceof Error && process.env.NODE_ENV === "development" && (
              <details className="text-left mb-6">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  エラーの詳細（開発環境のみ）
                </summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                  {error.stack}
                </pre>
              </details>
            )}
            <a
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ホームに戻る
            </a>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}