import logoUrl from '@/assets/capitec-logo.svg'

/**
 * The page's name: Capitec's logo, a thin divider and "Branch finder". It is shown beside the map
 * on wider screens, and left out on a phone, where the space is better spent on the map.
 */
export function BrandHeader() {
  return (
    <div className="brand-header">
      <img className="brand-header__logo" src={logoUrl} alt="Capitec" width={126} height={18} />
      <span className="brand-header__divider" aria-hidden="true" />
      <span className="brand-header__name">Branch finder</span>
    </div>
  )
}
