import { Context, createContext } from '@/context';
import { auth } from '@/lib/auth';
import { schema } from '@/schema';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { toNodeHandler } from 'better-auth/node';
import cors from 'cors';
import express from 'express';
import http from 'http';
import morgan from 'morgan';

// Worker routes
import assembleSkeetWorker from './workers/assemble-skeet';
import geminiAnalyzerWorker from './workers/gemini-analyzer';
import geminiScoutWorker from './workers/gemini-scout';
import thumbnailWorker from './workers/thumbnail';

export async function createServer() {
  const app = express();
  const httpServer = http.createServer(app);

  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.use(
    cors<cors.CorsRequest>({
      origin: true, // Allow reflected origin
      credentials: true,
    }),
  );
  app.use(express.json());

  const server = new ApolloServer<Context>({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: process.env.NODE_ENV !== 'production',
  });

  await server.start();

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req, res }) => createContext({ req, res }),
    }),
  );

  // Debug logs for auth
  app.use('/api/auth/*', (req, res, next) => {
    console.log(`[Auth Debug] ${req.method} ${req.originalUrl}`);
    next();
  });

  app.all('/api/auth/*', toNodeHandler(auth));

  // Worker endpoints (QStash-triggered)
  app.use('/api/workers', thumbnailWorker);
  app.use('/api/workers', geminiScoutWorker);
  app.use('/api/workers', geminiAnalyzerWorker);
  app.use('/api/workers', assembleSkeetWorker);

  return { app, httpServer, server };
}
