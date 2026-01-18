# Development Standards

## Package Management

We use **Yarn** for all package management. Please do not use `npm` or `pnpm`.

- **Install dependencies**: `yarn install`
- **Add a package**: `yarn add [package-name]`
- **Run scripts**: `yarn [script-name]`

## Code Style

- **Import Aliases**: Use `@/` to import files from the `src` directory. Avoid relative imports like `../../`.
- **File Naming**: All file names should be in `kebab-case` (e.g., `file-name.extension`). Do not use `CamelCase` or `PascalCase` for filenames.
- **Component Structure**: Group components in their own directories (e.g., `/components/ui/button.tsx`).

- **Types vs Interfaces**: Use `type` for defining shapes of objects, functions, etc. Only use `interface` if the type is intended to be implemented by a class.

## Data Fetching (GraphQL)

- **Type Safety**: ALWAYS provide TypeScript types for your GraphQL queries and mutations. Do not rely on implicit `any` or `{}` types.
  - Define a type for the query response data.
  - Pass this type as a generic to `useQuery` or `useMutation`.
- **Imports**: Import `gql` from `@apollo/client` (the main package). Import hooks like `useQuery` and `useMutation` from `@apollo/client/react` (the React-specific package).

  ```typescript
  // Example
  type GetUserResponse = {
    user: {
      id: string;
      name: string;
    };
  };

  const { data } = useQuery<GetUserResponse>(GET_USER);
  ```

## UI Components

### Component Reuse

- **Check First**: Before creating a new component, **ALWAYS** check the `components` directory (especially `components/ui`) to see if a similar component already exists.
- **Reuse**: We strive to reuse components to maintain consistency and reduce code duplication. If a component is close to what you need but missing a feature, prefer extending the existing component over complying a new one.

### Image Handling

We use a specialized `Image` component for rendering images that require consistent loading states and "cover" fitting behavior.

- Use `Image` instead of generic `div`s with background images or raw `img` tags when presentation and loading states matter.
- **Features**: automatically handles skeleton loading states and transitions.
- **Props**: accepts `src`, `className`, and `fallbackSrc`.
- **Usage**:
  ```tsx
  <Image src={user.profilePicture} className="w-10 h-10 rounded-full" alt="Profile" />
  ```
