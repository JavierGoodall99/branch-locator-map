import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import type { Branch } from '../types'
import { BranchDetail } from './BranchDetail'

const branch: Branch = {
  id: 'sandton',
  name: 'Capitec Bank Sandton City',
  type: 'branch',
  services: ['Branch', 'SmartID Services'],
  address: 'Sandton City, Rivonia Road, Sandton, Gauteng, 2196',
  province: 'Gauteng',
  postalCode: '2196',
  phone: '+27 86 010 2043',
  location: { lat: -26.1076, lng: 28.0567 },
  status: 'open',
  hours: { open: '08:00', close: '17:00' },
}

/** Pretends the window is, or is not, wide enough for the side panel. */
const stubWide = (wide: boolean) =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: wide && query === '(min-width: 768px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )

/** 10:00 in South Africa (UTC+2). */
const morning = new Date('2026-10-14T08:00:00Z')

function setup(props: Partial<ComponentProps<typeof BranchDetail>> = {}) {
  const handlers = { onBack: vi.fn() }
  render(<BranchDetail branch={branch} now={morning} {...handlers} {...props} />)
  return handlers
}

describe('BranchDetail', () => {
  it('uses the branch name as the page heading and moves focus to it', () => {
    setup()

    const heading = screen.getByRole('heading', { level: 1, name: 'Capitec Bank Sandton City' })
    expect(heading).toHaveFocus()
  })

  it('leads with a summary of the badge, the full address and the status', () => {
    setup()
    const summary = document.querySelector('.branch-detail__summary') as HTMLElement

    expect(within(summary).getByText('Sandton City, Rivonia Road, Sandton, Gauteng, 2196')).toBeInTheDocument()
    expect(within(summary).queryByText('Branch')).not.toBeInTheDocument()
    expect(within(summary).getByText('Open until 17:00')).toBeInTheDocument()
    expect(summary.querySelector('.type-badge--branch')).toHaveAttribute('aria-hidden', 'true')
  })

  it('shows the ATM badge for an ATM', () => {
    setup({ branch: { ...branch, type: 'atm' } })
    const summary = document.querySelector('.branch-detail__summary') as HTMLElement

    expect(summary.querySelector('.type-badge--atm')).not.toBeNull()
  })

  describe('beside the map', () => {
    beforeEach(() => stubWide(true))
    afterEach(() => vi.unstubAllGlobals())

    it('has a photo that is decoration, with sources in modern formats and a size to reserve space', () => {
      setup()
      const image = document.querySelector('.detail-hero img') as HTMLImageElement

      expect(image).toHaveAttribute('alt', '')
      expect(image).toHaveAttribute('width')
      expect(image).toHaveAttribute('height')
      expect(image).toHaveAttribute('decoding', 'async')
      expect(document.querySelectorAll('.detail-hero source').length).toBeGreaterThan(0)
    })

    it('puts the way back over the photo', () => {
      setup()

      expect(document.querySelector('.detail-hero')).toContainElement(
        screen.getByRole('button', { name: 'Back to results' }),
      )
    })
  })

  describe('on a phone', () => {
    beforeEach(() => stubWide(false))
    afterEach(() => vi.unstubAllGlobals())

    it('has no photo, and does not download one, only the way back in the corner', () => {
      setup()

      expect(document.querySelector('img')).toBeNull()
      expect(document.querySelector('picture')).toBeNull()
      expect(document.querySelector('.detail-bar')).toContainElement(
        screen.getByRole('button', { name: 'Back to results' }),
      )
    })

    it('still goes back, and keeps the name, address and buttons', async () => {
      const { onBack } = setup()

      await userEvent.click(screen.getByRole('button', { name: 'Back to results' }))

      expect(onBack).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('heading', { level: 1, name: 'Capitec Bank Sandton City' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Get directions/ })).toBeInTheDocument()
    })
  })

  it('puts the way back first, so it is the first stop for the keyboard', () => {
    setup()

    const [first] = screen.getAllByRole('button')
    expect(first).toHaveAccessibleName('Back to results')
  })

  it('shows hours and services under their own headings', () => {
    setup()

    expect(screen.getByRole('heading', { level: 2, name: 'Opening hours' })).toBeInTheDocument()
    expect(screen.getByText('08:00 to 17:00')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Services' })).toBeInTheDocument()
    expect(screen.getByText('SmartID Services')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Contact' })).not.toBeInTheDocument()
  })

  it('shows around-the-clock and missing hours in words', () => {
    setup({ branch: { ...branch, hours: { open: '00:00', close: '24:00' } } })
    expect(screen.getByText('Open 24 hours', { selector: 'p' })).toBeInTheDocument()
  })

  it('links to directions in a new tab and to the phone number', () => {
    setup()

    const directions = screen.getByRole('link', { name: /Get directions/ })
    expect(directions).toHaveAttribute('href', 'https://www.google.com/maps/dir/?api=1&destination=-26.1076,28.0567')
    expect(directions).toHaveAttribute('target', '_blank')
    expect(screen.getAllByRole('link', { name: /\+27 86 010 2043|Call/ })[0]).toHaveAttribute(
      'href',
      'tel:+27860102043',
    )
  })

  it('leaves out phone links when there is no number', () => {
    setup({ branch: { ...branch, phone: null } })

    expect(screen.queryByRole('link', { name: /Call/ })).not.toBeInTheDocument()
  })

  it('goes back to the results', async () => {
    const { onBack } = setup()

    await userEvent.click(screen.getByRole('button', { name: 'Back to results' }))

    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('has no Previous or Next, and no status announcer', () => {
    setup()

    expect(screen.queryByRole('button', { name: /Previous|Next/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows the distance when it is known, and nothing when it is not', () => {
    setup({ distanceKm: 12.6 })
    expect(screen.getByText('13 km', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('away', { exact: false })).toHaveClass('visually-hidden')
  })

  it('shows no distance without a location', () => {
    setup()
    expect(document.querySelector('.branch-detail__distance')).toBeNull()
  })
})
