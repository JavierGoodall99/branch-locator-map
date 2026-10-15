import { useCallback, useEffect, useRef, useState } from 'react'
import type { Coordinates } from '../types'

export type LocationState =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'located'; position: Coordinates }
  /** The user, or their browser settings, refused. */
  | { status: 'denied' }
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

// A coarse, recently cached position is plenty for sorting branches by distance, and it is
// quicker and kinder to batteries than a high-accuracy fix.
const OPTIONS: PositionOptions = { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 }

/** The user's location, only ever requested when `request` is called. It is never stored or sent. */
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
        setState({ status: error.code === PERMISSION_DENIED ? 'denied' : 'failed' })
      },
      OPTIONS,
    )
  }, [])

  const clear = useCallback(() => {
    latestRequest.current += 1
    setState({ status: 'idle' })
  }, [])

  return { ...state, request, clear }
}
