import { render, screen } from '@testing-library/react'
import { BrandHeader } from './BrandHeader'

describe('BrandHeader', () => {
  it('shows the Capitec logo with an accessible name', () => {
    render(<BrandHeader />)

    const logo = screen.getByRole('img', { name: 'Capitec' })
    expect(logo).toHaveAttribute('src', expect.stringContaining('capitec-logo'))
  })

  it('names the page "Branch finder"', () => {
    render(<BrandHeader />)

    expect(screen.getByText('Branch finder')).toBeInTheDocument()
  })

  it('hides the divider from assistive technology, since it is only decoration', () => {
    const { container } = render(<BrandHeader />)

    expect(container.querySelector('.brand-header__divider')).toHaveAttribute('aria-hidden', 'true')
  })
})
