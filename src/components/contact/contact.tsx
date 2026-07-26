import { useEffect } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { useLang } from '../../i18n/LanguageProvider'
import { useChapterStage } from '../../hooks/useChapterStage'
import { useSceneStore } from '../../scene/sceneHooks'
import PlacesGlobe from '../globe/placesGlobe'

const EMAIL = 'datnguyentien.work@gmail.com'

const SOCIALS = [
    { label: 'Email', href: `mailto:${EMAIL}`, external: false },
    { label: 'Facebook', href: 'https://www.facebook.com/Aleam007/', external: true },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/aleamz/', external: true },
]

const Contact = () => {
    const { t } = useLang()
    const store = useSceneStore()

    useEffect(() => () => {
        store.setContactEngaged(false)
    }, [store])

    const disengageEmail = (event: ReactPointerEvent<HTMLAnchorElement>) => {
        if (!event.currentTarget.matches(':focus')) store.setContactEngaged(false)
    }

    const stageRef = useChapterStage<HTMLDivElement>('contact')

    return (
        <section className="contact" id="contact" data-scene="contact" aria-labelledby="contact-heading">
            <div className="chapter-stage chapter-stage--closing" ref={stageRef}>
                <div className="contact__head reveal">
                    <h2 id="contact-heading" className="sr-only">{t.sections.contact}</h2>
                    <span className="index">05&nbsp;/&nbsp;{t.sections.contact}</span>
                    <span className="contact__loc">{t.aside.city} · {t.aside.available}</span>
                </div>

                <PlacesGlobe />

                <div className="contact__main">
                    <p className="contact__lead reveal">
                        {t.contact.lead}
                    </p>

                    <div className="contact__beacon reveal">
                    <a
                        className="contact__email reveal"
                        href={`mailto:${EMAIL}`}
                        onPointerEnter={() => store.setContactEngaged(true)}
                        onPointerLeave={disengageEmail}
                        onFocus={() => store.setContactEngaged(true)}
                        onBlur={() => store.setContactEngaged(false)}
                    >
                        <span className="contact__email-inner">{EMAIL}</span>
                    </a>

                    <ul className="contact__socials reveal">
                        {SOCIALS.map((s, i) => (
                            <li className="contact__social" key={s.label} style={{ '--i': i } as CSSProperties}>
                                <a
                                    href={s.href}
                                    {...(s.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                                >
                                    <span className="contact__social-label">{s.label}</span>
                                    <span className="contact__social-arrow" aria-hidden="true">↗</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                    </div>
                </div>
            </div>

        </section>
    )
}

export default Contact
