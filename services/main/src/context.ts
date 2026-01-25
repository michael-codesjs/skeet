import { PrismaClient } from '@/generated/prisma_client';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from './lib/auth';

let prisma: PrismaClient;

// Get or create Prisma client singleton
export function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    });
  }
  return prisma;
}

export interface Context {
  prisma: PrismaClient;
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
}

export const createContext = async ({ req, res }: { req: any; res: any }): Promise<Context> => {
  if (!prisma) {
    prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    });
  }

  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  return {
    prisma,
    user: session?.user || null,
    session: session?.session || null,
  };
};
