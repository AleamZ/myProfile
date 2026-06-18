 import { useEffect, useRef, useState } from 'react'
import { useLang } from '../../i18n/LanguageProvider'

// ── Redrawn pixel T-Rex (Chrome-style), facing right. Eye + mouth
//    are punched with var(--bg) so they read as holes in any theme.
const DinoBody = () => (
    <svg className="dino__body" viewBox="0 0 24 22" shapeRendering="crispEdges" aria-hidden="true">
        <g fill="currentColor">
            <rect x="0" y="8" width="3" height="3" />
            <rect x="1" y="11" width="3" height="2" />
            <rect x="5" y="4" width="7" height="2" />
            <rect x="3" y="6" width="11" height="9" />
            <rect x="12" y="5" width="3" height="4" />
            <rect x="12" y="0" width="8" height="7" />
            <rect x="20" y="2" width="4" height="4" />
            <rect x="12" y="11" width="2" height="2" />
            <rect className="dino__leg dino__leg--a" x="5" y="15" width="3" height="6" />
            <rect className="dino__leg dino__leg--b" x="9" y="15" width="3" height="6" />
        </g>
        <g fill="var(--bg)">
            <rect x="16" y="2" width="2" height="2" />
            <rect x="17" y="6" width="6" height="1" />
        </g>
    </svg>
)

const RestartIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        <path d="M21 3v6h-6" />
    </svg>
)

const CursorArrow = () => (
    <svg className="dino__cursor-arrow" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 2 L5 19 L9.5 14.7 L12.6 21.5 L15.1 20.4 L12 13.7 L18.5 13.2 Z" fill="currentColor" stroke="var(--bg)" strokeWidth="1" strokeLinejoin="round" />
    </svg>
)

// ── Tuning ─────────────────────────────────────────────────────
const DINO_X = 28
const DINO_W = 38
const GRAVITY = 2600
const JUMP_V = 760
const SPEED0 = 300
const SPEED_MAX = 560
const SPEED_RAMP = 7
const AI_TRIGGER = 132
const MISS_PROB = 0.12
const CURSOR_DUR = 1500

const pad5 = (n: number) => String(Math.max(0, Math.floor(n))).padStart(5, '0')
const randGap = () => 290 + Math.random() * 340

type Variant = { w: number; h: number; svg: string }
const CACTI: Variant[] = [
    {
        w: 14,
        h: 28,
        svg: '<svg viewBox="0 0 12 24" shape-rendering="crispEdges" width="100%" height="100%"><g fill="currentColor"><rect x="5" y="0" width="2" height="24"/><rect x="3" y="7" width="1" height="8"/><rect x="3" y="10" width="2" height="1"/><rect x="8" y="4" width="1" height="9"/><rect x="6" y="7" width="2" height="1"/></g></svg>',
    },
    {
        w: 22,
        h: 26,
        svg: '<svg viewBox="0 0 20 24" shape-rendering="crispEdges" width="100%" height="100%"><g fill="currentColor"><rect x="3" y="3" width="2" height="21"/><rect x="1" y="9" width="1" height="7"/><rect x="1" y="12" width="2" height="1"/><rect x="6" y="6" width="1" height="8"/><rect x="5" y="9" width="1" height="1"/><rect x="13" y="0" width="2" height="24"/><rect x="11" y="6" width="1" height="9"/><rect x="11" y="9" width="2" height="1"/><rect x="16" y="4" width="1" height="9"/><rect x="14" y="7" width="2" height="1"/></g></svg>',
    },
]

type Mode = 'auto' | 'play'

