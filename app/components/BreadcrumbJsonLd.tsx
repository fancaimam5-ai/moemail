interface BreadcrumbItem {
  name: string
  path: string
}

interface BreadcrumbJsonLdProps {
  locale: string
  items: BreadcrumbItem[]
}

export function BreadcrumbJsonLd({ locale, items }: BreadcrumbJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://if-mail.tech"

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${baseUrl}/${locale}${item.path}`,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
