import { useId, useState, type ReactNode } from 'react'
import { Button, Modal } from 'react-bootstrap'
import { serviceOptions } from '../lib/services'
import { DEFAULT_FILTERS, countWindowFilters, type WindowFilters } from '../model/filters'
import { PROVINCES, type Branch } from '../types'

interface FiltersModalProps {
  show: boolean
  onHide: () => void
  /** What is applied now, which the window starts from. */
  filters: WindowFilters
  branches: Branch[]
  /** Whether the user's location is known. Sorting nearest first needs it. */
  located: boolean
  onApply: (filters: WindowFilters) => void
  /** How many places the list would show with these filters, so the button can say. */
  countResults: (filters: WindowFilters) => number
}

const NONE: WindowFilters = {
  openNow: DEFAULT_FILTERS.openNow,
  open24Hours: DEFAULT_FILTERS.open24Hours,
  province: DEFAULT_FILTERS.province,
  services: [],
  sort: DEFAULT_FILTERS.sort,
}

/** One pill. Several can be chosen, so it is a toggle button. */
function Chip({ label, pressed, onClick }: { label: string; pressed: boolean; onClick: () => void }) {
  return (
    <button type="button" className="chip" aria-pressed={pressed} onClick={onClick}>
      {label}
    </button>
  )
}

/** A titled group of pills. */
function Group({ title, children, radio }: { title: string; children: ReactNode; radio?: boolean }) {
  const headingId = useId()
  return (
    <section className="filters-modal__group" aria-labelledby={headingId}>
      <h3 className="filters-modal__heading" id={headingId}>
        {title}
      </h3>
      <div className="filters-modal__chips" role={radio ? 'radiogroup' : 'group'} aria-labelledby={headingId}>
        {children}
      </div>
    </section>
  )
}

interface FormProps extends Omit<FiltersModalProps, 'show'> {
  titleId: string
}

/** The body of the window. It is only mounted while the window is open, so each opening starts from what is applied. */
function FiltersForm({ onHide, filters, branches, located, onApply, countResults, titleId }: FormProps) {
  const [draft, setDraft] = useState<WindowFilters>(filters)
  const services = serviceOptions(branches)
  const results = countResults(draft)

  const toggleService = (service: string) =>
    setDraft((current) => ({
      ...current,
      services: current.services.includes(service)
        ? current.services.filter((chosen) => chosen !== service)
        : [...current.services, service],
    }))

  // Nearest first needs the location, so without it the list is by name and that is what is shown as chosen.
  const sort = located ? draft.sort : 'name'

  return (
    <>
      <Modal.Header closeButton>
        <Modal.Title as="h2" className="h3" id={titleId}>
          Filters
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Group title="When">
          <Chip
            label="Open now"
            pressed={draft.openNow}
            onClick={() => setDraft({ ...draft, openNow: !draft.openNow })}
          />
          <Chip
            label="Open 24 hours"
            pressed={draft.open24Hours}
            onClick={() => setDraft({ ...draft, open24Hours: !draft.open24Hours })}
          />
        </Group>

        {services.length > 0 && (
          <Group title="Services">
            {services.map((service) => (
              <Chip
                key={service}
                label={service}
                pressed={draft.services.includes(service)}
                onClick={() => toggleService(service)}
              />
            ))}
          </Group>
        )}

        <Group title="Province">
          {PROVINCES.map((province) => (
            <Chip
              key={province}
              label={province}
              pressed={draft.province === province}
              // Pressing the chosen province again goes back to all of them.
              onClick={() => setDraft({ ...draft, province: draft.province === province ? null : province })}
            />
          ))}
        </Group>

        <Group title="Sort by" radio>
          <button
            type="button"
            role="radio"
            className="chip"
            aria-checked={sort === 'distance'}
            disabled={!located}
            onClick={() => setDraft({ ...draft, sort: 'distance' })}
          >
            Distance
          </button>
          <button
            type="button"
            role="radio"
            className="chip"
            aria-checked={sort === 'name'}
            onClick={() => setDraft({ ...draft, sort: 'name' })}
          >
            Name
          </button>
        </Group>
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="link"
          disabled={countWindowFilters(draft) === 0 && draft.sort === NONE.sort}
          onClick={() => setDraft(NONE)}
        >
          Clear all
        </Button>
        <Button
          disabled={results === 0}
          onClick={() => {
            onApply(draft)
            onHide()
          }}
        >
          {results === 0 ? 'No results' : `Show ${results} ${results === 1 ? 'result' : 'results'}`}
        </Button>
      </Modal.Footer>
    </>
  )
}

/**
 * The Filters window: when a place is open, which services it has, its province, and how the list
 * is sorted, as groups of pills. The choices are made together and apply when the user presses the
 * button, which says how many places they leave. Closing it any other way changes nothing.
 */
export function FiltersModal({ show, onHide, ...rest }: FiltersModalProps) {
  const titleId = useId()
  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      fullscreen="sm-down"
      dialogClassName="filters-modal"
      aria-labelledby={titleId}
    >
      <FiltersForm onHide={onHide} titleId={titleId} {...rest} />
    </Modal>
  )
}
