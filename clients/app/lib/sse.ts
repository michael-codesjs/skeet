export interface SSEEvent {
  type: string;
  payload?: any;
  [key: string]: any;
}

export function parseSSEChunk(lineBuffer: string, newContent: string) {
  const events: SSEEvent[] = [];
  const combined = lineBuffer + newContent;
  const lines = combined.split('\n');
  const remainingBuffer = lines.pop() || '';

  for (const line of lines) {
    const cleanedLine = line.trim();
    if (!cleanedLine.startsWith('data:')) continue;

    // Support both "data: {...}" and "data:{...}"
    const jsonStr = cleanedLine.replace(/^data:\s*/, '');
    if (!jsonStr) continue;

    try {
      events.push(JSON.parse(jsonStr));
    } catch (e) {
      console.warn('❌ Failed to parse SSE JSON:', jsonStr);
    }
  }

  return { events, remainingBuffer };
}
