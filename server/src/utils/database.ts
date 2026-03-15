// server/src/utils/database.ts
import { PrismaClient } from '@prisma/client';

export class DatabaseClient {
  private static instance: DatabaseClient;
  public prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient();
    }
    return DatabaseClient.instance;
  }
}

export const db = DatabaseClient.getInstance().prisma;
