import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router";
import Login from './Login';
import MainPage from './MainPage';
import RestaurantsPage from './RestaurantsPage';
const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/main" element={<MainPage />} />
                <Route path="/restaurants" element={<RestaurantsPage />} />
            </Routes>
        </Router>
    );
};

export default App;