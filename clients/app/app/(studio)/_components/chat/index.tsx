'use client';
import { MessageStep, useStudioStore } from '@/stores/studio';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown2, Danger, Magicpen } from 'iconsax-react';
import { useEffect, useRef, useState } from 'react';
import { ChatEmptyState } from './empty-state';
import { ChatHeader } from './header';
import { ChatInput } from './input';
import { MemoryIcon, ProjectIcon, ScissorIcon, SearchIcon, TimelineIcon } from './tool-icons';

const ToolStep = ({ step, depth = 0 }: { step: MessageStep; depth?: number }) => {
  const isRunning = step.status === 'running';
  const isDone = step.status === 'done';
  const isError = step.status === 'error';

  const getIcon = () => {
    // Restore green color for completed, red for error, dimmed for working
    const colorClass = isError ? 'text-red-500' : isDone ? 'text-green-500' : 'text-white/40';

    if (step.toolName === 'searchSegments') {
      return (
        <div className={colorClass}>
          <SearchIcon active={isRunning} />
        </div>
      );
    }
    if (step.toolName === 'updateWorkingMemory') {
      return (
        <div className={colorClass}>
          <MemoryIcon active={isRunning} />
        </div>
      );
    }
    if (step.toolName === 'getProjectManifest') {
      return (
        <div className={colorClass}>
          <ProjectIcon active={isRunning} />
        </div>
      );
    }
    if (step.toolName === 'getCurrentTimeline') {
      return (
        <div className={colorClass}>
          <TimelineIcon active={isRunning} />
        </div>
      );
    }
    if (step.toolName === 'applyEditOperations') {
      return (
        <div className={colorClass}>
          <ScissorIcon active={isRunning} />
        </div>
      );
    }
    return <Magicpen size={14} className={colorClass} variant="Bold" color="currentColor" />;
  };

  const formatToolName = (name: string) => {
    if (!name) return '';

    // Convert camelCase to Title Case with spaces
    const baseName = name
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    if (isRunning) {
      if (name === 'applyEditOperations') return 'Applying Edit Operations';
      if (baseName.toLowerCase().startsWith('get ')) {
        return `Getting ${baseName.slice(4)}`;
      }
      if (baseName.toLowerCase().startsWith('update ')) {
        return `Updating ${baseName.slice(7)}`;
      }
      return `Executing ${baseName}`;
    }

    if (isDone && !isError) {
      if (name === 'getProjectManifest') return 'Obtained Project Manifest';
      if (name === 'applyEditOperations') return 'Applied Edit Operations';
      if (baseName.toLowerCase().startsWith('get ')) {
        return `Obtained ${baseName.slice(4)}`;
      }
      if (baseName.toLowerCase().startsWith('update ')) {
        return `Updated ${baseName.slice(7)}`;
      }
      return `Completed ${baseName}`;
    }

    return baseName;
  };

  const getStatusText = () => {
    if (isRunning) return '';
    if (isError) return 'Failed';
    return '';
  };

  return (
    <div
      className="flex items-center gap-2 py-0.5 mb-1.5 h-5 relative"
      style={{ marginLeft: depth * 14 }}
    >
      {/* Hierarchy Line */}
      {depth > 0 && <div className="absolute -left-2.5 top-0 bottom-1/2 w-px bg-white/10" />}
      {depth > 0 && <div className="absolute -left-2.5 top-1/2 w-2 h-px bg-white/10" />}

      <div className="w-3.5 shrink-0 flex items-center justify-center leading-0">{getIcon()}</div>
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span
          className={`text-[10px] font-medium truncate ${
            isRunning ? 'text-white/60' : isDone ? 'text-green-500' : 'text-white/30'
          }`}
        >
          {formatToolName(step.toolName || '')}
        </span>
        {isRunning && (
          <span className="flex gap-1 items-center px-1 opacity-40">
            <span className="w-0.5 h-0.5 bg-white rounded-full animate-bounce [animation-duration:0.6s]" />
            <span className="w-0.5 h-0.5 bg-white rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.1s]" />
            <span className="w-0.5 h-0.5 bg-white rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]" />
          </span>
        )}
        <span className="text-[8px] tracking-wider text-white/20 font-bold shrink-0">
          {getStatusText()}
        </span>
        {isDone && !isError && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-green-500 shrink-0"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {isError && <Danger size={10} variant="Bold" className="text-orange-500/80 shrink-0" />}
      </div>
    </div>
  );
};

// Render markdown-like text with basic formatting
const renderMarkdownText = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.+?\*\*|\*.+?\*|`.+?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-white/10 rounded px-1 font-mono text-[10px]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

const ReasoningBlock = ({
  thought,
  duration,
  isFinished,
}: {
  thought: string;
  duration?: number;
  isFinished?: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isFinished && thought) {
      interval = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isFinished, thought]);

  // Auto-collapse when thinking is finished
  useEffect(() => {
    if (isFinished) {
      setIsExpanded(false);
    }
  }, [isFinished]);

  const displayDuration = isFinished ? duration : elapsed;

  if (!thought && !isFinished) return null;

  return (
    <div className="mb-1.5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-[8px] font-medium text-white/40 hover:text-white/60 transition-colors group h-4"
      >
        <div className="w-3 shrink-0 flex items-center justify-center">
          <ArrowDown2
            size={12}
            color="currentColor"
            variant="Linear"
            className={`transition-transform duration-300 ${isExpanded ? '' : '-rotate-90'}`}
          />
        </div>
        {!isFinished
          ? `Thinking... ${elapsed > 0 ? `(${elapsed}s)` : ''}`
          : `Thought for ${displayDuration || 0}s`}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-2"
          >
            <div className="pl-3 border-l border-white/10 text-[11px] leading-relaxed text-white/40 italic whitespace-pre-wrap max-h-40 overflow-y-auto scrollbar-hide">
              {renderMarkdownText(thought)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MessageContent = ({ content }: { content: string }) => {
  if (!content) return null;

  // Simple parser for @[filename] mentions
  const parts = content.split(/(@\[.+?\])/g);

  return (
    <div className="text-[10px] leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.startsWith('@[') && part.endsWith(']')) {
          const fileName = part.slice(2, -1);
          return (
            <span
              key={i}
              className="inline-flex items-center bg-white/10 text-white border border-white/20 rounded-md px-1.5 py-0.5 mx-0.5 font-mono font-bold align-middle select-none text-[9px] shadow-[0_0_10px_rgba(255,255,255,0.05)]"
            >
              {fileName}
            </span>
          );
        }

        return <span key={i}>{renderMarkdownText(part)}</span>;
      })}
    </div>
  );
};

const MessageSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    {[1, 2, 3].map((i) => (
      <div key={i} className={`flex flex-col gap-3 ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
        <div className={`w-8 h-2 bg-white/5 rounded-full ${i % 2 === 0 ? 'mr-1' : 'ml-1'}`} />
        <div className={`h-16 w-full bg-white/3 rounded-2xl`} />{' '}
      </div>
    ))}
  </div>
);

