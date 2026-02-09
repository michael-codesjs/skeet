export const ScissorIcon = ({ active }: { active?: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-inherit"
  >
    <g
      style={{
        transformOrigin: '12px 12px',
        animationName: active ? 'scissor-top' : 'none',
        animationDuration: '0.8s',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
      }}
    >
      <path d="M6 18L18 6" />
      <circle cx="6" cy="18" r="3" />
    </g>
    <g
      style={{
        transformOrigin: '12px 12px',
        animationName: active ? 'scissor-bottom' : 'none',
        animationDuration: '0.8s',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
      }}
    >
      <path d="M6 6L18 18" />
      <circle cx="6" cy="6" r="3" />
    </g>
    <style jsx>{`
      @keyframes scissor-top {
        0%,
        100% {
          transform: rotate(0deg);
        }
        50% {
          transform: rotate(15deg);
        }
      }
      @keyframes scissor-bottom {
        0%,
        100% {
          transform: rotate(0deg);
        }
        50% {
          transform: rotate(-15deg);
        }
      }
    `}</style>
  </svg>
);

export const CompassIcon = ({ active }: { active?: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-inherit"
  >
    <path d="M12 3L21 12L12 21L3 12L12 3Z" strokeWidth="1.5" />
    <g
      style={{
        transformOrigin: '12px 12px',
        animationName: active ? 'compass-spin' : 'none',
        animationDuration: '3s',
        animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        animationIterationCount: 'infinite',
      }}
    >
      <path d="M12 8L12 16M8 12L16 12" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </g>

    <style jsx>{`
      @keyframes compass-spin {
        0% {
          transform: rotate(0deg);
        }
        25% {
          transform: rotate(90deg);
        }
        50% {
          transform: rotate(90deg);
        }
        75% {
          transform: rotate(180deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `}</style>
  </svg>
);

export const MemoryIcon = ({ active }: { active?: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-inherit"
  >
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    {active && (
      <>
        <line
          x1="8"
          y1="7"
          x2="16"
          y2="7"
          opacity="0.6"
          style={{
            animationName: active ? 'fade-line' : 'none',
            animationDuration: '1.2s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDelay: '0s',
          }}
        />
        <line
          x1="8"
          y1="11"
          x2="14"
          y2="11"
          opacity="0.6"
          style={{
            animationName: active ? 'fade-line' : 'none',
            animationDuration: '1.2s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDelay: '0.3s',
          }}
        />
        <line
          x1="8"
          y1="15"
          x2="12"
          y2="15"
          opacity="0.6"
          style={{
            animationName: active ? 'fade-line' : 'none',
            animationDuration: '1.2s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDelay: '0.6s',
          }}
        />
      </>
    )}
    <style jsx>{`
      @keyframes fade-line {
        0%,
        100% {
          opacity: 0.2;
        }
        50% {
          opacity: 0.8;
        }
      }
    `}</style>
  </svg>
);

export const ProjectIcon = ({ active }: { active?: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-inherit"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" strokeWidth="1.5" opacity="0.4" />
    <line x1="16" y1="17" x2="8" y2="17" strokeWidth="1.5" opacity="0.4" />
    <line x1="10" y1="9" x2="8" y2="9" strokeWidth="1.5" opacity="0.4" />

    {active && (
      <line
        x1="6"
        y1="10"
        x2="18"
        y2="10"
        stroke="currentColor"
        strokeWidth="1"
        style={{
          animation: 'scan 1.5s ease-in-out infinite',
        }}
      />
    )}

    <style jsx>{`
      @keyframes scan {
        0%,
        100% {
          transform: translateY(0px);
          opacity: 0;
        }
        50% {
          transform: translateY(10px);
          opacity: 1;
        }
      }
    `}</style>
  </svg>
);

export const TimelineIcon = ({ active }: { active?: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-inherit"
  >
    {/* The Playhead */}
    <line x1="12" y1="4" x2="12" y2="20" strokeWidth="1.5" />

    {/* The Signal Waves */}
    <path
      d="M15 9c1.5 1.5 1.5 4.5 0 6"
      opacity="0.4"
      style={{
        animationName: active ? 'signal-pulse' : 'none',
        animationDuration: '1.2s',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
      }}
    />
    <path
      d="M9 9c-1.5 1.5-1.5 4.5 0 6"
      opacity="0.4"
      style={{
        animationName: active ? 'signal-pulse' : 'none',
        animationDuration: '1.2s',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
      }}
    />
    <path
      d="M18 7c2.5 2.5 2.5 7.5 0 10"
      opacity="0.2"
      style={{
        animationName: active ? 'signal-pulse' : 'none',
        animationDuration: '1.2s',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
        animationDelay: '0.3s',
      }}
    />
    <path
      d="M6 7c-2.5 2.5-2.5 7.5 0 10"
      opacity="0.2"
      style={{
        animationName: active ? 'signal-pulse' : 'none',
        animationDuration: '1.2s',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
        animationDelay: '0.3s',
      }}
    />

    <style jsx>{`
      @keyframes signal-pulse {
        0%,
        100% {
          opacity: 0.1;
          transform: scaleX(0.9);
        }
        50% {
          opacity: 0.8;
          transform: scaleX(1.1);
        }
      }
    `}</style>
  </svg>
);

export const EditorIcon = ({ active }: { active?: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-inherit"
  >
    {/* Incoming and Outgoing segments */}
    <rect
      x="3"
      y="10"
      width="7"
      height="4"
      rx="1"
      strokeWidth="1.5"
      style={{
        animationName: active ? 'splice-left' : 'none',
        animationDuration: '1.2s',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
      }}
    />
    <rect
      x="14"
      y="10"
      width="7"
      height="4"
      rx="1"
      strokeWidth="1.5"
      style={{
        animationName: active ? 'splice-right' : 'none',
        animationDuration: '1.2s',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
      }}
    />

    {/* The Joiner Spark */}
    {active && (
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none">
        <animate attributeName="opacity" values="0;1;0" dur="1.2s" repeatCount="indefinite" />
        <animate attributeName="r" values="1;3;1" dur="1.2s" repeatCount="indefinite" />
      </circle>
    )}

    <style jsx>{`
      @keyframes splice-left {
        0%,
        100% {
          transform: translateX(0px);
        }
        50% {
          transform: translateX(1.5px);
        }
      }
      @keyframes splice-right {
        0%,
        100% {
          transform: translateX(0px);
        }
        50% {
          transform: translateX(-1.5px);
        }
      }
    `}</style>
  </svg>
);

export const SearchIcon = ({ active }: { active?: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-inherit"
  >
    {/* Background segments */}
    <rect x="2" y="14" width="4" height="2" rx="0.5" opacity="0.3" />
    <rect x="7" y="14" width="6" height="2" rx="0.5" opacity="0.3" />
    <rect x="14" y="14" width="8" height="2" rx="0.5" opacity="0.3" />

    <g
      style={{
        transformOrigin: '10px 10px',
        animationName: active ? 'search-pulse' : 'none',
        animationDuration: '1.5s',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
      }}
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </g>

    <style jsx>{`
      @keyframes search-pulse {
        0%,
        100% {
          transform: scale(1) translate(0, 0);
        }
        50% {
          transform: scale(1.1) translate(-1px, -1px);
        }
      }
    `}</style>
  </svg>
);
