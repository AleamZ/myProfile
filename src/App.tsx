import { BrowserRouter } from "react-router-dom";
import MainRoutes from "./router/main.route";
import { LanguageProvider } from "./i18n/LanguageProvider";
import { SceneProvider } from "./scene/SceneProvider";
function App() {

  return (
    <div className="app">
      <LanguageProvider>
        <SceneProvider>
          <BrowserRouter>
            <MainRoutes />
          </BrowserRouter>
        </SceneProvider>
      </LanguageProvider>
    </div>
  )
}

export default App
