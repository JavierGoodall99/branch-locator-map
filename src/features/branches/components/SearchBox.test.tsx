import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import type { Branch } from '../types'
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

/** A SearchBox that keeps its own text, as the page does, so typing works as a user would see it. */
function Harness({ onPickBranch = vi.fn(), onValue = vi.fn() }: { onPickBranch?: (id: string) => void; onValue?: (v: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <SearchBox
      value={value}
      onChange={(next) => {
        setValue(next)
        onValue(next)
      }}
      branches={branches}
      onPickBranch={onPickBranch}
      trailing={<button type="button">Near me</button>}
    />
  )
}

const input = () => screen.getByRole('combobox', { name: 'Search by name, suburb, town or postcode' })

describe('SearchBox', () => {
  it('is a labelled combobox inside a search landmark, closed until there is something to suggest', () => {
    render(<Harness />)

    expect(screen.getByRole('search')).toContainElement(input())
    expect(input()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

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
    expect(within(list).getByRole('option', { name: /Capitec Bank Sandton City/ })).toHaveTextContent('Branch, Sandton')
    expect(within(list).getByRole('option', { name: /Capitec Bank ATM Sandton Station/ })).toHaveTextContent('ATM, Sandton')
  })

  it('announces how many suggestions there are', async () => {
    render(<Harness />)

    await userEvent.type(input(), 'sandton')

    expect(screen.getByRole('status')).toHaveTextContent('3 suggestions available')
  })

  it('moves through the suggestions with the arrow keys and tells assistive technology which is active', async () => {
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

  it('puts a place into the search when it is chosen with Enter, and closes the list', async () => {
    const onValue = vi.fn()
    render(<Harness onValue={onValue} />)
    await userEvent.type(input(), 'sand')

    await userEvent.keyboard('{ArrowDown}{Enter}')

    expect(input()).toHaveValue('Sandton')
    expect(onValue).toHaveBeenLastCalledWith('Sandton')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('opens a branch when it is chosen, and does not rewrite the search itself', async () => {
    const onPickBranch = vi.fn()
    render(<Harness onPickBranch={onPickBranch} />)
    await userEvent.type(input(), 'paarl')

    await userEvent.click(screen.getByRole('option', { name: /Capitec Bank Paarl/ }))

    expect(onPickBranch).toHaveBeenCalledWith('3')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('does nothing on Enter when no suggestion is highlighted', async () => {
    const onPickBranch = vi.fn()
    render(<Harness onPickBranch={onPickBranch} />)
    await userEvent.type(input(), 'sandton{Enter}')

    expect(onPickBranch).not.toHaveBeenCalled()
    expect(input()).toHaveValue('sandton')
  })

  it('closes the list on Escape, and clears the search on a second Escape', async () => {
    render(<Harness />)
    await userEvent.type(input(), 'sandton')

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(input()).toHaveValue('sandton')

    await userEvent.keyboard('{Escape}')
    expect(input()).toHaveValue('')
  })

  it('closes the list when focus leaves the search', async () => {
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

  it('offers a clear button only when there is text, and it empties the search and refocuses it', async () => {
    render(<Harness />)
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()

    await userEvent.type(input(), 'sandton')
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(input()).toHaveValue('')
    expect(input()).toHaveFocus()
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()
  })

  it('shows what it is given inside the bar, after a divider', () => {
    render(<Harness />)

    const bar = screen.getByRole('search')
    expect(within(bar).getByRole('button', { name: 'Near me' })).toBeInTheDocument()
  })

  it('says nothing is suggested when nothing matches', async () => {
    render(<Harness />)

    await userEvent.type(input(), 'zzzzz')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(input()).toHaveAttribute('aria-expanded', 'false')
  })
})
