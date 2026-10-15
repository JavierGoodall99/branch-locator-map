import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import sample from '../public/branches.json'
import App from './App'

describe('App', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('loads the sample data and lists the branches', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(sample))))
    render(<App />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading branches')

    const cards = await screen.findAllByRole('article')
    const listed = sample.filter((branch) => branch.status !== 'permanently-closed').length
    expect(cards).toHaveLength(listed)
    expect(screen.getByRole('status')).toHaveTextContent(`${listed} locations, sorted by name`)
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

    expect((await screen.findAllByRole('article')).length).toBeGreaterThan(0)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
