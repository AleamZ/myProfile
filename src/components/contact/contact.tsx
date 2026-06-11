import { useLang } from '../../i18n/LanguageProvider'

const EMAIL = 'datnguyentien.work@gmail.com'

const SOCIALS = [
    { label: 'Email', href: `mailto:${EMAIL}`, external: false },
    { label: 'Facebook', href: 'https://www.facebook.com/Aleam007/', external: true },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/aleamz/', external: true },
]

const Contact = () => {
    const { t } = useLang()

    return (
        <section className="contact" id="contact" aria-labelledby="contact-heading">
            <div className="contact__head reveal">
                <h2 id="contact-heading" className="sr-only">{t.sections.contact}</h2>
                <span className="index">05&nbsp;/&nbsp;{t.sections.contact}</span>
                <span className="contact__loc">{t.aside.city} · {t.aside.available}</span>
            </div>

            <div className="contact__main">
                <p className="contact__lead reveal">
                    {t.contact.lead}
                </p>

                <a className="contact__email reveal" href={`mailto:${EMAIL}`}>
                    {EMAIL}
                </a>

                <ul className="contact__socials reveal">
                    {SOCIALS.map((s) => (
                        <li className="contact__social" key={s.label}>
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
        </section>
    )
}

export default Contact
