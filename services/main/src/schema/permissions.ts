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

const isOwner = rule({ cache: 'strict' })(async (parent, _args, ctx: Context) => {
  if (!ctx.user?.id) return false;
  return parent?.userId === ctx.user.id;
});

const isSelf = rule({ cache: 'strict' })(async (parent, _args, ctx: Context) => {
  if (!ctx.user?.id) return false;
  return parent?.id === ctx.user.id;
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
    Project: isOwner,
    Media: isOwner,
    User: isSelf,
  },
  {
    allowExternalErrors: true,
    debug: process.env.NODE_ENV !== 'production',
  },
);
