import { allow, rule, shield } from 'graphql-shield';
import { Context } from '../context';

const isAuthenticated = rule({ cache: 'contextual' })(async (
  _parent,
  _args,
  ctx: Context,
  _info,
) => {
  return ctx.user?.id !== undefined && ctx.user?.id !== null;
});

export const permissions = shield(
  {
    Query: {
      '*': allow,
      me: isAuthenticated,
      project: isAuthenticated,
      projects: isAuthenticated,
    },
    Mutation: {
      '*': isAuthenticated,
    },
  },
  {
    allowExternalErrors: true,
    debug: process.env.NODE_ENV !== 'production',
  },
);