const DinoRunner = () => {
    const { t } = useLang()
    const [mode, setMode] = useState<Mode>('auto')
    const [dead, setDead] = useState(false)
    const [paused, setPaused] = useState(true)
    const [cursor, setCursor] = useState<'hidden' | 'approach' | 'click'>('hidden')

    const sceneRef = useRef<HTMLDivElement>(null)
    const dinoRef = useRef<HTMLDivElement>(null)
    const cactiRef = useRef<HTMLDivElement>(null)
    const scoreRef = useRef<HTMLSpanElement>(null)
    const hiRef = useRef<HTMLSpanElement>(null)

    const modeRef = useRef<Mode>('auto')
    const pendingModeRef = useRef<Mode>('auto')
    const evalRef = useRef<() => void>(() => {})

    const chooseMode = (m: Mode) => {
        setMode(m)
        pendingModeRef.current = m
        evalRef.current()
    }

    useEffect(() => {
        const scene = sceneRef.current
        const dinoEl = dinoRef.current
        const layer = cactiRef.current
        if (!scene || !dinoEl || !layer) return

        const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)')

        let raf = 0
        let last = 0
        let inView = false

        let running = true
        let dinoY = 0
        let vy = 0
        let onGround = true
        let score = 0
        let hi = Number(window.localStorage.getItem('pp-dino-hi') || 0)
        let speed = SPEED0
        let sinceSpawn = 0
        let gapTarget = randGap()
        let sceneW = scene.clientWidth || 640
        type Cactus = { el: HTMLDivElement; x: number; w: number; h: number; passed: boolean; willMiss: boolean }
        let cacti: Cactus[] = []
        const gameTimers: number[] = []

        const setScore = () => { if (scoreRef.current) scoreRef.current.textContent = pad5(score) }
        const setHiText = () => { if (hiRef.current) hiRef.current.textContent = `HI ${pad5(hi)}` }
        const clearGameTimers = () => { gameTimers.forEach((x) => window.clearTimeout(x)); gameTimers.length = 0 }
        const removeCacti = () => { cacti.forEach((c) => c.el.remove()); cacti = [] }
        setScore(); setHiText()

        const spawn = () => {
            const v = CACTI[Math.floor(Math.random() * CACTI.length)]
            const el = document.createElement('div')
            el.className = 'dino__cactus'
            el.style.width = `${v.w}px`
            el.style.height = `${v.h}px`
            el.innerHTML = v.svg
            layer.appendChild(el)
            const willMiss = modeRef.current === 'auto' && Math.random() < MISS_PROB
            const c: Cactus = { el, x: sceneW + 10, w: v.w, h: v.h, passed: false, willMiss }
            el.style.transform = `translateX(${c.x}px)`
            cacti.push(c)
        }

        const jump = () => {
            if (onGround) {
                vy = JUMP_V
                onGround = false
            }
        }

        const restart = () => {
            clearGameTimers()
            removeCacti()
            dinoY = 0; vy = 0; onGround = true
            score = 0; setScore()
            speed = SPEED0; sinceSpawn = 0; gapTarget = randGap()
            running = true
            dinoEl.style.transform = 'translateY(0)'
            setDead(false)
            setCursor('hidden')
        }

        const die = () => {
            running = false
            if (score > hi) {
                hi = score
                try { window.localStorage.setItem('pp-dino-hi', String(hi)) } catch { /* ignore */ }
                setHiText()
            }
            setDead(true)
            if (modeRef.current === 'auto') {
                gameTimers.push(window.setTimeout(() => setCursor('approach'), 900))
                gameTimers.push(window.setTimeout(() => setCursor('click'), 900 + CURSOR_DUR))
                gameTimers.push(window.setTimeout(restart, 900 + CURSOR_DUR + 380))
            }
        }

        const nearestAhead = (): Cactus | null => {
            let best: Cactus | null = null
            for (const c of cacti) {
                if (c.x + c.w > DINO_X && (!best || c.x < best.x)) best = c
            }
            return best
        }

        const frame = (ts: number) => {
            raf = requestAnimationFrame(frame)
            if (!last) last = ts
            let dt = (ts - last) / 1000
            last = ts
            if (dt > 0.05) dt = 0.05

            if (pendingModeRef.current !== modeRef.current) {
                modeRef.current = pendingModeRef.current
                restart()
            }
            if (!running) return

            speed = Math.min(SPEED_MAX, SPEED0 + score * SPEED_RAMP)

            if (!onGround) {
                vy -= GRAVITY * dt
                dinoY += vy * dt
                if (dinoY <= 0) { dinoY = 0; vy = 0; onGround = true }
            }

            for (const c of cacti) {
                c.x -= speed * dt
                c.el.style.transform = `translateX(${c.x}px)`
            }

            if (modeRef.current === 'auto' && onGround) {
                const c = nearestAhead()
                if (c && !c.willMiss && c.x - DINO_X < AI_TRIGGER && c.x + c.w > DINO_X) jump()
            }

            for (const c of cacti) {
                if (!c.passed && c.x + c.w < DINO_X) { c.passed = true; score += 1; setScore() }
                if (c.x < DINO_X + DINO_W - 6 && c.x + c.w > DINO_X + 6 && dinoY < c.h - 6) { die(); break }
            }

            sinceSpawn += speed * dt
            if (sinceSpawn > gapTarget) { sinceSpawn = 0; gapTarget = randGap(); spawn() }

            cacti = cacti.filter((c) => {
                if (c.x < -50) { c.el.remove(); return false }
                return true
            })

            dinoEl.style.transform = `translateY(${-dinoY}px)`
        }

        const evaluate = () => {
            const should =
                inView &&
                !reducedMq.matches &&
                document.documentElement.dataset.theme === 'dark' &&
                (pendingModeRef.current === 'play' || document.documentElement.dataset.bgfx !== 'off')
            setPaused(!should)
            if (should && !raf) { last = 0; raf = requestAnimationFrame(frame) }
            if (!should && raf) { cancelAnimationFrame(raf); raf = 0 }
        }
        evalRef.current = evaluate

        const onKey = (e: KeyboardEvent) => {
            if (e.code !== 'Space' && e.key !== ' ') return
            if (modeRef.current !== 'play' || !inView) return
            e.preventDefault()
            if (!running) restart()
            else jump()
        }
        const onTap = () => {
            if (modeRef.current !== 'play') return
            if (!running) restart()
            else jump()
        }
        const onResize = () => { sceneW = scene.clientWidth || sceneW }

        window.addEventListener('keydown', onKey)
        scene.addEventListener('pointerdown', onTap)
        window.addEventListener('resize', onResize)

        const io = new IntersectionObserver(
            (entries) => { inView = entries.some((e) => e.isIntersecting); evaluate() },
            { threshold: 0.25 },
        )
        io.observe(scene)
        const mo = new MutationObserver(evaluate)
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-bgfx'] })
        reducedMq.addEventListener?.('change', evaluate)

        evaluate()

        return () => {
            if (raf) cancelAnimationFrame(raf)
            window.removeEventListener('keydown', onKey)
            scene.removeEventListener('pointerdown', onTap)
            window.removeEventListener('resize', onResize)
            io.disconnect()
            mo.disconnect()
            reducedMq.removeEventListener?.('change', evaluate)
            clearGameTimers()
            removeCacti()
        }
    }, [])

    return (
        <div className="dino">
            <div
                className={`dino__scene${paused ? ' is-paused' : ''}${dead ? ' is-dead' : ''}${mode === 'play' ? ' is-play' : ''}`}
                ref={sceneRef}
                aria-hidden="true"
            >
                <div className="dino__ground" />
                <div className="dino__cacti" ref={cactiRef} />
                <div className="dino__char" ref={dinoRef}><DinoBody /></div>

                {mode === 'play' && !dead && <span className="dino__hint">{t.dino.hint}</span>}

                {dead && (
                    <div className="dino__over">
                        <span className="dino__over-text">{t.dino.gameOver}</span>
                        <span className="dino__restart"><RestartIcon /></span>
                    </div>
                )}

                {cursor !== 'hidden' && (
                    <div className={`dino__cursor is-${cursor}`}>
                        <CursorArrow />
                    </div>
                )}
            </div>

            <div className="dino__hud dino__hud--left" aria-hidden="true">
                <span className="dino__hi" ref={hiRef}>HI 00000</span>
                <span className="dino__score" ref={scoreRef}>00000</span>
            </div>

            <div className="dino__hud dino__hud--right">
                <div className="dino__switch" role="group" aria-label="Dino mode">
                    <button
                        type="button"
                        className={`dino__switch-btn${mode === 'auto' ? ' is-active' : ''}`}
                        aria-pressed={mode === 'auto'}
                        onClick={() => chooseMode('auto')}
                    >
                        {t.dino.auto}
                    </button>
                    <button
                        type="button"
                        className={`dino__switch-btn${mode === 'play' ? ' is-active' : ''}`}
                        aria-pressed={mode === 'play'}
                        onClick={() => chooseMode('play')}
                    >
                        {t.dino.play}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default DinoRunner
