interface HeroProps {
  /** Background image URL */
  imageUrl: string
  /** Accessible short description of the image */
  imageAlt: string
  title: string
  subtitle?: string
  /** Optional credit shown in corner */
  credit?: string
}

export default function Hero({ imageUrl, imageAlt, title, subtitle, credit }: HeroProps) {
  return (
    <section
      className="hero"
      aria-label="Page hero"
    >
      <div
        className="hero-bg"
        style={{ backgroundImage: `url(${imageUrl})` }}
        role="img"
        aria-label={imageAlt}
      />
      <span className="hero-overlay" aria-hidden />
      <div className="hero-content">
        <h1 className="hero-title">{title}</h1>
        {subtitle && <p className="hero-subtitle">{subtitle}</p>}
      </div>
      {credit && <span className="hero-credit">{credit}</span>}
    </section>
  )
}
