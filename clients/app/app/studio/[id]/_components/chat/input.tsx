'use client';
import apiClient from '@/lib/clients/rest-api';
import { parseSSEChunk } from '@/lib/sse';
import { MessageStep, useStudioStore } from '@/stores/studio';
import { Add, ArrowRight, Microphone } from 'iconsax-react';
import { useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const ChatInput = () => {
  const inputRef = useRef<HTMLDivElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const {
    project,
    addMessage,
    updateMessage,
    applyEditOperations,
    activeThreadId,
    setActiveThreadId,
    setThreads,
  } = useStudioStore();

  const handleSend = async () => {
    const text = inputRef.current?.innerText.trim();
    if (!text || !project || isStreaming) return;

    if (inputRef.current) inputRef.current.innerText = '';

    const userMessageId = uuidv4();

    addMessage({
      id: userMessageId,
      role: 'user',
      content: text,
      timestamp: new Date(),
      status: 'sent',
    });

    setIsStreaming(true);

    let lastProcessedLength = 0;
    let lineBuffer = '';
    let assistantContent = '';
    let assistantSteps: MessageStep[] = [];

    let threadCreatedThisSession = false;

    try {
      console.log('🚀 Starting chat request via apiClient...');

      const assistantMessageId = uuidv4();
      addMessage({
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        status: 'loading',
        steps: [],
      });

      await apiClient.post(
        '/api/chat',
        { projectId: project.id, prompt: text, threadId: activeThreadId },
        {
          onDownloadProgress: (progressEvent: any) => {
            const xhr = progressEvent.event?.target;
            const responseText = xhr?.responseText || '';

            const newContent = responseText.slice(lastProcessedLength);
            lastProcessedLength = responseText.length;

            if (newContent) {
              const { events, remainingBuffer } = parseSSEChunk(lineBuffer, newContent);
              lineBuffer = remainingBuffer;

              for (const data of events) {
                console.log('⚡️ Extracted JSON:', data);

                // Handle auto-created thread
                if (data.type === 'thread-created' && data.payload?.threadId) {
                  threadCreatedThisSession = true;
                  setActiveThreadId(data.payload.threadId);
                }

                if (data.type === 'text-delta' && data.payload?.text) {
                  assistantContent += data.payload.text;
                  updateMessage(assistantMessageId, {
                    content: assistantContent,
                    status: 'sending',
                  });
                }

                // Handle Thoughts (Reasoning)
                if (data.type === 'reasoning-delta' && data.payload?.text) {
                  const lastStep = assistantSteps[assistantSteps.length - 1];
                  if (lastStep?.type === 'thought' && lastStep.status === 'running') {
                    lastStep.content = (lastStep.content || '') + data.payload.text;
                  } else {
                    assistantSteps.push({
                      id: uuidv4(),
                      type: 'thought',
                      content: data.payload.text,
                      status: 'running',
                      startTime: Date.now(),
                    });
                  }

                  updateMessage(assistantMessageId, {
                    steps: [...assistantSteps],
                    status: 'loading',
                  });
                }

                // Handle Tool Calls
                if (data.type === 'tool-call' && data.payload) {
                  const toolCall = data.payload;

                  // Finalize any running thought and calculate duration
                  assistantSteps = assistantSteps.map((s) => {
                    if (s.type === 'thought' && s.status === 'running') {
                      return {
                        ...s,
                        status: 'done',
                        duration: Math.round((Date.now() - (s.startTime || Date.now())) / 1000),
                      };
                    }
                    return s;
                  });

                  assistantSteps.push({
                    id: toolCall.id || toolCall.callId || uuidv4(),
                    type: 'tool',
                    toolName: toolCall.toolName,
                    status: 'running',
                  });

                  updateMessage(assistantMessageId, {
                    steps: [...assistantSteps],
                    status: 'loading',
                  });
                }

                // Handle Tool Results
                if (data.type === 'tool-result' && data.payload) {
                  const toolResult = data.payload;
                  assistantSteps = assistantSteps.map((step) =>
                    step.toolName === toolResult.toolName && step.status === 'running'
                      ? { ...step, status: 'done', result: toolResult.result }
                      : step,
                  );

                  updateMessage(assistantMessageId, {
                    steps: [...assistantSteps],
                  });

                  if (toolResult.toolName === 'editor') {
                    const result = toolResult.result;
                    if (result?.operations) {
                      applyEditOperations(result.operations);
                    }
                  }
                }

                if (data.type === 'finish') {
                  // Finalize all steps and calculate duration for any remaining thoughts
                  assistantSteps = assistantSteps.map((s) => {
                    if (s.status === 'running') {
                      const updates: Partial<MessageStep> = { status: 'done' };
                      if (s.type === 'thought' && s.startTime) {
                        updates.duration = Math.round((Date.now() - s.startTime) / 1000);
                      }
                      return { ...s, ...updates };
                    }
                    return s;
                  });

                  updateMessage(assistantMessageId, {
                    status: 'sent',
                    content: assistantContent,
                    steps: [...assistantSteps],
                  });
                }
              }
            }
          },
        },
      );

      console.log('✅ Request complete');

      // Refresh thread list after stream finish if a new thread was created
      // This ensures we get the auto-generated title (Mastra takes a second post-stream sometimes)
      if (threadCreatedThisSession) {
        const res = await apiClient.get('/api/chat/threads', {
          params: { resourceId: project.id },
        });
        setThreads(res.data.threads || []);
      }
    } catch (err: any) {
      console.error('❌ Chat error:', err);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-sm">
      <div className="relative border border-white/10 rounded-xl bg-neutral-900/50 p-2 transition-all focus-within:border-white/20">
        <div
          ref={inputRef}
          contentEditable
          role="textbox"
          spellCheck="true"
          data-placeholder="Describe your vision"
          className="w-full bg-transparent border-none text-[11px] text-neutral-300 focus:outline-none outline-none min-h-[40px] max-h-[200px] py-3 px-3 overflow-y-auto scrollbar-hide relative before:content-[attr(data-placeholder)] before:text-neutral-500 before:absolute before:left-3 before:top-3 before:pointer-events-none empty:before:inline-block before:hidden"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        <div className="flex items-center justify-between px-2 pb-1">
          <div className="flex items-center gap-3">
            <button className="text-neutral-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg">
              <Add size={20} color="currentColor" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button className="text-neutral-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg">
              <Microphone size={20} color="currentColor" />
            </button>
            <button
              onClick={handleSend}
              disabled={isStreaming}
              className="p-2 bg-white text-black rounded-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <ArrowRight size={18} color="currentColor" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
