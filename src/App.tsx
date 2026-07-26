import { BrowserRouter } from 'react-router-dom'
import MainRoutes from './router/main.route'
import { LanguageProvider } from './i18n/LanguageProvider'

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <MainRoutes />
      </BrowserRouter>
    </LanguageProvider>
  )
}

export default App
