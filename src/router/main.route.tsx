import { Route, Routes } from "react-router-dom";
import Homepage from "../layouts/homepage.layout";
const MainRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Homepage />} />
        </Routes>
    );
};

export default MainRoutes;