import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const baseProps: Partial<IconProps> = {
  width: 26,
  height: 26,
  viewBox: '0 0 24 24',
  fill: 'none',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <defs>
        <linearGradient id="homeGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <path
        d="M4 11.5 11.3 4.7a1 1 0 0 1 1.4 0L20 11.5"
        stroke="url(#homeGradient)"
      />
      <path d="M6.5 10.5V18a1.5 1.5 0 0 0 1.5 1.5h8a1.5 1.5 0 0 0 1.5-1.5v-7.5" stroke="url(#homeGradient)" />
      <path d="M10 18v-4.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V18" stroke="url(#homeGradient)" />
    </svg>
  )
}

export function HabitsIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <defs>
        <linearGradient id="habitGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#a3e635" />
        </linearGradient>
      </defs>
      <rect
        x="3.5"
        y="4"
        width="17"
        height="16"
        rx="4"
        stroke="url(#habitGradient)"
      />
      <path
        d="M8 7.5h8"
        stroke="url(#habitGradient)"
        strokeLinecap="round"
      />
      <path
        d="M8 11.5 10.2 14 16 8.5"
        stroke="url(#habitGradient)"
      />
    </svg>
  )
}

export function FriendsIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <defs>
        <linearGradient id="friendsGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <circle cx="9" cy="9" r="3" stroke="url(#friendsGradient)" />
      <circle cx="16" cy="10" r="2.5" stroke="url(#friendsGradient)" />
      <path
        d="M4.5 17.5C5.3 15.4 7 14 9 14s3.7 1.4 4.5 3.5"
        stroke="url(#friendsGradient)"
      />
      <path
        d="M13 17c.6-.9 1.5-1.5 2.6-1.5 1.4 0 2.6.9 3.1 2.3"
        stroke="url(#friendsGradient)"
      />
    </svg>
  )
}

export function ProfileIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <defs>
        <linearGradient id="profileGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="8.2" r="3.2" stroke="url(#profileGradient)" />
      <path
        d="M5 18.5c1.3-2.2 3.4-3.5 7-3.5s5.7 1.3 7 3.5"
        stroke="url(#profileGradient)"
      />
    </svg>
  )
}

