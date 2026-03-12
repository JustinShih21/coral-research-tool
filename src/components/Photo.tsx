import type { CSSProperties } from 'react'

type AspectRatio = '16/9' | '4/3' | '1/1' | '21/9'

interface PhotoProps {
  src: string
  alt: string
  aspectRatio?: AspectRatio
  className?: string
  overlay?: boolean
  credit?: string
  loading?: 'lazy' | 'eager'
  /** For card tops: round only top corners */
  roundTop?: boolean
}

export default function Photo({
  src,
  alt,
  aspectRatio = '16/9',
  className = '',
  overlay = false,
  credit,
  loading = 'lazy',
  roundTop = false,
}: PhotoProps) {
  const style: CSSProperties = {
    aspectRatio: aspectRatio.replace('/', ' / '),
  }
  return (
    <figure
      className={`photo-wrap ${roundTop ? 'photo-round-top' : ''} ${className}`.trim()}
      style={style}
    >
      <div className="photo-inner">
        <img
          src={src}
          alt={alt}
          loading={loading}
          className="photo-img"
          decoding="async"
        />
        {overlay && <span className="photo-overlay" aria-hidden />}
      </div>
      {credit && (
        <figcaption className="photo-credit">{credit}</figcaption>
      )}
    </figure>
  )
}
