import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from './ErrorBoundary'

function Broken(): never {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  // React logs a caught render error to the console as well; keep the test output quiet.
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}))
  afterEach(() => vi.restoreAllMocks())

  it('shows what is inside it when nothing goes wrong', () => {
    render(
      <ErrorBoundary>
        <p>All well</p>
      </ErrorBoundary>,
    )

    expect(screen.getByText('All well')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows a message and a way forward instead of a blank page when something throws while rendering', () => {
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
    expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reload the page' })).toBeInTheDocument()
  })

  it('records the error where a developer will see it', () => {
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    )

    expect(console.error).toHaveBeenCalledWith('The page failed to render.', expect.any(Error), expect.any(String))
  })

  it('reloads the page when asked', async () => {
    const reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload })
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Reload the page' }))

    expect(reload).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })
})
