import { useEffect, useRef, useState } from 'react'
import { useLang } from '../../i18n/LanguageProvider'
import { bootState, shouldPlayBoot } from './bootState'

const SESSION_KEY = 'pp-booted'
const WIPE_MS = 760

function alreadyPlayed(): boolean {
    try {
        return window.sessionStorage.getItem(SESSION_KEY) === '1'
    } catch {
        return false
    }
}

function markPlayed() {
    try {
        window.sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
        /* private mode — replaying the sequence is harmless */
    }
}

function prefersReducedMotion(): boolean {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export interface BootSequenceProps {
    /** Fonts resolved and, where there is one, the world's first frame drawn. */
    ready: boolean
}

/**
 * The instrument powering on. A registration mark draws itself, a readout
 * counts against real page readiness, then the panel wipes upward and hands
 * over to the hero.
 *
 * While it runs, `html.is-booting` pauses the hero and header entrance
 * animations — otherwise they would play out behind the panel and the visitor
 * would arrive after their own introduction had finished.
 */
const BootSequence = ({ ready }: BootSequenceProps) => {
    const { t } = useLang()
    const [playing, setPlaying] = useState(false)
    const [mounted, setMounted] = useState(true)
    const [progress, setProgress] = useState(0)
    const [done, setDone] = useState(false)
    const barRef = useRef<HTMLSpanElement>(null)
    const readoutRef = useRef<HTMLSpanElement>(null)

    // Decided in an effect, not during render: sessionStorage and matchMedia
    // are browser state, and reading them while rendering would make the first
    // paint depend on it.
    useEffect(() => {
        if (!shouldPlayBoot(prefersReducedMotion(), alreadyPlayed())) {
            setMounted(false)
            return
        }
        document.documentElement.classList.add('is-booting')
        setPlaying(true)
        return () => document.documentElement.classList.remove('is-booting')
    }, [])

    useEffect(() => {
        if (!playing) return
        const start = performance.now()
        let frame: number | undefined

        const step = () => {
            const { progress: value, complete } = bootState(performance.now() - start, ready)
            // Written to refs: this ticks every frame, and re-rendering React to
            // move a bar would be the one janky thing on an otherwise smooth page.
            if (barRef.current) barRef.current.style.transform = `scaleX(${value.toFixed(4)})`
            if (readoutRef.current) {
                readoutRef.current.textContent = Math.round(value * 100).toString().padStart(3, '0')
            }
            if (complete) {
                setProgress(1)
                setDone(true)
                return
            }
            frame = window.requestAnimationFrame(step)
        }

        frame = window.requestAnimationFrame(step)
        return () => {
            if (frame !== undefined) window.cancelAnimationFrame(frame)
        }
    }, [playing, ready])

    useEffect(() => {
        if (!done) return
        markPlayed()
        document.documentElement.classList.remove('is-booting')
        const timer = window.setTimeout(() => setMounted(false), WIPE_MS)
        return () => window.clearTimeout(timer)
    }, [done])

    if (!mounted || !playing) return null

    return (
        <div className={`boot${done ? ' is-done' : ''}`} aria-hidden="true" data-progress={progress}>
            <div className="boot__mark">
                <span className="boot__mark-h" />
                <span className="boot__mark-v" />
                <span className="boot__mark-ring" />
            </div>

            <div className="boot__foot">
                <span className="boot__label">{t.boot.label}</span>
                <span className="boot__bar">
                    <span className="boot__bar-fill" ref={barRef} />
                </span>
                <span className="boot__readout" ref={readoutRef}>000</span>
            </div>
        </div>
    )
}

export default BootSequence
