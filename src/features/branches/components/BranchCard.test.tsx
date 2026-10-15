import { render, screen, within } from '@testing-library/react'
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
    render(<BranchCard branch={branch} now={morning} />)

    expect(screen.getByRole('article', { name: 'Capitec Bank Sandton City' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Capitec Bank Sandton City' })).toBeInTheDocument()
  })

  it('shows the address, open status and services', () => {
    render(<BranchCard branch={branch} now={morning} />)
    const card = screen.getByRole('article')

    expect(within(card).getByText(/Rivonia Road/)).toBeInTheDocument()
    expect(within(card).getByText('Open until 17:00')).toBeInTheDocument()
    expect(within(card).getByText('Branch')).toBeInTheDocument()
    expect(within(card).getByText('SmartID Services')).toBeInTheDocument()
  })

  it('links to directions in a new tab, and says so', () => {
    render(<BranchCard branch={branch} now={morning} />)
    const link = screen.getByRole('link', { name: /Directions to Capitec Bank Sandton City/ })

    expect(link).toHaveAttribute('href', 'https://www.google.com/maps/dir/?api=1&destination=-26.1076,28.0567')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(link).toHaveAccessibleName(/opens in a new tab/)
  })

  it('offers a call link that names the branch', () => {
    render(<BranchCard branch={branch} now={morning} />)

    expect(screen.getByRole('link', { name: 'Call Capitec Bank Sandton City' })).toHaveAttribute(
      'href',
      'tel:+27860102043',
    )
  })

  it('leaves out the call link when there is no phone number', () => {
    render(<BranchCard branch={{ ...branch, phone: null }} now={morning} />)

    expect(screen.queryByRole('link', { name: /^Call/ })).not.toBeInTheDocument()
  })

  it('shows closed sites as closed', () => {
    render(<BranchCard branch={{ ...branch, status: 'temporarily-closed' }} now={morning} />)

    expect(screen.getByText('Temporarily closed')).toBeInTheDocument()
  })
})
