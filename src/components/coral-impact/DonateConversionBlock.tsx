import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CoralPage, trackCoralDonateClick } from '@/lib/coralAnalytics'

const DONATION_TIERS = [
  { amount: 25, label: 'Plants one coral fragment' },
  { amount: 50, label: 'Restores 2 sq ft of reef' },
  { amount: 150, label: 'Sponsors a Reef Star installation' },
] as const

type DonateConversionBlockProps = {
  page: CoralPage
  placement: 'mid' | 'bottom'
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function DonateConversionBlock({ page, placement }: DonateConversionBlockProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(DONATION_TIERS[1].amount)

  const goalCurrent = 68450
  const goalTarget = 120000

  const progress = useMemo(() => {
    if (goalTarget <= 0) return 0
    return Math.min(100, Math.round((goalCurrent / goalTarget) * 100))
  }, [goalCurrent, goalTarget])

  const donateHref = `/donate?source=coral-${page}-${placement}&amount=${selectedAmount}`

  return (
    <section className="ci-donate-block" aria-labelledby={`ci-donate-${page}-${placement}`}>
      <div className="ci-donate-head">
        <p className="ci-kicker">Protect the Reef</p>
        <h2 id={`ci-donate-${page}-${placement}`}>Fund restoration teams before the next bleaching window.</h2>
      </div>

      <div className="ci-donate-tiers" role="list" aria-label="Donation tiers">
        {DONATION_TIERS.map((tier) => (
          <button
            key={tier.amount}
            type="button"
            role="listitem"
            className={selectedAmount === tier.amount ? 'active' : ''}
            onClick={() => setSelectedAmount(tier.amount)}
          >
            <strong>{formatUsd(tier.amount)}</strong>
            <span>{tier.label}</span>
          </button>
        ))}
      </div>

      <div className="ci-donate-progress" aria-label="Campaign progress">
        <div className="ci-donate-progress-top">
          <span>{formatUsd(goalCurrent)} funded</span>
          <span>{progress}% of goal</span>
        </div>
        <div className="ci-donate-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <i style={{ width: `${progress}%` }} />
        </div>
        <p className="ci-donate-progress-note">Goal: {formatUsd(goalTarget)} for community-led reef restoration this season.</p>
      </div>

      <div className="ci-donate-actions">
        <Link
          to={donateHref}
          className="ci-button ci-button--coral"
          onClick={() => trackCoralDonateClick(page, `${placement}_primary`)}
        >
          Donate {formatUsd(selectedAmount)}
        </Link>
        <Link
          to="/coral-impact"
          className="ci-link-inline"
          onClick={() => trackCoralDonateClick(page, `${placement}_learn_more`)}
        >
          Learn more
        </Link>
      </div>
    </section>
  )
}
