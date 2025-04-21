import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router";
import Login from './Login';
import MainPage from './MainPage';
import RestaurantsPage from './RestaurantsPage';
import RecipeSearchApp from "./RecipeSearchApp";
const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/main" element={<MainPage />} />
                <Route path="/restaurants" element={<RestaurantsPage />} />
                <Route path="/recipes" element={<RecipeSearchApp />} />
            </Routes>
        </Router>
    );
};

export default App;