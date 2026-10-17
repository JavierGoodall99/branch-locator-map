import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

describe('LocatorLayout when a branch is open', () => {
  const layout = (detailOpen?: boolean) =>
    render(
      <LocatorLayout
        controls={<input aria-label="Search" />}
        results={<h1>Results</h1>}
        map={<p>Map content</p>}
        detailOpen={detailOpen}
      />,
    )

  it('is the normal layout by default', () => {
    const { container } = layout()

    expect(container.firstElementChild).not.toHaveClass('locator--detail')
  })

  it('switches to the detail layout, in which the details take the whole sidebar', () => {
    const { container } = layout(true)

    expect(container.firstElementChild).toHaveClass('locator--detail')
  })

  it('keeps the controls in the page, hidden by the layout, so what was typed survives', () => {
    layout(true)

    expect(screen.getByLabelText('Search')).toBeInTheDocument()
  })
})

describe('LocatorLayout sheet handle', () => {
  const layout = (detailOpen?: boolean) =>
    render(
      <LocatorLayout
        controls={<input aria-label="Search" />}
        results={<h1>Results</h1>}
        map={<p>Map content</p>}
        detailOpen={detailOpen}
      />,
    )

  it('is the first thing in the results, as a button that says what it does', () => {
    layout()

    const handle = screen.getByRole('button', { name: 'Hide results' })
    expect(screen.getByRole('main').firstElementChild).toBe(handle)
    expect(handle).toHaveAttribute('aria-controls', 'results-content')
    expect(document.getElementById('results-content')).toContainElement(screen.getByRole('heading', { name: 'Results' }))
  })

  it('lowers the sheet, and raises it again, and its name follows', async () => {
    const { container } = layout()
    expect(container.firstElementChild).not.toHaveClass('locator--lowered')

    await userEvent.click(screen.getByRole('button', { name: 'Hide results' }))
    expect(container.firstElementChild).toHaveClass('locator--lowered')
    expect(screen.getByRole('button', { name: 'Show results' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Show results' }))
    expect(container.firstElementChild).not.toHaveClass('locator--lowered')
  })

  it('shows its name only while lowered, when there is nothing else on the strip', async () => {
    layout()
    expect(screen.getByText('Hide results')).toHaveClass('visually-hidden')

    await userEvent.click(screen.getByRole('button', { name: 'Hide results' }))

    expect(screen.getByText('Show results')).not.toHaveClass('visually-hidden')
  })

  it('keeps the results in the page while lowered, so nothing is lost', async () => {
    layout()

    await userEvent.click(screen.getByRole('button', { name: 'Hide results' }))

    expect(screen.getByRole('heading', { name: 'Results' })).toBeInTheDocument()
  })

  it('starts raised in the details layout', () => {
    const { container } = layout(true)

    expect(container.firstElementChild).toHaveClass('locator--detail')
    expect(container.firstElementChild).not.toHaveClass('locator--lowered')
  })
})
