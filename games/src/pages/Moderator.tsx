import React, { useEffect } from 'react';
import { Button, Typography, Box } from '@mui/material';
import moderatorStore from '../utils/Store';
import { GameState } from '../utils/gameutils';
import { usePlayerStore } from '../context/PlayerStoreContext';

const Moderator = () => {

  const {
    connect,
    gameState
  } = moderatorStore.getState();
  const {
    sendMessage,
  } = moderatorStore();



  useEffect(() => {
    connect();

    return () => {
      const { socket } = moderatorStore.getState();
      if (socket) {
        socket.close();
      }
    };
  }, []);
  
  useEffect(() => {
    if(gameState === GameState.NewGame){
      setTimeout(() => {
        startGame()
      }, 2000);
    }
    if(gameState === 'Void'){
      setTimeout(() => {
        newGame()
      }, 1500);
    }
    if(gameState === GameState.WinnerDeclared){
      setTimeout(() => {
        newGame()
      }, 2000);
    }
  }, [gameState]);

  const startGame = () => {
    sendMessage(JSON.stringify({ game: "bbp", cmd: GameState.Open }));
  };
  const newGame = () => {
    sendMessage(JSON.stringify({ game: "bbp", cmd: GameState.NewGame }));
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <Typography variant="h4" gutterBottom>
        Welcome to the Game!
      </Typography>
      <Button
        variant="contained"
        color="primary"
        size="large"
        onClick={startGame}
      >
        Start Game
      </Button>
    </Box>
  );
};

export default Moderator;
