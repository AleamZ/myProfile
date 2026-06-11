import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

// ── Sprites (pixel, monochrome via currentColor) ───────────────
const ShipSprite = () => (
    <svg className="ship" viewBox="0 0 16 10" shapeRendering="crispEdges" aria-hidden="true">
        <g fill="currentColor">
            <rect x="2" y="2" width="2" height="2" />
            <rect x="2" y="4" width="12" height="2" />
            <rect x="14" y="4" width="2" height="2" />
            <rect x="9" y="3" width="3" height="1" />
            <rect x="4" y="6" width="6" height="2" />
            <rect x="2" y="6" width="2" height="1" />
        </g>
    </svg>
)

const Heart = ({ filled }: { filled: boolean }) => (
    <svg className={`heart${filled ? '' : ' is-empty'}`} viewBox="0 0 7 6" shapeRendering="crispEdges" aria-hidden="true">
        <g fill="currentColor">
            <rect x="0" y="1" width="2" height="1" />
            <rect x="5" y="1" width="2" height="1" />
            <rect x="0" y="2" width="7" height="1" />
            <rect x="1" y="3" width="5" height="1" />
            <rect x="2" y="4" width="3" height="1" />
            <rect x="3" y="5" width="1" height="1" />
        </g>
    </svg>
)

const Chute = () => (
    <svg viewBox="0 0 24 16" aria-hidden="true">
        <path d="M2 11 A10 9 0 0 1 22 11" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M2 11 L9 16 M12 11 L12 16 M22 11 L15 16" stroke="currentColor" strokeWidth="1" />
    </svg>
)

const Guy = () => (
    <svg viewBox="0 0 8 12" shapeRendering="crispEdges" aria-hidden="true">
        <g fill="currentColor">
            <rect x="3" y="0" width="2" height="2" />
            <rect x="2" y="2" width="4" height="5" />
            <rect className="pleg pleg--a" x="2" y="7" width="2" height="4" />
            <rect className="pleg pleg--b" x="4" y="7" width="2" height="4" />
        </g>
    </svg>
)

const LASER_DELAYS = [1500, 3000, 4500, 6000, 7500]
const HP_MAX = 3
const FALL_MS = 950
const BOOM_MS = 420
const DESCENT_MS = 1900
const RUN_MS = 1300

let PID = 0
let PLID = 0
const rand = (a: number, b: number) => a + Math.random() * (b - a)

interface PlaneData { id: number; dir: 1 | -1; top: number; dur: number; fires: boolean }
interface PilotData { id: number; x: number; y: number; descent: number; runX: number; runDir: 1 | -1 }

// ── Plane (clickable, 3 HP) ────────────────────────────────────
interface PlaneProps {
    data: PlaneData
    layerRef: React.RefObject<HTMLDivElement | null>
    onDone: (id: number) => void
    onEject: (x: number, y: number, dir: 1 | -1) => void
}

const Plane = ({ data, layerRef, onDone, onEject }: PlaneProps) => {
    const { id, dir, top, dur, fires } = data
    const [hp, setHp] = useState(HP_MAX)
    const [status, setStatus] = useState<'fly' | 'falling' | 'boom'>('fly')
    const hpRef = useRef(HP_MAX)
    const craftRef = useRef<HTMLDivElement>(null)
    const timers = useRef<number[]>([])

    useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

    const hit = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (status !== 'fly') return
        hpRef.current -= 1
        setHp(Math.max(0, hpRef.current))
        if (hpRef.current <= 0) {
            const cr = craftRef.current?.getBoundingClientRect()
            const lr = layerRef.current?.getBoundingClientRect()
            if (cr && lr) onEject(cr.left - lr.left + 20, cr.top - lr.top, dir)
            setStatus('falling')
            timers.current.push(window.setTimeout(() => setStatus('boom'), FALL_MS))
            timers.current.push(window.setTimeout(() => onDone(id), FALL_MS + BOOM_MS))
        }
    }

    const onCrossEnd = (e: React.AnimationEvent) => {
        if (e.animationName === 'squad-cross' && status === 'fly') onDone(id)
    }

    const style: CSSProperties = {
        top: `${top}%`,
        animationDuration: `${dur}ms`,
        animationDirection: dir === 1 ? 'normal' : 'reverse',
    }

    return (
        <div className="craft" ref={craftRef} style={style} onAnimationEnd={onCrossEnd}>
            <div className={`craft__fall${status !== 'fly' ? ' is-falling' : ''}`}>
                <div
                    className={`craft__facing${dir === -1 ? ' is-left' : ''}`}
                    onClick={hit}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <ShipSprite />
                    {fires && status === 'fly' &&
                        LASER_DELAYS.map((d, i) => (
                            <span key={i} className="laser" style={{ animationDelay: `${d}ms` } as CSSProperties} />
                        ))}
                </div>

                {status === 'fly' && hp < HP_MAX && (
                    <div className="craft__hearts">
                        {[0, 1, 2].map((i) => (
                            <Heart key={i} filled={i < hp} />
                        ))}
                    </div>
                )}

                {status === 'boom' && <span className="craft__boom" />}
            </div>
        </div>
    )
}

