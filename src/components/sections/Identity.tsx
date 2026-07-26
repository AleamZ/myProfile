import type { CSSProperties } from 'react'
import Chapter from '../Chapter'
import { useLang } from '../../i18n/LanguageProvider'

const NAME = ['NGUYEN', 'TIEN', 'DAT']

/**
 * 01 — Identity.
 *
 * The name is drawn twice per line: a permanent hairline outline, and a solid
 * copy inside a window whose width tracks the chapter's own progress. It
 * resolves as the reader descends, so the type is the chapter's progress
 * indicator and nothing extra has to announce it.
 *
 * The clip is plain overflow on the wrapper. Masks and background-clip both
 * push the line onto its own compositing layer, where Chromium intermittently
 * drops the clip and repaints the whole line as a solid slab.
 */
const Identity = () => {
    const { t } = useLang()

    return (
        <Chapter
            id="identity"
            index="01"
            title={t.sections.identity}
            meta={t.roleEyebrow}
            edge="opening"
            wide
        >
            <h1 className="identity__name t-display" aria-label="Nguyen Tien Dat">
                {NAME.map((line, index) => (
                    <span className="identity__line" key={line} style={{ '--n': index } as CSSProperties}>
                        <span className="identity__ghost" aria-hidden="true">{line}</span>
                        <span className="identity__cut" aria-hidden="true">
                            <span className="identity__fill">{line}</span>
                        </span>
                    </span>
                ))}
            </h1>

            <p className="identity__lead">{t.identity.lead}</p>

            <dl className="identity__facts">
                <div className="identity__fact">
                    <dt className="t-data">{t.aside.basedIn}</dt>
                    <dd>{t.aside.city}</dd>
                </div>
                <div className="identity__fact">
                    <dt className="t-data">{t.identity.stack}</dt>
                    <dd>React · Next.js · TypeScript</dd>
                </div>
                <div className="identity__fact identity__fact--live">
                    <dt className="t-data">{t.identity.status}</dt>
                    <dd>
                        <span className="identity__dot" aria-hidden="true" />
                        {t.aside.available}
                    </dd>
                </div>
            </dl>
        </Chapter>
    )
}

export default Identity
