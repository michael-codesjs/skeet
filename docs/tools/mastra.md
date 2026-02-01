# Mastra Documentation

> **Note**: This documentation is based on [Mastra Docs](https://mastra.ai/docs).

## About Mastra

Mastra is a framework for building AI-powered applications and agents with a modern TypeScript stack. It includes tools for model routing, agents, workflows, human-in-the-loop interactions, context management, integrations, and production essentials like evaluation and observability.

## Installation

To install the Mastra core package:

```bash
npm install @mastra/core@latest
# or
pnpm add @mastra/core@latest
# or
yarn add @mastra/core@latest
# or
bun add @mastra/core@latest
```

Ensure you have your AI provider API keys set (e.g., `OPENAI_API_KEY`).

## Agents

Agents interpret input (goals), make decisions, and execute actions (tools) to achieve results.

### Creating an Agent

```typescript
import { Agent } from '@mastra/core/agent';

export const testAgent = new Agent({
  id: 'test-agent',
  name: 'Test Agent',
  instructions: 'You are a helpful assistant.',
  model: 'openai/gpt-4', // or other supported models
});
```

### Instruction Formats

Instructions can be:

- **String**: `"You are a helpful assistant."`
- **Array of Strings**: `["You are helpful.", "Be concise."]`
- **System Messages**: `[{ role: "system", content: "..." }]`
- **Dynamic**: Async function resolving to instructions.

### Provider Options

```typescript
instructions: {
  role: "system",
  content: "...",
  providerOptions: {
    openai: { reasoningEffort: "high" },
    anthropic: { cacheControl: { type: "ephemeral" } }
  }
}
```

### Registering and Accessing Agents

Register your agent in the Mastra instance:

```typescript
import { Mastra } from '@mastra/core';
import { testAgent } from './agents/test-agent';

export const mastra = new Mastra({
  agents: { testAgent },
});
```

Access it via `.getAgent()`:

```typescript
const agent = mastra.getAgent('testAgent');
```

## Generating Responses

### Text Generation

```typescript
const response = await testAgent.generate('Help me organize my day');
console.log(response.text);
```

### Streaming

```typescript
const stream = await testAgent.stream('Help me organize my day');
for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}
```

### Structured Output (Zod/JSON Schema)

Agents can return type-safe structured data. Result is in `response.object`.

### Analyzing Images

Pass image content in the user message:

```typescript
const response = await testAgent.generate([
  {
    role: 'user',
    content: [
      {
        type: 'image',
        image: 'https://example.com/image.jpg', // or base64
        mimeType: 'image/jpeg',
      },
      {
        type: 'text',
        text: 'Describe this image.',
      },
    ],
  },
]);
```

## Advanced Features

- **Max Steps**: `maxSteps: 10` limits sequential LLM calls (default 1).
- **Step Monitoring**: `onStepFinish` callback to monitor progress.
- **Tools**: Attach tools to agents for external interactions.
- **Request Context**: Use `requestContext` for dynamic behavior based on request data.
