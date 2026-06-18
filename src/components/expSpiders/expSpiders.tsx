import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

// ── Sprites (pixel, monochrome via currentColor) ───────────────
// Front view — used while rappelling straight down.
const SpiderFront = () => (
    <svg className="spider-svg" viewBox="0 0 20 20" shapeRendering="crispEdges" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="square">
            <path className="fleg" d="M8 7 L3 4 L1 6" />
            <path className="fleg" d="M8 9 L2 8" />
            <path className="fleg" d="M8 11 L2 12" />
            <path className="fleg" d="M8 13 L3 16 L1 17" />
            <path className="fleg fleg--r" d="M12 7 L17 4 L19 6" />
            <path className="fleg fleg--r" d="M12 9 L18 8" />
            <path className="fleg fleg--r" d="M12 11 L18 12" />
            <path className="fleg fleg--r" d="M12 13 L17 16 L19 17" />
        </g>
        <g fill="currentColor">
            <rect x="8" y="4" width="4" height="5" />
            <rect x="8" y="9" width="4" height="5" />
        </g>
    </svg>
)

// Side view — used while walking away (legs animate).
const SpiderSide = ({ left }: { left: boolean }) => (
    <svg className={`spider-svg${left ? ' is-left' : ''}`} viewBox="0 0 22 14" shapeRendering="crispEdges" aria-hidden="true">
        <g fill="currentColor">
            <rect x="6" y="3" width="7" height="5" />
            <rect x="13" y="4" width="4" height="3" />
        </g>
        <g stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="square">
            <path className="sleg sleg--1" d="M8 8 L5 13" />
            <path className="sleg sleg--2" d="M10 8 L9 13" />
            <path className="sleg sleg--3" d="M13 8 L14 13" />
            <path className="sleg sleg--4" d="M15 7 L18 12" />
        </g>
    </svg>
)

const CornerWeb = ({ className = '' }: { className?: string }) => (
    <svg className={`exp-web__net ${className}`} viewBox="0 0 120 120" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="1" fill="none">
            <path d="M2 2 L118 2 M2 2 L92 34 M2 2 L60 60 M2 2 L34 92 M2 2 L2 118" />
            <path d="M30 2 Q22 22 2 30" />
            <path d="M62 2 Q46 46 2 62" />
            <path d="M94 2 Q66 66 2 94" />
        </g>
    </svg>
)

const DROP_MS = 2200
const CRAWL_MS = 2600
let SPID = 0
const rand = (a: number, b: number) => a + Math.random() * (b - a)

interface SpiderData { id: number; x: number; drop: number; crawlDir: 1 | -1 }

const Spider = ({ data, onDone }: { data: SpiderData; onDone: (id: number) => void }) => {
    const { id, x, drop, crawlDir } = data
    const [phase, setPhase] = useState<'drop' | 'crawl'>('drop')

    useEffect(() => {
        const t1 = window.setTimeout(() => setPhase('crawl'), DROP_MS)
        const t2 = window.setTimeout(() => onDone(id), DROP_MS + CRAWL_MS)
        return () => {
            window.clearTimeout(t1)
            window.clearTimeout(t2)
        }
    }, [id, onDone])

    return (
        <div className="spider" style={{ left: `${x}%` }}>
            {phase === 'drop' ? (
                <>
                    <span className="spider__silk" style={{ ['--drop' as string]: `${drop}px` } as CSSProperties} />
                    <span className="spider__front" style={{ ['--drop' as string]: `${drop}px` } as CSSProperties}>
                        <SpiderFront />
                    </span>
                </>
            ) : (
                <span
                    className="spider__side"
                    style={{ top: `${drop}px`, ['--crawlx' as string]: `${crawlDir * 100}vw` } as CSSProperties}
                >
                    <SpiderSide left={crawlDir === -1} />
                </span>
            )}
        </div>
    )
}

const ExpSpiders = () => {
    const [spiders, setSpiders] = useState<SpiderData[]>([])
    const layerRef = useRef<HTMLDivElement>(null)
    const onDone = useCallback((id: number) => setSpiders((s) => s.filter((x) => x.id !== id)), [])

    useEffect(() => {
        const root = document.documentElement
        const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)')
        let enabled = false
        let inView = false
        let stopped = false
        const timers: number[] = []

        const isOn = () => inView && root.dataset.theme === 'dark' && root.dataset.bgfx !== 'off' && !reducedMq.matches
        const clear = () => {
            timers.forEach((t) => window.clearTimeout(t))
            timers.length = 0
        }

        const launch = () => {
            if (stopped || !enabled) return
            const data: SpiderData = {
                id: ++SPID,
                x: Math.round(rand(12, 86)),
                drop: Math.round(rand(70, 200)),
                crawlDir: Math.random() < 0.5 ? 1 : -1,
            }
            setSpiders((s) => [...s, data])
            timers.push(window.setTimeout(launch, rand(9000, 18000)))
        }

        const sync = () => {
            const on = isOn()
            if (on === enabled) return
            enabled = on
            if (on) timers.push(window.setTimeout(launch, rand(3000, 6000)))
            else {
                clear()
                setSpiders([])
            }
        }

        sync()

        let io: IntersectionObserver | null = null
        if (layerRef.current && 'IntersectionObserver' in window) {
            io = new IntersectionObserver((entries) => {
                inView = entries.some((e) => e.isIntersecting)
                sync()
            })
            io.observe(layerRef.current)
        }
        const mo = new MutationObserver(sync)
        mo.observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-bgfx'] })
        reducedMq.addEventListener?.('change', sync)

        return () => {
            stopped = true
            io?.disconnect()
            mo.disconnect()
            reducedMq.removeEventListener?.('change', sync)
            clear()
        }
    }, [])

    return (
        <div className="exp-web" ref={layerRef} aria-hidden="true">
            <CornerWeb />
            <CornerWeb className="exp-web__net--right" />
            {spiders.map((s) => (
                <Spider key={s.id} data={s} onDone={onDone} />
            ))}
        </div>
    )
}

export default ExpSpiders
