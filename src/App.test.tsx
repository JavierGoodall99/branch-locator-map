import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import sample from '../public/branches.json'
import App from './App'

// The real map needs WebGL, which jsdom does not have. BranchMap has its own tests with a fake map.
vi.mock('@/features/branches/components/BranchMap', () => ({
  // It reports which place it was told to highlight, so the tests can see the list and the map agree.
  BranchMap: ({ hoveredId }: { hoveredId?: string | null }) => <div data-testid="map" data-hovered={hoveredId ?? ''} />,
}))

// There are ~190 cards, and role queries compute an accessible name for each, which is slow
// in jsdom and can time out on a busy machine. Counting cards with a plain selector keeps
// these tests quick; each card's own accessibility is covered by the BranchCard tests.
// The page starts on both branches and ATMs, so it is the longest list, and so gets more time.
vi.setConfig({ testTimeout: 30_000 })

const searchField = () => screen.getByRole('combobox', { name: 'Search by name, suburb, town or postcode' })
const cardCount = () => document.querySelectorAll('article.branch-card').length
const firstDetailsButton = () => document.querySelector<HTMLButtonElement>('[id^="details-"]')!

const listed = sample.filter((branch) => branch.status !== 'permanently-closed').length
const listedBranches = sample.filter((branch) => branch.status !== 'permanently-closed' && branch.type !== 'atm').length

const stubSample = () => vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(sample))))

const capeTown = { coords: { latitude: -33.9249, longitude: 18.4241 } }

