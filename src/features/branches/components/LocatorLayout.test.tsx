import { render, screen } from '@testing-library/react'
import { LocatorLayout } from './LocatorLayout'

function renderLayout() {
  return render(
    <LocatorLayout
      controls={<input aria-label="Search" />}
      results={<h1>Results</h1>}
      map={<p>Map content</p>}
    />,
  )
}

describe('LocatorLayout', () => {
  it('renders each slot in its landmark', () => {
    renderLayout()

    expect(screen.getByRole('banner')).toContainElement(screen.getByLabelText('Search'))
    expect(screen.getByRole('main')).toContainElement(screen.getByRole('heading', { name: 'Results' }))
    expect(screen.getByRole('region', { name: /map/i })).toHaveTextContent('Map content')
  })

  it('offers a skip link that targets the results', () => {
    renderLayout()

    expect(screen.getByRole('link', { name: 'Skip to results' })).toHaveAttribute('href', '#results')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'results')
  })

  it('puts the list before the map so it works as an alternative', () => {
    renderLayout()

    const main = screen.getByRole('main')
    const map = screen.getByRole('region', { name: /map/i })
    expect(main.compareDocumentPosition(map) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
