import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { Icon } from '@/shared/ui/Icon'
import { HERO_SIZES, hero, placeholder } from '@/features/branches/components/detail/heroImage'
import { WIDE_LAYOUT_QUERY } from '@/features/branches/map/view'

interface DetailHeroProps {
  onBack: () => void
}

/**
 * The top of the details. Beside the map it is a photo with the way back over its top left. The
 * photo is decoration, so it has no description; the button is the content. On a phone there is
 * no photo, because the sheet is short and the name, address and buttons matter more, so it is
 * not even downloaded: only the way back, which sits in the top left corner of the screen. Either way
 * the button comes first in the page, so it is the first stop for the keyboard. Beside the map the photo is
 * fetched ahead of time (see `preloadHeroImage`), so it is usually there in the first frame.
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
          <source
            key={format}
            type={`image/${format === 'jpg' ? 'jpeg' : format}`}
            srcSet={srcSet}
            sizes={HERO_SIZES}
          />
        ))}
        <img
          className="detail-hero__image"
          // A blurred copy of the photo shows from the first frame, so a block of plain colour never does.
          style={{ backgroundImage: `url(${placeholder})` }}
          src={hero.img.src}
          width={hero.img.w}
          height={hero.img.h}
          sizes={HERO_SIZES}
          alt=""
          decoding="async"
        />
      </picture>
      {back('detail-hero__back')}
    </div>
  )
}
