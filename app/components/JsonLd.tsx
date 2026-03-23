export default function JsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://if-mail.tech"
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        url: `${baseUrl}/`,
        name: 'IfMail',
        description: 'Free disposable email service with auto-expiring inboxes and API access',
        publisher: { '@id': `${baseUrl}/#organization` },
        inLanguage: ['en', 'id'],
      },
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: 'SoftMoe Studio',
        url: `${baseUrl}/`,
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/icons/icon-192x192.png`,
        },
        sameAs: [
          'https://github.com/softmoe',
        ],
        foundingDate: '2024-01-01',
        foundingLocation: {
          '@type': 'Place',
          name: 'Indonesia',
        },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${baseUrl}/#application`,
        name: 'IfMail',
        applicationCategory: 'CommunicationApplication',
        operatingSystem: 'Web',
        url: `${baseUrl}/`,
        description: 'IfMail is a free temporary email service that creates disposable email addresses instantly — no account or phone number required. Addresses auto-expire after a set period (1 hour to 72 hours), keeping your real inbox clean and private. Free users get 3 email addresses; Premium users get unlimited addresses with permanent retention, API access, and webhook notifications.',
        featureList: [
          'Create temporary email addresses instantly',
          'No signup or phone number required',
          'Auto-expiry from 1 hour to 72 hours',
          'Real-time email delivery via Cloudflare edge',
          'Share mailboxes via link',
          'Full REST API for developers',
          'Webhook notifications',
          'AES-256-GCM email encryption',
          'Open source on GitHub',
        ],
        offers: [
          {
            '@type': 'Offer',
            name: 'Free',
            price: '0',
            priceCurrency: 'USD',
            description: '3 email addresses, up to 72-hour expiry, 2 sends/day',
            url: `${baseUrl}/en/pricing`,
          },
          {
            '@type': 'Offer',
            name: 'Premium',
            description: 'Unlimited email addresses, permanent retention, API key, webhooks, 5 sends/day',
            url: `${baseUrl}/en/pricing`,
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: '25000',
              priceCurrency: 'IDR',
              billingDuration: 'P1M',
              unitText: 'MONTH',
            },
          },
        ],
        softwareHelp: {
          '@type': 'WebPage',
          url: `${baseUrl}/en/docs`,
        },
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