// ── Pilot (parachute → land → run off) ─────────────────────────
const Pilot = ({ data, onDone }: { data: PilotData; onDone: (id: number) => void }) => {
    const [phase, setPhase] = useState<'chute' | 'run'>('chute')

    useEffect(() => {
        const t1 = window.setTimeout(() => setPhase('run'), DESCENT_MS)
        const t2 = window.setTimeout(() => onDone(data.id), DESCENT_MS + RUN_MS)
        return () => {
            window.clearTimeout(t1)
            window.clearTimeout(t2)
        }
    }, [data.id, onDone])

    const style: CSSProperties = {
        left: `${data.x}px`,
        top: `${data.y}px`,
        ['--descent' as string]: `${data.descent}px`,
        ['--runx' as string]: `${data.runX}px`,
    }

    return (
        <div className={`pilot is-${phase}${data.runDir === -1 ? ' is-left' : ''}`} style={style} aria-hidden="true">
            <div className="pilot__chute"><Chute /></div>
            <div className="pilot__guy"><Guy /></div>
        </div>
    )
}

// ── Squadron ───────────────────────────────────────────────────
const PixelSquadron = () => {
    const [planes, setPlanes] = useState<PlaneData[]>([])
    const [pilots, setPilots] = useState<PilotData[]>([])
    const layerRef = useRef<HTMLDivElement>(null)

    const onDone = useCallback((id: number) => setPlanes((p) => p.filter((x) => x.id !== id)), [])
    const onPilotDone = useCallback((id: number) => setPilots((p) => p.filter((x) => x.id !== id)), [])

    const onEject = useCallback((x: number, y: number, dir: 1 | -1) => {
        void dir
        const lr = layerRef.current?.getBoundingClientRect()
        if (!lr) return
        const groundY = lr.height - 46
        const descent = Math.max(24, groundY - y)
        const runDir: 1 | -1 = Math.random() < 0.5 ? 1 : -1
        const runX = runDir > 0 ? lr.width - x + 70 : -(x + 70)
        setPilots((p) => [...p, { id: ++PLID, x, y, descent, runX, runDir }])
    }, [])

    useEffect(() => {
        const root = document.documentElement
        const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)')
        let enabled = false
        let inView = false
        let stopped = false
        const timers: number[] = []

        const isOn = () => inView && root.dataset.bgfx !== 'off' && !reducedMq.matches
        const clear = () => {
            timers.forEach((t) => window.clearTimeout(t))
            timers.length = 0
        }

        const launch = () => {
            if (stopped || !enabled) return
            const wave = Math.random() < 0.45 ? 2 : 1
            const top = Math.round(rand(14, 62))
            const baseDir: 1 | -1 = Math.random() < 0.5 ? 1 : -1
            const dur = Math.round(rand(9000, 13000))
            const fresh: PlaneData[] = []
            for (let i = 0; i < wave; i++) {
                const dir: 1 | -1 = wave === 2 ? (i === 0 ? baseDir : ((-baseDir) as 1 | -1)) : baseDir
                fresh.push({ id: ++PID, dir, top: top + i * 6, dur, fires: Math.random() < 0.7 })
            }
            setPlanes((p) => [...p, ...fresh])
            timers.push(window.setTimeout(launch, rand(14000, 26000)))
        }

        const sync = () => {
            const on = isOn()
            if (on === enabled) return
            enabled = on
            if (on) {
                timers.push(window.setTimeout(launch, rand(4000, 8000)))
            } else {
                clear()
                setPlanes([])
                setPilots([])
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
        mo.observe(root, { attributes: true, attributeFilter: ['data-bgfx'] })
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
        <div className="fx-squadron" ref={layerRef} aria-hidden="true">
            {planes.map((p) => (
                <Plane key={p.id} data={p} layerRef={layerRef} onDone={onDone} onEject={onEject} />
            ))}
            {pilots.map((p) => (
                <Pilot key={p.id} data={p} onDone={onPilotDone} />
            ))}
        </div>
    )
}

export default PixelSquadron
