import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import type { Branch } from '@/features/branches/types'
import { SearchBox } from './SearchBox'

function branch(id: string, name: string, address: string, overrides: Partial<Branch> = {}): Branch {
  const parts = address.split(', ')
  return {
    id,
    name,
    type: 'branch',
    services: ['Branch'],
    address,
    province: parts.at(-2) as Branch['province'],
    postalCode: parts.at(-1)!,
    phone: null,
    location: { lat: -26.2, lng: 28.05 },
    status: 'open',
    hours: { open: '08:00', close: '17:00' },
    ...overrides,
  }
}

const branches = [
  branch('1', 'Capitec Bank Sandton City', 'Sandton City, Rivonia Road, Sandton, Gauteng, 2196'),
  branch('2', 'Capitec Bank ATM Sandton Station', 'Sandton Station, Rivonia Road, Sandton, Gauteng, 2196', {
    type: 'atm',
    services: ['ATM'],
  }),
  branch('3', 'Capitec Bank Paarl', 'Lady Grey Street, Paarl, Western Cape, 7646'),
]

/**
 * A SearchBox with the applied search kept in state, as the page does it: the box only changes the
 * applied search when it calls onSearch, so what is typed and what is searched can differ.
 */
function Harness({
  onPickBranch = vi.fn(),
  onSearch = vi.fn(),
  initial = '',
}: {
  onPickBranch?: (id: string) => void
  onSearch?: (query: string) => void
  initial?: string
}) {
  const [applied, setApplied] = useState(initial)
  return (
    <>
      <SearchBox
        value={applied}
        onSearch={(query) => {
          setApplied(query)
          onSearch(query)
        }}
        branches={branches}
        onPickBranch={onPickBranch}
        trailing={<button type="button">Near me</button>}
      />
      <p data-testid="applied">{applied}</p>
    </>
  )
}

const input = () => screen.getByRole('combobox', { name: 'Search by name, suburb, town or postcode' })
const applied = () => screen.getByTestId('applied').textContent

