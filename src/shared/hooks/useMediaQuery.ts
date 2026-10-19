import { useSyncExternalStore } from 'react'

/**
 * Whether a CSS media query matches right now, and it updates when that changes (the window is
 * resized, the phone turned). It is false where `matchMedia` does not exist, such as in tests.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== 'function') return () => {}
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
    () => false,
  )
}
