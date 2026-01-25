'use client';

import { cn } from '@/lib/utils';
import React, { forwardRef } from 'react';

type BaseProps = {
  label?: string;
  error?: string;
  startIcon?: React.ReactElement;
  endIcon?: React.ReactElement;
};

type InputAttributes = React.InputHTMLAttributes<HTMLInputElement> &
  BaseProps & {
    type?: Exclude<string, 'textarea'>;
  };

type TextareaAttributes = React.TextareaHTMLAttributes<HTMLTextAreaElement> &
  BaseProps & {
    type: 'textarea';
  };

type InputProps = InputAttributes | TextareaAttributes;

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  (props, ref) => {
    const { className, label, error, startIcon, endIcon, ...rest } = props;
    const isTextarea = props.type === 'textarea';

    const renderIcon = (icon: React.ReactElement, position: 'left' | 'right') => {
      return (
        <div
          className={cn(
            'absolute text-neutral-500 flex items-center justify-center z-10',
            position === 'left' ? 'left-4' : 'right-4',
            isTextarea ? 'top-5' : 'top-1/2 -translate-y-1/2',
          )}
        >
          {React.cloneElement(icon, {
            size: (icon.props as any).size || 20,
            color: 'currentColor',
            variant: (icon.props as any).variant || 'Linear',
          } as any)}
        </div>
      );
    };

    const renderInput = () => {
      if (isTextarea) {
        const textareaProps = rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>;
        return (
          <textarea
            className={cn(
              'w-full rounded-xl border border-white/10 bg-white/5 p-4 text-white placeholder:text-neutral-600 focus:border-white/20 focus:outline-none transition-all resize-none',
              startIcon && 'pl-12',
              endIcon && 'pr-12',
              error && 'border-red-500/50 focus:border-red-500',
              className,
            )}
            ref={ref as React.ForwardedRef<HTMLTextAreaElement>}
            {...textareaProps}
          />
        );
      }

      const inputProps = rest as React.InputHTMLAttributes<HTMLInputElement>;
      return (
        <input
          className={cn(
            'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder:text-neutral-600 focus:border-white/20 focus:outline-none transition-all',
            startIcon && 'pl-12',
            endIcon && 'pr-12',
            error && 'border-red-500/50 focus:border-red-500',
            className,
          )}
          ref={ref as React.ForwardedRef<HTMLInputElement>}
          {...inputProps}
        />
      );
    };

    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label htmlFor={props.id} className="text-sm font-medium text-neutral-300 ml-1">
            {label}
          </label>
        )}
        <div className="relative">
          {startIcon && renderIcon(startIcon, 'left')}
          {renderInput()}
          {endIcon && renderIcon(endIcon, 'right')}
        </div>
        {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
