import { BrowserRouter } from "react-router-dom";
import MainRoutes from "./router/main.route";
import { LanguageProvider } from "./i18n/LanguageProvider";
import { ThemeProvider } from "./theme/ThemeProvider";
import { SceneProvider } from "./scene/SceneProvider";
function App() {

  return (
    <div className="app">
      <ThemeProvider>
        <LanguageProvider>
          <SceneProvider>
            <BrowserRouter>
              <MainRoutes />
            </BrowserRouter>
          </SceneProvider>
        </LanguageProvider>
      </ThemeProvider>
    </div>
  )
}

export default App
