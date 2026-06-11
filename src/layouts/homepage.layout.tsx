import MHeader from '../components/header/header'
import HomepageBanner from '../components/homepageBanner/homepageBanner'
import Projects from '../components/projects/projects'
import Experience from '../components/experience/experience'
import Skills from '../components/skills/skills'
import Contact from '../components/contact/contact'
import Background from '../components/background/background.hompage'
import Footer from '../components/footer/footer'
import { useScrollReveal } from '../hooks/useScrollReveal'

const Homepage = () => {
    useScrollReveal()

    return (
        <div className="homepage">
            <a className="skip-link" href="#main">Skip to content</a>
            <Background />
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
