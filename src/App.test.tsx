import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import sample from '../public/branches.json'
import App from './App'

// The real map needs WebGL, which jsdom does not have. BranchMap has its own tests with a fake map.
vi.mock('./features/branches/components/BranchMap', () => ({
  BranchMap: () => <div data-testid="map" />,
}))

// There are ~190 cards, and role queries compute an accessible name for each, which is slow
// in jsdom and can time out on a busy machine. Counting cards with a plain selector keeps
// these tests quick; each card's own accessibility is covered by the BranchCard tests.
const cardCount = () => document.querySelectorAll('article.branch-card').length
const firstDetailsButton = () => document.querySelector<HTMLButtonElement>('[id^="details-"]')!

const stubSample = () =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(sample))))

describe('App', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('loads the sample data and lists the branches', async () => {
    stubSample()
    render(<App />)

    expect(screen.getByText('Loading branches')).toBeInTheDocument()

    const listed = sample.filter(
      (branch) => branch.status !== 'permanently-closed' && branch.type !== 'atm',
    ).length
    await waitFor(() => expect(cardCount()).toBe(listed))
    expect(screen.getByText(`${listed} locations, sorted by name`)).toBeInTheDocument()
  })

  it('recovers from a failed load when the user retries', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('down', { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(sample)))
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Branch service responded with status 503.',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    await waitFor(() => expect(cardCount()).toBeGreaterThan(0))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('narrows the list as the user searches, and clears back', async () => {
    stubSample()
    render(<App />)
    await waitFor(() => expect(cardCount()).toBeGreaterThan(0))
    const before = cardCount()

    await userEvent.type(screen.getByRole('searchbox'), 'sandton')

    expect(cardCount()).toBeGreaterThan(0)
    expect(cardCount()).toBeLessThan(before)

    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(cardCount()).toBe(before)
    expect(screen.getByRole('searchbox')).toHaveValue('')
  })

  it('shows more locations when both branches and ATMs are selected', async () => {
    stubSample()
    render(<App />)
    await waitFor(() => expect(cardCount()).toBeGreaterThan(0))
    const branchesOnly = cardCount()

    await userEvent.click(screen.getByRole('button', { name: 'Both' }))

    expect(cardCount()).toBeGreaterThan(branchesOnly)
  })

  describe('branch details', () => {
    async function openFirstBranch() {
      stubSample()
      render(<App />)
      await waitFor(() => expect(cardCount()).toBeGreaterThan(0))
      const button = firstDetailsButton()
      const id = button.id
      await userEvent.click(button)
      return id
    }

    it('opens a branch from the list and focuses its heading', async () => {
      await openFirstBranch()

      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveFocus()
      expect(heading).not.toHaveTextContent('Branches and ATMs')
      expect(cardCount()).toBe(0)
    })

    it('goes back to the list and returns focus to that branch', async () => {
      const buttonId = await openFirstBranch()

      await userEvent.click(screen.getByRole('button', { name: 'Back to results' }))

      expect(cardCount()).toBeGreaterThan(0)
      expect(document.getElementById(buttonId)).toHaveFocus()
    })

    it('moves to the next and previous branch', async () => {
      await openFirstBranch()
      const first = screen.getByRole('heading', { level: 1 }).textContent

      await userEvent.click(screen.getByRole('button', { name: 'Next branch' }))
      const second = screen.getByRole('heading', { level: 1 }).textContent
      expect(second).not.toBe(first)
      expect(screen.getByText(/^2 of \d+$/)).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'Previous branch' }))
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(first!)
    })

    it('returns to the list when the search changes', async () => {
      await openFirstBranch()

      await userEvent.type(screen.getByRole('searchbox'), 'a')

      expect(cardCount()).toBeGreaterThan(0)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Branches and ATMs')
    })
  })
})
