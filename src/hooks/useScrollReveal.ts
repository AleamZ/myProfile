import { useEffect } from 'react'

/**
 * Progressive-enhancement scroll reveal.
 * Default (no-JS) state = fully visible; the `.js` flag opts elements into
 * the hidden-then-reveal treatment, so IntersectionObserver/JS failure
 * never hides content. One-shot: each element is unobserved after revealing.
 */
export function useScrollReveal(selector = '.reveal') {
    useEffect(() => {
        const root = document.documentElement
        root.classList.add('js')

        const els = Array.from(document.querySelectorAll<HTMLElement>(selector))
        if (els.length === 0) return

        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (reduce || !('IntersectionObserver' in window)) {
            els.forEach((el) => el.classList.add('is-inview'))
            return
        }

        const reveal: IntersectionObserverCallback = (entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-inview')
                    obs.unobserve(entry.target)
                }
            })
        }

        const io = new IntersectionObserver(reveal, { threshold: 0.35, rootMargin: '0px 0px -12% 0px' })
        // Bottom-of-page bands can never reach the main threshold inside the
        // -12% rootMargin — give them a lenient observer of their own.
        const late = new IntersectionObserver(reveal, { threshold: 0.05 })

        els.forEach((el) => (el.classList.contains('reveal--late') ? late : io).observe(el))
        return () => {
            io.disconnect()
            late.disconnect()
        }
    }, [selector])
}
