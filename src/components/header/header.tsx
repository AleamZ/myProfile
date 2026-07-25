import { useEffect, useState } from 'react'
import LogoMark from '../logo/logoMark'
import LangSwitcher from '../langSwitcher/langSwitcher'
import ThemeSwitcher from '../themeSwitcher/themeSwitcher'

const MHeader = () => {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40)
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
            <a className="site-header__brand" href="#main" aria-label="Nguyen Tien Dat — home">
                <LogoMark className="logo logo--brand" decorative />
            </a>

            <div className="site-header__right">
                <ThemeSwitcher />
                <LangSwitcher />
            </div>
        </header>
    )
}

export default MHeader
