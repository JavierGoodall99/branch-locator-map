import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { LocationState, UseLocationResult } from '../model/useLocation'
import { LocateButton, LocationNote } from './LocationControl'

function withActions(state: LocationState): UseLocationResult {
  return { ...state, request: vi.fn(), clear: vi.fn() }
}

function setup(state: LocationState) {
  const location = withActions(state)
  render(
    <>
      <LocateButton location={location} />
      <LocationNote location={location} />
    </>,
  )
  return location
}

describe('LocateButton', () => {
  it('is a button named Near me that asks for the location only when pressed', async () => {
    const location = setup({ status: 'idle' })
    expect(location.request).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Near me' }))

    expect(location.request).toHaveBeenCalledTimes(1)
  })

  it('is not pressed until a location has been found', () => {
    setup({ status: 'idle' })

    expect(screen.getByRole('button', { name: 'Near me' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('says it is busy and cannot be pressed again while locating', () => {
    setup({ status: 'locating' })

    const button = screen.getByRole('button', { name: 'Finding your location' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })

  it('shows as pressed once located, and turns the location off when pressed again', async () => {
    const location = setup({ status: 'located', position: { lat: -26.2, lng: 28.05 } })

    const button = screen.getByRole('button', { name: 'Near me' })
    expect(button).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(button)

    expect(location.clear).toHaveBeenCalledTimes(1)
    expect(location.request).not.toHaveBeenCalled()
  })
})

describe('LocationNote', () => {
  it('explains what Near me does before the user taps, including that nothing leaves the device', () => {
    setup({ status: 'idle' })

    expect(screen.getByRole('status')).toHaveTextContent('sorts by distance')
    expect(screen.getByRole('status')).toHaveTextContent('stays on your device')
  })

  it('shows progress while locating', () => {
    setup({ status: 'locating' })

    expect(screen.getByRole('status')).toHaveTextContent('Finding your location')
  })

  it('confirms the nearest are shown once located', () => {
    setup({ status: 'located', position: { lat: -26.2, lng: 28.05 } })

    expect(screen.getByRole('status')).toHaveTextContent('nearest first')
  })

  it('tells the user how to fix a refusal, and lets them try again', async () => {
    const location = setup({ status: 'denied' })

    expect(screen.getByRole('status')).toHaveTextContent('turned off for this site')
    expect(screen.getByRole('status')).toHaveTextContent('search by name, suburb or postcode')
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(location.request).toHaveBeenCalledTimes(1)
  })

  it('offers a retry when no position came back', async () => {
    const location = setup({ status: 'failed' })

    expect(screen.getByRole('status')).toHaveTextContent('couldn’t find your location')
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(location.request).toHaveBeenCalledTimes(1)
  })

  it('points to search when the browser cannot share a location, with nothing to retry', () => {
    setup({ status: 'unavailable' })

    expect(screen.getByRole('status')).toHaveTextContent('can’t share your location')
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
  })
})
