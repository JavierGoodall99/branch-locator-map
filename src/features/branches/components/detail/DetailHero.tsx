import hero from '@/assets/capitec-atm.jpg?w=480;800;1200&format=avif;webp;jpg&as=picture'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { Icon } from '@/shared/ui/Icon'
import { WIDE_LAYOUT_QUERY } from '@/features/branches/map/view'

interface DetailHeroProps {
  onBack: () => void
}

// The sidebar is at most 440px wide. The photo is only used beside the map, so this is its only size.
const SIZES = '440px'

/**
 * The top of the details. Beside the map it is a photo with the way back over its top left. The
 * photo is decoration, so it has no description; the button is the content. On a phone there is
 * no photo, because the sheet is short and the name, address and buttons matter more, so it is
 * not even downloaded: only the way back, which sits in the top left corner of the screen. Either way the button comes first in
 * the page, so it is the first stop for the keyboard.
 */
export function DetailHero({ onBack }: DetailHeroProps) {
  const wide = useMediaQuery(WIDE_LAYOUT_QUERY)

  const back = (className: string) => (
    <button type="button" className={`icon-button ${className}`} aria-label="Back to results" onClick={onBack}>
      <Icon name="arrowLeft" />
    </button>
  )

  if (!wide) return <div className="detail-bar">{back('detail-bar__back')}</div>

  return (
    <div className="detail-hero">
      <picture>
        {Object.entries(hero.sources).map(([format, srcSet]) => (
          <source key={format} type={`image/${format === 'jpg' ? 'jpeg' : format}`} srcSet={srcSet} sizes={SIZES} />
        ))}
        <img
          className="detail-hero__image"
          src={hero.img.src}
          width={hero.img.w}
          height={hero.img.h}
          sizes={SIZES}
          alt=""
          decoding="async"
        />
      </picture>
      {back('detail-hero__back')}
    </div>
  )
}
