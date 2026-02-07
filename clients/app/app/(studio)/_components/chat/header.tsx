'use client';
import { Popover } from '@/components/ui/popover';
import { useDisclosure } from '@/hooks/use-disclosure';
import apiClient from '@/lib/clients/rest-api';
import { MessageStep, Thread, useStudioStore } from '@/stores/studio';
import { Add, ArchiveBook, ArrowDown2, Messages1, Timer1 } from 'iconsax-react';
import { useEffect } from 'react';

export function ChatHeader() {
  const {
    project,
    threads,
    setThreads,
    activeThreadId,
    setActiveThreadId,
    setMessages,
    setIsMessagesLoading,
  } = useStudioStore();

  const historyDisclosure = useDisclosure(false);

  useEffect(() => {
    const fetchThreads = async () => {
      if (!project?.id) return;
      try {
        const response = await apiClient.get('/api/chat/threads', {
          params: { projectId: project.id },
        });
        const fetchedThreads = response.data.threads || [];
        setThreads(fetchedThreads);

        // Restore last used thread for this project
        const lastThreadId = localStorage.getItem(`lastThread_${project.id}`);
        if (lastThreadId && !activeThreadId) {
          const threadExists = fetchedThreads.some((t: Thread) => t.id === lastThreadId);
          if (threadExists) {
            handleSelectThread(lastThreadId);
          }
        }
      } catch (err) {
        console.error('Failed to fetch threads', err);
      }
    };
    fetchThreads();
  }, [setThreads, project?.id]);

  const activeThread = threads.find((t: Thread) => t.id === activeThreadId);

  const handleNewThread = () => {
    setActiveThreadId(null);
    setMessages([]);
    if (project?.id) {
      localStorage.removeItem(`lastThread_${project.id}`);
    }
  };

  const handleSelectThread = async (threadId: string) => {
    setActiveThreadId(threadId);
    historyDisclosure.onClose();
    setIsMessagesLoading(true);
    if (project?.id) {
      localStorage.setItem(`lastThread_${project.id}`, threadId);
    }
    try {
      const response = await apiClient.get(`/api/chat/history/${threadId}`, {
        params: { projectId: project?.id },
      });
      // Handle paginated response: response.data.messages
      const messages = response.data.messages || [];
      setMessages(
        messages.map((m: any) => {
          let content = '';
          const steps: MessageStep[] = [];

          // Handle structured content (format 2 with parts)
          if (typeof m.content === 'object' && m.content !== null) {
            if (Array.isArray(m.content.parts)) {
              m.content.parts.forEach((part: any, idx: number) => {
                if (part.type === 'text' && part.text) {
                  content += part.text;
                  steps.push({
                    id: `text-${m.id}-${idx}`,
                    type: 'text',
                    content: part.text,
                    status: 'done',
                  });
                } else if (part.type === 'reasoning') {
                  const thoughtText = part.reasoning || part.details?.[0]?.text || '';
                  if (thoughtText) {
                    steps.push({
                      id: `thought-${m.id}-${idx}`,
                      type: 'thought',
                      content: thoughtText,
                      status: 'done',
                    });
                  }
                } else if (part.type === 'tool-invocation') {
                  const invocation = part.toolInvocation;
                  steps.push({
                    id: invocation.toolCallId || `tool-${m.id}-${idx}`,
                    type: 'tool',
                    toolName: invocation.toolName,
                    status: invocation.state === 'result' ? 'done' : 'running',
                    result: invocation.result,
                  });
                }
              });

              // If content is still empty but there's a fallback content field
              if (!content && m.content.content) {
                content = m.content.content;
              }
            } else if (m.content.content) {
              content = m.content.content;
            }
          } else {
            content = m.content || '';
          }

          // Merge with any metadata steps if they exist and we don't have parts-based steps
          const metadata = m.metadata || {};
          const finalSteps = steps.length > 0 ? steps : metadata.steps || [];

          return {
            id: m.id,
            role: m.role.toLowerCase() as 'user' | 'assistant',
            content: content || '',
            steps: finalSteps,
            timestamp: new Date(m.createdAt),
            status: 'sent',
          };
        }),
      );
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setIsMessagesLoading(false);
    }
  };

  return (
    <div className="p-4 border-b border-white/5 bg-black/20 flex flex-col gap-2 relative">
      <div className="flex items-center justify-between">
        <Popover
          width={300}
          isOpen={historyDisclosure.isOpen}
          onToggle={historyDisclosure.onToggle}
          onClose={historyDisclosure.onClose}
          trigger={
            <div className="flex items-center gap-2 overflow-hidden group h-8">
              <div className="w-8 h-8 shrink-0 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-all text-white/40 group-hover:text-white/60">
                <Messages1 size={16} color="currentColor" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 cursor-pointer leading-none">
                  <h3 className="text-[11px] font-semibold text-white/90 truncate max-w-[140px]">
                    {activeThread ? (activeThread?.title as string) || activeThread.id : 'New Chat'}
                  </h3>
                  <ArrowDown2 size={12} color="currentColor" className="text-white/30 shrink-0" />
                </div>
              </div>
            </div>
          }
        >
          <div className="py-2">
            <div className="px-4 py-3 flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-white/40 font-bold border-b border-white/5 mb-2">
              <ArchiveBook size={12} color="currentColor" />
              Recent History
            </div>

            <div className="max-h-[300px] overflow-y-auto px-2 space-y-1">
              {threads.length === 0 ? (
                <div className="px-4 py-8 text-[11px] text-white/20 text-center italic flex flex-col items-center gap-2">
                  <Timer1 size={24} color="currentColor" className="opacity-10" />
                  No conversations found
                </div>
              ) : (
                threads.map((thread: Thread) => (
                  <button
                    key={thread.id}
                    onClick={() => handleSelectThread(thread.id)}
                    className={`w-full text-left px-3 py-3 rounded-xl transition-all group border border-transparent ${
                      activeThreadId === thread.id
                        ? 'bg-white/10 border-white/10 text-white'
                        : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="truncate text-[11px] font-medium leading-tight">
                        {thread?.title as string}
                      </div>
                      <div className="flex items-center justify-between text-[8px] opacity-40">
                        <span className="flex items-center gap-1">
                          <Timer1 size={10} color="currentColor" />
                          {new Date(thread.updatedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="font-mono">{thread.id.slice(0, 6)}</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </Popover>

        <button
          onClick={handleNewThread}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all outline-none active:scale-95"
          title="New Conversation"
        >
          <Add size={18} color="currentColor" />
        </button>
      </div>
    </div>
  );
}
