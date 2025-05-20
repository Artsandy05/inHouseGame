// src/routes/kingfisher.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';
import GameList from '../models/GameList';
import { mockKingfisherAPI } from '../utils/tests/mockings';
import createEncryptor from '../utils/createEncryptor';
import GoldenGooseJackpotLog from '../models/GoldenGooseJackpotLog';
import GoldenGooseRound from '../models/GoldenGooseRound';
import GoldenGooseTransaction from '../models/GoldenGooseTransaction';
import { Op, QueryTypes } from 'sequelize';
import GoldenGoosePrize from '../models/GoldenGoosePrize';
import sequelize from "../config/database";
import User from '../models/User';

type JackpotType = 'mini' | 'minor' | 'major' | 'grand';
type TransactionType = 'bet' | 'payout';
const formatDateForSQL = (date: Date) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

interface JackpotLogResult {
  id: number;
  userId: number;
  firstName: string;
  amount: string | number;
  type: string;
  gameRoundId: string;
  createdAt: string;
}

interface PrizeResult {
  id: number;
  type: string;
  amount: number;
  count: number;
  createdAt: string;
}

interface RoundResult {
  id: number;
  user_id: number;
  firstName: string;
  result: string;
  winning_amount: string | number;
  jackpot_amount: string | number;
  jackpot_type: string | null;
  transaction_number: string;
  game_id: string;
  round_id: string;
  crack_count: number;
  eggs: any;
  createdAt: string;
}

interface TransactionResult {
  id: number;
  userId: number;
  firstName: string;
  game_id: string;
  round_id: string;
  transaction_number: string;
  amount: string | number;
  type: string;
  createdAt: string;
}

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

const encryptor = createEncryptor(process.env.ENCRYPTION_SECRET);

interface AuthenticatedRequest extends FastifyRequest {
  headers: {
    'x-api-key'?: string;
  };
  query: {
    apiKey?: string;
  };
}

