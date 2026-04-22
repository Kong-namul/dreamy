interface IconProps {
  size?: number
  className?: string
  style?: React.CSSProperties
}

// 카카오톡 스타일 사람 실루엣 (꽉 찬 fill)
export const PersonIcon = ({ size = 20, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <path d="M12 12.5a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5zM4 20.5c0-3.59 3.58-6.5 8-6.5s8 2.91 8 6.5c0 .28-.22.5-.5.5h-15a.5.5 0 0 1-.5-.5z"/>
  </svg>
)

// 별 (별헤는밤)
export const StarIcon = ({ size = 20, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <path d="M12 2.5l2.6 6.1 6.6.6-5 4.5 1.5 6.5L12 17l-5.7 3.2L7.8 13.7l-5-4.5 6.6-.6L12 2.5z"/>
  </svg>
)

// 구름 (구름산책)
export const CloudIcon = ({ size = 20, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <path d="M7 18a5 5 0 0 1-.7-9.95A6 6 0 0 1 17.7 8a4.5 4.5 0 0 1 .3 9H7z"/>
  </svg>
)

export const ChevronRightIcon = ({ size = 16, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path
      d="M9 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const ChevronLeftIcon = ({ size = 16, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path
      d="M15 6l-6 6 6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const MoonIcon = ({ size = 20, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const BookIcon = ({ size = 20, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path
      d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const BarChartIcon = ({ size = 20, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <rect x="3" y="12" width="4" height="9" rx="1" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <rect x="10" y="7" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <rect x="17" y="3" width="4" height="18" rx="1" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
)

export const GlobeIcon = ({ size = 20, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9M12 3c2.5 3 4 5.5 4 9s-1.5 6-4 9M3 12h18"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
)

export const DiamondIcon = ({ size = 14, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <path d="M6 2L2 8l10 14L22 8l-4-6H6zM2 8h20M6 2l-2 6M18 2l2 6M12 22L2 8M12 22L22 8" />
    <path
      d="M2 8h20L12 22 2 8zM6 2h12l4 6H2l4-6z"
      fill="currentColor"
      fillOpacity="0.9"
    />
  </svg>
)

export const SparkleIcon = ({ size = 18, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path
      d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
)

export const CloudMoonIcon = ({ size = 18, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <defs>
      <clipPath id="cmi-moon-clip">
        <rect x="0" y="0" width="24" height="12.5" />
      </clipPath>
    </defs>
    {/* Crescent moon — upper-left, clipped where cloud overlaps */}
    <path
      d="M12 3A6 6 0 1 1 6 10A5 5 0 0 0 12 3z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      clipPath="url(#cmi-moon-clip)"
    />
    {/* Cloud — lower portion, drawn on top */}
    <path
      d="M4 21Q2.5 21 2 19Q1.5 15.5 5 14.5Q6.5 11.5 10.5 13Q12.5 10 15.5 12.5Q19.5 11.5 20 15Q21 16.5 20.5 19Q20 21 17.5 21Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const JournalIcon = ({ size = 18, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <rect x="4" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M4 7h14M8 2v5M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

export const SunIcon = ({ size = 18, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
)

export const SaveIcon = ({ size = 18, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path
      d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const ArrowLeftIcon = ({ size = 16, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const CloseIcon = ({ size = 14, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const DreamyLogo = ({ size = 28, className, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
    {/* Cloud body */}
    <ellipse cx="16" cy="20" rx="12" ry="7" fill="currentColor" fillOpacity="0.18" />
    <ellipse cx="16" cy="20" rx="10" ry="5.5" fill="currentColor" fillOpacity="0.3" />
    {/* Moon in cloud */}
    <path
      d="M20 11a6 6 0 1 1-8.2 1.4A4.5 4.5 0 0 0 20 11z"
      fill="currentColor"
    />
    {/* Stars */}
    <circle cx="8" cy="10" r="1" fill="currentColor" fillOpacity="0.7" />
    <circle cx="24" cy="8" r="0.8" fill="currentColor" fillOpacity="0.7" />
    <circle cx="26" cy="14" r="0.6" fill="currentColor" fillOpacity="0.5" />
  </svg>
)
