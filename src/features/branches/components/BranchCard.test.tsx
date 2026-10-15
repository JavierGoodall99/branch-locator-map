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

  it('shows the address, open status and services', () => {
    render(<BranchCard branch={branch} now={morning} onSelect={vi.fn()} />)
    const card = screen.getByRole('article')

    expect(within(card).getByText(/Rivonia Road/)).toBeInTheDocument()
    expect(within(card).getByText('Open until 17:00')).toBeInTheDocument()
    expect(within(card).getByText('Branch')).toBeInTheDocument()
    expect(within(card).getByText('SmartID Services')).toBeInTheDocument()
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

  it('opens the details when Details is pressed', async () => {
    const onSelect = vi.fn()
    render(<BranchCard branch={branch} now={morning} onSelect={onSelect} />)

    await userEvent.click(screen.getByRole('button', { name: 'Details for Capitec Bank Sandton City' }))

    expect(onSelect).toHaveBeenCalledWith('sandton')
  })

  it('shows how far away it is when the distance is known', () => {
    render(<BranchCard branch={branch} now={morning} distanceKm={2.34} onSelect={vi.fn()} />)

    expect(screen.getByText('2,3 km')).toBeInTheDocument()
    expect(screen.getByRole('article')).toHaveTextContent('2,3 km away')
  })

  it('shows no distance when the location is unknown', () => {
    render(<BranchCard branch={branch} now={morning} onSelect={vi.fn()} />)

    expect(screen.getByRole('article')).not.toHaveTextContent('away')
  })
})
