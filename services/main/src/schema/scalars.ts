import { DateTimeResolver, JSONResolver } from 'graphql-scalars';
import { asNexusMethod, scalarType } from 'nexus';

export const DateTime = asNexusMethod(DateTimeResolver, 'dateTime');

export const Json = scalarType({
  name: 'Json',
  asNexusMethod: 'json',
  description: 'Json scalar type',
  serialize: JSONResolver.serialize,
  parseValue: JSONResolver.parseValue,
  parseLiteral: JSONResolver.parseLiteral,
});
