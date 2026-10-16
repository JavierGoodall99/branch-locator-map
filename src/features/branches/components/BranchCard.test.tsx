import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Branch } from '../types'
import { BranchCard } from './BranchCard'

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

describe('BranchCard', () => {
  it('names the card by its heading', () => {
    render(<BranchCard branch={branch} now={morning} onSelect={vi.fn()} />)

    expect(screen.getByRole('article', { name: 'Capitec Bank Sandton City' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Capitec Bank Sandton City' })).toBeInTheDocument()
  })

  it('shows the open status and services, but not the full address, which is for the details', () => {
    render(<BranchCard branch={branch} now={morning} onSelect={vi.fn()} />)
    const card = screen.getByRole('article')

    expect(within(card).queryByText(/Rivonia Road/)).not.toBeInTheDocument()
    expect(card).not.toHaveTextContent('2196')
    expect(within(card).getByText('Open until 17:00')).toBeInTheDocument()
    const services = within(within(card).getByRole('list'))
    expect(services.getByText('Branch')).toBeInTheDocument()
    expect(services.getByText('SmartID Services')).toBeInTheDocument()
  })

  it('links to directions in a new tab, and says so', () => {
    render(<BranchCard branch={branch} now={morning} onSelect={vi.fn()} />)
    const link = screen.getByRole('link', { name: /Directions to Capitec Bank Sandton City/ })

    expect(link).toHaveAttribute('href', 'https://www.google.com/maps/dir/?api=1&destination=-26.1076,28.0567')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(link).toHaveAccessibleName(/opens in a new tab/)
  })

  it('offers a call link that names the branch', () => {
    render(<BranchCard branch={branch} now={morning} onSelect={vi.fn()} />)

    expect(screen.getByRole('link', { name: 'Call Capitec Bank Sandton City' })).toHaveAttribute(
      'href',
      'tel:+27860102043',
    )
  })

  it('leaves out the call link when there is no phone number', () => {
    render(<BranchCard branch={{ ...branch, phone: null }} now={morning} onSelect={vi.fn()} />)

    expect(screen.queryByRole('link', { name: /^Call/ })).not.toBeInTheDocument()
  })

  it('shows closed sites as closed', () => {
    render(<BranchCard branch={{ ...branch, status: 'temporarily-closed' }} now={morning} onSelect={vi.fn()} />)

    expect(screen.getByText('Temporarily closed')).toBeInTheDocument()
  })

  it('opens the details when the card is pressed, through its name', async () => {
    const onSelect = vi.fn()
    render(<BranchCard branch={branch} now={morning} onSelect={onSelect} />)

    await userEvent.click(screen.getByRole('button', { name: 'Capitec Bank Sandton City' }))

    expect(onSelect).toHaveBeenCalledWith('sandton')
  })

  it('has no separate Details button', () => {
    render(<BranchCard branch={branch} now={morning} onSelect={vi.fn()} />)

    expect(screen.queryByRole('button', { name: /Details/ })).not.toBeInTheDocument()
  })

  it('opens from the keyboard, and has one stop for the card, on its name', async () => {
    const onSelect = vi.fn()
    render(<BranchCard branch={branch} now={morning} onSelect={onSelect} />)

    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Capitec Bank Sandton City' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')

    expect(onSelect).toHaveBeenCalledWith('sandton')
  })

  it('keeps Directions and Call as their own controls, which do not open the details', async () => {
    const onSelect = vi.fn()
    render(<BranchCard branch={branch} now={morning} onSelect={onSelect} />)

    await userEvent.click(screen.getByRole('link', { name: /Directions/ }))
    await userEvent.click(screen.getByRole('link', { name: /Call/ }))

    expect(onSelect).not.toHaveBeenCalled()
  })

  it('keeps the name button inside the heading, so the card is still named by its heading', () => {
    render(<BranchCard branch={branch} now={morning} onSelect={vi.fn()} />)

    const heading = screen.getByRole('heading', { level: 2 })
    expect(within(heading).getByRole('button', { name: 'Capitec Bank Sandton City' })).toBeInTheDocument()
  })

  it('shows how far away it is when the distance is known', () => {
    render(<BranchCard branch={branch} now={morning} distanceKm={2.34} onSelect={vi.fn()} />)

    expect(screen.getByText('2,3 km away')).toBeInTheDocument()
  })

  it('shows no distance when the location is unknown', () => {
    render(<BranchCard branch={branch} now={morning} onSelect={vi.fn()} />)

    expect(screen.getByRole('article')).not.toHaveTextContent('away')
  })

  describe('the line under the name', () => {
    const line = () => document.querySelector('.branch-card__meta')!
    /** What a sighted user reads: the text without the parts that are only for screen readers. */
    const visibleText = (element: Element) => {
      const copy = element.cloneNode(true) as Element
      copy.querySelectorAll('.visually-hidden').forEach((node) => node.remove())
      return copy.textContent?.replace(/\s+/g, ' ').trim()
    }

    it('says what kind of site it is and where, with the distance in between once it is known', () => {
      render(<BranchCard branch={branch} now={morning} distanceKm={3.04} onSelect={vi.fn()} />)

      expect(visibleText(line())).toBe('Branch · 3,0 km away · Sandton')
    })

    it('leaves the distance out without a location', () => {
      render(<BranchCard branch={branch} now={morning} onSelect={vi.fn()} />)

      expect(visibleText(line())).toBe('Branch · Sandton')
    })

    it('uses the suburb when the address has one', () => {
      render(
        <BranchCard
          branch={{ ...branch, address: 'Yarona Mall, Watt Avenue, Wynberg, Sandton, Gauteng, 2090' }}
          now={morning}
          onSelect={vi.fn()}
        />,
      )

      expect(visibleText(line())).toBe('Branch · Wynberg')
    })

    it('calls an ATM an ATM, and a business centre a business centre', () => {
      const { rerender } = render(<BranchCard branch={{ ...branch, type: 'atm' }} now={morning} onSelect={vi.fn()} />)
      expect(line()).toHaveTextContent(/^ATM/)

      rerender(<BranchCard branch={{ ...branch, type: 'business-centre' }} now={morning} onSelect={vi.fn()} />)
      expect(line()).toHaveTextContent(/^Business centre/)
    })

    it('reads with commas, not dots, for a screen reader', () => {
      render(<BranchCard branch={branch} now={morning} distanceKm={3.04} onSelect={vi.fn()} />)

      const dots = [...line().querySelectorAll('[aria-hidden="true"]')]
      expect(dots.length).toBeGreaterThan(0)
      expect(dots.every((dot) => dot.textContent?.trim() === '·')).toBe(true)
      expect(line().querySelectorAll('.visually-hidden')).toHaveLength(dots.length)
    })
  })

  it('shows a badge for the kind of site, hidden from assistive technology', () => {
    const { container, rerender } = render(<BranchCard branch={branch} now={morning} onSelect={vi.fn()} />)
    expect(container.querySelector('.type-badge--branch')).toHaveAttribute('aria-hidden', 'true')

    rerender(<BranchCard branch={{ ...branch, type: 'atm' }} now={morning} onSelect={vi.fn()} />)
    expect(container.querySelector('.type-badge--atm')).not.toBeNull()
  })
})
