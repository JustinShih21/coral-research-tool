import { useMemo, useState } from 'react'
import { buildDonationCheckoutUrl, resolveDonationBaseUrl } from '@/lib/donationCheckoutUrl'

const SUGGESTED_AMOUNTS = [35, 75, 150, 300, 500] as const
const POPULAR_PRESET_AMOUNT = 75

/** Hero visual — coral reef (Unsplash); replace with /images/... when you host your own photo. */
const DONATE_HERO_IMAGE =
  'https://images.unsplash.com/photo-1572713629470-3e9f5d4fdf4c?auto=format&fit=crop&w=1600&q=80'

const PARTNER_PILLS = [
  { label: 'USC Marshall field program' },
  { label: 'Indonesia reef teams' },
  { label: 'Transparent field reporting' },
] as const

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

function annualFromPreset(amount: number, frequency: 'monthly' | 'one-time'): number {
  return frequency === 'monthly' ? amount * 12 : amount
}

function impactFromAnnual(annualValue: number) {
  return {
    fragments: Math.round(annualValue * 1.8),
    stewardMonths: Math.max(1, Math.round(annualValue / 125)),
    monitoringTrips: Math.max(1, Math.round(annualValue / 280)),
  }
}

function presetImpactSummary(amount: number, frequency: 'monthly' | 'one-time'): string {
  const annual = annualFromPreset(amount, frequency)
  const { fragments } = impactFromAnnual(annual)
  return `~${fragments.toLocaleString()} fragments/yr equiv.`
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
  const configuredDonationUrlMonthly =
    (import.meta.env.VITE_DONATION_URL_MONTHLY as string | undefined)?.trim() || ''
  const configuredDonationUrlOnetime =
    (import.meta.env.VITE_DONATION_URL_ONETIME as string | undefined)?.trim() || ''
  const configuredDonationEmail =
    (import.meta.env.VITE_DONATION_EMAIL as string | undefined)?.trim() || 'donations@coralresearchinitiative.org'
  const supportEmail =
    (import.meta.env.VITE_DONATION_SUPPORT_EMAIL as string | undefined)?.trim() || configuredDonationEmail
  const processorLabel = (import.meta.env.VITE_DONATION_PROCESSOR_LABEL as string | undefined)?.trim() || ''

  const faqs = useMemo(() => buildDonationFaqs(supportEmail), [supportEmail])

  const impact = useMemo(() => impactFromAnnual(annualValue), [annualValue])

  const donationUrl = useMemo(() => {
    const base = resolveDonationBaseUrl(
      frequency,
      configuredDonationUrl,
      configuredDonationUrlMonthly || undefined,
      configuredDonationUrlOnetime || undefined
    )
    if (!base) return ''
    return buildDonationCheckoutUrl(base, donationAmount, frequency)
  }, [
    configuredDonationUrl,
    configuredDonationUrlMonthly,
    configuredDonationUrlOnetime,
    donationAmount,
    frequency,
  ])

  const fallbackMailto = `mailto:${encodeURIComponent(configuredDonationEmail)}?subject=${encodeURIComponent(
    `Donation pledge: ${formatUsd(donationAmount)} ${frequency}`
  )}`
  const primaryHref = donationUrl || fallbackMailto

  return (
    <div className="donation-page">
      <section className="donation-hero donation-hero-with-media">
        <figure className="donation-hero-media">
          <img
            src={DONATE_HERO_IMAGE}
            alt="Healthy coral reef underwater—restoration work protects habitats like this."
            width={800}
            height={520}
            loading="eager"
            decoding="async"
          />
        </figure>
        <div className="donation-hero-copy">
          <p className="donation-kicker">Fund reef restoration</p>
          <h1>Every gift grows living reef—where communities lead the work.</h1>
          <p>
            Your support helps keep nurseries stocked, stewards paid, and monitoring honest. Pick a monthly or
            one-time amount, see what it can unlock in the field, then finish on secure checkout.
          </p>
        </div>
      </section>

      <section className="donation-social-proof" aria-label="Partners and credibility">
        <p className="donation-social-lead">Backed by university research and in-water partners across Indonesia.</p>
        <div className="donation-partner-pills" role="list">
          {PARTNER_PILLS.map((p) => (
            <span key={p.label} className="donation-partner-pill" role="listitem">
              {p.label}
            </span>
          ))}
        </div>
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
                <span className="donation-amt-hint">{presetImpactSummary(amount, frequency)}</span>
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
          <p className="donation-secure-line">
            <span className="donation-secure-icon" aria-hidden>
              🔒
            </span>
            Encrypted checkout{processorLabel ? ` · ${processorLabel}` : ''}
          </p>
          <p className="donation-note">
            {donationUrl
              ? `You will leave this site to complete payment${
                  processorLabel ? ` with ${processorLabel}` : ' on our processor'
                }. Your amount is sent to checkout${
                  frequency === 'monthly' ? ' (choose the monthly option on the next page if prompted).' : '.'
                }`
              : 'Add a payment link in your site settings (e.g. Stripe Payment Link)—until then this button opens an email pledge with your amount and frequency.'}
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
              <span className="donation-impact-hint">
                Illustrative equivalent based on program cost benchmarks—not a guarantee of a single outcome.
              </span>
            </article>
            <article>
              <strong>{impact.stewardMonths}</strong>
              <span>Steward work-months funded</span>
              <span className="donation-impact-hint">Roughly one funded month per ~$125 directed to stipends.</span>
            </article>
            <article>
              <strong>{impact.monitoringTrips}</strong>
              <span>Monitoring dive trips covered</span>
              <span className="donation-impact-hint">Roughly one trip per ~$280 in dive logistics.</span>
            </article>
          </div>
        </aside>
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

      <section className="donation-pillars" aria-label="Program focus">
        <h2 className="donation-pillars-heading">What your gift supports</h2>
        <ul className="donation-pillars-list">
          <li>Restoration finance and bankable reef projects</li>
          <li>Indonesia field partnerships and local capacity</li>
          <li>Reporting donors can trust</li>
        </ul>
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
