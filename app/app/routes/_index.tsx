import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "SS Azure - Home" },
    { name: "description", content: "Azure と AWS を連携する Remix サンプルアプリケーション" },
  ];
};

export default function Index() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="py-16">
          <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">
            SS Azure プロジェクト
          </h1>
          <p className="text-xl text-gray-600 text-center">
            Remix on Azure + AWS RDS のサンプルアプリケーション
          </p>
        </header>

        <nav className="flex justify-center gap-6 mb-16">
          <Link
            to="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            ホーム
          </Link>
          <Link
            to="/about"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            About
          </Link>
        </nav>

        <main className="grid md:grid-cols-2 gap-8 pb-16">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">プロジェクト概要</h2>
            <p className="text-gray-600 mb-4">
              このプロジェクトは、Azure App Service 上で動作する Remix アプリケーションと、 AWS RDS
              のデータベースを VPN で安全に接続するサンプル実装です。
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>フロントエンド/バックエンド: Remix (TypeScript)</li>
              <li>ホスティング: Azure App Service</li>
              <li>データベース: AWS RDS (PostgreSQL)</li>
              <li>インフラ管理: Pulumi</li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">技術的な特徴</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Azure VNet と AWS VPC 間の Site-to-Site VPN 接続</li>
              <li>すべて TypeScript で実装</li>
              <li>Docker による開発環境の統一</li>
              <li>Biome による一貫したコードフォーマット</li>
              <li>Infrastructure as Code による再現可能な環境構築</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}
