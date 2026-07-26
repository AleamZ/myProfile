import { Route, Routes } from 'react-router-dom'
import Homepage from '../layouts/Homepage'

const MainRoutes = () => (
    <Routes>
        <Route path="/" element={<Homepage />} />
    </Routes>
)

export default MainRoutes
