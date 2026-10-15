import { render, screen } from '@testing-library/react'
import type { OpenStatus } from '../lib/hours'
import { StatusChip } from './StatusChip'

describe('StatusChip', () => {
  it.each<[OpenStatus, string]>([
    [{ kind: 'open', label: 'Open until 17:00' }, 'status-chip--open'],
    [{ kind: 'closing-soon', label: 'Closing soon, closes at 17:00' }, 'status-chip--soon'],
    [{ kind: 'closed', label: 'Closed, opens at 08:00' }, 'status-chip--closed'],
    [{ kind: 'no-hours', label: 'Opening hours not available' }, 'status-chip--closed'],
    [{ kind: 'temporarily-closed', label: 'Temporarily closed' }, 'status-chip--closed'],
  ])('shows the label and tone for %j', (status, toneClass) => {
    render(<StatusChip status={status} />)

    expect(screen.getByText(status.label)).toHaveClass(toneClass)
  })

  it('hides its icon from assistive technology', () => {
    const { container } = render(<StatusChip status={{ kind: 'open', label: 'Open 24 hours' }} />)

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
