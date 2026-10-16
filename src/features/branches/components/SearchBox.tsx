import { useId, useMemo, useRef, useState, type FocusEvent, type KeyboardEvent, type ReactNode } from 'react'
import { Icon } from '../../../shared/ui/Icon'
import { buildPlaceIndex, suggest, type BranchSuggestion, type PlaceEntry } from '../lib/suggestions'
import { typeLabel } from '../lib/labels'
import type { Branch } from '../types'

interface SearchBoxProps {
  /** The search that is applied to the list and the map. What is being typed is kept separately. */
  value: string
  /** Called when the user searches: Enter, the Search button, a chosen place, or clearing the text. */
  onSearch: (query: string) => void
  /** Everything that can be suggested. */
  branches: Branch[]
  /** A branch suggestion was chosen: open it. */
  onPickBranch: (id: string) => void
  /** Shown inside the bar, on the right, after a divider. The Near me button goes here. */
  trailing?: ReactNode
}

type Option =
  | { kind: 'place'; place: PlaceEntry }
  | { kind: 'branch'; branch: BranchSuggestion }

const count = (n: number) => `${n} ${n === 1 ? 'location' : 'locations'}`

function placeDetail(place: PlaceEntry): string {
  if (place.kind === 'province') return `Province, ${count(place.count)}`
  if (place.kind === 'postcode') return `Postcode, ${count(place.count)}`
  return count(place.count)
}

/**
 * The search field, with suggestions as the user types. Typing does not change the results: the
 * list and the map wait until the user presses Enter or the Search button, or chooses a suggestion.
 * It follows the ARIA combobox pattern:
 * focus stays in the field while arrow keys move a highlight through the list, and the field
 * tells assistive technology which suggestion is highlighted. Everything works without a mouse.
 */
export function SearchBox({ value, onSearch, branches, onPickBranch, trailing }: SearchBoxProps) {
  const id = useId()
  const inputId = `${id}-input`
  const listId = `${id}-list`
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  // What is typed, which may be ahead of the applied search. When the applied search changes from
  // outside (a clear, a chosen branch), the text follows it.
  const [draft, setDraft] = useState(value)
  const [syncedValue, setSyncedValue] = useState(value)
  if (value !== syncedValue) {
    setSyncedValue(value)
    setDraft(value)
  }

  const placeIndex = useMemo(() => buildPlaceIndex(branches), [branches])
  const suggestions = useMemo(() => suggest(draft, placeIndex, branches), [draft, placeIndex, branches])

  const options: Option[] = [
    ...suggestions.places.map((place): Option => ({ kind: 'place', place })),
    ...suggestions.branches.map((branch): Option => ({ kind: 'branch', branch })),
  ]
  const expanded = open && options.length > 0
  const activeIndex = expanded && active >= 0 && active < options.length ? active : -1
  const optionId = (index: number) => `${id}-option-${index}`

  const close = () => {
    setOpen(false)
    setActive(-1)
  }

  const choose = (option: Option) => {
    close()
    if (option.kind === 'place') {
      setDraft(option.place.label)
      onSearch(option.place.label)
    } else {
      onPickBranch(option.branch.id)
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (!expanded) {
          setOpen(true)
          setActive(0)
        } else {
          setActive((activeIndex + 1) % options.length)
        }
        break
      case 'ArrowUp':
        if (!expanded) break
        event.preventDefault()
        setActive(activeIndex <= 0 ? options.length - 1 : activeIndex - 1)
        break
      case 'Enter':
        if (activeIndex >= 0) {
          event.preventDefault()
          choose(options[activeIndex])
        }
        break
      case 'Escape':
        // First Escape closes the list; a second one clears the search.
        if (expanded) {
          event.preventDefault()
          close()
        } else if (draft || value) {
          setDraft('')
          onSearch('')
        }
        break
    }
  }

  // Focus moving to something outside the search, such as a suggestion, closes the list.
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) close()
  }

  const renderOption = (option: Option, index: number) => {
    const key = option.kind === 'place' ? `place-${option.place.label}-${option.place.kind}` : `branch-${option.branch.id}`
    const isPlace = option.kind === 'place'
    return (
      <div
        key={key}
        id={optionId(index)}
        role="option"
        aria-selected={index === activeIndex}
        className="search-suggestions__option"
        // Keep focus in the field, so choosing with the mouse does not blur it and close the list first.
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => choose(option)}
      >
        <Icon name={isPlace ? 'pin' : option.branch.type === 'atm' ? 'cash' : 'bank'} />
        <span className="search-suggestions__text">
          <span className="search-suggestions__name">{isPlace ? option.place.label : option.branch.name}</span>
          <span className="search-suggestions__detail">
            {isPlace ? placeDetail(option.place) : `${typeLabel(option.branch.type)}, ${option.branch.place}`}
          </span>
        </span>
      </div>
    )
  }

  const placeCount = suggestions.places.length

  return (
    <div className="search-field" onBlur={onBlur}>
      <form
        role="search"
        className="search-box"
        onSubmit={(event) => {
          // Enter, or the Search button. Choosing a highlighted suggestion with Enter is handled
          // on the field and never reaches here.
          event.preventDefault()
          close()
          onSearch(draft.trim())
        }}
      >
        <button type="submit" className="search-box__action" aria-label="Search">
          <Icon name="search" size={18} />
        </button>
        <label htmlFor={inputId} className="visually-hidden">
          Search by name, suburb, town or postcode
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={expanded}
          aria-controls={expanded ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          placeholder="Name, suburb, town or postcode"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
            setOpen(true)
            setActive(-1)
            // Emptying the field resets the list, so it never shows a search that is no longer there.
            if (event.target.value === '') onSearch('')
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {draft && (
          <button
            type="button"
            className="search-box__action"
            aria-label="Clear search"
            onClick={() => {
              setDraft('')
              onSearch('')
              close()
              inputRef.current?.focus()
            }}
          >
            <Icon name="close" size={18} />
          </button>
        )}
        {trailing && (
          <>
            <span className="search-box__divider" aria-hidden="true" />
            {trailing}
          </>
        )}
      </form>

      {expanded && (
        <div id={listId} role="listbox" aria-label="Suggestions" className="search-suggestions">
          {placeCount > 0 && (
            <div role="group" aria-labelledby={`${id}-places`}>
              <div id={`${id}-places`} role="presentation" className="search-suggestions__heading">
                Places
              </div>
              {options.slice(0, placeCount).map((option, index) => renderOption(option, index))}
            </div>
          )}
          {suggestions.branches.length > 0 && (
            <div role="group" aria-labelledby={`${id}-branches`}>
              <div id={`${id}-branches`} role="presentation" className="search-suggestions__heading">
                Branches and ATMs
              </div>
              {options.slice(placeCount).map((option, index) => renderOption(option, placeCount + index))}
            </div>
          )}
        </div>
      )}

      <p className="visually-hidden" role="status">
        {expanded ? `${options.length} ${options.length === 1 ? 'suggestion' : 'suggestions'} available` : ''}
      </p>
    </div>
  )
}
