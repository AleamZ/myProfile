import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { PROJECTS, type Project } from '../../data/projects'
import ProjectModal from './projectModal'
import LogoMark from '../logo/logoMark'
import DinoRunner from '../dinoRunner/dinoRunner'
import { useLang } from '../../i18n/LanguageProvider'

const pad = (n: number) => String(n + 1).padStart(2, '0')
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

// A live website preview for the card. Prefer a real screenshot in /public
// (project.image); otherwise auto-capture the live URL via a screenshot service
// — this renders reliably inside the 3D coverflow and works even for sites that
// block iframe embedding (the shot is taken server-side).
const screenshotUrl = (p: Project): string | null => {
    if (p.image) return p.image
    if (!p.demoUrl) return null
    return `https://image.thum.io/get/width/1200/crop/900/noanimate/${p.demoUrl}`
}

const Projects = () => {
    const { t, lang } = useLang()
    const count = PROJECTS.length
    const [active, setActive] = useState(0)
    const [openId, setOpenId] = useState<string | null>(null)
    const [previewReady, setPreviewReady] = useState(false)
    const [failed, setFailed] = useState<Set<string>>(new Set())
    const [settled, setSettled] = useState(0)
    const [forceReady, setForceReady] = useState(false)
    const openProject = PROJECTS.find((p) => p.id === openId) ?? null

    const totalShots = useMemo(() => PROJECTS.reduce((n, p) => n + (screenshotUrl(p) ? 1 : 0), 0), [])
    // Work section is "ready" once every preview has settled (loaded or errored),
    // with a hard timeout so a slow screenshot never blocks the reveal.
    const ready = forceReady || (previewReady && settled >= totalShots)

    const sectionRef = useRef<HTMLElement>(null)
    const pressed = useRef(false)
    const startX = useRef(0)
    const dragged = useRef(false)

    // Only load previews once the Work section is near view.
    useEffect(() => {
        const el = sectionRef.current
        if (!el) return
        if (!('IntersectionObserver' in window)) {
            setPreviewReady(true)
            return
        }
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setPreviewReady(true)
                    io.disconnect()
                }
            },
            { rootMargin: '300px' },
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])

    // Hard fallback so the loader always clears even if a shot never settles.
    useEffect(() => {
        if (!previewReady) return
        const t = window.setTimeout(() => setForceReady(true), 4500)
        return () => window.clearTimeout(t)
    }, [previewReady])

    const markFailed = (id: string) =>
        setFailed((prev) => {
            const next = new Set(prev)
            next.add(id)
            return next
        })

    const go = (dir: number) => setActive((a) => clamp(a + dir, 0, count - 1))

    const onCardClick = (i: number) => {
        if (dragged.current) return
        if (i === active) setOpenId(PROJECTS[i].id)
        else setActive(i)
    }

    const onPointerDown = (e: ReactPointerEvent) => {
        pressed.current = true
        startX.current = e.clientX
        dragged.current = false
    }
    const onPointerMove = (e: ReactPointerEvent) => {
        if (!pressed.current) return
        if (Math.abs(e.clientX - startX.current) > 10) dragged.current = true
    }
    const onPointerUp = (e: ReactPointerEvent) => {
        if (!pressed.current) return
        pressed.current = false
        const dx = e.clientX - startX.current
        if (dx < -40) go(1)
        else if (dx > 40) go(-1)
    }

    const onKeyDown = (e: ReactKeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
            e.preventDefault()
            go(-1)
        } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            go(1)
        } else if (e.key === 'Home') {
            e.preventDefault()
            setActive(0)
        } else if (e.key === 'End') {
            e.preventDefault()
            setActive(count - 1)
        }
    }

    const cardStyle = (i: number): CSSProperties => {
        const offset = i - active
        const abs = Math.abs(offset)
        return {
            transform: `translateX(calc(${offset} * var(--cf-step))) translateZ(calc(${-abs} * 9rem)) rotateY(${
                offset * -26
            }deg) scale(${Math.max(0, 1 - abs * 0.12)})`,
            opacity: abs > 2 ? 0 : 1 - abs * 0.24,
            zIndex: 50 - abs,
            pointerEvents: abs > 2 ? 'none' : 'auto',
        }
    }

    return (
        <section className="projects" id="work" aria-labelledby="work-heading" ref={sectionRef}>
            <div className="projects__head reveal">
                <h2 id="work-heading" className="sr-only">Work</h2>
                <span className="index">02&nbsp;/&nbsp;{t.sections.work}</span>
                <span className="projects__count" aria-hidden="true">
                    {pad(active)}&nbsp;—&nbsp;{pad(count - 1)}
                </span>
            </div>

            <div className="cf">
                {previewReady && (
                    <div className={`cf__loader${ready ? ' is-done' : ''}`} aria-hidden="true">
                        <LogoMark className="logo logo--loader" decorative />
                        <span className="cf__loader-text">{t.work.loading}</span>
                    </div>
                )}

                <button
                    type="button"
                    className="cf__nav cf__nav--prev"
                    onClick={() => go(-1)}
                    aria-label="Previous project"
                    disabled={active === 0}
                >
                    <span aria-hidden="true">‹</span>
                </button>

                <div
                    className="cf__stage"
                    role="group"
                    aria-roledescription="carousel"
                    aria-label="Projects coverflow"
                    tabIndex={0}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={() => (pressed.current = false)}
                    onKeyDown={onKeyDown}
                >
                    {PROJECTS.map((p, i) => {
                        const distance = Math.abs(i - active)
                        const shot = screenshotUrl(p)
                        return (
                            <div key={p.id} className={`cf__card${i === active ? ' is-active' : ''}`} style={cardStyle(i)}>
                                <span className="cf__thumb">
                                    <span className="cf__thumb-ph" aria-hidden="true">{pad(i)}</span>
                                    {previewReady && shot && !failed.has(p.id) && (
                                        <img
                                            className="cf__shot"
                                            src={shot}
                                            alt=""
                                            loading="lazy"
                                            referrerPolicy="no-referrer"
                                            onLoad={() => setSettled((c) => c + 1)}
                                            onError={() => {
                                                markFailed(p.id)
                                                setSettled((c) => c + 1)
                                            }}
                                        />
                                    )}
                                </span>

                                <span className="cf__meta">
                                    <span className="cf__row">
                                        <span className="cf__name">{p.name}</span>
                                        {p.year && <span className="cf__year">{p.year}</span>}
                                    </span>
                                    <span className="cf__blurb">{p.blurb[lang]}</span>
                                    <span className="cf__tech">
                                        {p.tech.slice(0, 4).map((tag) => (
                                            <span className="cf__tag" key={tag}>{tag}</span>
                                        ))}
                                    </span>
                                </span>

                                {i === active && <span className="cf__open" aria-hidden="true">{t.work.view}&nbsp;↗</span>}

                                <button
                                    type="button"
                                    className="cf__hit"
                                    aria-label={`${p.name}${i === active ? ' — open details' : ''}`}
                                    aria-current={i === active}
                                    tabIndex={distance > 2 ? -1 : 0}
                                    onClick={() => onCardClick(i)}
                                />
                            </div>
                        )
                    })}
                </div>

                <button
                    type="button"
                    className="cf__nav cf__nav--next"
                    onClick={() => go(1)}
                    aria-label="Next project"
                    disabled={active === count - 1}
                >
                    <span aria-hidden="true">›</span>
                </button>
            </div>

            <div className="cf__dots" role="tablist" aria-label="Select project">
                {PROJECTS.map((p, i) => (
                    <button
                        type="button"
                        key={p.id}
                        role="tab"
                        className={`cf__dot${i === active ? ' is-active' : ''}`}
                        aria-selected={i === active}
                        aria-label={p.name}
                        onClick={() => setActive(i)}
                    />
                ))}
            </div>

            <DinoRunner />

            {openProject && <ProjectModal project={openProject} onClose={() => setOpenId(null)} />}
        </section>
    )
}

export default Projects
