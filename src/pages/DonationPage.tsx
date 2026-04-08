import { useMemo, useState } from 'react'

const SUGGESTED_AMOUNTS = [35, 75, 150, 300] as const

const FUNDING_ALLOCATION = [
  { label: 'Coral nursery operations', percent: 42 },
  { label: 'Community steward stipends', percent: 28 },
  { label: 'Monitoring and reporting', percent: 18 },
  { label: 'Training and safety', percent: 12 },
]

const FAQS = [
  {
    question: 'Can I give monthly?',
    answer:
      'Yes. Monthly gifts are the most useful because nursery upkeep and monitoring are ongoing commitments.',
  },
  {
    question: 'How quickly does my donation reach field teams?',
    answer:
      'Most donations are allocated during the next monthly disbursement cycle after internal review and reporting checks.',
  },
  {
    question: 'Will I receive impact updates?',
    answer:
      'Yes. Donors receive recurring field updates with nursery survival snapshots and program progress.',
  },
]

function parseCurrency(value: string): number {
  const parsed = Number(value.replace(/[^\d.]/g, ''))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function DonationPage() {
  const [frequency, setFrequency] = useState<'monthly' | 'one-time'>('monthly')
  const [selectedAmount, setSelectedAmount] = useState<number>(75)
  const [customAmount, setCustomAmount] = useState('')
  const [activeFaqIndex, setActiveFaqIndex] = useState(0)

  const customAmountValue = parseCurrency(customAmount)
  const donationAmount = customAmountValue > 0 ? customAmountValue : selectedAmount
  const annualValue = frequency === 'monthly' ? donationAmount * 12 : donationAmount

  const impact = useMemo(() => {
    return {
      fragments: Math.round(annualValue * 1.8),
      stewardMonths: Math.max(1, Math.round(annualValue / 125)),
      monitoringTrips: Math.max(1, Math.round(annualValue / 280)),
    }
  }, [annualValue])

  const allocationAmounts = useMemo(() => {
    return FUNDING_ALLOCATION.map((item) => ({
      ...item,
      amount: Math.round((annualValue * item.percent) / 100),
    }))
  }, [annualValue])

  const configuredDonationUrl =
    (import.meta.env.VITE_DONATION_URL as string | undefined)?.trim() || ''
  const configuredDonationEmail =
    (import.meta.env.VITE_DONATION_EMAIL as string | undefined)?.trim() || 'donations@coralresearchinitiative.org'

  const donationUrl = useMemo(() => {
    if (!configuredDonationUrl) return ''
    try {
      const url = new URL(configuredDonationUrl)
      url.searchParams.set('amount', String(donationAmount))
      url.searchParams.set('frequency', frequency)
      return url.toString()
    } catch {
      return configuredDonationUrl
    }
  }, [configuredDonationUrl, donationAmount, frequency])

  const fallbackMailto = `mailto:${encodeURIComponent(configuredDonationEmail)}?subject=${encodeURIComponent(
    `Donation pledge: ${formatUsd(donationAmount)} ${frequency}`
  )}`

  return (
    <div className="donation-page">
      <section className="donation-hero">
        <div>
          <p className="donation-kicker">Donation Landing Page</p>
          <h1>Power reef recovery with a gift that is measurable and transparent.</h1>
          <p>
            This page is designed to prioritize donor trust, recurring giving, and visible field outcomes.
            Choose an amount, see expected impact, and continue to a secure donation handoff.
          </p>
        </div>
        <aside className="donation-proof" aria-label="Trust markers">
          <article>
            <strong>Monthly reporting</strong>
            <p>Program summaries include outplant totals, survival checks, and spending snapshots.</p>
          </article>
          <article>
            <strong>Community-first disbursement</strong>
            <p>Local operators and dive teams receive priority in the funding cycle.</p>
          </article>
          <article>
            <strong>Outcome-linked planning</strong>
            <p>Finance decisions are tied to clear ecological and operations milestones.</p>
          </article>
        </aside>
      </section>

      <section className="donation-builder">
        <div className="donation-form">
          <h2>Choose your gift</h2>
          <div className="donation-frequency" role="tablist" aria-label="Donation frequency">
            <button
              type="button"
              role="tab"
              aria-selected={frequency === 'monthly'}
              className={frequency === 'monthly' ? 'active' : ''}
              onClick={() => setFrequency('monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={frequency === 'one-time'}
              className={frequency === 'one-time' ? 'active' : ''}
              onClick={() => setFrequency('one-time')}
            >
              One-time
            </button>
          </div>
          <div className="donation-amount-grid" role="list" aria-label="Suggested amounts">
            {SUGGESTED_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                role="listitem"
                className={donationAmount === amount && customAmountValue === 0 ? 'active' : ''}
                onClick={() => {
                  setSelectedAmount(amount)
                  setCustomAmount('')
                }}
              >
                {formatUsd(amount)}
              </button>
            ))}
          </div>
          <label className="donation-custom-input">
            Custom amount (USD)
            <input
              type="text"
              inputMode="decimal"
              placeholder="Enter amount"
              value={customAmount}
              onChange={(event) => setCustomAmount(event.target.value)}
            />
          </label>
          <a className="donation-submit" href={donationUrl || fallbackMailto}>
            Continue to Secure Donation
          </a>
          <p className="donation-note">
            {donationUrl
              ? 'You will be redirected to our secure donation processor.'
              : 'Donation processing is not configured yet. This button opens an email pledge as a temporary fallback.'}
          </p>
        </div>

        <aside className="donation-impact" aria-label="Impact estimate">
          <h2>Your projected impact</h2>
          <p>
            {formatUsd(donationAmount)} {frequency === 'monthly' ? 'per month' : 'one-time'} can support:
          </p>
          <div className="donation-impact-cards">
            <article>
              <strong>{impact.fragments}</strong>
              <span>Coral fragments prepared annually</span>
            </article>
            <article>
              <strong>{impact.stewardMonths}</strong>
              <span>Steward work-months funded</span>
            </article>
            <article>
              <strong>{impact.monitoringTrips}</strong>
              <span>Monitoring dive trips covered</span>
            </article>
          </div>
        </aside>
      </section>

      <section className="donation-allocation">
        <h2>Where funds go</h2>
        <p>
          Transparent allocation helps donors understand how each gift translates to implementation.
          Values below are estimated annualized amounts based on your selection.
        </p>
        <div className="donation-allocation-list" role="list">
          {allocationAmounts.map((item) => (
            <article key={item.label} role="listitem" className="donation-allocation-row">
              <div className="donation-allocation-label">
                <span>{item.label}</span>
                <strong>
                  {item.percent}% · {formatUsd(item.amount)}
                </strong>
              </div>
              <div className="donation-allocation-track" aria-hidden>
                <i style={{ width: `${item.percent}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="donation-faq">
        <h2>Donor questions</h2>
        <div className="donation-faq-list">
          {FAQS.map((faq, index) => (
            <article key={faq.question}>
              <button
                type="button"
                aria-expanded={activeFaqIndex === index}
                onClick={() => setActiveFaqIndex(index)}
              >
                {faq.question}
              </button>
              {activeFaqIndex === index && <p>{faq.answer}</p>}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
