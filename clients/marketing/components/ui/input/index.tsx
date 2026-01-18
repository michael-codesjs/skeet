import { cn } from '@/lib/utils';
import { Eye, EyeSlash } from 'iconsax-react';
import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, startIcon, endIcon, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === 'password';

    const handleTogglePassword = () => {
      setShowPassword((prev) => !prev);
    };

    const generatedId = React.useId();
    const id = props.id || generatedId;

    return (
      <div className="w-full flex flex-col space-y-4">
        {label && (
          <label
            htmlFor={id}
            className="text-xs uppercase tracking-wider font-semibold text-neutral-500 cursor-pointer hover:text-neutral-400 transition-colors"
          >
            {label}
          </label>
        )}
        <div className="relative group">
          {startIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-white transition-colors">
              {startIcon}
            </div>
          )}
          <input
            type={isPassword ? (showPassword ? 'text' : 'password') : type}
            className={cn(
              'flex h-14 w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-base ring-offset-black',
              'placeholder:text-neutral-600 text-white',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:bg-white/10 focus-visible:border-white/20',
              'disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 ease-out',
              startIcon && 'pl-11',
              (endIcon || isPassword) && 'pr-11',
              error && 'border-red-500/50 focus-visible:ring-red-500/20 bg-red-500/5',
              className,
            )}
            ref={ref}
            id={id}
            {...props}
          />
          {isPassword ? (
            <button
              type="button"
              onClick={handleTogglePassword}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors focus:outline-none"
            >
              {showPassword ? (
                <EyeSlash size={20} variant="Bold" color="currentColor" />
              ) : (
                <Eye size={20} variant="Bold" color="currentColor" />
              )}
            </button>
          ) : (
            endIcon && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500">
                {endIcon}
              </div>
            )
          )}
        </div>
        {error && <p className="text-xs text-red-400 mt-1 font-medium">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
