

// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import GameList from './components/GameList';
import BatoBatoPik from './pages/BatoBatoPik';
import { PlayerStoreProvider } from './context/PlayerStoreContext';
import Moderator from './pages/Moderator';
import GoldenGoose from './pages/GoldenGoose';
import AdminReports from './pages/admin/AdminReports';
import KaraKrus from './pages/KaraKrus';
import BulagPipiBingi from './pages/BulagPipiBingi';
import PigeonRace from './pages/PigeonRace';
import HorseRacingGame from './pages/HorseRace';

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
          <Route path="/karakrus" element={<KaraKrus />} />
          <Route path="/bulag_pipi_bingi" element={<BulagPipiBingi />} />
          <Route path="/pigeon_race" element={<PigeonRace />} />
          <Route path="/horse_race" element={<HorseRacingGame />} />
        </Routes>
      </Router>
    </PlayerStoreProvider>
  );
};

export default App;



