import { useCallback, useEffect, useRef, useState } from 'react'
import type { Coordinates } from '@/features/branches/types'

export type LocationState =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'located'; position: Coordinates }
  /**
   * The user, or their browser settings, refused. `blocked` means the browser will not ask again,
   * so only changing the site's setting helps; otherwise asking again opens the permission prompt.
   */
  | { status: 'denied'; blocked?: boolean }
  /** The browser has no geolocation at all. */
  | { status: 'unavailable' }
  /** Allowed, but no position came back in time. Worth trying again. */
  | { status: 'failed' }

export type UseLocationResult = LocationState & {
  /** Asks the browser for the user's position. This is what triggers the permission prompt. */
  request: () => void
  /** Forgets the position and goes back to the default list. */
  clear: () => void
}

const PERMISSION_DENIED = 1

/**
 * The browser's own record of what the user has decided for this site, where it keeps one (the
 * Permissions API), or null where it does not or cannot say. Reading it never shows a prompt.
 */
async function geolocationPermission(): Promise<PermissionStatus | null> {
  try {
    return (await navigator.permissions?.query({ name: 'geolocation' })) ?? null
  } catch {
    return null
  }
}

// A coarse, recently cached position is plenty for sorting branches by distance, and it is
// quicker and kinder to batteries than a high-accuracy fix.
const OPTIONS: PositionOptions = { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 }

/** The user's location, requested when `request` is called (the page does so on arrival). It is never stored or sent. */
export function useLocation(): UseLocationResult {
  const [state, setState] = useState<LocationState>({ status: 'idle' })

  // Each request gets a number; an answer only counts if it is still the latest request.
  // This drops answers that arrive after the user cleared, retried or left the page.
  const latestRequest = useRef(0)
  useEffect(() => {
    return () => {
      latestRequest.current += 1
    }
  }, [])

  const request = useCallback(() => {
    if (!('geolocation' in navigator) || !navigator.geolocation) {
      setState({ status: 'unavailable' })
      return
    }

    const id = ++latestRequest.current
    setState({ status: 'locating' })

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (id !== latestRequest.current) return
        setState({ status: 'located', position: { lat: coords.latitude, lng: coords.longitude } })
      },
      (error) => {
        if (id !== latestRequest.current) return
        if (error.code !== PERMISSION_DENIED) {
          setState({ status: 'failed' })
          return
        }
        setState({ status: 'denied' })
        // A browser that has blocked the site will not show its prompt again, so asking again cannot
        // help; find out, so the message can say what does.
        void geolocationPermission().then((permission) => {
          if (permission?.state === 'denied' && id === latestRequest.current) {
            setState({ status: 'denied', blocked: true })
          }
        })
      },
      OPTIONS,
    )
  }, [])

  // After a refusal, if the user changes their mind in the browser's site settings (the lock icon
  // beside the address), find them straight away: no need to come back and press anything.
  const refused = state.status === 'denied'
  useEffect(() => {
    if (!refused) return
    let cancelled = false
    let permission: PermissionStatus | null = null
    const onChange = () => {
      if (permission && permission.state !== 'denied') request()
    }
    void geolocationPermission().then((found) => {
      if (cancelled || !found) return
      permission = found
      found.addEventListener('change', onChange)
    })
    return () => {
      cancelled = true
      permission?.removeEventListener('change', onChange)
    }
  }, [refused, request])

  const clear = useCallback(() => {
    latestRequest.current += 1
    setState({ status: 'idle' })
  }, [])

  return { ...state, request, clear }
}
