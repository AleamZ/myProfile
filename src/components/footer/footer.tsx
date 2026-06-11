import { useState } from 'react'
import { useLang } from '../../i18n/LanguageProvider'

const Footer = () => {
    const { t } = useLang()
    const [motionOn, setMotionOn] = useState<boolean>(() => {
        try {
            return document.documentElement.dataset.bgfx !== 'off'
        } catch {
            return true
        }
    })

    const toggleMotion = () => {
        const next = !motionOn
        setMotionOn(next)
        document.documentElement.dataset.bgfx = next ? 'on' : 'off'
        try {
            window.localStorage.setItem('pp-bgfx', next ? 'on' : 'off')
        } catch {
            /* ignore */
        }
    }

    const toTop = () => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
    }

    return (
        <footer className="site-footer">
            <div className="site-footer__inner">
                <a
                    className="site-footer__meta site-footer__mail"
                    href="mailto:datnguyentien.work@gmail.com"
                    aria-label="Email datnguyentien.work@gmail.com"
                >
                    datnguyentien.work@gmail.com
                </a>
                <span className="site-footer__meta site-footer__center">{t.aside.city} · © 2026 Nguyen Tien Dat</span>
                <div className="site-footer__right">
                    <button
                        type="button"
                        className="site-footer__btn"
                        data-magnetic
                        aria-pressed={motionOn}
                        onClick={toggleMotion}
                    >
                        {t.footer.motion}{motionOn ? ' ●' : ' ○'}
                    </button>
                    <button type="button" className="site-footer__btn" data-magnetic onClick={toTop}>
                        {t.footer.backToTop} <span aria-hidden="true" className="site-footer__arrow">↑</span>
                    </button>
                </div>
            </div>
        </footer>
    )
}

export default Footer