interface InitGameRequestBody {
  game_id: string;
  user_details?: {
    id: number;
    name: string;
    credits: number;
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
  fastify.addHook('onRequest', (request, reply, done) => {
    reply.header('Referrer-Policy', 'no-referrer-when-downgrade');
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
    done();
  });
  const authenticate = async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const apiKey = request.headers['x-api-key'] || request.query.apiKey;

      if (!apiKey) {
        return reply.code(400).send({ 
          success: false,
          error: 'API Key is required' 
        });
      }

      if (apiKey !== IN_HOUSE_GAME.apiKey) {
        return reply.code(401).send({ 
          success: false,
          error: 'Unauthorized: Invalid API Key' 
        });
      }
    } catch (err) {
      return reply.code(500).send({ 
        success: false,
        error: 'Internal Server Error during authentication' 
      });
    }
  };
  
  fastify.get('/get-games', {
    preHandler: [authenticate]
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const games = await GameList.findAll({
        where: { isActive: true },
        attributes: ['id', 'name', 'label', 'gameRoute', 'banner', 'jackpot_level', 'url']
      });
  
      if (!games || games.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'No active games found'
        });
      }
  
      const modifiedGames = games.map(game => {
        const gameUrl = new URL(game.url);
        return {
          game_id: game.id,
          name: game.name,
          url: gameUrl.toString(),
          jackpot_level: game.jackpot_level
        };
      });
  
      return reply.code(200).send({
        success: true,
        games: modifiedGames
      });
  
    } catch (error: any) {
      console.error('Error in /get-games:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  });

  fastify.post('/init-game', {
    preHandler: [authenticate]
  }, async (request: FastifyRequest<{ Body: InitGameRequestBody }>, reply: FastifyReply) => {
    try {
      reply.header('Referrer-Policy', 'no-referrer-when-downgrade');
      reply.header('Access-Control-Allow-Origin', '*');
      reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      reply.header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
      const { game_id, user_details } = request.body;
      
      // Validate required game_id
      if (!game_id) {
        return reply.code(400).send({
          success: false,
          error: 'game_id is required'
        });
      }

      if (!user_details) {
        return reply.code(400).send({
          success: false,
          error: 'user_details is required'
        });
      }
  
      // Get the specific game by ID
      const game = await GameList.findOne({
        where: { id: game_id },
        attributes: ['id', 'name', 'label', 'gameRoute', 'banner', 'jackpot_level', 'url']
      });
  
      if (!game) {
        return reply.code(404).send({
          success: false,
          error: 'Game not found with the specified ID'
        });
      }
      const encrypted = encryptor.encryptParams(user_details);
      
      
      // Create modified game URL
      const gameUrl = new URL(game.url);
      
      // Add entire user_details object as a JSON string in URL search params
      if (user_details) {
        gameUrl.searchParams.append('data', encrypted);
      }
  
      return reply.code(200).send({
        success: true,
        game_url: gameUrl.toString(),
        game_id: game.id,
        game_name: game.name
      });
  
    } catch (error: any) {
      console.error('Error in /init-game:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: error.message
      });
    }
  });

  fastify.get('/golden-goose/jackpot-logs', {
    preHandler: [authenticate]
  }, async (request: FastifyRequest<{ Querystring: { start: string; end: string } }>, reply) => {
    try {
      const { start, end } = request.query;
      
      if (!start || !end) {
        return reply.code(400).send({
          success: false,
          error: 'Start and end dates are required'
        });
      }
  
      const startDate = new Date(start);
      startDate.setUTCHours(0, 0, 0, 0);  // Use UTC to avoid timezone issues
      const endDate = new Date(end);
      endDate.setUTCHours(23, 59, 59, 999);

      // If formatDateForSQL isn't working, try this:
      const formattedStart = startDate.toISOString().slice(0, 19).replace('T', ' ');
      const formattedEnd = endDate.toISOString().slice(0, 19).replace('T', ' ');
  
      const query = `
        SELECT 
          j.id, 
          j.user_id as "userId", 
          u.firstName as "firstName",
          j.amount, 
          j.type, 
          j.game_round_id as "gameRoundId", 
          j.createdAt as "createdAt"
        FROM golden_goose_jackpot_logs j
        JOIN users u ON j.user_id = u.id
        WHERE j.createdAt BETWEEN :formattedStart AND :formattedEnd
        ORDER BY j.createdAt DESC
      `;
  
      const logs = await sequelize.query<JackpotLogResult>(query, {
        replacements: { formattedStart, formattedEnd },
        type: QueryTypes.SELECT
      });
  
      return reply.send({ 
        success: true, 
        data: logs
      });
    } catch (error) {
      console.error('Error in /golden-goose/jackpot-logs:', error);
      return reply.code(500).send({ 
        success: false, 
        error: 'Failed to fetch jackpot logs'
      });
    }
  });
  
  fastify.get('/golden-goose/prizes', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const query = `
        SELECT 
          id,
          type,
          amount,
          count,
          createdAt as "createdAt"
        FROM golden_goose_prizes
        ORDER BY amount DESC
      `;
  
      const prizes = await sequelize.query<PrizeResult>(query, {
        type: QueryTypes.SELECT
      });
  
      const totalJackpots = prizes.reduce((sum, prize) => sum + prize.count, 0);
      
      return reply.send({ 
        success: true, 
        data: prizes.map(prize => ({
          id: prize.id,
          type: prize.type,
          amount: prize.amount,
          count: prize.count,
          probability: totalJackpots > 0 ? prize.count / totalJackpots : 0,
          createdAt: prize.createdAt
        }))
      });
    } catch (error) {
      console.error(error);
      return reply.code(500).send({ 
        success: false, 
        error: 'Failed to fetch prize levels' 
      });
    }
  });
  
  
  
  fastify.get('/golden-goose/rounds', {
    preHandler: [authenticate]
  }, async (request: FastifyRequest<{ Querystring: { start: string; end: string } }>, reply) => {
    try {
      const { start, end } = request.query;
      //console.log(start, end)
      
      if (!start || !end) {
        return reply.code(400).send({
          success: false,
          error: 'Start and end dates are required'
        });
      }

      const startDate = new Date(start);
      startDate.setUTCHours(0, 0, 0, 0);  // Use UTC to avoid timezone issues
      const endDate = new Date(end);
      endDate.setUTCHours(23, 59, 59, 999);

      // If formatDateForSQL isn't working, try this:
      const formattedStart = startDate.toISOString().slice(0, 19).replace('T', ' ');
      const formattedEnd = endDate.toISOString().slice(0, 19).replace('T', ' ');
  
      // Raw query to fetch rounds
      const [rounds] = await sequelize.query(`
        SELECT 
          r.id,
          r.user_id as "user_id",
          u.firstName as "firstName",
          r.result,
          r.winning_amount as "winning_amount",
          r.jackpot_amount as "jackpot_amount",
          r.jackpot_type as "jackpot_type",
          r.transaction_number as "transaction_number",
          r.game_id as "game_id",
          r.round_id as "round_id",
          r.crack_count as "crack_count",
          r.eggs,
          r.createdAt as "createdAt"
        FROM golden_goose_rounds r
        JOIN users u ON r.user_id = u.id
        WHERE r.createdAt BETWEEN ? AND ?
        ORDER BY r.createdAt DESC
      `, {
        replacements: [formattedStart, formattedEnd]
      });
  
      const roundIds = (rounds as any[]).map(r => r.round_id);
      
      let betMap: Record<string, number> = {};
      
      // Only query for bets if there are rounds
      if (roundIds.length > 0) {
        // Create a string of placeholders for each round ID
        const placeholders = roundIds.map(() => '?').join(',');
        
        // Raw query to fetch bets
        const [bets] = await sequelize.query(`
          SELECT 
            round_id as "round_id",
            amount
          FROM golden_goose_transactions
          WHERE round_id IN (${placeholders}) AND type = 'bet'
        `, {
          replacements: [...roundIds]
        });
  
        betMap = (bets as any[]).reduce((acc: Record<string, number>, bet) => {
          acc[bet.round_id] = parseFloat(bet.amount.toString());
          return acc;
        }, {});
      }
  
      return reply.send({ 
        success: true, 
        data: (rounds as any[]).map(round => {
          const betAmount = betMap[round.round_id] || 0;
          const winningAmount = parseFloat(round.winning_amount.toString());
          
          return {
            id: round.id,
            user_id: round.user_id,
            firstName: round.firstName || 'Unknown',
            result: round.result,
            winning_amount: winningAmount,
            jackpot_amount: parseFloat(round.jackpot_amount.toString()) || 0,
            jackpot_type: round.jackpot_type,
            transaction_number: round.transaction_number,
            game_id: round.game_id,
            round_id: round.round_id,
            crack_count: round.crack_count,
            eggs: round.eggs || [],
            bet_amount: betAmount,
            payout_ratio: betAmount > 0 ? winningAmount / betAmount : 0,
            createdAt: round.createdAt
          };
        })
      });
    } catch (error) {
      console.error('Error in /golden-goose/rounds:', error);
      return reply.code(500).send({ 
        success: false, 
        error: 'Failed to fetch game rounds' 
      });
    }
  });
  
  fastify.get('/golden-goose/transactions', {
    preHandler: [authenticate]
  }, async (request: FastifyRequest<{ Querystring: { start: string; end: string } }>, reply) => {
    try {
      const { start, end } = request.query;
      
      if (!start || !end) {
        return reply.code(400).send({
          success: false,
          error: 'Start and end dates are required'
        });
      }
  
      const startDate = new Date(start);
      startDate.setUTCHours(0, 0, 0, 0);  // Use UTC to avoid timezone issues
      const endDate = new Date(end);
      endDate.setUTCHours(23, 59, 59, 999);

      // If formatDateForSQL isn't working, try this:
      const formattedStart = startDate.toISOString().slice(0, 19).replace('T', ' ');
      const formattedEnd = endDate.toISOString().slice(0, 19).replace('T', ' ');
  
      const query = `
        SELECT 
          t.id,
          t.user_id as "userId",
          u.firstName as "firstName",
          t.game_id as "game_id",
          t.round_id as "round_id",
          t.transaction_number as "transaction_number",
          t.amount,
          t.type,
          t.createdAt as "createdAt"
        FROM golden_goose_transactions t
        JOIN users u ON t.user_id = u.id
        WHERE t.createdAt BETWEEN :formattedStart AND :formattedEnd
        ORDER BY t.createdAt ASC
      `;
  
      const transactions = await sequelize.query<TransactionResult>(query, {
        replacements: { formattedStart, formattedEnd },
        type: QueryTypes.SELECT
      });
  
      let runningBalance = 0;
      const transactionsWithBalances = transactions.map(tx => {
        const amount = parseFloat(tx.amount.toString());
        const previousBalance = runningBalance;
        
        if (tx.type === 'payout') {
          runningBalance += amount;
        } else {
          runningBalance -= amount;
        }
        
        return {
          id: tx.id,
          user_id: tx.userId,
          firstName: tx.firstName || 'Unknown',
          game_id: tx.game_id,
          round_id: tx.round_id,
          transaction_number: tx.transaction_number,
          amount: amount,
          type: tx.type,
          previous_balance: previousBalance,
          balance_after: runningBalance,
          createdAt: tx.createdAt
        };
      });
  
      transactionsWithBalances.reverse();
  
      return reply.send({ 
        success: true, 
        data: transactionsWithBalances
      });
    } catch (error) {
      console.error('Error in /golden-goose/transactions:', error);
      return reply.code(500).send({ 
        success: false, 
        error: 'Failed to fetch transactions' 
      });
    }
  });
  
  fastify.get('/golden-goose/summary', {
    preHandler: [authenticate]
  }, async (request: FastifyRequest<{ Querystring: { start: string; end: string } }>, reply) => {
    try {
      const { start, end } = request.query;
      
      if (!start || !end) {
        return reply.code(400).send({
          success: false,
          error: 'Start and end dates are required'
        });
      }
    
      const startDate = new Date(start);
      startDate.setUTCHours(0, 0, 0, 0);  // Use UTC to avoid timezone issues
      const endDate = new Date(end);
      endDate.setUTCHours(23, 59, 59, 999);

      // If formatDateForSQL isn't working, try this:
      const formattedStart = startDate.toISOString().slice(0, 19).replace('T', ' ');
      const formattedEnd = endDate.toISOString().slice(0, 19).replace('T', ' ');
  
      // Get all data in parallel
      const [
        betsResult,
        payoutsResult,
        jackpotsResult,
        roundsCount,
        activePlayersCount,
        highestWinResult,
        biggestJackpotResult,
        averageBetResult,
        jackpotBreakdownResult
      ] = await Promise.all([
        // Bets total
        sequelize.query<{total: number}>(`
          SELECT COALESCE(SUM(amount), 0) as total
          FROM golden_goose_transactions
          WHERE type = 'bet' AND createdAt BETWEEN :formattedStart AND :formattedEnd
        `, {
          replacements: { formattedStart, formattedEnd },
          type: QueryTypes.SELECT,
          plain: true
        }),
        
        // Payouts total
        sequelize.query<{total: number}>(`
          SELECT COALESCE(SUM(amount), 0) as total
          FROM golden_goose_transactions
          WHERE type = 'payout' AND createdAt BETWEEN :formattedStart AND :formattedEnd
        `, {
          replacements: { formattedStart, formattedEnd },
          type: QueryTypes.SELECT,
          plain: true
        }),
        
        // Jackpots total
        sequelize.query<{total: number}>(`
          SELECT COALESCE(SUM(amount), 0) as total
          FROM golden_goose_jackpot_logs
          WHERE createdAt BETWEEN :formattedStart AND :formattedEnd
        `, {
          replacements: { formattedStart, formattedEnd },
          type: QueryTypes.SELECT,
          plain: true
        }),
        
        // Round count
        sequelize.query<{count: number}>(`
          SELECT COUNT(*) as count
          FROM golden_goose_rounds
          WHERE createdAt BETWEEN :formattedStart AND :formattedEnd
        `, {
          replacements: { formattedStart, formattedEnd },
          type: QueryTypes.SELECT,
          plain: true
        }),
        
        // Active players count
        sequelize.query<{count: number}>(`
          SELECT COUNT(DISTINCT user_id) as count
          FROM golden_goose_transactions
          WHERE type = 'bet' AND createdAt BETWEEN :formattedStart AND :formattedEnd
        `, {
          replacements: { formattedStart, formattedEnd },
          type: QueryTypes.SELECT,
          plain: true
        }),
        
        // Highest win amount
        sequelize.query<{max: number}>(`
          SELECT COALESCE(MAX(winning_amount), 0) as max
          FROM golden_goose_rounds
          WHERE createdAt BETWEEN :formattedStart AND :formattedEnd
        `, {
          replacements: { formattedStart, formattedEnd },
          type: QueryTypes.SELECT,
          plain: true
        }),
        
        // Biggest jackpot
        sequelize.query<{max: number}>(`
          SELECT COALESCE(MAX(amount), 0) as max
          FROM golden_goose_jackpot_logs
          WHERE createdAt BETWEEN :formattedStart AND :formattedEnd
        `, {
          replacements: { formattedStart, formattedEnd },
          type: QueryTypes.SELECT,
          plain: true
        }),
        
        // Average bet amount
        sequelize.query<{avg: number}>(`
          SELECT COALESCE(AVG(amount), 0) as avg
          FROM golden_goose_transactions
          WHERE type = 'bet' AND createdAt BETWEEN :formattedStart AND :formattedEnd
        `, {
          replacements: { formattedStart, formattedEnd },
          type: QueryTypes.SELECT,
          plain: true
        }),
        
        // Jackpot breakdown
        sequelize.query<{type: string, count: number, total: number}>(`
          SELECT 
            type, 
            COUNT(type) as count, 
            COALESCE(SUM(amount), 0) as total
          FROM golden_goose_jackpot_logs
          WHERE createdAt BETWEEN :formattedStart AND :formattedEnd
          GROUP BY type
        `, {
          replacements: { formattedStart, formattedEnd },
          type: QueryTypes.SELECT
        })
      ]);
    
      // Extract values
      const totalBets = betsResult?.total || 0;
      const totalPayouts = payoutsResult?.total || 0;
      const totalJackpots = jackpotsResult?.total || 0;
      const totalRounds = roundsCount?.count || 0;
      const activePlayers = activePlayersCount?.count || 0;
      const highestWin = highestWinResult?.max || 0;
      const biggestJackpot = biggestJackpotResult?.max || 0;
      const averageBet = averageBetResult?.avg || 0;
      
      // Calculate payout ratio
      const payoutRatio = totalBets > 0 ? (totalPayouts + totalJackpots) / totalBets : 0;
  
      // Process jackpot breakdown
      const jackpotTypes = ['mini', 'minor', 'major', 'grand'] as const;
      const breakdown = jackpotBreakdownResult.reduce((acc: Record<string, number>, item: any) => {
        const type = item.type.toLowerCase();
        if (jackpotTypes.includes(type as JackpotType)) {
          acc[type] = item.total || 0;
        }
        return acc;
      }, {} as Record<JackpotType, number>);
      
      // Ensure all jackpot types are represented
      jackpotTypes.forEach(type => {
        if (!(type in breakdown)) {
          breakdown[type] = 0;
        }
      });
    
      return reply.send({
        success: true,
        data: {
          totalBets,
          totalPayouts,
          totalJackpots,
          totalRounds,
          activePlayers,
          highestWin,
          biggestJackpot,
          averageBet,
          payoutRatio,
          jackpotBreakdown: breakdown
        }
      });
    } catch (error) {
      console.error('Error in /golden-goose/summary:', error);
      return reply.code(500).send({ 
        success: false, 
        error: 'Failed to fetch summary data',
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      });
    }
  });
}