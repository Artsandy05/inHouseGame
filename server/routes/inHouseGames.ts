// src/routes/kingfisher.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';
import GameList from '../models/GameList';
import { mockKingfisherAPI } from '../utils/tests/mockings';

// Kingfisher API configuration
const IN_HOUSE_GAME = {
  baseUrl: 'https://kingfisher.com/api',
  endpoints: {
    walletBalance: '/get-wallet-balance',
    userDetails: '/get-user-details',
    updateWallet: '/update-wallet-balance',
    createRound: '/create-round-result',
    createSales: '/create-sales',
    updateSales: '/update-sales'
  },
  apiKey: process.env.IN_HOUSE_GAME_KEY || 'default-key-in-dev' // Set this in your .env
};

interface AuthenticatedRequest extends FastifyRequest {
  headers: {
    'x-api-key'?: string;
  };
  query: {
    apiKey?: string;
  };
}

// Helper function to call Kingfisher APIs
async function callKingfisherAPI(endpoint: string, data: any = {}, method = 'POST') {
  try {
    const url = `${IN_HOUSE_GAME.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${IN_HOUSE_GAME.apiKey}`,
      'Content-Type': 'application/json'
    };

    const response = await axios({
      method,
      url,
      data,
      headers
    });

    return response.data;
  } catch (error: any) {
    throw new Error(`Failed to call Kingfisher API: ${error.message}`);
  }
}

export default async function (fastify: FastifyInstance) {
  const authenticate = async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const apiKey = request.headers['x-api-key'] || request.query.apiKey;

      if (!apiKey || apiKey !== IN_HOUSE_GAME.apiKey) {
        throw new Error('Invalid API Key');
      }
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized: Invalid API Key' });
    }
  };
  // Endpoint to get games list (protected with Bearer token)
  fastify.get('/get-games', {
    preHandler: [authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Get active games from database
      const games = await GameList.findAll({
        where: { isActive: true },
        attributes: ['id', 'name', 'label', 'gameRoute', 'banner', 'jackpot_level']
      });

      return {
        success: true,
        games: games.map(game => ({
          game_id: game.id,
          name: game.name,
          label: game.label,
          route: game.gameRoute,
          banner: `${process.env.PROD_BASE_URL}${game.banner}`,
          jackpot_level: game.jackpot_level
        }))
      };
    } catch (error: any) {
      reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  });

  // Kingfisher callback endpoint
  fastify.get('/in-house-games-callback', async (request: FastifyRequest<{
    Querystring: { game_id: string; user_token: string }
  }>, reply: FastifyReply) => {
    const { game_id, user_token } = request.query;
    
    if (!game_id || !user_token) {
      return reply.code(400).send({ 
        success: false, 
        error: 'Missing game_id or user_token' 
      });
    }

    try {
      // Get game details from database
      const game = await GameList.findByPk(game_id);
      if (!game) {
        return reply.code(404).send({
          success: false,
          error: 'Game not found'
        });
      }

      const useMock = process.env.NODE_ENV === 'local';
      const userDetails = useMock
      ? await mockKingfisherAPI('/get-user-details', { user_token })
      : await callKingfisherAPI(IN_HOUSE_GAME.endpoints.userDetails, { user_token });

      // Get wallet balance (mock or real)
      const walletBalance = useMock
      ? await mockKingfisherAPI('/get-wallet-balance', { user_token })
      : await callKingfisherAPI(IN_HOUSE_GAME.endpoints.walletBalance, { user_token });
      // Get user details from Kingfisher
      // const userDetails = await callKingfisherAPI(
      //   KINGFISHER_API.endpoints.userDetails,
      //   { user_token }
      // );

      // // Get wallet balance from Kingfisher
      // const walletBalance = await callKingfisherAPI(
      //   KINGFISHER_API.endpoints.walletBalance,
      //   { user_token }
      // );

      // Redirect to the appropriate game page with necessary data
      const redirectUrl = `${process.env.LOCAL_FRONTEND_URL}${game.gameRoute}?` + 
        `user_token=${encodeURIComponent(user_token)}&` +
        `user_id=${encodeURIComponent(userDetails.user_id)}&` +
        `balance=${encodeURIComponent(walletBalance.balance)}&` +
        `game_id=${encodeURIComponent(game_id)}`;

        console.log(redirectUrl)

      return reply.redirect(redirectUrl, 302);  // New signature: (url, statusCode)
      
    } catch (error: any) {
      reply.code(500).send({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // Game result submission endpoint
  fastify.post('/submit-game-result', {
    preHandler: [authenticate]
  }, async (request: FastifyRequest<{
    Body: {
      user_token: string;
      game_id: string;
      bet_amount: number;
      win_amount: number;
      round_details: any;
    }
  }>, reply: FastifyReply) => {
    const { user_token, game_id, bet_amount, win_amount, round_details } = request.body;
    
    try {
      // Update wallet balance on Kingfisher
      const walletUpdate = await callKingfisherAPI(
        IN_HOUSE_GAME.endpoints.updateWallet,
        { 
          user_token,
          amount: win_amount - bet_amount,
          transaction_type: 'game_result'
        }
      );

      // Create round result record
      const roundResult = await callKingfisherAPI(
        IN_HOUSE_GAME.endpoints.createRound,
        {
          user_token,
          game_id,
          bet_amount,
          win_amount,
          round_details
        }
      );

      // Create/update sales record
      const salesRecord = win_amount > bet_amount 
        ? await callKingfisherAPI(IN_HOUSE_GAME.endpoints.updateSales, {
            user_token,
            game_id,
            amount: bet_amount - win_amount
          })
        : await callKingfisherAPI(IN_HOUSE_GAME.endpoints.createSales, {
            user_token,
            game_id,
            amount: bet_amount
          });

      return { 
        success: true,
        wallet_balance: walletUpdate.new_balance,
        round_id: roundResult.round_id,
        sales_id: salesRecord.sales_id
      };
      
    } catch (error: any) {
      reply.code(500).send({ 
        success: false, 
        error: error.message 
      });
    }
  });
}