function stubGeolocation(result: 'granted' | 'denied') {
  const getCurrentPosition = vi.fn((success: (position: unknown) => void, failure: (error: unknown) => void) => {
    if (result === 'granted') success(capeTown)
    else failure({ code: 1 })
  })
  Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true })
  return getCurrentPosition
}

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    Object.defineProperty(navigator, 'geolocation', { value: undefined, configurable: true })
  })

  it('loads the sample data and lists branches and ATMs together', async () => {
    stubSample()
    render(<App />)

    expect(screen.getByText('Loading branches')).toBeInTheDocument()

    await waitFor(() => expect(cardCount()).toBe(listed))
    expect(screen.getByText(`${listed} locations, sorted by name`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Both' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('recovers from a failed load when the user retries', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('down', { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(sample)))
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Branch service responded with status 503.')

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    await waitFor(() => expect(cardCount()).toBeGreaterThan(0))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('narrows the list as the user searches, and clears back', async () => {
    stubSample()
    render(<App />)
    await waitFor(() => expect(cardCount()).toBeGreaterThan(0))
    const before = cardCount()

    await userEvent.type(searchField(), 'sandton')
    // Typing alone changes nothing: the list waits for Enter or a chosen suggestion.
    expect(cardCount()).toBe(before)

    await userEvent.keyboard('{Enter}')

    expect(cardCount()).toBeGreaterThan(0)
    expect(cardCount()).toBeLessThan(before)

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(cardCount()).toBe(before)
    expect(searchField()).toHaveValue('')
  })

  it('shows Both first, and narrows to branches or to ATMs', async () => {
    stubSample()
    render(<App />)
    await waitFor(() => expect(cardCount()).toBeGreaterThan(0))

    const show = within(screen.getByRole('group', { name: 'Show' })).getAllByRole('button')
    expect(show.map((button) => button.textContent)).toEqual(['Both', 'Branches', 'ATMs'])

    await userEvent.click(screen.getByRole('button', { name: 'Branches' }))
    expect(cardCount()).toBe(listedBranches)

    await userEvent.click(screen.getByRole('button', { name: 'ATMs' }))
    expect(cardCount()).toBe(listed - listedBranches)

    await userEvent.click(screen.getByRole('button', { name: 'Both' }))
    expect(cardCount()).toBe(listed)
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

    it('gives the details the whole sidebar, and gives it back on return', async () => {
      await openFirstBranch()
      expect(document.querySelector('.locator')).toHaveClass('locator--detail')

      await userEvent.click(screen.getByRole('button', { name: 'Back to results' }))

      expect(document.querySelector('.locator')).not.toHaveClass('locator--detail')
    })

    it('keeps what was typed in the search while the details are open', async () => {
      stubSample()
      render(<App />)
      await waitFor(() => expect(cardCount()).toBeGreaterThan(0))
      await userEvent.type(searchField(), 'pretoria{Enter}')

      await userEvent.click(firstDetailsButton())
      await userEvent.click(screen.getByRole('button', { name: 'Back to results' }))

      expect(searchField()).toHaveValue('pretoria')
    })

    it('opens a card by its name, which is the only control that stands for the whole card', async () => {
      stubSample()
      render(<App />)
      await waitFor(() => expect(cardCount()).toBeGreaterThan(0))
      const firstCard = document.querySelector('article.branch-card') as HTMLElement
      const name = firstCard.querySelector('h2')!.textContent!

      await userEvent.click(within(firstCard).getByRole('button', { name }))

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(name)
    })
  })

  describe('hovering a card', () => {
    const mapHovered = () => screen.getByTestId('map').getAttribute('data-hovered')
    const idOf = (card: Element) => card.querySelector('[id^="details-"]')!.id.replace('details-', '')

    async function load() {
      stubSample()
      render(<App />)
      await waitFor(() => expect(cardCount()).toBeGreaterThan(0))
      await screen.findByTestId('map')
    }

    it('tells the map which place the pointer is over, and lets go when it leaves', async () => {
      await load()
      const cards = document.querySelectorAll('article.branch-card')
      expect(mapHovered()).toBe('')

      await userEvent.hover(cards[1])
      expect(mapHovered()).toBe(idOf(cards[1]))

      await userEvent.unhover(cards[1])
      expect(mapHovered()).toBe('')
    })

    it('follows the keyboard as well', async () => {
      await load()

      firstDetailsButton().focus()

      await waitFor(() => expect(mapHovered()).toBe(firstDetailsButton().id.replace('details-', '')))
    })

    it('clears when the details open, because the list is gone', async () => {
      await load()
      await userEvent.hover(document.querySelector('article.branch-card')!)
      expect(mapHovered()).not.toBe('')

      await userEvent.click(firstDetailsButton())

      expect(mapHovered()).toBe('')
    })
  })

  describe('the Filters window', () => {
    const filtersButton = () => screen.getByRole('button', { name: /^Filters/ })
    const dialog = () => screen.getByRole('dialog', { name: 'Filters' })
    const apply = () => within(dialog()).getByRole('button', { name: /^Show \d+ results?$/ })

    async function load() {
      stubSample()
      render(<App />)
      await waitFor(() => expect(cardCount()).toBeGreaterThan(0))
    }

    it('narrows the list to a province, and says how many filters are in use', async () => {
      await load()
      const before = cardCount()

      await userEvent.click(filtersButton())
      await userEvent.click(within(dialog()).getByRole('button', { name: 'Gauteng' }))
      await userEvent.click(apply())

      expect(cardCount()).toBeGreaterThan(0)
      expect(cardCount()).toBeLessThan(before)
      expect(filtersButton()).toHaveAccessibleName('Filters, 1 in use')
    })

    it('narrows the list to places open around the clock', async () => {
      await load()
      const around = sample.filter(
        (item) => item.status === 'open' && item.hours?.open === '00:00' && item.hours?.close === '24:00',
      ).length

      await userEvent.click(filtersButton())
      await userEvent.click(within(dialog()).getByRole('button', { name: 'Open 24 hours' }))
      await userEvent.click(apply())

      expect(cardCount()).toBe(around)
      expect(cardCount()).toBeLessThan(listed)
    })

    it('says how many places the choices leave before they are applied, and leaves the list alone until then', async () => {
      await load()
      const before = cardCount()

      await userEvent.click(filtersButton())
      await userEvent.click(within(dialog()).getByRole('button', { name: 'Northern Cape' }))

      const promised = Number(apply().textContent!.match(/\d+/)![0])
      expect(promised).toBeLessThan(before)
      expect(cardCount()).toBe(before)

      await userEvent.click(apply())
      expect(cardCount()).toBe(promised)
    })

    it('offers to clear the filters when they leave nothing, and clears them', async () => {
      await load()
      await userEvent.click(filtersButton())
      await userEvent.click(within(dialog()).getByRole('button', { name: 'Northern Cape' }))
      await userEvent.click(apply())
      await userEvent.type(searchField(), 'zzzz nowhere{Enter}')

      expect(screen.getByRole('heading', { name: 'No matches found' })).toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))

      expect(cardCount()).toBe(listed)
      expect(filtersButton()).toHaveAccessibleName('Filters')
      expect(searchField()).toHaveValue('')
    })

    it('opening a branch from the suggestions clears the filters that might hide it', async () => {
      await load()
      await userEvent.click(filtersButton())
      await userEvent.click(within(dialog()).getByRole('button', { name: 'Northern Cape' }))
      await userEvent.click(apply())

      await userEvent.type(searchField(), 'Alexandra Yarona')
      await userEvent.click(screen.getByRole('option', { name: /Capitec Bank Alexandra Yarona/ }))

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Capitec Bank Alexandra Yarona')
      await userEvent.click(screen.getByRole('button', { name: 'Back to results' }))
      expect(filtersButton()).toHaveAccessibleName('Filters')
    })

    it('sorts by name instead of nearest first when asked, keeping the distances', async () => {
      stubSample()
      stubGeolocation('granted')
      render(<App />)
      await waitFor(() => expect(cardCount()).toBeGreaterThan(0))
      const nearestName = document.querySelector('article.branch-card h2')!.textContent
      expect(screen.getByText(/nearest first$/)).toBeInTheDocument()

      await userEvent.click(filtersButton())
      await userEvent.click(within(dialog()).getByRole('radio', { name: 'Name' }))
      await userEvent.click(apply())

      expect(screen.getByText(/sorted by name$/)).toBeInTheDocument()
      const names = [...document.querySelectorAll('article.branch-card h2')].map((heading) => heading.textContent!)
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
      expect(names[0]).not.toBe(nearestName)
      expect(document.querySelector('.branch-card__meta')!.textContent).toContain(' away')
    })
  })

  describe('search suggestions', () => {
    it('suggests places and branches as the user types, and narrows the list to a chosen place', async () => {
      stubSample()
      render(<App />)
      await waitFor(() => expect(cardCount()).toBeGreaterThan(0))
      const before = cardCount()

      await userEvent.type(searchField(), 'pretor')

      const list = screen.getByRole('listbox', { name: 'Suggestions' })
      expect(list).toHaveTextContent('Places')
      expect(list).toHaveTextContent('Branches and ATMs')

      await userEvent.click(screen.getByRole('option', { name: /^Pretoria\s*\d+ locations?$/ }))

      expect(searchField()).toHaveValue('Pretoria')
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      expect(cardCount()).toBeGreaterThan(0)
      expect(cardCount()).toBeLessThan(before)
    })

    it('opens a branch when its suggestion is chosen', async () => {
      stubSample()
      render(<App />)
      await waitFor(() => expect(cardCount()).toBeGreaterThan(0))

      await userEvent.type(searchField(), 'Alexandra Yarona')
      await userEvent.click(screen.getByRole('option', { name: /Capitec Bank Alexandra Yarona/ }))

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Capitec Bank Alexandra Yarona')
      expect(screen.getByRole('button', { name: 'Back to results' })).toBeInTheDocument()
    })

    it('opens an ATM from the suggestions even while the list is on branches', async () => {
      stubSample()
      render(<App />)
      await waitFor(() => expect(cardCount()).toBeGreaterThan(0))
      await userEvent.click(screen.getByRole('button', { name: 'Branches' }))
      const atm = sample.find((item) => item.type === 'atm' && item.status !== 'permanently-closed')!

      await userEvent.type(searchField(), atm.name)
      await userEvent.click(screen.getByRole('option', { name: (name) => name.includes(atm.name) }))

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(atm.name)
      expect(screen.getByRole('button', { name: 'ATMs' })).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('near me', () => {
    it('asks for the location as soon as the page opens, without anyone pressing Near me', async () => {
      stubSample()
      const getCurrentPosition = stubGeolocation('granted')
      render(<App />)

      expect(getCurrentPosition).toHaveBeenCalledTimes(1)
      await waitFor(() => expect(cardCount()).toBeGreaterThan(0))
      expect(screen.getByRole('button', { name: 'Near me' })).toHaveAttribute('aria-pressed', 'true')
    })

    it('lists the nearest first with distances, within 25 km, once the location is found', async () => {
      stubSample()
      stubGeolocation('granted')
      render(<App />)
      await waitFor(() => expect(cardCount()).toBeGreaterThan(0))

      const nearest = document.querySelector('article.branch-card')!
      // The nearest place to Cape Town is in Cape Town. The address itself is only on the details.
      expect(nearest.textContent).toContain('Cape Town')
      expect(nearest.querySelector('.branch-card__meta')!.textContent).toContain(' away')
      expect(screen.getByText(/locations? within 25 km, nearest first$/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '25 km' })).toHaveAttribute('aria-pressed', 'true')
      expect(cardCount()).toBeLessThan(listed)
      // 25 km is a way of looking, not a filter the user chose, so the Filters button has no count.
      expect(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument()
    })

    it('turns off, back to the whole list by name, and does not ask again by itself', async () => {
      stubSample()
      const getCurrentPosition = stubGeolocation('granted')
      render(<App />)
      await waitFor(() => expect(cardCount()).toBeGreaterThan(0))

      await userEvent.click(screen.getByRole('button', { name: 'Near me' }))

      expect(cardCount()).toBe(listed)
      expect(screen.getByText(`${listed} locations, sorted by name`)).toBeInTheDocument()
      expect(document.querySelector('.branch-card__meta')!.textContent).not.toContain(' away')
      expect(screen.getByRole('button', { name: '25 km' })).toHaveAttribute('aria-pressed', 'false')
      expect(getCurrentPosition).toHaveBeenCalledTimes(1)
    })

    it('changes the distance, and goes to any distance when the chosen one is pressed again', async () => {
      stubSample()
      stubGeolocation('granted')
      render(<App />)
      await waitFor(() => expect(cardCount()).toBeGreaterThan(0))
      const within25 = cardCount()

      await userEvent.click(screen.getByRole('button', { name: '10 km' }))
      expect(cardCount()).toBeGreaterThan(0)
      expect(cardCount()).toBeLessThan(within25)
      expect(screen.getByText(/locations? within 10 km, nearest first$/)).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: '10 km' }))
      expect(cardCount()).toBe(listed)
      expect(screen.getByText(`${listed} locations, nearest first`)).toBeInTheDocument()
    })

    it('keeps the whole list by name and explains how to carry on when location is refused', async () => {
      stubSample()
      stubGeolocation('denied')
      render(<App />)
      await waitFor(() => expect(cardCount()).toBeGreaterThan(0))

      expect(screen.getByText(/turned off for this site/)).toBeInTheDocument()
      expect(cardCount()).toBe(listed)
      expect(document.querySelector('.branch-card__meta')!.textContent).not.toContain(' away')
      expect(screen.getByRole('button', { name: '25 km' })).toBeEnabled()
      expect(screen.getByRole('button', { name: '25 km' })).toHaveAttribute('aria-pressed', 'false')
    })

    it('finds the location when a distance is chosen after Near me was turned off, and applies that distance', async () => {
      stubSample()
      const getCurrentPosition = stubGeolocation('granted')
      render(<App />)
      await waitFor(() => expect(cardCount()).toBeGreaterThan(0))
      await userEvent.click(screen.getByRole('button', { name: 'Near me' }))
      expect(cardCount()).toBe(listed)

      await userEvent.click(screen.getByRole('button', { name: '10 km' }))

      expect(getCurrentPosition).toHaveBeenCalledTimes(2)
      expect(screen.getByRole('button', { name: 'Near me' })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('button', { name: '10 km' })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByText(/locations? within 10 km, nearest first$/)).toBeInTheDocument()
      expect(cardCount()).toBeLessThan(listed)
    })

    it('finds the location from a distance after a refusal, once the browser allows it, and applies that distance', async () => {
      stubSample()
      stubGeolocation('denied')
      render(<App />)
      await waitFor(() => expect(cardCount()).toBeGreaterThan(0))

      stubGeolocation('granted')
      await userEvent.click(screen.getByRole('button', { name: '50 km' }))

      expect(screen.getByRole('button', { name: '50 km' })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByText(/locations? within 50 km, nearest first$/)).toBeInTheDocument()
    })

    it('tries again from the note, and then finds the nearest', async () => {
      stubSample()
      stubGeolocation('denied')
      render(<App />)
      await waitFor(() => expect(cardCount()).toBeGreaterThan(0))

      stubGeolocation('granted')
      await userEvent.click(screen.getByRole('button', { name: 'Try again', hidden: false }))

      expect(screen.getByRole('button', { name: '25 km' })).toHaveAttribute('aria-pressed', 'true')
      expect(cardCount()).toBeLessThan(listed)
    })
  })
})
