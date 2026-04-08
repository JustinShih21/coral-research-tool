import { useMemo, useState } from 'react'

const SUGGESTED_AMOUNTS = [35, 75, 150, 300] as const
/** Preset we highlight as a social-norm anchor (matches default selection). */
const POPULAR_PRESET_AMOUNT = 75

function buildDonationFaqs(supportEmail: string) {
  return [
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
    {
      question: 'Will I get a tax receipt?',
      answer: `Tax documentation depends on your jurisdiction and how gifts are processed. After you give, our payment flow or finance contact can provide a receipt where applicable. For help, email ${supportEmail}.`,
    },
    {
      question: 'How do I change or cancel a recurring gift?',
      answer: `Email ${supportEmail} from the address you used when donating, and let us know you want to change or cancel your monthly gift. We will confirm once it is updated.`,
    },
    {
      question: 'Who can I contact about donations?',
      answer: `For donation help, partnerships, or questions about this page, write to ${supportEmail}.`,
    },
  ]
}

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
  const [selectedAmount, setSelectedAmount] = useState<number>(POPULAR_PRESET_AMOUNT)
  const [customAmount, setCustomAmount] = useState('')
  const [activeFaqIndex, setActiveFaqIndex] = useState(0)

  const customAmountValue = parseCurrency(customAmount)
  const donationAmount = customAmountValue > 0 ? customAmountValue : selectedAmount
  const annualValue = frequency === 'monthly' ? donationAmount * 12 : donationAmount

  const configuredDonationUrl =
    (import.meta.env.VITE_DONATION_URL as string | undefined)?.trim() || ''
  const configuredDonationEmail =
    (import.meta.env.VITE_DONATION_EMAIL as string | undefined)?.trim() || 'donations@coralresearchinitiative.org'
  const supportEmail =
    (import.meta.env.VITE_DONATION_SUPPORT_EMAIL as string | undefined)?.trim() || configuredDonationEmail
  const processorLabel = (import.meta.env.VITE_DONATION_PROCESSOR_LABEL as string | undefined)?.trim() || ''

  const faqs = useMemo(() => buildDonationFaqs(supportEmail), [supportEmail])

  const impact = useMemo(() => {
    return {
      fragments: Math.round(annualValue * 1.8),
      stewardMonths: Math.max(1, Math.round(annualValue / 125)),
      monitoringTrips: Math.max(1, Math.round(annualValue / 280)),
    }
  }, [annualValue])

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
  const primaryHref = donationUrl || fallbackMailto

  return (
    <div className="donation-page">
      <section className="donation-hero">
        <div>
          <p className="donation-kicker">Fund reef restoration</p>
          <h1>Help scale coral recovery—with clear, measurable impact.</h1>
          <p>
            Monthly gifts keep nurseries and monitoring funded year-round. Choose an amount to see estimated field
            impact, then complete your gift through our secure checkout.
          </p>
        </div>
        <aside className="donation-proof" aria-label="Why donors trust this program">
          <article>
            <strong>Transparent reporting</strong>
            <p>Program updates cover outplant totals, survival checks, and how resources reach the water.</p>
          </article>
          <article>
            <strong>Community-first operations</strong>
            <p>Local operators and dive teams are prioritized in how field work is resourced.</p>
          </article>
          <article>
            <strong>Outcomes, not optics</strong>
            <p>Funding decisions are tied to ecological milestones and operational realities on the reef.</p>
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
                <span className="donation-amt-value">{formatUsd(amount)}</span>
                {amount === POPULAR_PRESET_AMOUNT && (
                  <span className="donation-amt-popular">Popular</span>
                )}
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
          <a className="donation-submit" href={primaryHref}>
            Continue to secure donation
          </a>
          <p className="donation-note">
            {donationUrl
              ? `You will leave this site to complete payment${
                  processorLabel ? ` with ${processorLabel}` : ' on our processor'
                }. Your amount and frequency are passed to checkout.`
              : 'Checkout is not configured yet—this button opens an email pledge with your amount and frequency.'}
          </p>
          <div className="donation-trust-foot">
            <p>
              Questions before you give?{' '}
              <a className="donation-inline-link" href={`mailto:${encodeURIComponent(supportEmail)}`}>
                Email {supportEmail}
              </a>
            </p>
          </div>
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

      <section className="donation-pillars" aria-label="Program focus">
        <h2 className="donation-pillars-heading">What your gift supports</h2>
        <ul className="donation-pillars-list">
          <li>Restoration finance and bankable reef projects</li>
          <li>Indonesia field partnerships and local capacity</li>
          <li>Reporting donors can trust</li>
        </ul>
      </section>

      <section className="donation-faq">
        <h2>Donor questions</h2>
        <div className="donation-faq-list">
          {faqs.map((faq, index) => (
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

      <div className="donation-sticky-give">
        <a className="donation-sticky-give-btn" href={primaryHref}>
          <span className="donation-sticky-label">Continue gift</span>
          <span className="donation-sticky-amt">
            {formatUsd(donationAmount)}
            {frequency === 'monthly' ? '/mo' : ' once'}
          </span>
        </a>
      </div>
    </div>
  )
}
