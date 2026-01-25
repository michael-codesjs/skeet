'use client';

import { client } from '@/lib/apollo-client';
import { ApolloProvider as BaseApolloProvider } from '@apollo/client/react';

export function ApolloProvider({ children }: { children: React.ReactNode }) {
  return <BaseApolloProvider client={client}>{children}</BaseApolloProvider>;
}
