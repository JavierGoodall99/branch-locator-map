import { useId, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import { serviceOptions } from '../lib/services'
import { DEFAULT_FILTERS, countWindowFilters, type WindowFilters } from '../model/filters'
import { PROVINCES, type Branch, type Province } from '../types'

interface FiltersModalProps {
  show: boolean
  onHide: () => void
  /** What is applied now, which the window starts from. */
  filters: WindowFilters
  branches: Branch[]
  onApply: (filters: WindowFilters) => void
  /** How many places the list would show with these filters, so the button can say. */
  countResults: (filters: WindowFilters) => number
}

const NONE: WindowFilters = { openNow: DEFAULT_FILTERS.openNow, province: DEFAULT_FILTERS.province, services: [] }

interface FormProps extends Omit<FiltersModalProps, 'show'> {
  titleId: string
}

/** The body of the window. It is only mounted while the window is open, so each opening starts from what is applied. */
function FiltersForm({ onHide, filters, branches, onApply, countResults, titleId }: FormProps) {
  const id = useId()
  const [draft, setDraft] = useState<WindowFilters>({
    openNow: filters.openNow,
    province: filters.province,
    services: filters.services,
  })
  const services = serviceOptions(branches)
  const results = countResults(draft)

  const toggleService = (service: string) =>
    setDraft((current) => ({
      ...current,
      services: current.services.includes(service)
        ? current.services.filter((chosen) => chosen !== service)
        : [...current.services, service],
    }))

  return (
    <>
      <Modal.Header closeButton>
        <Modal.Title as="h2" className="h4" id={titleId}>
          Filters
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form.Check
          type="switch"
          role="switch"
          id={`${id}-open`}
          label="Open now"
          checked={draft.openNow}
          onChange={(event) => setDraft({ ...draft, openNow: event.target.checked })}
        />

        <Form.Group className="mt-4" controlId={`${id}-province`}>
          <Form.Label className="fw-bold">Province</Form.Label>
          <Form.Select
            value={draft.province ?? ''}
            onChange={(event) => setDraft({ ...draft, province: (event.target.value || null) as Province | null })}
          >
            <option value="">All provinces</option>
            {PROVINCES.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        {services.length > 0 && (
          <fieldset className="mt-4">
            <legend className="fs-6 fw-bold">Services</legend>
            {services.map((service) => (
              <Form.Check
                key={service}
                type="checkbox"
                id={`${id}-service-${service}`}
                label={service}
                checked={draft.services.includes(service)}
                onChange={() => toggleService(service)}
              />
            ))}
          </fieldset>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="link" disabled={countWindowFilters(draft) === 0} onClick={() => setDraft(NONE)}>
          Reset
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
 * The Filters window: open now, province and services. The choices are made together and apply
 * when the user presses the button, which says how many places they leave. Closing it any other way
 * changes nothing.
 */
export function FiltersModal({ show, onHide, ...rest }: FiltersModalProps) {
  const titleId = useId()
  return (
    <Modal show={show} onHide={onHide} centered fullscreen="sm-down" aria-labelledby={titleId}>
      <FiltersForm onHide={onHide} titleId={titleId} {...rest} />
    </Modal>
  )
}
