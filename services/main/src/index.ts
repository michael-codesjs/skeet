import chalk from 'chalk';
import 'dotenv/config';
import { createServer } from './server';

const PORT = process.env.PORT || 4000 || 4001;

createServer()
  .then(({ httpServer }) => {
    httpServer.listen({ port: PORT }, () => {
      console.log(chalk.bold('Server running on: ' + chalk.green('http://localhost:' + PORT)));
      console.log(
        chalk.bold('GraphQL API ready at: ' + chalk.green('http://localhost:' + PORT + '/graphql')),
      );
    });
  })
  .catch((err) => {
    console.error('Failed to start server: ', err);
    process.exit(1);
  });
