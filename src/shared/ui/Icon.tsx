const PATHS = {
  bank: 'M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18',
  cash: 'M3 8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2zM12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z',
  deposit: 'M12 4v10M8 10l4 4 4-4M5 20h14',
  briefcase: 'M3 9a2 2 0 012-2h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M3 13h18',
  idCard: 'M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2zM8 11a1.5 1.5 0 100 .01M6 16c.5-1.5 3.5-1.5 4 0M14 10h4M14 14h4',
  navigation: 'M3 11l18-8-8 18-2-8z',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z',
  check: 'M12 3a9 9 0 100 18 9 9 0 000-18zM8 12l3 3 5-6',
  clock: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2',
  moon: 'M20 14a8 8 0 01-10-10 8 8 0 1010 10z',
  info: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 11v5M12 8v.01',
  alert: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v6M12 16v.01',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4',
  close: 'M6 6l12 12M18 6L6 18',
  pin: 'M12 21s-6-5.2-6-10a6 6 0 1112 0c0 4.8-6 10-6 10zM12 8.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z',
  locate:'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v3M12 19v3M2 12h3M19 12h3',
  chevronLeft: 'M15 6l-6 6 6 6',
  chevronRight: 'M9 6l6 6-6 6',
} as const

export type IconName = keyof typeof PATHS

interface IconProps {
  name: IconName
  /** Pixel size; the design uses 16, 20 and 24. */
  size?: 16 | 20 | 24
}

/** Decorative line icon. It is hidden from assistive tech, so always pair it with text. */
export function Icon({ name, size = 20 }: IconProps) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
