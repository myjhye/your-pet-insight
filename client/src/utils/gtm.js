/**
 * Google Tag Manager (GTM) custom event tracking helper
 * Safely pushes events to window.dataLayer for GTM triggers and GA4 tags
 */
export const trackEvent = (eventName, params = {}) => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      event: eventName,
      ...params,
    })
  }
}
