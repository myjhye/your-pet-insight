import { Helmet } from 'react-helmet-async'

const SITE_URL = 'https://www.yourpetinsight.com'
const SITE_NAME = 'Your Pet Insight'

export function BlogSEO({ title, description, url, type = 'article', publishedDate, category }) {
  const fullTitle = `${title} | ${SITE_NAME} 블로그`
  const fullUrl = `${SITE_URL}${url}`

  return (
    <Helmet>
      {/* ★ 한국어 명시 */}
      <html lang="ko" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />
      <link rel="alternate" hreflang="ko" href={fullUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="ko_KR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />

      {publishedDate && <meta property="article:published_time" content={publishedDate} />}
      {category && <meta property="article:section" content={category} />}

      {/* JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': type === 'article' ? 'Article' : 'WebPage',
          headline: title,
          description,
          url: fullUrl,
          inLanguage: 'ko',
          publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
          ...(publishedDate && { datePublished: publishedDate }),
        })}
      </script>
    </Helmet>
  )
}

