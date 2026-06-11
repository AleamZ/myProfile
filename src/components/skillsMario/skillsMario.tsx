import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useLang } from '../../i18n/LanguageProvider'

// ── Pixel sprites (monochrome via currentColor; eyes/spots = var(--bg)) ──
const MarioSprite = () => (
    <svg className="mario-svg" viewBox="0 0 14 18" shapeRendering="crispEdges" aria-hidden="true">
        <g fill="currentColor">
            <rect x="2" y="0" width="9" height="3" />
            <rect x="9" y="2" width="4" height="1" />
            <rect x="3" y="3" width="6" height="3" />
            <rect x="2" y="6" width="8" height="6" />
            <rect x="9" y="6" width="2" height="3" />
            <rect className="mleg mleg--a" x="2" y="12" width="3" height="6" />
            <rect className="mleg mleg--b" x="6" y="12" width="3" height="6" />
        </g>
        <g fill="var(--bg)">
            <rect x="6" y="4" width="1" height="1" />
        </g>
    </svg>
)

const Mushroom = () => (
    <svg className="mush-svg" viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true">
        <g fill="currentColor">
            <rect x="2" y="1" width="8" height="1" />
            <rect x="1" y="2" width="10" height="2" />
            <rect x="1" y="4" width="10" height="2" />
            <rect x="4" y="6" width="4" height="5" />
        </g>
        <g fill="var(--bg)">
            <rect x="3" y="3" width="2" height="2" />
            <rect x="7" y="3" width="2" height="2" />
            <rect x="4" y="8" width="1" height="2" />
            <rect x="7" y="8" width="1" height="2" />
        </g>
    </svg>
)

const Pipe = () => (
    <svg className="pipe-svg" viewBox="0 0 28 46" shapeRendering="crispEdges" aria-hidden="true">
        <g fill="currentColor">
            <rect x="0" y="0" width="28" height="6" />
            <rect x="3" y="6" width="22" height="40" />
        </g>
        <g fill="var(--bg)">
            <rect x="4" y="0" width="20" height="3" />
        </g>
    </svg>
)

const FlagPole = () => (
    <svg className="flagpole-svg" viewBox="0 0 6 44" shapeRendering="crispEdges" aria-hidden="true">
        <g fill="currentColor">
            <rect x="2" y="2" width="1" height="42" />
            <rect x="1" y="0" width="3" height="2" />
        </g>
    </svg>
)

const FlagBanner = () => (
    <svg className="banner-svg" viewBox="0 0 14 10" shapeRendering="crispEdges" aria-hidden="true">
        <path d="M0 0 L13 5 L0 10 Z" fill="currentColor" />
    </svg>
)

const Gun = () => (
    <svg className="gun-svg" viewBox="0 0 8 5" shapeRendering="crispEdges" aria-hidden="true">
        <g fill="currentColor">
            <rect x="0" y="1" width="6" height="2" />
            <rect x="6" y="1" width="1" height="1" />
            <rect x="1" y="3" width="2" height="2" />
        </g>
    </svg>
)

const Car = () => (
    <svg className="car-svg" viewBox="0 0 24 14" shapeRendering="crispEdges" aria-hidden="true">
        <g fill="currentColor">
            <rect x="2" y="6" width="20" height="4" />
            <rect x="6" y="3" width="9" height="3" />
            <rect x="8" y="1" width="4" height="2" />
            <rect x="3" y="9" width="3" height="3" />
            <rect x="17" y="9" width="3" height="3" />
        </g>
    </svg>
)

// Katana — trails behind for the ninja run, held in hand.
const Katana = () => (
    <svg className="katana-svg" viewBox="0 0 18 5" shapeRendering="crispEdges" aria-hidden="true">
        <g fill="currentColor">
            <rect x="4" y="2" width="13" height="1" />
            <rect x="17" y="1" width="1" height="1" />
            <rect x="3" y="1" width="1" height="3" />
            <rect x="0" y="2" width="3" height="1" />
        </g>
    </svg>
)

