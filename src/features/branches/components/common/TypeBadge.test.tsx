import { render } from '@testing-library/react'
import { TypeBadge } from './TypeBadge'

describe('TypeBadge', () => {
  it('is a square badge for a branch and for a business centre', () => {
    for (const type of ['branch', 'business-centre'] as const) {
      const { container, unmount } = render(<TypeBadge type={type} />)
      expect(container.firstElementChild).toHaveClass('type-badge--branch')
      unmount()
    }
  })

  it('is a round badge for an ATM', () => {
    const { container } = render(<TypeBadge type="atm" />)

    expect(container.firstElementChild).toHaveClass('type-badge--atm')
    expect(container.firstElementChild).not.toHaveClass('type-badge--branch')
  })

  it('is decoration, hidden from assistive technology', () => {
    const { container } = render(<TypeBadge type="branch" />)

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('draws an icon in it', () => {
    const { container } = render(<TypeBadge type="atm" />)

    expect(container.querySelector('svg path')).not.toBeNull()
  })
})
