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

  it('keeps the same icon while locating, and turns it, instead of swapping in a spinner', () => {
    const { unmount } = render(<LocateButton location={withActions({ status: 'locating' })} />)
    const busy = screen.getByRole('button', { name: 'Finding your location' })
    expect(busy.querySelector('.spinner-border')).toBeNull()
    expect(busy.querySelector('svg')).not.toBeNull()
    expect(busy.querySelector('svg')!.parentElement).toHaveClass('search-box__spin')
    unmount()

    render(<LocateButton location={withActions({ status: 'idle' })} />)
    const idle = screen.getByRole('button', { name: 'Near me' })
    expect(idle.querySelector('svg')).not.toBeNull()
    expect(idle.querySelector('.search-box__spin')).toBeNull()
  })

  it('keeps the turning icon hidden from assistive technology, which hears the message instead', () => {
    render(<LocateButton location={withActions({ status: 'locating' })} />)

    expect(screen.getByRole('button', { name: 'Finding your location' }).querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
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

describe('LocateButton explanation', () => {
  it('explains Near me as its tooltip, which is also its description for assistive technology', () => {
    setup({ status: 'idle' })

    const button = screen.getByRole('button', { name: 'Near me' })
    expect(button).toHaveAttribute('title', expect.stringContaining('sorts by distance'))
    expect(button).toHaveAttribute('title', expect.stringContaining('stays on your device'))
    expect(button).toHaveAccessibleDescription(/stays on your device/)
  })
})

describe('LocationNote', () => {
  it('says nothing before Near me is used, so the page is not cluttered', () => {
    setup({ status: 'idle' })

    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('announces that it is finding the location, without showing any text for it', () => {
    setup({ status: 'locating' })

    const note = screen.getByRole('status')
    expect(note).toHaveTextContent('Finding your location')
    expect(note).toHaveClass('visually-hidden')
  })

  it('shows a failure message on the page, not hidden', () => {
    setup({ status: 'denied' })

    expect(screen.getByRole('status')).not.toHaveClass('visually-hidden')
  })

  it('says nothing once located, because the cards then show distances', () => {
    setup({ status: 'located', position: { lat: -26.2, lng: 28.05 } })

    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('splits a message into a short part, which a phone shows, and what to do next, which it keeps for screen readers', () => {
    setup({ status: 'denied' })

    const note = screen.getByRole('status')
    expect(note.querySelector('.location-note__summary')).toHaveTextContent('Location is turned off for this site.')
    expect(note.querySelector('.location-note__more')).toHaveTextContent('Allow it when your browser asks')
    // A screen reader still hears all of it, in order, with a space between the parts.
    expect(note).toHaveTextContent(/^Location is turned off for this site\. Allow it when your browser asks, or search by name, suburb or postcode\.\s*Try again$/)
  })

  it('tells the user how to fix a refusal, and lets them try again', async () => {
    const location = setup({ status: 'denied' })

    expect(screen.getByRole('status')).toHaveTextContent('turned off for this site')
    expect(screen.getByRole('status')).toHaveTextContent('search by name, suburb or postcode')
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(location.request).toHaveBeenCalledTimes(1)
  })

  describe('when the browser has blocked the site', () => {
    const blocked = { status: 'denied' as const, blocked: true }

    it('says what helps, short on a phone, and that it will notice', () => {
      setup(blocked)

      const note = screen.getByRole('status')
      expect(note.querySelector('.location-note__summary')).toHaveTextContent('Location is blocked. Allow it in your browser.')
      expect(note.querySelector('.location-note__more')).toHaveTextContent('lock icon beside the web address')
      expect(note.querySelector('.location-note__more')).toHaveTextContent('we’ll find you as soon as you do')
    })

    it('has no Try again, because the browser would not show its prompt', () => {
      setup(blocked)

      expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
    })
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
