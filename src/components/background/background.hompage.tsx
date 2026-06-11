import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import PixelSquadron from '../pixelSquadron/pixelSquadron'

/**
 * Decorative + motion layer for PLATINE PROOF.
 * Renders the fixed luminance stack (vignette · spotlight · grain · grid
 * overlay) and the custom cursor, and drives a single requestAnimationFrame
 * lerp loop for the cursor, the spotlight CSS vars, magnetic targets and the
 * name-glyph proximity bloom. Everything is gated behind a fine pointer +
 * no-reduced-motion; on touch / reduced-motion the spotlight falls back to a
 * static centre glow and the native cursor is kept.
 */

type Magnet = { el: HTMLElement; cx: number; cy: number; ox: number; oy: number }
type Glyph = { el: HTMLElement; cx: number; cy: number; lit: boolean }

const MAGNET_RADIUS = 70
const GLYPH_RADIUS = 95

// Light-theme "frosted bloom" orbs — deterministic literal (no randomness).
const BLOOMS = [
    { c: 'is-lav', top: '12%', left: '18%', size: '46vmax', dur: '34s', delay: '0s' },
    { c: 'is-sky', top: '58%', left: '70%', size: '52vmax', dur: '41s', delay: '-7s' },
    { c: 'is-peach', top: '74%', left: '22%', size: '40vmax', dur: '37s', delay: '-15s' },
    { c: 'is-white', top: '30%', left: '62%', size: '44vmax', dur: '45s', delay: '-23s' },
] as const

const Background = () => {
    const cursorRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const root = document.documentElement
        const finePointer = window.matchMedia('(pointer: fine)').matches
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

        // Fallback: static centre glow, native cursor kept.
        if (!finePointer || reduced) {
            root.style.setProperty('--mx', '50%')
            root.style.setProperty('--my', '38%')
            return
        }

        document.body.classList.add('has-pointer-fx')

        const target = { x: window.innerWidth / 2, y: window.innerHeight * 0.38 }
        const cursor = { x: target.x, y: target.y }
        const spot = { x: target.x, y: target.y }

        let magnets: Magnet[] = []
        let glyphs: Glyph[] = []
        let needsMeasure = false

        const measure = () => {
            magnets = Array.from(document.querySelectorAll<HTMLElement>('[data-magnetic]')).map((el) => {
                const r = el.getBoundingClientRect()
                return { el, cx: r.left + r.width / 2, cy: r.top + r.height / 2, ox: 0, oy: 0 }
            })
            glyphs = Array.from(document.querySelectorAll<HTMLElement>('[data-glyph]')).map((el) => {
                const r = el.getBoundingClientRect()
                return { el, cx: r.left + r.width / 2, cy: r.top + r.height / 2, lit: false }
            })
        }
        measure()

        // The giant Fraunces name reflows once the webfont swaps in, so
        // re-measure when fonts are ready (display=swap, async).
        document.fonts?.ready.then(() => {
            needsMeasure = true
        })

        // Magnetism only after the load choreography settles, so we never
        // clobber the entrance transforms on the brand / nav.
        let magnetsReady = false
        const readyTimer = window.setTimeout(() => {
            magnetsReady = true
            needsMeasure = true
        }, 1700)

        const onMove = (e: PointerEvent) => {
            target.x = e.clientX
            target.y = e.clientY
        }
        // Defer the layout reads to the next animation frame (single loop owns
        // all measurement) so rapid scroll/resize never thrashes layout.
        const onResize = () => {
            needsMeasure = true
        }
        const onScroll = () => {
            needsMeasure = true
        }

        const onOver = (e: Event) => {
            const t = e.target as HTMLElement | null
            if (t?.closest('a, button, [role="button"], [data-magnetic]')) {
                document.body.classList.add('cursor-link')
            }
        }
        const onOut = (e: Event) => {
            const t = e.target as HTMLElement | null
            if (t?.closest('a, button, [role="button"], [data-magnetic]')) {
                document.body.classList.remove('cursor-link')
            }
        }

        window.addEventListener('pointermove', onMove, { passive: true })
        window.addEventListener('resize', onResize)
        window.addEventListener('scroll', onScroll, { passive: true })
        document.addEventListener('pointerover', onOver)
        document.addEventListener('pointerout', onOut)

        let raf = 0
        const loop = () => {
            if (needsMeasure) {
                measure()
                needsMeasure = false
            }

            cursor.x += (target.x - cursor.x) * 0.18
            cursor.y += (target.y - cursor.y) * 0.18
            spot.x += (target.x - spot.x) * 0.08
            spot.y += (target.y - spot.y) * 0.08

            if (cursorRef.current) {
                cursorRef.current.style.transform =
                    `translate3d(${cursor.x}px, ${cursor.y}px, 0) translate(-50%, -50%)`
            }
            root.style.setProperty('--mx', `${spot.x}px`)
            root.style.setProperty('--my', `${spot.y}px`)

            if (magnetsReady) {
                for (const m of magnets) {
                    const dx = cursor.x - m.cx
                    const dy = cursor.y - m.cy
                    const dist = Math.hypot(dx, dy)
                    let tx = 0
                    let ty = 0
                    if (dist < MAGNET_RADIUS) {
                        const f = 1 - dist / MAGNET_RADIUS
                        tx = dx * 0.3 * f
                        ty = dy * 0.3 * f
                    }
                    m.ox += (tx - m.ox) * 0.15
                    m.oy += (ty - m.oy) * 0.15
                    m.el.style.transform = `translate3d(${m.ox.toFixed(2)}px, ${m.oy.toFixed(2)}px, 0)`
                }
            }

            for (const g of glyphs) {
                const near = Math.hypot(cursor.x - g.cx, cursor.y - g.cy) < GLYPH_RADIUS
                if (near !== g.lit) {
                    g.lit = near
                    g.el.classList.toggle('is-lit', near)
                }
            }

            raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)

        const onVisibility = () => {
            cancelAnimationFrame(raf)
            if (!document.hidden) raf = requestAnimationFrame(loop)
        }
        document.addEventListener('visibilitychange', onVisibility)

        return () => {
            cancelAnimationFrame(raf)
            window.clearTimeout(readyTimer)
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('resize', onResize)
            window.removeEventListener('scroll', onScroll)
            document.removeEventListener('pointerover', onOver)
            document.removeEventListener('pointerout', onOut)
            document.removeEventListener('visibilitychange', onVisibility)
            document.body.classList.remove('has-pointer-fx', 'cursor-link')
            magnets.forEach((m) => (m.el.style.transform = ''))
            glyphs.forEach((g) => g.el.classList.remove('is-lit'))
        }
    }, [])

    return (
        <>
            <div className="fx-aurora" aria-hidden="true" />

            <div className="fx-bloom" aria-hidden="true">
                {BLOOMS.map((o, i) => (
                    <div
                        key={i}
                        className={`fx-bloom__orb ${o.c}`}
                        style={{ '--top': o.top, '--left': o.left, '--size': o.size, '--dur': o.dur, '--delay': o.delay } as CSSProperties}
                    />
                ))}
            </div>

            <div className="fx-vignette" aria-hidden="true" />

            <div className="fx-hairline" aria-hidden="true">
                <div className="fx-hairline__grid" />
                <div className="fx-hairline__scan" />
                <div className="fx-hairline__scan--b" />
            </div>

            <PixelSquadron />

            <div className="fx-spotlight" aria-hidden="true" />
            <div className="fx-grain" aria-hidden="true" />
            <div className="cursor" ref={cursorRef} aria-hidden="true" />
        </>
    )
}

export default Background
