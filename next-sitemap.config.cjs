/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://if-mail.tech',
  generateRobotsTxt: false,
  generateIndexSitemap: false,
  changefreq: null,
  priority: null,
  // Exclude all auto-discovered paths (dynamic [locale] routes can't be resolved automatically)
  exclude: ['/*'],
  additionalPaths: async (config) => {
    const locales = ['en', 'id']
    const pages = ['', '/pricing', '/about', '/privacy', '/terms']
    const result = []
    for (const locale of locales) {
      for (const page of pages) {
        result.push({
          loc: `/${locale}${page}`,
          lastmod: new Date().toISOString(),
          alternateRefs: [
            { href: `https://if-mail.tech/en${page}`, hreflang: 'en' },
            { href: `https://if-mail.tech/id${page}`, hreflang: 'id' },
            { href: `https://if-mail.tech/en${page}`, hreflang: 'x-default' },
          ],
        })
      }
    }
    return result
  },
}
