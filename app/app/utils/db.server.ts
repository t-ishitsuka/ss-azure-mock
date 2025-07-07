import { PrismaClient } from "../../generated/prisma";

let prisma: PrismaClient;

declare global {
  var __db__: PrismaClient;
}

// 本番環境では毎回新しいインスタンスを作成
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // 開発環境では、ホットリロード時にインスタンスを再利用
  if (!global.__db__) {
    global.__db__ = new PrismaClient();
  }
  prisma = global.__db__;
  prisma.$connect();
}

export { prisma };