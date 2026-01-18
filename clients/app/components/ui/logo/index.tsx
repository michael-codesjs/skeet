import React from 'react';
import { twMerge } from 'tailwind-merge';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  variant?: 'star' | 'abstract' | 'eye' | 'slice' | 'timeline-slice';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'star', className, ...props }) => {
  const baseClasses = 'text-white fill-current transition-all duration-300';

  switch (variant) {
    case 'abstract':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={twMerge(baseClasses, className)}
          {...props}
        >
          <path
            d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
            className="fill-current"
            opacity="0.2"
          />
          <path
            d="M12 6L13.5 10.5L18 12L13.5 13.5L12 18L10.5 13.5L6 12L10.5 10.5L12 6Z"
            className="fill-white"
          />
        </svg>
      );
    case 'eye':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={twMerge(baseClasses, className)}
          {...props}
        >
          <path
            d="M12 5C7 5 2.73 8.11 1 12C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 12C21.27 8.11 17 5 12 5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z"
            className="fill-white/30"
          />
          <path d="M12 9L15 12L12 15L9 12L12 9Z" className="fill-white" />
        </svg>
      );
    case 'slice':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={twMerge(baseClasses, className)}
          {...props}
        >
          <path d="M4 4H10L20 20H14L4 4Z" className="fill-white" />
          <path d="M20 4H14L16.5 8L22.5 8L20 4Z" className="fill-white/60" />
          <path d="M4 20H10L7.5 16L1.5 16L4 20Z" className="fill-white/60" />
        </svg>
      );
    case 'timeline-slice':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={twMerge(baseClasses, className)}
          {...props}
        >
          {/* Mask for the cutout */}
          <mask id="slice-mask-final">
            <rect x="0" y="0" width="24" height="24" fill="white" />
            {/* The negative space cut */}
            <path d="M-2 23L26 1" stroke="black" strokeWidth="4" />
          </mask>

          {/* Vertical Bars Group */}
          <g mask="url(#slice-mask-final)">
            {/* Bar 1 */}
            <rect x="2" y="9" width="3" height="6" className="fill-white" />
            {/* Bar 2 */}
            <rect x="6.5" y="6" width="3" height="12" className="fill-white" />
            {/* Bar 3 (Center) */}
            <rect x="11" y="2" width="3" height="20" className="fill-white" />
            {/* Bar 4 */}
            <rect x="15.5" y="6" width="3" height="12" className="fill-white" />
            {/* Bar 5 */}
            <rect x="20" y="9" width="3" height="6" className="fill-white" />
          </g>

          {/* The Blade Line */}
          <path
            d="M-2 23L26 1"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round" // Round makes the tips effectively 'sharp' at this thinness versus square
            className="drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" // Subtle glow to match the 'neon' feel
          />
        </svg>
      );
    case 'star':
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={twMerge(baseClasses, className)}
          {...props}
        >
          {/* Main Star Body */}
          <path
            d="M12 2C12.8 8.5 15.5 11.2 22 12C15.5 12.8 12.8 15.5 12 22C11.2 15.5 8.5 12.8 2 12C8.5 11.2 11.2 8.5 12 2Z"
            className="fill-white"
          />
          {/* Subtle Cut/Slice Effect */}
          <path d="M12 2V12M12 12H22" stroke="black" strokeWidth="0.5" strokeOpacity="0.2" />
        </svg>
      );
  }
};
