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
import chatRouter from './routes/chat';
import mediaWorker from './workers/media';

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

  // Chat endpoint (Mastra-triggered)
  app.use('/api/chat', chatRouter);

  // Worker endpoints (QStash Webhooks)
  app.use('/api/workers/media', mediaWorker);

  return { app, httpServer, server };
}