export function DirectorChat() {
  const { messages, isMessagesLoading } = useStudioStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full w-80 shrink-0 bg-[#050505] border-l border-white/5">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide py-6 px-5">
        {isMessagesLoading ? (
          <MessageSkeleton />
        ) : messages.length === 0 ? (
          <ChatEmptyState />
        ) : (
          <div className="space-y-8 pb-4">
            <AnimatePresence initial={false}>
              {messages.map((message) => {
                const isAssistant = message.role === 'assistant';
                const hasInterleavedSteps =
                  isAssistant && message.steps?.some((s) => s.type === 'text');

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-full w-full flex flex-col ${
                        message.role === 'user'
                          ? 'bg-white/3 text-white/90 rounded-2xl p-4 self-end border border-white/2 shadow-xl'
                          : 'text-white/60 pl-1'
                      }`}
                    >
                      {isAssistant && message.steps && message.steps.length > 0 ? (
                        <div className="flex flex-col">
                          {(() => {
                            const AGENT_TOOLS: string[] = []; // No sub-agents, all tools are direct
                            let activeAgentTool: string | null = null;

                            return message.steps
                              .filter((step) => step.toolName !== 'updateWorkingMemory')
                              .map((step) => {
                                if (step.type === 'thought') {
                                  return (
                                    <ReasoningBlock
                                      key={step.id}
                                      thought={step.content || ''}
                                      duration={step.duration}
                                      isFinished={step.status !== 'running'}
                                    />
                                  );
                                }
                                if (step.type === 'text') {
                                  activeAgentTool = null;
                                  return (
                                    <div key={step.id} className="mb-3 last:mb-0">
                                      <MessageContent content={step.content || ''} />
                                    </div>
                                  );
                                }

                                const isAgent = AGENT_TOOLS.includes(step.toolName || '');
                                let depth = 0;

                                if (isAgent) {
                                  activeAgentTool = step.toolName!;
                                  depth = 0;
                                } else if (activeAgentTool) {
                                  depth = 1;
                                }

                                return <ToolStep key={step.id} step={step} depth={depth} />;
                              });
                          })()}

                          {!hasInterleavedSteps && message.content && (
                            <div className="mt-2">
                              <MessageContent content={message.content} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="leading-relaxed">
                          {isAssistant && message.status === 'loading' && !message.content ? (
                            <span className="flex gap-1.5 h-4 items-center pl-1">
                              <span className="w-1 h-1 bg-white rounded-full animate-bounce" />
                              <span className="w-1 h-1 bg-white/60 rounded-full animate-bounce delay-75" />
                              <span className="w-1 h-1 bg-white/30 rounded-full animate-bounce delay-150" />
                            </span>
                          ) : (
                            <MessageContent content={message.content} />
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <ChatInput />
    </div>
  );
}
