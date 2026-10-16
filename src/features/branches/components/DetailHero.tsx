import hero from '../../../assets/capitec-atm.jpg?w=480;800;1200&format=avif;webp;jpg&as=picture'
import { Icon } from '../../../shared/ui/Icon'

interface DetailHeroProps {
  /** 1-based position in the list the user came from. */
  position: number
  total: number
  onBack: () => void
  onPrevious: () => void
  onNext: () => void
}

// The sidebar is at most 400px wide, and the full width of a phone below that.
const SIZES = '(min-width: 768px) 400px, 100vw'

/**
 * The photo at the top of the details, with the way back over its top left and Previous and Next over
 * its top right. The photo is decoration, so it has no description; the controls are the content.
 * The back button comes first in the page, so it is the first stop for the keyboard.
 */
export function DetailHero({ position, total, onBack, onPrevious, onNext }: DetailHeroProps) {
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

      <button type="button" className="icon-button detail-hero__back" aria-label="Back to results" onClick={onBack}>
        <Icon name="arrowLeft" />
      </button>

      <div className="detail-hero__pager">
        <button type="button" className="icon-button" aria-label="Previous branch" disabled={position <= 1} onClick={onPrevious}>
          <Icon name="chevronLeft" />
        </button>
        <span className="detail-hero__position" aria-hidden="true">
          {position} of {total}
        </span>
        <button type="button" className="icon-button" aria-label="Next branch" disabled={position >= total} onClick={onNext}>
          <Icon name="chevronRight" />
        </button>
      </div>
    </div>
  )
}
