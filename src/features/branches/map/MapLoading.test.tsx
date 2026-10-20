import { render, screen } from '@testing-library/react'
import { MapLoading } from './MapLoading'

describe('MapLoading', () => {
  it('shows a spinner, which is hidden from assistive technology', () => {
    const { container } = render(<MapLoading />)

    expect(container.querySelector('.spinner-border')).toHaveAttribute('aria-hidden', 'true')
  })

  it('tells a screen reader the map is loading, as a status message, without showing the words', () => {
    render(<MapLoading />)

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Loading map')
    expect(screen.getByText('Loading map…')).toHaveClass('visually-hidden')
  })
})
