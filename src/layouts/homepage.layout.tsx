import { lazy, Suspense, useCallback, useState } from 'react'
import MHeader from '../components/header/header'
import HomepageBanner from '../components/homepageBanner/homepageBanner'
import Projects from '../components/projects/projects'
import Experience from '../components/experience/experience'
import Skills from '../components/skills/skills'
import Contact from '../components/contact/contact'
import Background from '../components/background/background.hompage'
import Footer from '../components/footer/footer'
import { WorldBoundary } from '../components/world/WorldBoundary'
import { useSceneDirector } from '../hooks/useSceneDirector'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { detectWebGL, selectSceneQuality } from '../scene/quality'

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
    const [quality] = useState(readInitialSceneQuality)
    const [worldReady, setWorldReady] = useState(false)
    const onWorldFirstFrame = useCallback(() => setWorldReady(true), [])

    return (
        <div className="homepage" data-world={worldReady ? 'active' : undefined}>
            <a className="skip-link" href="#main">Skip to content</a>
            <Background />
            <WorldBoundary fallback={null}>
                <Suspense fallback={null}>
                    {quality !== 'fallback' && <WorldCanvas quality={quality} onFirstFrame={onWorldFirstFrame} />}
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
