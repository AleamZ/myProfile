import { useEffect, useState } from 'react'
import LogoMark from '../logo/logoMark'
import LangSwitcher from '../langSwitcher/langSwitcher'
import ThemeSwitcher from '../themeSwitcher/themeSwitcher'
import { useLang } from '../../i18n/LanguageProvider'

const MHeader = () => {
    const { t } = useLang()
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40)
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
            <a className="site-header__brand" data-magnetic href="#main" aria-label="Nguyen Tien Dat — home">
                <LogoMark className="logo logo--brand" decorative />
            </a>

            <div className="site-header__right">
                <nav className="site-nav" aria-label="Primary">
                    {([
                        ['#work', t.sections.work],
                        ['#experience', t.sections.experience],
                        ['#skills', t.sections.skills],
                        ['#contact', t.sections.contact],
                    ] as const).map(([href, label]) => (
                        <a className="site-nav__link" data-magnetic href={href} key={href} aria-label={label}>
                            <span className="nav-flip" aria-hidden="true">
                                <span className="nav-flip__inner" data-text={label}>{label}</span>
                            </span>
                        </a>
                    ))}
                </nav>

                <p className="status" role="status" aria-live="polite">
                    <span className="status__dot" aria-hidden="true" />
                    <span className="status__word">{t.status.available}</span>
                    <span className="status__meta">— 2026</span>
                </p>

                <ThemeSwitcher />
                <LangSwitcher />
            </div>
        </header>
    )
}

export default MHeader