describe('SearchBox', () => {
  it('is a labelled combobox inside a search landmark, closed until there is something to suggest', () => {
    render(<Harness />)

    expect(screen.getByRole('search')).toContainElement(input())
    expect(input()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  describe('searching', () => {
    it('does not search while the user is typing', async () => {
      const onSearch = vi.fn()
      render(<Harness onSearch={onSearch} />)

      await userEvent.type(input(), 'sandton')

      expect(input()).toHaveValue('sandton')
      expect(onSearch).not.toHaveBeenCalled()
      expect(applied()).toBe('')
    })

    it('searches when the user presses Enter', async () => {
      const onSearch = vi.fn()
      render(<Harness onSearch={onSearch} />)

      await userEvent.type(input(), 'sandton{Enter}')

      expect(onSearch).toHaveBeenCalledTimes(1)
      expect(onSearch).toHaveBeenCalledWith('sandton')
      expect(applied()).toBe('sandton')
    })

    it('searches when the Search button is pressed', async () => {
      const onSearch = vi.fn()
      render(<Harness onSearch={onSearch} />)
      await userEvent.type(input(), 'paarl')

      await userEvent.click(screen.getByRole('button', { name: 'Search' }))

      expect(onSearch).toHaveBeenCalledWith('paarl')
    })

    it('ignores spaces around the search', async () => {
      const onSearch = vi.fn()
      render(<Harness onSearch={onSearch} />)

      await userEvent.type(input(), '  paarl  {Enter}')

      expect(onSearch).toHaveBeenCalledWith('paarl')
    })

    it('closes the suggestions when searching', async () => {
      render(<Harness />)
      await userEvent.type(input(), 'sandton')
      expect(screen.getByRole('listbox')).toBeInTheDocument()

      await userEvent.keyboard('{Enter}')

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('resets the search when the field is emptied, so the list never shows a search that is gone', async () => {
      const onSearch = vi.fn()
      render(<Harness onSearch={onSearch} initial="paarl" />)

      await userEvent.clear(input())

      expect(onSearch).toHaveBeenLastCalledWith('')
      expect(applied()).toBe('')
    })

    it('follows the applied search when it changes from outside', () => {
      const { rerender } = render(<SearchBox value="" onSearch={vi.fn()} branches={branches} onPickBranch={vi.fn()} />)

      rerender(<SearchBox value="Capitec Bank Paarl" onSearch={vi.fn()} branches={branches} onPickBranch={vi.fn()} />)

      expect(input()).toHaveValue('Capitec Bank Paarl')
    })

    it('keeps what the user is typing when the applied search has not changed', async () => {
      const { rerender } = render(
        <SearchBox value="paarl" onSearch={vi.fn()} branches={branches} onPickBranch={vi.fn()} />,
      )
      await userEvent.type(input(), ' c')

      rerender(<SearchBox value="paarl" onSearch={vi.fn()} branches={branches} onPickBranch={vi.fn()} />)

      expect(input()).toHaveValue('paarl c')
    })
  })

  describe('suggestions', () => {
    it('suggests nothing for a single character', async () => {
      render(<Harness />)

      await userEvent.type(input(), 's')

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('suggests places and branches, in groups, as the user types', async () => {
      render(<Harness />)

      await userEvent.type(input(), 'sandton')

      const list = screen.getByRole('listbox', { name: 'Suggestions' })
      expect(input()).toHaveAttribute('aria-expanded', 'true')
      expect(input()).toHaveAttribute('aria-controls', list.id)
      expect(within(list).getByRole('group', { name: 'Places' })).toBeInTheDocument()
      expect(within(list).getByRole('group', { name: 'Branches and ATMs' })).toBeInTheDocument()
      expect(within(list).getByRole('option', { name: /^Sandton/ })).toHaveTextContent('2 locations')
      expect(within(list).getByRole('option', { name: /Capitec Bank Sandton City/ })).toHaveTextContent(
        'Branch, Sandton',
      )
      expect(within(list).getByRole('option', { name: /Capitec Bank ATM Sandton Station/ })).toHaveTextContent(
        'ATM, Sandton',
      )
    })

    it('announces how many suggestions there are', async () => {
      render(<Harness />)

      await userEvent.type(input(), 'sandton')

      expect(screen.getByRole('status')).toHaveTextContent('3 suggestions available')
    })

    it('says nothing is suggested when nothing matches', async () => {
      render(<Harness />)

      await userEvent.type(input(), 'zzzzz')

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      expect(input()).toHaveAttribute('aria-expanded', 'false')
    })

    it('moves through them with the arrow keys and tells assistive technology which is active', async () => {
      render(<Harness />)
      await userEvent.type(input(), 'sandton')
      const options = screen.getAllByRole('option')

      await userEvent.keyboard('{ArrowDown}')
      expect(input()).toHaveAttribute('aria-activedescendant', options[0].id)
      expect(options[0]).toHaveAttribute('aria-selected', 'true')

      await userEvent.keyboard('{ArrowDown}')
      expect(input()).toHaveAttribute('aria-activedescendant', options[1].id)

      await userEvent.keyboard('{ArrowUp}{ArrowUp}')
      expect(input()).toHaveAttribute('aria-activedescendant', options[options.length - 1].id)
    })

    it('searches for a place when it is chosen with Enter, and shows it in the field', async () => {
      const onSearch = vi.fn()
      render(<Harness onSearch={onSearch} />)
      await userEvent.type(input(), 'sand')

      await userEvent.keyboard('{ArrowDown}{Enter}')

      expect(input()).toHaveValue('Sandton')
      expect(onSearch).toHaveBeenCalledTimes(1)
      expect(onSearch).toHaveBeenCalledWith('Sandton')
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('searches for a place when it is clicked', async () => {
      const onSearch = vi.fn()
      render(<Harness onSearch={onSearch} />)
      await userEvent.type(input(), 'sand')

      await userEvent.click(screen.getByRole('option', { name: /^Sandton/ }))

      expect(onSearch).toHaveBeenCalledWith('Sandton')
    })

    it('opens a branch when it is chosen, without searching for anything itself', async () => {
      const onPickBranch = vi.fn()
      const onSearch = vi.fn()
      render(<Harness onPickBranch={onPickBranch} onSearch={onSearch} />)
      await userEvent.type(input(), 'paarl')

      await userEvent.click(screen.getByRole('option', { name: /Capitec Bank Paarl/ }))

      expect(onPickBranch).toHaveBeenCalledWith('3')
      expect(onSearch).not.toHaveBeenCalled()
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('closes on Escape without searching, and a second Escape clears the search', async () => {
      const onSearch = vi.fn()
      render(<Harness onSearch={onSearch} initial="paarl" />)
      await userEvent.type(input(), ' c')

      await userEvent.keyboard('{Escape}')
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      expect(input()).toHaveValue('paarl c')
      expect(onSearch).not.toHaveBeenCalled()

      await userEvent.keyboard('{Escape}')
      expect(input()).toHaveValue('')
      expect(onSearch).toHaveBeenLastCalledWith('')
    })

    it('closes when focus leaves the search', async () => {
      render(
        <>
          <Harness />
          <button type="button">Elsewhere</button>
        </>,
      )
      await userEvent.type(input(), 'sandton')

      await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }))

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })
  })

  describe('the buttons in the bar', () => {
    it('offers a clear button only when there is text, and it clears the search and refocuses the field', async () => {
      const onSearch = vi.fn()
      render(<Harness onSearch={onSearch} />)
      expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()

      await userEvent.type(input(), 'sandton')
      await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))

      expect(input()).toHaveValue('')
      expect(input()).toHaveFocus()
      expect(onSearch).toHaveBeenLastCalledWith('')
      expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()
    })

    it('shows what it is given inside the bar', () => {
      render(<Harness />)

      expect(within(screen.getByRole('search')).getByRole('button', { name: 'Near me' })).toBeInTheDocument()
    })

    it('has a Search button inside the bar', () => {
      render(<Harness />)

      expect(within(screen.getByRole('search')).getByRole('button', { name: 'Search' })).toBeInTheDocument()
    })
  })
})
