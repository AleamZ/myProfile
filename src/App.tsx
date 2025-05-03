import { BrowserRouter } from "react-router-dom";
import MainRoutes from "./router/main.route";
function App() {

  return (
    <div className="app">
      <BrowserRouter>
        <MainRoutes />
      </BrowserRouter>
    </div>
  )
}

export default App
