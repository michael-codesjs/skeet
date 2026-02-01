'use client';
import { MessageStep, useStudioStore } from '@/stores/studio';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown2, Magicpen } from 'iconsax-react';
import { useEffect, useRef, useState } from 'react';
import { ChatEmptyState } from './empty-state';
import { ChatHeader } from './header';
import { ChatInput } from './input';
import { CompassIcon, MemoryIcon, ProjectIcon, ScissorIcon } from './tool-icons';

const ToolStep = ({ step }: { step: MessageStep }) => {
  const isRunning = step.status === 'running';
  const isDone = step.status === 'done';
  const isError = step.status === 'error';

  const getIcon = () => {
    const colorClass = isError ? 'text-red-500' : isDone ? 'text-green-500' : 'text-white/40';

    if (step.toolName === 'editor') {
      return (
        <div className={colorClass}>
          <ScissorIcon active={isRunning} />
        </div>
      );
    }
    if (step.toolName === 'scout') {
      return (
        <div className={colorClass}>
          <CompassIcon active={isRunning} />
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
    return <Magicpen size={14} className={colorClass} variant="Bold" color="currentColor" />;
  };

  const formatToolName = (name: string) => {
    if (!name) return '';
    // Convert camelCase to Title Case with spaces
    return name
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getStatusText = () => {
    if (isRunning) return 'Is Working';
    if (isError) return 'Failed';
    return 'Completed';
  };

  return (
    <div className="flex items-center gap-2 py-1 mb-3h-4">
      <div className="w-3 shrink-0 flex items-center justify-center leading-0 text-white/40">
        {getIcon()}
      </div>
      <span className="text-[10px] font-medium text-white/40">
        {formatToolName(step.toolName || '')} {getStatusText()}
      </span>
    </div>
  );
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

  // Strip markdown formatting from thought text
  const stripMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove **bold**
      .replace(/\*(.+?)\*/g, '$1') // Remove *italic*
      .replace(/`(.+?)`/g, '$1'); // Remove `code`
  };

  if (!thought && !isFinished) return null;

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-[10px] font-medium text-white/40 hover:text-white/60 transition-colors group mb-2 h-4"
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
            className="overflow-hidden"
          >
            <div className="pl-3 border-l border-white/10 text-[11px] leading-relaxed text-white/40 italic whitespace-pre-wrap max-h-40 overflow-y-auto scrollbar-hide">
              {stripMarkdown(thought)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SmoothTypewriter = ({ content }: { content: string }) => {
  const stripMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove **bold**
      .replace(/\*(.+?)\*/g, '$1') // Remove *italic*
      .replace(/`(.+?)`/g, '$1'); // Remove `code`
  };

  return <span className="whitespace-pre-wrap text-[10px]">{stripMarkdown(content)}</span>;
};

const MessageSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {[1, 2, 3].map((i) => (
      <div key={i} className={`flex flex-col gap-1 ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
        <div className={`w-12 h-2 bg-white/5 rounded ${i % 2 === 0 ? 'mr-1' : 'ml-1'}`} />
        <div
          className={`h-12 w-[80%] bg-white/5 rounded-lg ${i % 2 === 0 ? 'bg-neutral-800/40' : ''}`}
        />
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
    <div className="flex flex-col h-full w-80 shrink-0 border-l border-white/5 bg-black/40">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide py-4 px-4">
        {isMessagesLoading ? (
          <MessageSkeleton />
        ) : messages.length === 0 ? (
          <ChatEmptyState />
        ) : (
          <div className="space-y-6 text-white pb-4">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col gap-1 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[95%] w-full flex flex-col ${
                      message.role === 'user'
                        ? 'bg-neutral-800/80 text-white/90 rounded-lg p-2 self-end'
                        : 'text-white/60'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <>
                        {message.steps && message.steps.length > 0 && (
                          <div className="mb-4">
                            {message.steps
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
                                return <ToolStep key={step.id} step={step} />;
                              })}
                          </div>
                        )}
                      </>
                    )}

                    <div className="text-xs leading-relaxed">
                      {message.role === 'assistant' &&
                      message.status === 'loading' &&
                      !message.content ? (
                        <span className="flex gap-1 h-4 items-center">
                          <span className="w-1 h-1 bg-white/30 rounded-full animate-bounce" />
                          <span className="w-1 h-1 bg-white/30 rounded-full animate-bounce delay-75" />
                          <span className="w-1 h-1 bg-white/30 rounded-full animate-bounce delay-150" />
                        </span>
                      ) : (
                        <SmoothTypewriter content={message.content} />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <ChatInput />
    </div>
  );
}
