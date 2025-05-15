// src/services/gameService.ts
import api from './api';

export const getGameHistory = async (game: string) => {
  try {
    const response = await api.get('/get-game-history', {
      params: { game }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching winning balls:', error);
    throw error;
  }
};