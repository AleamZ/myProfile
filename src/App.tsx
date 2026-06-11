import { BrowserRouter } from "react-router-dom";
import MainRoutes from "./router/main.route";
import { LanguageProvider } from "./i18n/LanguageProvider";
import { ThemeProvider } from "./theme/ThemeProvider";
function App() {

  return (
    <div className="app">
      <ThemeProvider>
        <LanguageProvider>
          <BrowserRouter>
            <MainRoutes />
          </BrowserRouter>
        </LanguageProvider>
      </ThemeProvider>
    </div>
  )
}

export default App
