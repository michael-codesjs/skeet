'use client';
import apiClient from '@/lib/clients/rest-api';
import { parseSSEChunk } from '@/lib/sse';
import { MediaItem, MessageStep, useStudioStore } from '@/stores/studio';
import { Add, ArrowRight, Microphone } from 'iconsax-react';
import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MentionList } from './mention-list';

export const ChatInput = () => {
  const inputRef = useRef<HTMLDivElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Mention State
  const [mentionIsOpen, setMentionIsOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const {
    project,
    addMessage,
    updateMessage,
    applyEditOperations,
    activeThreadId,
    setActiveThreadId,
    setThreads,
  } = useStudioStore();

  // Filter items for mention list
  const filteredItems = (project?.media || []).filter((item) =>
    item.fileName.toLowerCase().includes(mentionQuery.toLowerCase()),
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [mentionQuery]);

  const handleInput = () => {
    if (!inputRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const node = selection.anchorNode;
    if (node && node.nodeType === 3) {
      // Text node
      const content = node.textContent || '';
      const offset = selection.anchorOffset;

      // Look backwards from offset for @
      const lastAt = content.lastIndexOf('@', offset);
      if (lastAt !== -1) {
        // Check if there are spaces between @ and cursor (allow simple search)
        const query = content.slice(lastAt + 1, offset);
        // We assume valid mention query doesn't have too many spaces (maybe 1-2 for filenames)
        // But filenames can have spaces. Let's limit query length to 30.
        if (query.length < 30) {
          setMentionQuery(query);
          setMentionIsOpen(true);
          return;
        }
      }
    }
    setMentionIsOpen(false);
  };

  const insertMention = (item: MediaItem) => {
    if (!inputRef.current) return;
    const selection = window.getSelection();
    if (!selection) return;

    const node = selection.anchorNode;
    if (node && node.nodeType === 3) {
      const content = node.textContent || '';
      const offset = selection.anchorOffset;
      const lastAt = content.lastIndexOf('@', offset);

      if (lastAt !== -1) {
        // Create a range for the text to replace (@query)
        const range = document.createRange();
        range.setStart(node, lastAt);
        range.setEnd(node, offset);
        range.deleteContents();

        // Create the styled mention chip
        const span = document.createElement('span');
        span.textContent = `@[${item.fileName}]`;
        span.className =
          'inline-flex items-center bg-blue-500/20 text-blue-200 border border-blue-500/30 rounded px-1.5 py-0.5 text-[10px] mx-1 font-mono align-middle select-none';
        span.contentEditable = 'false'; // Treat as a single unit

        // Insert the chip
        range.insertNode(span);

        // Add a space after the chip so the user can keep typing
        const space = document.createTextNode('\u00A0');
        range.setStartAfter(span);
        range.insertNode(space);

        // Move selection to after the space
        range.setStartAfter(space);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    setMentionIsOpen(false);
    // Explicitly focus back
    inputRef.current.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionIsOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % filteredItems.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[activeIndex]) {
          insertMention(filteredItems[activeIndex]);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionIsOpen(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const text = inputRef.current?.innerText.trim();
    if (!text || !project || isStreaming) return;

    if (inputRef.current) inputRef.current.innerText = '';
    setMentionIsOpen(false);

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

                // Handle Thoughts
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

      if (threadCreatedThisSession) {
        const res = await apiClient.get('/api/chat/threads', {
          params: { projectId: project.id },
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
    <div className="p-2 border-t border-white/5 bg-black/20 backdrop-blur-sm relative">
      {/* Mention List */}
      {mentionIsOpen && (
        <div className="absolute bottom-full left-4 mb-2 z-50 w-64">
          <MentionList
            items={filteredItems}
            activeIndex={activeIndex}
            onSelect={insertMention}
            onClose={() => setMentionIsOpen(false)}
          />
        </div>
      )}

      <div className="relative border border-white/10 rounded-xl bg-neutral-900/50 p-2 transition-all focus-within:border-white/20">
        <div
          ref={inputRef}
          contentEditable
          role="textbox"
          spellCheck="false"
          data-placeholder="Describe your vision (Use @ to mention clips)"
          className="w-full bg-transparent border-none text-[10px] text-neutral-300 focus:outline-none outline-none min-h-[40px] max-h-[200px] py-3 px-3 overflow-y-auto scrollbar-hide relative before:content-[attr(data-placeholder)] before:text-neutral-500 before:absolute before:left-3 before:top-3 before:pointer-events-none empty:before:inline-block before:hidden"
          onInput={handleInput}
          onKeyDown={handleKeyDown}
        />

        <div className="flex items-center justify-between px-2 pb-1">
          <div className="flex items-center gap-3">
            <button className="text-neutral-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg">
              <Add size={20} color="currentColor" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button className="text-neutral-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg">
              <Microphone size={16} color="currentColor" />
            </button>
            <button
              onClick={handleSend}
              disabled={isStreaming}
              className="p-1 bg-white text-black rounded-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <ArrowRight size={14} color="currentColor" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
