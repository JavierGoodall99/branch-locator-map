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

/** 10:00 in South Africa (UTC+2). */
const morning = new Date('2026-10-14T08:00:00Z')

function setup(props: Partial<ComponentProps<typeof BranchDetail>> = {}) {
  const handlers = { onBack: vi.fn(), onPrevious: vi.fn(), onNext: vi.fn() }
  render(<BranchDetail branch={branch} position={2} total={5} now={morning} {...handlers} {...props} />)
  return handlers
}

describe('BranchDetail', () => {
  it('uses the branch name as the page heading and moves focus to it', () => {
    setup()

    const heading = screen.getByRole('heading', { level: 1, name: 'Capitec Bank Sandton City' })
    expect(heading).toHaveFocus()
  })

  it('leads with a summary of the kind of site, its full address and its status', () => {
    setup()
    const summary = document.querySelector('.branch-detail__summary') as HTMLElement

    expect(within(summary).getByText('Sandton City, Rivonia Road, Sandton, Gauteng, 2196')).toBeInTheDocument()
    expect(within(summary).getByText('Branch')).toBeInTheDocument()
    expect(within(summary).getByText('Open until 17:00')).toBeInTheDocument()
    expect(summary.querySelector('.type-badge--branch')).toHaveAttribute('aria-hidden', 'true')
  })

  it('calls an ATM an ATM, with the ATM badge', () => {
    setup({ branch: { ...branch, type: 'atm' } })
    const summary = document.querySelector('.branch-detail__summary') as HTMLElement

    expect(within(summary).getByText('ATM')).toBeInTheDocument()
    expect(summary.querySelector('.type-badge--atm')).not.toBeNull()
  })

  it('has a photo that is decoration, with sources in modern formats and a size to reserve space', () => {
    setup()
    const image = document.querySelector('.detail-hero img') as HTMLImageElement

    expect(image).toHaveAttribute('alt', '')
    expect(image).toHaveAttribute('width')
    expect(image).toHaveAttribute('height')
    expect(image).toHaveAttribute('decoding', 'async')
    expect(document.querySelectorAll('.detail-hero source').length).toBeGreaterThan(0)
  })

  it('puts the way back first, so it is the first stop for the keyboard', () => {
    setup()

    const [first] = screen.getAllByRole('button')
    expect(first).toHaveAccessibleName('Back to results')
  })

  it('shows hours, services and contact under their own headings', () => {
    setup()

    expect(screen.getByRole('heading', { level: 2, name: 'Opening hours' })).toBeInTheDocument()
    expect(screen.getByText('08:00 to 17:00')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Services' })).toBeInTheDocument()
    expect(screen.getByText('SmartID Services')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Contact' })).toBeInTheDocument()
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

  it('moves to the previous and next branch', async () => {
    const { onPrevious, onNext } = setup()

    await userEvent.click(screen.getByRole('button', { name: 'Previous branch' }))
    await userEvent.click(screen.getByRole('button', { name: 'Next branch' }))

    expect(onPrevious).toHaveBeenCalledTimes(1)
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('announces the position so a screen reader hears each change', () => {
    setup()

    expect(screen.getByRole('status')).toHaveTextContent('Capitec Bank Sandton City, 2 of 5')
  })

  it('disables Previous on the first branch and Next on the last', () => {
    const { rerender } = render(
      <BranchDetail branch={branch} position={1} total={3} now={morning} onBack={vi.fn()} onPrevious={vi.fn()} onNext={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: 'Previous branch' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next branch' })).toBeEnabled()

    rerender(
      <BranchDetail branch={branch} position={3} total={3} now={morning} onBack={vi.fn()} onPrevious={vi.fn()} onNext={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: 'Previous branch' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Next branch' })).toBeDisabled()
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
