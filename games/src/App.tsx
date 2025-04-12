

// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext'; // Import the UserProvider
import LoginForm from './components/LoginForm';
import GameList from './components/GameList';
import BatoBatoPik from './pages/BatoBatoPik';
import { PlayerStoreProvider } from './context/PlayerStoreContext';
import Moderator from './pages/Moderator';
import GoldenGoose from './pages/GoldenGoose';
import AdminReports from './pages/admin/AdminReports';

const App = () => {
  return (
    <PlayerStoreProvider> {/* Wrap your app with the UserProvider */}
      <Router>
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/games" element={<GameList />} />
          <Route path="/bato_bato_pik" element={<BatoBatoPik />} />
          <Route path="/golden_goose" element={<GoldenGoose />} />
          <Route path="/moderator" element={<Moderator />} />
          <Route path="/admin/reports" element={<AdminReports />} />
        </Routes>
      </Router>
    </PlayerStoreProvider>
  );
};

export default App;



