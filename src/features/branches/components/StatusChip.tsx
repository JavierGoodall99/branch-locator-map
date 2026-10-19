import { Icon, type IconName } from '@/shared/ui/Icon'
import type { OpenStatus, OpenStatusKind } from '@/features/branches/lib/hours'

const APPEARANCE: Record<OpenStatusKind, { tone: 'open' | 'soon' | 'closed'; icon: IconName }> = {
  open: { tone: 'open', icon: 'check' },
  'closing-soon': { tone: 'soon', icon: 'clock' },
  closed: { tone: 'closed', icon: 'moon' },
  'no-hours': { tone: 'closed', icon: 'info' },
  'temporarily-closed': { tone: 'closed', icon: 'alert' },
  'permanently-closed': { tone: 'closed', icon: 'alert' },
}

/** Shows open state with an icon, the words and a fill, so it never relies on colour alone. */
export function StatusChip({ status }: { status: OpenStatus }) {
  const { tone, icon } = APPEARANCE[status.kind]
  return (
    <span className={`status-chip status-chip--${tone}`}>
      <Icon name={icon} size={16} />
      {status.label}
    </span>
  )
}
