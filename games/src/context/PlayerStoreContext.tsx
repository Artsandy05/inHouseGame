import React, { createContext, useState, useContext } from 'react';

// Create the Player Store Context
const PlayerStoreContext = createContext(null);

// Provider Component
export const PlayerStoreProvider = ({ children }) => {
  const [roundResult, setRoundResult] = useState(null);

  return (
    <PlayerStoreContext.Provider
      value={{
        roundResult,
        setRoundResult,
      }}
    >
      {children}
    </PlayerStoreContext.Provider>
  );
};

// Custom hook to use the PlayerStoreContext
export const usePlayerStore = () => {
  const context = useContext(PlayerStoreContext);

  if (!context) {
    throw new Error(
      'usePlayerStore must be used within a PlayerStoreProvider'
    );
  }

  return context;
};
