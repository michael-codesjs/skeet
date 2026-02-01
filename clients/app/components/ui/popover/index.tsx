'use client';
import { useDisclosure } from '@/hooks/use-disclosure';
import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
  width?: string | number;
  offset?: { x?: number; y?: number };
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  onToggle?: () => void;
}

export function Popover({
  trigger,
  children,
  className = '',
  align = 'left',
  width = 280,
  offset = { x: 0, y: 0 },
  isOpen: controlledIsOpen,
  onOpen: controlledOnOpen,
  onClose: controlledOnClose,
  onToggle: controlledOnToggle,
}: PopoverProps) {
  const disclosure = useDisclosure(false);

  const isOpen = controlledIsOpen ?? disclosure.isOpen;
  const onToggle = controlledOnToggle ?? disclosure.onToggle;
  const onClose = controlledOnClose ?? disclosure.onClose;

  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let left = rect.left + (offset.x || 0);

      if (align === 'right') {
        left = rect.right - (typeof width === 'number' ? width : 0) + (offset.x || 0);
      } else if (align === 'center') {
        left =
          rect.left +
          rect.width / 2 -
          (typeof width === 'number' ? width / 2 : 0) +
          (offset.x || 0);
      }

      setCoords({
        top: rect.bottom + window.scrollY + 8 + (offset.y || 0),
        left: left + window.scrollX,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <div ref={triggerRef} onClick={onToggle} className="cursor-pointer inline-block">
        {trigger}
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={popoverRef}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                style={{
                  position: 'absolute',
                  top: coords.top,
                  left: coords.left,
                  width: width,
                  zIndex: 9999,
                }}
                className={`
                  bg-[#0A0A0A]/90 backdrop-blur-2xl border border-white/10 rounded-2xl 
                  shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/5
                  ${className}
                `}
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
