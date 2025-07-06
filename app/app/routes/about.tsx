import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "SS Azure - About" },
    { name: "description", content: "プロジェクトの詳細情報" },
  ];
};

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="py-16">
          <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">About</h1>
          <p className="text-xl text-gray-600 text-center">プロジェクトの技術詳細</p>
        </header>

        <nav className="flex justify-center gap-6 mb-16">
          <Link
            to="/"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            ホーム
          </Link>
          <Link
            to="/about"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            About
          </Link>
        </nav>

        <main className="space-y-8 pb-16">
          <section className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">アーキテクチャ概要</h2>
            <div className="prose text-gray-600 max-w-none">
              <p className="mb-4">
                このプロジェクトは、マルチクラウド環境での安全なデータ通信を実現するサンプル実装です。
                Azure と AWS
                の両方のクラウドサービスを活用し、それぞれの強みを生かしたアーキテクチャを構築しています。
              </p>
              <h3 className="text-xl font-semibold mt-6 mb-3">ネットワーク構成</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Azure VNet: App Service をホストする仮想ネットワーク</li>
                <li>AWS VPC: RDS インスタンスを配置するプライベートネットワーク</li>
                <li>Site-to-Site VPN: 両クラウド間の暗号化された接続</li>
                <li>Network Security Group / Security Group: 厳格なアクセス制御</li>
              </ul>
            </div>
          </section>

          <section className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">使用技術スタック</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">フロントエンド/バックエンド</h3>
                <ul className="text-gray-600 space-y-2">
                  <li>• Remix v2 - フルスタック Web フレームワーク</li>
                  <li>• React 18 - UI ライブラリ</li>
                  <li>• TypeScript - 型安全な開発</li>
                  <li>• Tailwind CSS - ユーティリティファーストCSS</li>
                  <li>• Vite - 高速な開発サーバー</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">インフラストラクチャ</h3>
                <ul className="text-gray-600 space-y-2">
                  <li>• Pulumi - Infrastructure as Code</li>
                  <li>• Azure App Service - Web アプリホスティング</li>
                  <li>• AWS RDS PostgreSQL - マネージドデータベース</li>
                  <li>• Docker - 開発環境の統一</li>
                  <li>• GitHub Actions - CI/CD パイプライン</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">開発環境</h2>
            <div className="text-gray-600 space-y-4">
              <p>
                Docker を使用することで、チーム全体で統一された開発環境を実現しています。
                必要なツール（Node.js、pnpm、Azure CLI、AWS CLI、Pulumi）はすべて Docker
                イメージに含まれています。
              </p>
              <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
                <p className="mb-2"># 開発環境の起動</p>
                <p>docker compose up -d</p>
                <p>docker compose exec ss-azure-dev bash</p>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">今後の展開</h2>
            <ul className="text-gray-600 space-y-2">
              <li>• Prisma を使用したデータベース操作の実装</li>
              <li>• CRUD 操作のサンプル実装</li>
              <li>• Application Insights によるモニタリング</li>
              <li>• GitHub Actions による自動デプロイ</li>
              <li>• セキュリティベストプラクティスの実装</li>
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
}
