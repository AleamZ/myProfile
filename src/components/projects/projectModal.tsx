import { useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import type { Project } from '../../data/projects'
import RepoSource from './repoSource'
import { useLang } from '../../i18n/LanguageProvider'

interface ProjectModalProps {
    project: Project
    onClose: () => void
}

const ProjectModal = ({ project, onClose }: ProjectModalProps) => {
    const { t, lang } = useLang()
    const hasLive = !!project.demoUrl
    const canEmbed = project.embeddable !== false
    const canBrowseSource = !!project.repoUrl && project.allowSource !== false

    const [tab, setTab] = useState<'live' | 'source'>(hasLive ? 'live' : 'source')
    const [iframeLoaded, setIframeLoaded] = useState(false)
    const [iframeSlow, setIframeSlow] = useState(false)

    const panelRef = useRef<HTMLDivElement>(null)
    const closeRef = useRef<HTMLButtonElement>(null)

    // Mount: lock scroll, restore native cursor, trap focus, Esc to close.
    useEffect(() => {
        const previouslyFocused = document.activeElement as HTMLElement | null
        document.body.classList.add('modal-open')
        closeRef.current?.focus()

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
                return
            }
            if (e.key !== 'Tab' || !panelRef.current) return
            const focusables = Array.from(
                panelRef.current.querySelectorAll<HTMLElement>(
                    'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
                ),
            ).filter((el) => el.offsetParent !== null || el.tagName === 'IFRAME')
            if (focusables.length === 0) return
            const first = focusables[0]
            const last = focusables[focusables.length - 1]
            const active = document.activeElement
            if (e.shiftKey && active === first) {
                e.preventDefault()
                last.focus()
            } else if (!e.shiftKey && active === last) {
                e.preventDefault()
                first.focus()
            }
        }

        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.classList.remove('modal-open')
            previouslyFocused?.focus?.()
        }
    }, [onClose])

    // "Taking too long?" hint if the iframe hasn't loaded (likely X-Frame blocked).
    useEffect(() => {
        if (tab !== 'live' || !hasLive || iframeLoaded) return
        setIframeSlow(false)
        const timer = window.setTimeout(() => setIframeSlow(true), 4500)
        return () => window.clearTimeout(timer)
    }, [tab, hasLive, iframeLoaded])

    const onOverlayClick = (e: ReactMouseEvent) => {
        if (e.target === e.currentTarget) onClose()
    }

    return (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={onOverlayClick}>
            <div className="modal__panel" ref={panelRef}>
                <header className="modal__head">
                    <div className="modal__heading">
                        {project.year && <span className="modal__year">{project.year}</span>}
                        <h3 id="modal-title" className="modal__title">{project.name}</h3>
                    </div>
                    <button ref={closeRef} type="button" className="modal__close" onClick={onClose} aria-label={t.modal.close}>
                        <span aria-hidden="true">✕</span>
                    </button>
                </header>

                <p className="modal__blurb">{project.blurb[lang]}</p>

                {project.tech.length > 0 && (
                    <ul className="modal__tech">
                        {project.tech.map((tag) => (
                            <li key={tag}>{tag}</li>
                        ))}
                    </ul>
                )}

                <div className="modal__tabs" role="tablist" aria-label="Project views">
                    {hasLive && (
                        <button
                            type="button"
                            role="tab"
                            aria-selected={tab === 'live'}
                            className={`modal__tab${tab === 'live' ? ' is-active' : ''}`}
                            onClick={() => setTab('live')}
                        >
                            {t.modal.live}
                        </button>
                    )}
                    <button
                        type="button"
                        role="tab"
                        aria-selected={tab === 'source'}
                        className={`modal__tab${tab === 'source' ? ' is-active' : ''}`}
                        onClick={() => setTab('source')}
                    >
                        {t.modal.source}
                    </button>
                </div>

                <div className="modal__body">
                    {tab === 'live' && hasLive && canEmbed && (
                        <div className="frame">
                            {!iframeLoaded && <div className="frame__loading">{t.modal.loadingDemo}</div>}
                            <iframe
                                key={project.id}
                                title={`${project.name} — ${t.modal.live}`}
                                src={project.demoUrl}
                                className="frame__iframe"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                                onLoad={() => setIframeLoaded(true)}
                            />
                            {iframeSlow && !iframeLoaded && (
                                <p className="frame__hint">
                                    {t.modal.slowHint}{' '}
                                    <a href={project.demoUrl} target="_blank" rel="noreferrer">
                                        {t.modal.newTab}&nbsp;↗
                                    </a>
                                </p>
                            )}
                        </div>
                    )}

                    {tab === 'live' && hasLive && !canEmbed && (
                        <div className="frame frame--blocked">
                            {project.image && (
                                <img
                                    className="frame__poster"
                                    src={project.image}
                                    alt={`${project.name} preview`}
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                    }}
                                />
                            )}
                            <p className="frame__msg">
                                {t.modal.blocked}{' '}
                                <a href={project.demoUrl} target="_blank" rel="noreferrer">
                                    {t.modal.openLiveDemo}&nbsp;↗
                                </a>
                            </p>
                        </div>
                    )}

                    {tab === 'source' &&
                        (canBrowseSource ? (
                            <RepoSource repoUrl={project.repoUrl!} branch={project.branch} entryFile={project.entryFile} />
                        ) : (
                            <div className="repo__private">
                                <span aria-hidden="true">🔒</span>
                                {t.modal.privateMsg}
                            </div>
                        ))}
                </div>

                <footer className="modal__foot">
                    {project.demoUrl && (
                        <a className="modal__link" href={project.demoUrl} target="_blank" rel="noreferrer">
                            {t.modal.openLive}&nbsp;↗
                        </a>
                    )}
                    {project.repoUrl && project.allowSource !== false && (
                        <a className="modal__link" href={project.repoUrl} target="_blank" rel="noreferrer">
                            {t.modal.repository}&nbsp;↗
                        </a>
                    )}
                </footer>
            </div>
        </div>
    )
}

export default ProjectModal
