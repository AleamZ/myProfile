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

        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-inview')
                        io.unobserve(entry.target)
                    }
                })
            },
            { threshold: 0.35, rootMargin: '0px 0px -12% 0px' },
        )

        els.forEach((el) => io.observe(el))
        return () => io.disconnect()
    }, [selector])
}
