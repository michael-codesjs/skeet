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
      '*': allow, // By default allow reads, unless specific query overrides
      me: isAuthenticated,
      // Add other restricted queries here
    },
    Mutation: {
      '*': isAuthenticated, // Secure all mutations by default
      // We can open up specific mutations if needed, e.g.:
      updateUser: isAuthenticated,
      requestProfilePictureUploadUrl: isAuthenticated,
      confirmProfilePictureUpload: isAuthenticated,
    },
    // Add other types if field-level permissions are needed
  },
  {
    allowExternalErrors: true, // Pass through original errors
    debug: process.env.NODE_ENV !== 'production',
  },
);
