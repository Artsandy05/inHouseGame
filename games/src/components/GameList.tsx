// src/components/GameList.tsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Button, Card, CardContent, Typography, Grid, Container } from '@mui/material';
import { useUser } from '../context/UserContext';
import { getCookie } from '../utils/cookie';
import { useNavigate } from 'react-router-dom';

// Define the type for a game
interface Game {
  id: number;
  name: string;
  label: string;
  isActive: boolean;
  isStreaming: boolean;
  moderatorRoute: string;
  gameRoute: string;
  updatedAt: string;
  createdAt: string;
}

const GameList = () => {
  const [games, setGames] = useState<Game[]>([]);  // Type the state as an array of `Game` objects
  const userData = JSON.parse(localStorage.getItem('user') || 'null');

  const navigate = useNavigate();

  
console.log(userData)
  useEffect(() => {
    if (userData.expirationTime < new Date().getTime()) {
      localStorage.removeItem('user');
    } 
  }, [userData]);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await api.get('/games');  // Replace with actual API endpoint
        // Access the correct structure based on the API response
        setGames(response.data.data.content);  // Get games from the 'content' array
      } catch (err) {
        console.error('Error fetching games:', err);
      }
    };

    fetchGames();
  }, []);

  return (
    <Container>
      <Typography variant="h4" gutterBottom align="center">
        Game List
      </Typography>
      <Grid container spacing={2}>
        {games.map((game) => (
          <Grid item xs={12} sm={6} md={4} key={game.id}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" component="div" gutterBottom>
                  {game.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active: {game.isActive ? 'Yes' : 'No'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Streaming: {game.isStreaming ? 'Yes' : 'No'}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {navigate(`/${game.name}`)}}
                  style={{ marginTop: '10px' }}
                  fullWidth
                >
                  Play {game.label}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default GameList;
