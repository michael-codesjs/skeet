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
        animation: active ? 'scissor-top 0.8s ease-in-out infinite' : 'none',
      }}
    >
      <path d="M6 18L18 6" />
      <circle cx="6" cy="18" r="3" />
    </g>
    <g
      style={{
        transformOrigin: '12px 12px',
        animation: active ? 'scissor-bottom 0.8s ease-in-out infinite' : 'none',
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
        animation: active ? 'compass-spin 3s cubic-bezier(0.4, 0, 0.2, 1) infinite' : 'none',
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
            animation: 'fade-line 1.2s ease-in-out infinite',
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
            animation: 'fade-line 1.2s ease-in-out infinite',
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
            animation: 'fade-line 1.2s ease-in-out infinite',
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
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    {active && (
      <>
        <circle
          cx="12"
          cy="13"
          r="0"
          style={{
            animation: 'pulse-dot 1.5s ease-in-out infinite',
          }}
        />
      </>
    )}
    <style jsx>{`
      @keyframes pulse-dot {
        0%,
        100% {
          r: 0;
          opacity: 0.8;
        }
        50% {
          r: 2;
          opacity: 0.2;
        }
      }
    `}</style>
  </svg>
);
