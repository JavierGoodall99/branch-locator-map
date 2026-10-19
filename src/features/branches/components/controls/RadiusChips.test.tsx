import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { LocationState, UseLocationResult } from '@/features/branches/model/useLocation'
import { RadiusChips } from './RadiusChips'

function setup(state: LocationState, radiusKm: number | null = null) {
  const location: UseLocationResult = { ...state, request: vi.fn(), clear: vi.fn() }
  const onChange = vi.fn()
  render(<RadiusChips radiusKm={radiusKm} onChange={onChange} location={location} />)
  return { onChange, request: location.request }
}

const located: LocationState = { status: 'located', position: { lat: -26.2, lng: 28.05 } }
const group = () => screen.getByRole('group', { name: 'Distance from you' })
const chip = (km: number) => within(group()).getByRole('button', { name: `${km} km` })

describe('RadiusChips', () => {
  it('offers 5, 10, 25, 50 and 100 km, in one labelled group', () => {
    setup(located)

    expect(
      within(group())
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['5 km', '10 km', '25 km', '50 km', '100 km'])
  })

  describe('once the location is known', () => {
    it('marks the chosen distance, and only that one', () => {
      setup(located, 25)

      expect(chip(25)).toHaveAttribute('aria-pressed', 'true')
      for (const km of [5, 10, 50, 100]) expect(chip(km)).toHaveAttribute('aria-pressed', 'false')
    })

    it('chooses another distance without asking for the location again', async () => {
      const { onChange, request } = setup(located, 25)

      await userEvent.click(chip(10))

      expect(onChange).toHaveBeenCalledWith(10)
      expect(request).not.toHaveBeenCalled()
    })

    it('goes back to any distance when the chosen one is pressed again', async () => {
      const { onChange } = setup(located, 25)

      await userEvent.click(chip(25))

      expect(onChange).toHaveBeenCalledWith(null)
    })

    it('has no hint, because there is nothing to explain', () => {
      setup(located)

      expect(group()).not.toHaveAccessibleDescription()
    })
  })

  describe('before the location is known', () => {
    it('shows no distance as chosen, because none applies yet, but keeps every one on', () => {
      setup({ status: 'idle' }, 25)

      for (const km of [5, 10, 25, 50, 100]) {
        expect(chip(km)).toBeEnabled()
        expect(chip(km)).toHaveAttribute('aria-pressed', 'false')
      }
    })

    it('keeps the distance and asks for the location when one is chosen', async () => {
      const { onChange, request } = setup({ status: 'idle' })

      await userEvent.click(chip(50))

      expect(onChange).toHaveBeenCalledWith(50)
      expect(request).toHaveBeenCalledTimes(1)
    })

    it.each<LocationState['status']>(['denied', 'failed', 'unavailable'])('asks again after %s', async (status) => {
      const { request } = setup({ status } as LocationState)

      await userEvent.click(chip(5))

      expect(request).toHaveBeenCalledTimes(1)
    })

    it('tells a screen reader that choosing one asks for the location, without showing it', () => {
      setup({ status: 'idle' })

      expect(group()).toHaveAccessibleDescription('Choosing a distance asks for your location.')
      expect(screen.getByText('Choosing a distance asks for your location.')).toHaveClass('visually-hidden')
    })
  })

  describe('while the location is on its way', () => {
    it('shows the chosen distance, which applies when it arrives', () => {
      setup({ status: 'locating' }, 25)

      expect(chip(25)).toHaveAttribute('aria-pressed', 'true')
    })

    it('changes the distance without asking twice', async () => {
      const { onChange, request } = setup({ status: 'locating' }, 25)

      await userEvent.click(chip(5))

      expect(onChange).toHaveBeenCalledWith(5)
      expect(request).not.toHaveBeenCalled()
    })
  })
})
