import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import type { WindowFilters } from '@/features/branches/model/locatorFilters'
import type { Branch } from '@/features/branches/types'
import { FiltersModal } from './FiltersModal'

const NOTHING: WindowFilters = { openNow: false, open24Hours: false, province: null, services: [], sort: 'distance' }

function branch(id: string, services: string[]): Branch {
  return {
    id,
    name: `Capitec ${id}`,
    type: 'branch',
    services,
    address: '1 Test Street',
    province: 'Gauteng',
    postalCode: '2000',
    phone: null,
    location: { lat: -26.2, lng: 28.05 },
    status: 'open',
    hours: { open: '08:00', close: '17:00' },
  }
}

const branches = [branch('a', ['Branch', 'SmartID Services']), branch('b', ['ATM', 'Cash Accepting ATM'])]

function setup(props: Partial<ComponentProps<typeof FiltersModal>> = {}) {
  const handlers = {
    onHide: vi.fn(),
    onApply: vi.fn(),
    countResults: vi.fn<(filters: WindowFilters) => number>().mockReturnValue(7),
  }
  render(<FiltersModal show filters={NOTHING} branches={branches} located {...handlers} {...props} />)
  return handlers
}

const dialog = () => screen.getByRole('dialog', { name: 'Filters' })
const pill = (name: string) => within(dialog()).getByRole('button', { name })
const radio = (name: string) => within(dialog()).getByRole('radio', { name })

describe('FiltersModal', () => {
  it('shows nothing while it is closed', () => {
    setup({ show: false })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('is a dialog named by its title', () => {
    setup()

    expect(dialog()).toBeInTheDocument()
    expect(within(dialog()).getByRole('heading', { level: 2, name: 'Filters' })).toBeInTheDocument()
  })

  it('offers the services found in the data, leaving out the ones that only repeat the kind of site', () => {
    setup()

    const services = within(within(dialog()).getByRole('group', { name: 'Services' })).getAllByRole('button')
    expect(services.map((service) => service.textContent)).toEqual(['Cash Accepting ATM', 'SmartID Services'])
  })

  it('leaves out the Services group when the data has none to offer', () => {
    setup({ branches: [branch('a', ['Branch'])] })

    expect(within(dialog()).queryByRole('group', { name: 'Services' })).not.toBeInTheDocument()
  })

  it('starts from the filters that are applied', () => {
    setup({ filters: { ...NOTHING, openNow: true, province: 'Limpopo', services: ['SmartID Services'] } })

    expect(pill('Open now')).toHaveAttribute('aria-pressed', 'true')
    expect(pill('Open 24 hours')).toHaveAttribute('aria-pressed', 'false')
    expect(pill('Limpopo')).toHaveAttribute('aria-pressed', 'true')
    expect(pill('SmartID Services')).toHaveAttribute('aria-pressed', 'true')
  })

  it('changes nothing until the button is pressed, and then applies every choice at once and closes', async () => {
    const { onApply, onHide } = setup()

    await userEvent.click(pill('Open 24 hours'))
    await userEvent.click(pill('Cash Accepting ATM'))
    await userEvent.click(pill('Western Cape'))
    await userEvent.click(radio('Name'))
    expect(onApply).not.toHaveBeenCalled()

    await userEvent.click(pill('Show 7 results'))

    expect(onApply).toHaveBeenCalledTimes(1)
    expect(onApply).toHaveBeenCalledWith({
      openNow: false,
      open24Hours: true,
      province: 'Western Cape',
      services: ['Cash Accepting ATM'],
      sort: 'name',
    })
    expect(onHide).toHaveBeenCalledTimes(1)
  })

  it('asks how many places the choices leave each time they change, and says so on the button', async () => {
    const { countResults } = setup()
    countResults.mockImplementation((filters) => (filters.openNow ? 1 : 7))
    expect(pill('Show 7 results')).toBeEnabled()

    await userEvent.click(pill('Open now'))

    expect(countResults).toHaveBeenLastCalledWith({ ...NOTHING, openNow: true })
    expect(pill('Show 1 result')).toBeEnabled()
  })

  it('cannot apply choices that leave nothing', async () => {
    const { countResults, onApply } = setup()
    countResults.mockReturnValue(0)

    await userEvent.click(pill('Open now'))

    expect(pill('No results')).toBeDisabled()
    expect(onApply).not.toHaveBeenCalled()
  })

  it('chooses one province at a time, and goes back to all of them when the chosen one is pressed again', async () => {
    setup()

    await userEvent.click(pill('Gauteng'))
    await userEvent.click(pill('Limpopo'))
    expect(pill('Gauteng')).toHaveAttribute('aria-pressed', 'false')
    expect(pill('Limpopo')).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(pill('Limpopo'))
    expect(pill('Limpopo')).toHaveAttribute('aria-pressed', 'false')
  })

  it('allows several services at once, and lets one go again', async () => {
    const { onApply } = setup()

    await userEvent.click(pill('Cash Accepting ATM'))
    await userEvent.click(pill('SmartID Services'))
    await userEvent.click(pill('Cash Accepting ATM'))
    await userEvent.click(pill('Show 7 results'))

    expect(onApply).toHaveBeenCalledWith({ ...NOTHING, services: ['SmartID Services'] })
  })

  describe('sorting', () => {
    it('is a pair of radios, with Distance chosen when the location is known', () => {
      setup()

      expect(within(dialog()).getByRole('radiogroup', { name: 'Sort by' })).toBeInTheDocument()
      expect(radio('Distance')).toBeChecked()
      expect(radio('Name')).not.toBeChecked()
    })

    it('cannot sort by distance without the location, so it shows Name as chosen', () => {
      setup({ located: false })

      expect(radio('Distance')).toBeDisabled()
      expect(radio('Name')).toBeChecked()
    })

    it('keeps the preference for distance when nothing else changes, for when the location arrives', async () => {
      const { onApply } = setup({ located: false })

      await userEvent.click(pill('Show 7 results'))

      expect(onApply).toHaveBeenCalledWith(NOTHING)
    })
  })

  describe('Clear all', () => {
    it('is off when nothing is chosen', () => {
      setup()

      expect(pill('Clear all')).toBeDisabled()
    })

    it('clears every choice, including the sort, without applying it', async () => {
      const { onApply } = setup({
        filters: {
          openNow: true,
          open24Hours: true,
          province: 'Gauteng',
          services: ['SmartID Services'],
          sort: 'name',
        },
      })

      await userEvent.click(pill('Clear all'))

      expect(pill('Open now')).toHaveAttribute('aria-pressed', 'false')
      expect(pill('Gauteng')).toHaveAttribute('aria-pressed', 'false')
      expect(radio('Distance')).toBeChecked()
      expect(pill('Clear all')).toBeDisabled()
      expect(onApply).not.toHaveBeenCalled()
    })
  })

  it('closes without applying anything from its close button', async () => {
    const { onApply, onHide } = setup()
    await userEvent.click(pill('Open now'))

    await userEvent.click(within(dialog()).getByRole('button', { name: 'Close' }))

    expect(onHide).toHaveBeenCalledTimes(1)
    expect(onApply).not.toHaveBeenCalled()
  })

  it('closes without applying anything on Escape', async () => {
    const { onApply, onHide } = setup()
    await userEvent.click(pill('Open now'))

    await userEvent.keyboard('{Escape}')

    await waitFor(() => expect(onHide).toHaveBeenCalledTimes(1))
    expect(onApply).not.toHaveBeenCalled()
  })
})
