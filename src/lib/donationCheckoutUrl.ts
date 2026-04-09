/**
 * Builds the outbound checkout URL for /donate.
 * - Stripe Payment Links (buy.stripe.com, etc.): sets `prefilled_amount` in cents (USD).
 * - Other processors: keeps `amount` (dollars) + `frequency` query params.
 * - Optional separate URLs for monthly vs one-time (VITE_DONATION_URL_MONTHLY / ONETIME).
 */

function isStripeHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  return h.includes('stripe.com') || h.endsWith('.stripe.me')
}

export function resolveDonationBaseUrl(
  frequency: 'monthly' | 'one-time',
  fallback: string,
  monthlyUrl?: string,
  onetimeUrl?: string
): string {
  const m = monthlyUrl?.trim()
  const o = onetimeUrl?.trim()
  const base = fallback.trim()
  if (frequency === 'monthly' && m) return m
  if (frequency === 'one-time' && o) return o
  return base
}

export function buildDonationCheckoutUrl(
  baseUrl: string,
  donationAmountDollars: number,
  frequency: 'monthly' | 'one-time'
): string {
  if (!baseUrl.trim()) return ''

  try {
    const url = new URL(baseUrl.trim())
    const forceGeneric =
      (import.meta.env.VITE_DONATION_FORCE_GENERIC_PARAMS as string | undefined) === 'true'

    if (!forceGeneric && isStripeHost(url.hostname)) {
      const cents = Math.max(50, Math.round(donationAmountDollars * 100))
      url.searchParams.set('prefilled_amount', String(cents))
      url.searchParams.delete('amount')
      url.searchParams.delete('frequency')
      return url.toString()
    }

    url.searchParams.set('amount', String(donationAmountDollars))
    url.searchParams.set('frequency', frequency)
    return url.toString()
  } catch {
    return baseUrl.trim()
  }
}
