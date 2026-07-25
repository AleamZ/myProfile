import { lazy, Suspense, useCallback, useReducer, useState } from 'react'
import MHeader from '../components/header/header'
import HomepageBanner from '../components/homepageBanner/homepageBanner'
import Projects from '../components/projects/projects'
import Experience from '../components/experience/experience'
import Skills from '../components/skills/skills'
import Contact from '../components/contact/contact'
import Background from '../components/background/background.hompage'
import Footer from '../components/footer/footer'
import { WorldBoundary } from '../components/world/WorldBoundary'
import { getWorldPresentation, worldReadinessReducer } from '../components/world/worldReadiness'
import { useSceneDirector } from '../hooks/useSceneDirector'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { detectWebGL, selectSceneQuality } from '../scene/quality'
import { useTheme } from '../theme/ThemeProvider'

const WorldCanvas = lazy(() => import('../components/world/WorldCanvas'))

function readInitialSceneQuality() {
    return selectSceneQuality({
        webgl: detectWebGL(),
        reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
        coarsePointer: window.matchMedia?.('(pointer: coarse)').matches ?? false,
        width: window.innerWidth,
        dpr: window.devicePixelRatio || 1,
    })
}

const Homepage = () => {
    useSceneDirector()
    useScrollReveal()
    const { theme } = useTheme()
    const [quality] = useState(readInitialSceneQuality)
    const [worldReadiness, dispatchWorldReadiness] = useReducer(worldReadinessReducer, 'pending')
    const onWorldFirstFrame = useCallback(() => dispatchWorldReadiness({ type: 'first-frame' }), [])
    const onWorldUnavailable = useCallback(() => dispatchWorldReadiness({ type: 'unavailable' }), [])
    const worldPresentation = getWorldPresentation(theme, worldReadiness)

    return (
        <div
            className={`homepage${worldPresentation.ambienceClass ? ` ${worldPresentation.ambienceClass}` : ''}`}
            data-world={worldPresentation.worldAttribute}
        >
            <a className="skip-link" href="#main">Skip to content</a>
            <Background />
            <WorldBoundary fallback={null} onError={onWorldUnavailable}>
                <Suspense fallback={null}>
                    {quality !== 'fallback' && (
                        <WorldCanvas
                            quality={quality}
                            onFirstFrame={onWorldFirstFrame}
                            onUnavailable={onWorldUnavailable}
                        />
                    )}
                </Suspense>
            </WorldBoundary>
            <MHeader />
            <main id="main" className="content">
                <HomepageBanner />
                <Projects />
                <Experience />
                <Skills />
                <Contact />
            </main>
            <Footer />
        </div>
    )
}

export default Homepage
