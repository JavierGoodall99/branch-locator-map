import { Icon, type IconName } from '@/shared/ui/Icon'

const SERVICE_ICONS: Record<string, IconName> = {
  Branch: 'bank',
  ATM: 'cash',
  'Cash Accepting ATM': 'deposit',
  'SmartID Services': 'idCard',
  'Business Banking Centre': 'briefcase',
}

/** The services a site offers, each with its icon. Unknown services get a neutral icon. */
export function ServiceList({ services }: { services: string[] }) {
  return (
    <ul className="branch-card__services">
      {services.map((service) => (
        <li key={service}>
          <Icon name={SERVICE_ICONS[service] ?? 'info'} size={16} />
          {service}
        </li>
      ))}
    </ul>
  )
}