// ── Timing + geometry (cqw = % of the stage width) ─────────────
const START = -14
const MUSH = 44
const END = 82
const RUN1 = 2600
const EAT = 900
const RUN2 = 2200
const SINK_PIPE = 1300
const SINK_FLAG = 1200
const KICK = 80
const DASH_MS = 280

type Phase = 'idle' | 'run1' | 'eat' | 'run2' | 'sink'
type Kill = 'stomp' | 'gun' | 'ninja' | 'car'
const KILLS: Kill[] = ['stomp', 'gun', 'ninja', 'car']
type PickKill = 'auto' | Kill
type PickEnd = 'auto' | 'pipe' | 'flag'
const KILL_OPTS: PickKill[] = ['auto', 'stomp', 'gun', 'ninja', 'car']
const END_OPTS: PickEnd[] = ['auto', 'pipe', 'flag']

const SkillsMario = () => {
    const { t } = useLang()
    const [phase, setPhase] = useState<Phase>('idle')
    const [mx, setMx] = useState(START)
    const [mdur, setMdur] = useState(0)
    const [eaten, setEaten] = useState(false)
    const [ending, setEnding] = useState<'pipe' | 'flag'>('pipe')
    const [kill, setKill] = useState<Kill>('stomp')
    const [pickKill, setPickKill] = useState<PickKill>('auto')
    const [pickEnd, setPickEnd] = useState<PickEnd>('auto')

    const stageRef = useRef<HTMLDivElement>(null)
    const genRef = useRef(0)
    const pickKillRef = useRef<PickKill>('auto')
    const pickEndRef = useRef<PickEnd>('auto')
    const restartRef = useRef<() => void>(() => {})

    const chooseKill = (k: PickKill) => { setPickKill(k); pickKillRef.current = k; restartRef.current() }
    const chooseEnd = (e: PickEnd) => { setPickEnd(e); pickEndRef.current = e; restartRef.current() }

    useEffect(() => {
        const root = document.documentElement
        const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)')
        let enabled = false
        let inView = false
        const timers: number[] = []

        const isOn = () => inView && root.dataset.bgfx !== 'off' && !reducedMq.matches
        const clear = () => {
            timers.forEach((t) => window.clearTimeout(t))
            timers.length = 0
        }
        const push = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms))

        const loop = (gen: number) => {
            if (gen !== genRef.current || !enabled) return
            setEaten(false)
            setPhase('idle')
            setMx(START)
            setMdur(0)
            const pe = pickEndRef.current
            const end: 'pipe' | 'flag' = pe === 'auto' ? (Math.random() < 0.5 ? 'pipe' : 'flag') : pe
            setEnding(end)
            const pk = pickKillRef.current
            const k: Kill = pk === 'auto' ? KILLS[Math.floor(Math.random() * KILLS.length)] : pk
            setKill(k)

            const endX = end === 'pipe' ? END : END - 8
            const run1X = k === 'stomp' ? MUSH : k === 'gun' ? MUSH - 18 : k === 'ninja' ? MUSH - 14 : MUSH - 18
            const eatDur = k === 'car' ? 1300 : EAT
            const hit = k === 'stomp' ? 440 : k === 'gun' ? 560 : k === 'ninja' ? 320 : 630

            push(() => { setPhase('run1'); setMdur(RUN1); setMx(run1X) }, KICK)
            push(() => setPhase('eat'), KICK + RUN1)
            if (k === 'ninja') push(() => { setMdur(DASH_MS); setMx(MUSH + 14) }, KICK + RUN1 + 40)
            push(() => setEaten(true), KICK + RUN1 + hit)
            // car: Mario boards (hidden), rides to MUSH+14, then dismounts there before running on
            if (k === 'car') push(() => { setMdur(0); setMx(MUSH + 14) }, KICK + RUN1 + eatDur - 30)
            push(() => { setPhase('run2'); setMdur(RUN2); setMx(endX) }, KICK + RUN1 + eatDur)
            push(() => setPhase('sink'), KICK + RUN1 + eatDur + RUN2)
            const sink = end === 'pipe' ? SINK_PIPE : SINK_FLAG
            push(() => { genRef.current += 1; loop(genRef.current) }, KICK + RUN1 + eatDur + RUN2 + sink + 500)
        }

        const sync = () => {
            const on = isOn()
            if (on === enabled) return
            enabled = on
            if (on) {
                genRef.current += 1
                loop(genRef.current)
            } else {
                clear()
                setPhase('idle')
                setMx(START)
                setMdur(0)
                setEaten(false)
            }
        }

        // Picking a scenario restarts the loop immediately so it plays right away
        restartRef.current = () => {
            if (!enabled) return
            clear()
            genRef.current += 1
            loop(genRef.current)
        }

        sync()

        let io: IntersectionObserver | null = null
        if (stageRef.current && 'IntersectionObserver' in window) {
            io = new IntersectionObserver((entries) => { inView = entries.some((e) => e.isIntersecting); sync() }, { threshold: 0.3 })
            io.observe(stageRef.current)
        }
        const mo = new MutationObserver(sync)
        mo.observe(root, { attributes: true, attributeFilter: ['data-bgfx'] })
        reducedMq.addEventListener?.('change', sync)

        return () => {
            io?.disconnect()
            mo.disconnect()
            reducedMq.removeEventListener?.('change', sync)
            clear()
        }
    }, [])

    const hopClass =
        phase === 'eat' && kill === 'stomp'
            ? ' is-hop'
            : phase === 'sink'
              ? (ending === 'pipe' ? ' is-sink-pipe' : ' is-sink-flag')
              : ''
    const eating = phase === 'eat'
    const ninjaGear = kill === 'ninja' && (phase === 'run1' || phase === 'eat' || phase === 'run2')
    const riding = phase === 'eat' && kill === 'car'

    return (
        <div className="mario-deck">
            <div className="mario-pick">
                <div className="mario-pick__group" role="group" aria-label={t.mario.method}>
                    {KILL_OPTS.map((k) => (
                        <button
                            key={k}
                            type="button"
                            className={`mario-pick__chip${pickKill === k ? ' is-active' : ''}`}
                            aria-pressed={pickKill === k}
                            onClick={() => chooseKill(k)}
                        >
                            {t.mario[k]}
                        </button>
                    ))}
                </div>
                <div className="mario-pick__group" role="group" aria-label={t.mario.ending}>
                    {END_OPTS.map((e) => (
                        <button
                            key={e}
                            type="button"
                            className={`mario-pick__chip${pickEnd === e ? ' is-active' : ''}`}
                            aria-pressed={pickEnd === e}
                            onClick={() => chooseEnd(e)}
                        >
                            {t.mario[e]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="skills-mario" ref={stageRef} aria-hidden="true">
                <div className="skills-mario__ground" />

            <div className={`mush${eaten ? ` is-eaten kill-${kill}` : ''}`}><Mushroom /></div>

            {ending === 'pipe' ? (
                <div className="pipe"><Pipe /></div>
            ) : (
                <div className="flag">
                    <FlagPole />
                    <span className={`flag__banner${phase === 'sink' ? ' is-down' : ''}`}><FlagBanner /></span>
                </div>
            )}

            {/* Kill effects */}
            {eating && kill === 'ninja' && <span className="slash" style={{ left: `${MUSH}cqw` } as CSSProperties} />}
            {eating && kill === 'car' && (
                <span className="car" style={{ left: `${MUSH - 18}cqw`, ['--lunge' as string]: '32cqw' } as CSSProperties}>
                    <Car />
                </span>
            )}

            <div
                className={`mario phase-${phase} kill-${kill}${kill === 'ninja' ? ' is-ninja' : ''}${riding ? ' is-riding' : ''}`}
                style={{ ['--mx' as string]: `${mx}cqw`, ['--mdur' as string]: `${mdur}ms` } as CSSProperties}
            >
                <div className={`mario__hop${hopClass}`}>
                    <MarioSprite />
                    {eating && kill === 'gun' && <span className="mario__gun"><Gun /></span>}
                    {ninjaGear && <span className="mario__band" />}
                    {ninjaGear && <span className="mario__katana"><Katana /></span>}
                </div>
                {eating && kill === 'gun' && <span className="bullet" style={{ ['--fly' as string]: '18cqw' } as CSSProperties} />}
                </div>
            </div>
        </div>
    )
}

export default SkillsMario
