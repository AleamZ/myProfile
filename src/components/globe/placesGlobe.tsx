import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useLang } from '../../i18n/LanguageProvider'
import { useMotionCapability } from '../../hooks/useMotionCapability'
import { detectWebGL } from '../../scene/quality'
import { PLACES, PLACE_ROLE_LABEL } from '../../data/places'

const GlobeCanvas = lazy(() => import('./GlobeCanvas'))

// The card sits beside the marker, and flips to the other side rather than
// running off the edge of the stage.
const CARD_GAP = 18

function initialsFor(name: string): string {
    return name
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0] ?? '')
        .join('')
        .toUpperCase()
}

const PlacesGlobe = () => {
    const { lang, t } = useLang()
    const motionEnabled = useMotionCapability()
    const [activeId, setActiveId] = useState<string | null>(null)
    const [inView, setInView] = useState(false)
    const [webgl] = useState(detectWebGL)
    const sectionRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)

    const active = PLACES.find((place) => place.id === activeId) ?? null

    // Only pay for the globe (three + a world topology) once it is close.
    useEffect(() => {
        const node = sectionRef.current
        if (!node || typeof IntersectionObserver === 'undefined') {
            setInView(true)
            return
        }
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setInView(true)
                    observer.disconnect()
                }
            },
            { rootMargin: '400px 0px' },
        )
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    // Written straight to style: the marker moves every frame while the globe
    // turns, and re-rendering React at that rate would be wasteful.
    const onMarkerScreenPosition = useCallback((position: { x: number; y: number } | null) => {
        const stage = stageRef.current
        if (!stage) return
        if (!position) {
            stage.style.setProperty('--marker-on', '0')
            return
        }
        const flip = position.x > stage.clientWidth * 0.58
        stage.style.setProperty('--marker-on', '1')
        stage.style.setProperty('--marker-x', `${position.x}px`)
        stage.style.setProperty('--marker-y', `${position.y}px`)
        stage.style.setProperty('--card-tx', flip ? `calc(-100% - ${CARD_GAP}px)` : `${CARD_GAP}px`)
        stage.style.setProperty('--card-origin', flip ? 'right center' : 'left center')
    }, [])

    return (
        <div className="globe" ref={sectionRef}>
            <div className="globe__intro reveal">
                <h3 className="globe__title">{t.places.title}</h3>
                <p className="globe__lead">{t.places.lead}</p>
            </div>

            <div className="globe__body">
                <ol className="globe__list reveal">
                    {PLACES.map((place, index) => (
                        <li
                            className={`globe__item${place.id === activeId ? ' is-active' : ''}`}
                            key={place.id}
                            style={{ '--i': index } as CSSProperties}
                        >
                            <button
                                type="button"
                                className="globe__trigger"
                                aria-pressed={place.id === activeId}
                                onPointerEnter={() => setActiveId(place.id)}
                                onPointerLeave={() => setActiveId(null)}
                                onFocus={() => setActiveId(place.id)}
                                onBlur={() => setActiveId(null)}
                                onClick={() => setActiveId((current) => (current === place.id ? null : place.id))}
                            >
                                <span className="globe__role">{PLACE_ROLE_LABEL[place.role][lang]}</span>
                                <span className="globe__dot" aria-hidden="true" />
                                <span className="globe__name">{place.name}</span>
                                <span className="globe__country">{place.country[lang]}</span>
                                {/* The card is decorative; this is where the
                                    note reaches assistive tech. */}
                                <span className="sr-only">{place.note[lang]}</span>
                            </button>
                        </li>
                    ))}
                </ol>

                <div className="globe__stage" ref={stageRef}>
                    {webgl && inView && (
                        <Suspense fallback={null}>
                            <GlobeCanvas
                                activeId={activeId}
                                onHover={setActiveId}
                                onMarkerScreenPosition={onMarkerScreenPosition}
                                reducedMotion={!motionEnabled}
                            />
                        </Suspense>
                    )}

                    {/* Position is driven by the marker; content only changes on hover. */}
                    <figure className="globe__card" aria-hidden="true">
                        <div className="globe__photo">
                            {active && (
                                <img
                                    src={active.photo}
                                    alt=""
                                    loading="lazy"
                                    onError={(event) => {
                                        event.currentTarget.style.visibility = 'hidden'
                                    }}
                                />
                            )}
                            <span className="globe__initials">{active ? initialsFor(active.name) : ''}</span>
                        </div>
                        <figcaption className="globe__caption">
                            <span className="globe__caption-name">{active?.name}</span>
                            <span className="globe__caption-note">{active ? active.note[lang] : ''}</span>
                        </figcaption>
                    </figure>

                    <span className="globe__hint" aria-hidden="true">{t.places.hint}</span>
                </div>
            </div>
        </div>
    )
}

export default PlacesGlobe
