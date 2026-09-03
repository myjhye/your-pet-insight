/**
 * GA4 / Google Tag custom event tracking helper
 * Directly invokes window.gtag('event', eventName, params) for direct GA4 collection
 */
export const trackEvent = (eventName, params = {}) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params)
  } else if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push(['event', eventName, params])
  }
}

