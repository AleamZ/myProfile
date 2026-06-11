import { useEffect, useState } from 'react'
import { useLang } from '../../i18n/LanguageProvider'

// Local time in Ho Chi Minh City, independent of the visitor's timezone.
const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
})
const now = () => timeFormatter.format(new Date())

const LiveClock = () => {
    const [time, setTime] = useState(now)

    useEffect(() => {
        const id = window.setInterval(() => setTime(now()), 1000)
        return () => window.clearInterval(id)
    }, [])

    return <span className="hero__clock">{time}</span>
}

const HeroAside = () => {
    const { t } = useLang()

    return (
        <div className="hero__aside">
            <span className="hero__aside-line" aria-hidden="true" />

            <div className="hero__aside-stack">
                <div className="hero__meta">
                    <span className="hero__meta-label">{t.aside.localTime}</span>
                    <LiveClock />
                </div>

                <div className="hero__meta">
                    <span className="hero__meta-label">{t.aside.basedIn}</span>
                    <span className="hero__meta-val">{t.aside.city}</span>
                    <span className="hero__meta-sub">10.82°N · 106.75°E</span>
                </div>

                <div className="hero__meta hero__meta--status">
                    <span className="hero__status-dot" aria-hidden="true" />
                    <span>{t.aside.available}</span>
                </div>
            </div>
        </div>
    )
}

export default HeroAside
