import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import Chapter from '../Chapter'
import { useLang } from '../../i18n/LanguageProvider'
import { PLACES, PLACE_ROLE_LABEL } from '../../data/places'
import { stage } from '../../system/stage'

const Globe = lazy(() => import('../Globe/Globe'))

const EMAIL = 'datnguyentien.work@gmail.com'
const SOCIALS = [
    { label: 'Email', href: `mailto:${EMAIL}` },
    { label: 'Facebook', href: 'https://www.facebook.com/Aleam007/', external: true },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/aleamz/', external: true },
]

const pad = (n: number) => n.toString().padStart(2, '0')

/**
 * 05 — Contact. Where I am from, then how to reach me.
 *
 * The place list is the same index shape as every other chapter; the globe is
 * its readout. Selecting a place turns the planet to face it and lifts a card
 * out of the marker.
 */
const Contact = () => {
    const { t, lang } = useLang()
    const [activeId, setActiveId] = useState<string | null>(null)
    const [near, setNear] = useState(false)
    const sectionRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)

    const active = PLACES.find((place) => place.id === activeId) ?? null

    useEffect(() => {
        if (!active) {
            stage.setFocus(null)
            return
        }
        const index = PLACES.findIndex((place) => place.id === active.id)
        stage.setFocus({ chapter: 'contact', label: active.name, index: index + 1, total: PLACES.length })
    }, [active])

    useEffect(() => () => stage.setFocus(null), [])

    // The globe carries a world topology and a WebGL context. Neither is worth
    // paying for until the closing chapter is nearly on screen.
    useEffect(() => {
        const node = sectionRef.current
        if (!node || typeof IntersectionObserver === 'undefined') {
            setNear(true)
            return
        }
        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                setNear(true)
                observer.disconnect()
            }
        }, { rootMargin: '500px 0px' })
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    // Written to style rather than state: the marker moves every frame while
    // the globe turns.
    const onMarkerPosition = useCallback((position: { x: number; y: number } | null) => {
        const node = stageRef.current
        if (!node) return
        if (!position) {
            node.style.setProperty('--marker-on', '0')
            return
        }
        const flip = position.x > node.clientWidth * 0.56
        node.style.setProperty('--marker-on', '1')
        node.style.setProperty('--marker-x', `${position.x}px`)
        node.style.setProperty('--marker-y', `${position.y}px`)
        node.style.setProperty('--card-shift', flip ? 'calc(-100% - 16px)' : '16px')
        node.style.setProperty('--card-origin', flip ? 'right center' : 'left center')
    }, [])

    return (
        <Chapter
            id="contact"
            index="05"
            title={t.sections.contact}
            meta={`${t.aside.city} · ${t.aside.available}`}
            edge="closing"
            tall
        >
            <div className="contact" ref={sectionRef}>
                <div className="work">
                    <ol className="work__index">
                        {PLACES.map((place, i) => (
                            <li key={place.id}>
                                <button
                                    type="button"
                                    className={`work__row${place.id === activeId ? ' is-active' : ''}`}
                                    style={{ '--i': i } as CSSProperties}
                                    aria-pressed={place.id === activeId}
                                    onPointerEnter={() => setActiveId(place.id)}
                                    onPointerLeave={() => setActiveId(null)}
                                    onFocus={() => setActiveId(place.id)}
                                    onBlur={() => setActiveId(null)}
                                    onClick={() => setActiveId((id) => (id === place.id ? null : place.id))}
                                >
                                    <span className="work__no t-data">{pad(i + 1)}</span>
                                    <span className="work__name">{place.name}</span>
                                    <span className="work__year t-data">{PLACE_ROLE_LABEL[place.role][lang]}</span>
                                    <span className="sr-only">{place.note[lang]}</span>
                                </button>
                            </li>
                        ))}
                    </ol>

                    <div className="globe__stage" ref={stageRef}>
                        {near && (
                            <Suspense fallback={null}>
                                <Globe activeId={activeId} onHover={setActiveId} onMarkerPosition={onMarkerPosition} />
                            </Suspense>
                        )}

                        <figure className="globe__card" aria-hidden="true">
                            <span className="globe__card-name">{active?.name}</span>
                            <span className="globe__card-note">{active ? active.note[lang] : ''}</span>
                        </figure>
                    </div>
                </div>

                <div className="contact__reach">
                    <p className="contact__lead">{t.contact.lead}</p>

                    <a className="contact__email" href={`mailto:${EMAIL}`}>{EMAIL}</a>

                    <ul className="contact__socials">
                        {SOCIALS.map((item) => (
                            <li key={item.label}>
                                <a
                                    className="contact__social t-data"
                                    href={item.href}
                                    {...(item.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                                >
                                    {item.label} <span aria-hidden="true">↗</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Chapter>
    )
}

export default Contact
