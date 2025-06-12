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

export const generateVideo = async (images:any, prompt:any) => {
  try {
    const response = await api.post('/generate-video', {
      params: { images, prompt }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching winning balls:', error);
    throw error;
  }
};