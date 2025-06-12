import { FindOptions, OrderItem, Sequelize, Op, QueryTypes } from 'sequelize';
import Concern from '../models/Concern';
import Conversation from '../models/Conversation';
import ConversationStatusUpdate from '../models/ConversationStatusUpdate';
import Message from '../models/Message';
import User from '../models/User';
import sequelize from "../config/database";
import { successResponse, errorResponse, makeLog, displayMoney } from '../utils/logic';
import Wallet from '../models/Wallet';
import Transaction from '../models/Transaction';
import Gifting from '../models/Gifting';
import HostLikes from '../models/HostLikes';
import ChatRate from '../models/ChatRate';
import GiftWallet from '../models/GiftWallet';
import Game from '../models/Game';
import Log from '../models/Log';
import PlayerBadge from '../models/PlayerBadge';
import Badge from '../models/Badge';
import RepresentativeBetInfo from '../models/RepresentativeBetInfo';
import RepresentativePlayerBets from '../models/RepresentativePlayerBets';
import WinningBall from '../models/WinningBall';
import RepresentativePlayerTransactions from '../models/RepresentativePlayerTransactions';
import Cashier from '../models/Cashier';
import moment from 'moment-timezone';
import LoadTransaction from '../models/LoadTransaction';
import { DEDUCTCREDITS } from '../constants';
import GameList from '../models/GameList';
import { userInfo } from 'os';
import fs from 'fs';
import path from 'path';
import RunwayML from '@runwayml/sdk';

const getAllConversations = async (request, reply) => {
  try {
    const userId = request.query.userId;
    let status = request.query.status;

    if (!userId) {
      return errorResponse('User ID is required', reply, 'custom');
    }

    // Raw SQL query to get the conversations, related data, latest message, and unread messages count
    let query = `
      SELECT
        c.id AS conversation_id,
        c.player_id,
        c.csr_id,
        p.firstName AS player_firstName,
        p.lastName AS player_lastName,
        p.nickName AS player_nickName,
        p.profilePicture AS avatar,
        p.uuid AS playerUUID,
        p.isActive as isPlayerActive, 
        csr.firstName AS csr_firstName,
        csr.lastName AS csr_lastName,
        csr.nickName AS csr_nickName,
        c.concern_id,
        cn.concern_type,
        c.createdAt AS time,
        csu.status AS status,
        c.ticket AS ticket,
        cr.rate AS rate,
        m.message_text AS latest_message,
        m.createdAt AS latest_message_time,
        m.isReadByCSR,
        COUNT(m_unread.id) AS csrUnreadMessageCount  -- Counting unread messages where sender is not the user
      FROM
        conversations c
      LEFT JOIN users p ON c.player_id = p.id
      LEFT JOIN chat_rate cr ON c.id = cr.conversation_id
      LEFT JOIN users csr ON c.csr_id = csr.id
      LEFT JOIN concerns cn ON c.concern_id = cn.id
      LEFT JOIN conversation_status_updates csu ON c.id = csu.conversation_id
      LEFT JOIN (
        SELECT
          m1.conversation_id,
          m1.message_text,
          m1.createdAt,
          m1.isReadByCSR
        FROM
          messages m1
        WHERE
          m1.id IN (
            SELECT MAX(m2.id)
            FROM messages m2
            WHERE m2.conversation_id = m1.conversation_id
            GROUP BY m2.conversation_id
          )
      ) m ON c.id = m.conversation_id
      LEFT JOIN messages m_unread ON c.id = m_unread.conversation_id
        AND m_unread.sender_id != :userId  -- Adding condition to select messages where sender_id is not userId
        AND m_unread.isReadByCSR = false  -- Count only unread messages
      WHERE
        (c.csr_id = :userId OR c.player_id = :userId)
    `;

    if (status && status !== 'false') {
      const validStatuses = ["New", "Ongoing", "Closed"];
      if (validStatuses.includes(status)) {
        query += ` AND csu.status = :status`;
      } else {
        return errorResponse('Invalid status value', reply, 'custom');
      }
    }

    // Modify the ORDER BY to use latest_message_time for sorting
    query += " GROUP BY c.id ORDER BY m.createdAt DESC;";  // Sorting by latest message time

    const conversations = await sequelize.query(query, {
      replacements: { 
        userId: userId, 
        status: status
      },
      type: 'SELECT'
    });

    return successResponse(conversations, 'All active conversations fetched successfully!', reply);
  } catch (error) {
    return errorResponse(`Error fetching conversations: ${error.message}`, reply, 'custom');
  }
};






const getConcerns = async (request, reply) => {
  try {
    const concerns = await Concern.findAll();
    
    if (concerns.length === 0) {
      return errorResponse('No concerns found', reply, 'custom');
    }

    return successResponse(concerns, 'All concerns fetched successfully!', reply);
  } catch (error) {
    return errorResponse(`Error fetching concerns: ${error.message}`, reply, 'custom');
  }
};

const login = async (req, reply) => {
  const { mobile } = req.body;

  
  const user = await User.findOne({ where: { mobile } }); 

  if (!user) {
    return errorResponse('Invalid mobile number', reply, 'custom');
  }

  
  const wallet = await Wallet.findByUserId(user.id); 

  
  if (!wallet) {
    return errorResponse('Wallet not found', reply, 'custom');
  }

  
  const token = req.server.jwt.sign({ mobile: user.mobile }, { expiresIn: '1d' });

  
  return reply
    .setCookie('token', token, {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      maxAge: 24 * 60 * 60 * 1000, 
    })
    .send(successResponse({ token, user, wallet }, 'Login successful!', reply)); 
};


const getWinningBallsWithProbabilities = async (request, reply) => {
  try {

    const today = new Date();
    
    // Set the start time (00:00:00) and end time (23:59:59)
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    // Fetch all winning balls
    const winningBalls = await WinningBall.findAll({
      where: {
        createdAt: {
          [Op.gte]: startOfDay, // greater than or equal to the start of today
          [Op.lte]: endOfDay    // less than or equal to the end of today
        }
      },
      order: [
        ['id', 'DESC'] // Orders by createdAt in descending order
      ]
    });
    
    if (winningBalls.length === 0) {
      return errorResponse("No winning balls found", reply, "custom");
    }

    // Separate balls by game type
    const dosBalls = winningBalls.filter(ball => ball.game === 'dos');
    const zodiacBalls = winningBalls.filter(ball => ball.game === 'zodiac');
    

    // Function to calculate the ball probabilities (percentage of occurrences)
    const calculateBallProbabilities = (balls: any[]) => {
      // Filter out 'void' balls from the balls array
      const filteredBalls = balls.filter(ball => ball.zodiac !== 'void');
      
      const ballCount: Record<string, number> = {};

      // Count occurrences of each ball
      filteredBalls.forEach(ball => {
        ballCount[ball.zodiac] = (ballCount[ball.zodiac] || 0) + 1;
      });

      // Calculate percentages
      const totalBalls = filteredBalls.length;
      const ballProbabilities: { ball: string, percentage: number }[] = [];

      for (const ball in ballCount) {
        const count = ballCount[ball];
        const percentage = ((count / totalBalls) * 100).toFixed(2);
        ballProbabilities.push({ ball, percentage: parseFloat(percentage) });
      }

      return ballProbabilities;
    };

    // Get probabilities for 'dos' and 'zodiac' games
    const dosBallProbability = calculateBallProbabilities(dosBalls);
    const zodiacBallProbability = calculateBallProbabilities(zodiacBalls);

    // Send success response with dosBalls, zodiacBalls, and their probabilities
    return successResponse({
      dosBalls,
      dosBallProbability,
      zodiacBalls,
      zodiacBallProbability,
    }, "Winning balls and probabilities fetched successfully!", reply);

  } catch (error) {
    return errorResponse(`Error fetching winning balls: ${error.message}`, reply, "custom");
  }
};


const getHosts = async (request, reply) => {
  try {
    const users = await sequelize.query(
      `SELECT 
        u.id,
        u.username,
        u.email,
        u.firstName,
        u.lastName,
        u.nickName,
        u.gender,
        u.siteId,
        u.status,
        u.role,
        u.birthdate,
        u.profilePicture,
        u.isActive,
        u.accountId,
        u.uuid,
        hp.hostName, 
        hp.location, 
        hp.birthday, 
        hp.facebookLink, 
        hp.assetId,
        GROUP_CONCAT(DISTINCT h.name ORDER BY h.name SEPARATOR ', ') AS hobbies
      FROM 
        users u
      LEFT JOIN \`host-profile\` hp ON u.id = hp.userId
      LEFT JOIN \`host-hobbies\` hh ON u.id = hh.hostProfileId
      LEFT JOIN hobbies h ON hh.hobbyId = h.id
      WHERE 
        u.role = 'host'
      GROUP BY 
        u.id, 
        u.username, 
        u.email, 
        u.firstName, 
        u.lastName, 
        u.nickName, 
        u.gender, 
        u.siteId, 
        u.status, 
        u.role, 
        u.birthdate, 
        u.profilePicture, 
        u.isActive, 
        u.accountId,
        u.uuid,
        hp.hostName, 
        hp.location, 
        hp.birthday, 
        hp.facebookLink, 
        hp.assetId
      ORDER BY 
        hp.hostName`,  // Adjusted to sort by username, or you can change it based on your preference
      {
        model: User,
        mapToModel: true,
        raw: false,
      }
    );

    if (users.length === 0) {
      return errorResponse('No users found', reply, 'custom');
    }

    return successResponse(users, 'All users fetched successfully!', reply);
  } catch (error) {
    return errorResponse(`Error fetching hosts: ${error.message}`, reply, 'custom');
  }
};

const getTotalPlayerBetsForLastMonth = async (request, reply) => {
  const { userId } = request.query; // Assuming userId is passed as a query parameter

  try {
    // Ensure userId is provided
    if (!userId) {
      return errorResponse('Please provide userId', reply, 'custom');
    }

    // Get the current date
    const currentDate = new Date();

    // Get the date one month ago from the current date
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(currentDate.getMonth() - 1);
    oneMonthAgo.setHours(0, 0, 0, 0);

    // Fetch the total bet amount for the player from the current date to one month ago
    const result = await Transaction.sum('amount', {
      where: {
        wallet_id: userId, // Filter by player (userId or walletId)
        type: 'bet', // Only consider bet transactions
        createdAt: {
          [Op.between]: [oneMonthAgo, currentDate], // Filter for the last month (from one month ago to today)
        },
      },
    });

    

    return successResponse({ totalAmount: result || false}, 'Total amount for the player\'s bets fetched successfully!', reply);
  } catch (error) {
    return errorResponse(`Error fetching total bets: ${error.message}`, reply, 'custom');
  }
};

const getGames = async (request: any, reply: any) => {
  const options: FindOptions = {
    attributes: ["id", "name", "label", "isActive", "isStreaming", "moderatorRoute", "gameRoute", "updatedAt", "createdAt"],
  };
  try {
    const gamesList = await GameList.findAll(options);
    const totalCount = await GameList.count();
    const payload = {
      content: gamesList,
      totalCount,
    };
    return successResponse(
      payload,
      "Get All Games is successfully fetched!",
      reply
    );
  } catch (error) {
    return errorResponse("Games not found", reply, "custom");
  }
};



const getTransactionCountForLastWeek = async (request, reply) => {
  const { userId } = request.query; // Assuming userId is passed as a query parameter

  try {
    // Ensure userId is provided
    if (!userId) {
      return errorResponse('Please provide userId', reply, 'custom');
    }

    // Get the current date
    const currentDate = new Date();

    // Get the date one week ago from the current date
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(currentDate.getDate() - 7); // Subtract 7 days from the current date
    oneWeekAgo.setHours(0, 0, 0, 0);

    // Count and group the number of transactions by game_id for the player from one week ago to today
    const transactionCounts = await Transaction.findAll({
      attributes: [
        'game_id', // Group by game_id
        [sequelize.fn('COUNT', sequelize.col('id')), 'transactionCount'], // Count the transactions
      ],
      where: {
        wallet_id: userId, // Filter by player (userId or walletId)
        type: 'bet',
        createdAt: {
          [Op.between]: [oneWeekAgo, currentDate], // Filter for the date range (from one week ago to today)
        },
      },
      group: ['game_id'], // Group the results by game_id
      raw: true, // To return plain data
    });

    // Return the transaction counts grouped by game_id
    return successResponse(transactionCounts.length, 'Transaction counts for the player grouped by game_id in the last week fetched successfully!', reply);
  } catch (error) {
    return errorResponse(`Error fetching transaction counts: ${error.message}`, reply, 'custom');
  }
};

const checkUserLoginLastWeek = async (request, reply) => {
  const { userId } = request.query; // Assuming userId is passed as a query parameter

  try {
    // Ensure userId is provided
    if (!userId) {
      return errorResponse('Please provide userId', reply, 'custom');
    }

    // Get the current date and the date 7 days ago
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7); // Subtract 7 days to get the date for comparison
    sevenDaysAgo.setHours(0, 0, 0, 0); // Set time to midnight
    
    // Query the Log model to check if the user logged in last week
    const loginLogs = await Log.findAll({
      where: {
        associatedId: userId,
        description: "login player", // Filter logs for login events
        createdAt: {
          [Op.gte]: sevenDaysAgo, // Only consider logs from the last 7 days
          [Op.lte]: today, // Up until today
        },
      },
      order: [["createdAt", "ASC"]], // Order the logs chronologically
    });

    
    // Check if there are logs for the last 7 days, and if they cover consecutive days
    const loggedInDates = loginLogs.map(log => log.createdAt?.toISOString().split('T')[0]); // Get unique dates of login attempts
    const uniqueDates = [...new Set(loggedInDates)]; // Remove duplicates

    
    // Check if the user has logged in every day in the past 7 days
    const hasLoggedInWholeWeekLastWeek = uniqueDates.length >= 7;

    return successResponse(
      { loggedInWholeWeekLastWeek: hasLoggedInWholeWeekLastWeek },
      `User has ${hasLoggedInWholeWeekLastWeek ? '' : 'not '}logged in for the past consecutive 7 days`,
      reply
    );
  } catch (error) {
    return errorResponse(`Error checking user login: ${error.message}`, reply, 'custom');
  }
};


const getTopGifters = async (request, reply) => {
  try {
    // Get today's date
    const today = new Date();
    const currentMonth = today.getMonth(); // Current month (0-11)
    const currentYear = today.getFullYear(); // Current year
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0); // Last day of the current month

    // Check if today is the last day of the month
    const isLastDayOfMonth = today.getDate() === lastDayOfMonth.getDate();

    // If today is not the last day of the month, return an empty array
    if (!isLastDayOfMonth) {
      return successResponse([], 'Today is not the last day of the month, no top gifters.', reply);
    }

    // If today is the last day of the month, proceed with fetching top gifters
    const whereClause: { createdAt?: { [Op.gte]: Date; [Op.lte]: Date } } = {};

    // Get the first day of the current month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);

    // Filter gifts by the range from the first day of the current month to today
    whereClause.createdAt = {
      [Op.gte]: firstDayOfMonth, // Greater than or equal to the first day of the month
      [Op.lte]: today, // Less than or equal to today
    };

    // Fetch the top 10 gifters based on the highest total gift amount
    const topGifters = await Gifting.findAll({
      attributes: [
        'gifter_id', // Gifter's ID
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalGiftAmount'], // Sum of the gift amounts
      ],
      where: whereClause, // Add the where condition to filter by date
      group: ['gifter_id'], // Group by gifter_id
      having: sequelize.fn('SUM', sequelize.col('amount')), // Ensure only gifters with a positive total amount are included
      order: [[sequelize.fn('SUM', sequelize.col('amount')), 'DESC']], // Order by total gift amount in descending order
      limit: 10, // Limit to the top 10 gifters
    });

    // Return the response with top gifters
    return successResponse(topGifters || false, 'Top 10 gifters fetched successfully', reply);
  } catch (error) {
    // Handle error
    return errorResponse(`Error fetching top gifters: ${error.message}`, reply, 'custom');
  }
};

const checkIfUserHasActiveBadge = async (request, reply) => {
  const { userId, uuid } = request.query;
  let whereConditions = {}
  const currentDate = new Date();
  if (uuid) {
    const user = await User.findOne({ where: { uuid }})
    whereConditions[Op.or] = [
      {
        userId: user?.id, 
        expirationDate: { [Op.gt]: currentDate }, // Badge is still valid (expirationDate is in the future)
      },
    ]
  } else if (userId){
    whereConditions[Op.or] = [
      {
        userId, 
        expirationDate: { [Op.gt]: currentDate }, // Badge is still valid (expirationDate is in the future)
      },
    ]
  }
 
  try {

    // Check if the user has any active badges and order them by Badge rank in ascending order
    const activeBadge = await PlayerBadge.findAll({
      where: whereConditions, 
      include: [
        {
          model: Badge, // Include the Badge model
          as: "badge",  // Use the alias for the Badge association
          attributes: ['description','rank'], // Only include the rank field from the Badge model
        },
      ],
      order: [
        [{ model: Badge, as: 'badge' }, 'rank', 'ASC'], // Order by rank in ascending order
      ],
    });

    // Return the active badge status and order them by rank
    return successResponse(activeBadge || false, 'Active badge status successfully fetched', reply);
  } catch (error) {
    return errorResponse(`Error fetching active badge status: ${error.message}`, reply, 'custom');
  }
};

const createPlayerBadge = async (request, reply) => {
  const { badgeId, userId, expirationDate } = request.body;
  try {
    // Ensure all required data is provided
    if (!badgeId || !userId || !expirationDate) {
      return errorResponse('Please provide badgeId, userId, and expirationDate', reply, 'custom');
    }

    // Check if the badge exists
    const badge = await Badge.findByPk(badgeId);
    if (!badge) {
      return errorResponse('Badge not found', reply, 'custom');
    }

    // Check if the user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return errorResponse('User not found', reply, 'custom');
    }

    if (badgeId === 4) {
      const count = await PlayerBadge.count({
        where: {
          badgeId: 4,
          expirationDate: {
            [Op.gt]: new Date(), // Ensures the badge has not expired
          },
        },
      });

      if (count >= 10) {
        return errorResponse('The maximum limit of 10 active badges with badgeId 4 has been reached.', reply, 'custom');
      }
    }

    // Check if the user already has the badge and it is not expired
    const existingPlayerBadge = await PlayerBadge.findOne({
      where: {
        userId,
        badgeId,
        expirationDate: {
          [Op.gt]: new Date(), // Ensures the badge has not expired
        },
      },
    });

    // If an existing non-expired badge is found, skip creating the badge
    if (existingPlayerBadge) {
      return successResponse(
        { data: existingPlayerBadge },
        'User already has a non-expired badge',
        reply
      );
    }

    // Create a new PlayerBadge record if no valid existing badge
    const newPlayerBadge = await PlayerBadge.create({
      badgeId,
      userId,
      expirationDate, // Expiration date should be passed in the proper format
    });

    // Return success response with the created PlayerBadge
    return successResponse(
      { data: newPlayerBadge },
      'Player badge created successfully',
      reply
    );
  } catch (error) {
    console.error('Error creating player badge:', error);
    return errorResponse(
      `Error creating player badge: ${error.message}`,
      reply,
      'custom'
    );
  }
};


// const getBadgeByUserId = async (request, reply) => {
//   const { userId } = request.query; // Assuming userId is passed as a query parameter

//   // Ensure userId is provided
//   if (!userId) {
//     return errorResponse('Please provide userId', reply, 'custom');
//   }

//   try {
//     // Query the PlayerBadge model, joining with the Badge model to fetch badge info
//     const playerBadge = await PlayerBadge.findOne({
//       where: { userId: userId }, // Filter by userId
//       include: {
//         model: Badge, // Join with the Badge model
//         as: "badge", // Alias to access the badge info in the response
//         required: true, // Ensure only PlayerBadges with a corresponding Badge are returned
//       },
//     });

//     // Return the success response
//     return successResponse(
//       { activePlayerBadge: playerBadge || false },
//       'Active badge status successfully fetched',
//       reply
//     );
//   } catch (error) {
//     console.error('Error fetching activeBadge status:', error);
//     // Return the error response
//     return errorResponse(
//       `Error fetching activeBadge status: ${error.message}`,
//       reply,
//       'custom'
//     );
//   }
// };

const getHostRanking = async (request, reply) => {
  try {
    const hosts = await sequelize.query(
      `SELECT 
        u.id,
        u.username,
        u.email,
        u.firstName,
        u.lastName,
        u.nickName,
        u.gender,
        u.siteId,
        u.status,
        u.role,
        u.birthdate,
        u.profilePicture,
        u.isActive,
        u.accountId,
        u.uuid,
        hp.hostName, 
        hp.location, 
        hp.birthday, 
        hp.facebookLink, 
        hp.assetId,
        ga.name as zodiac,
        COALESCE(g.totalAmount, 0) AS totalAmount,
        GROUP_CONCAT(DISTINCT h.name ORDER BY h.name SEPARATOR ', ') AS hobbies
      FROM 
        users u
      LEFT JOIN \`host-profile\` hp ON u.id = hp.userId
       LEFT JOIN \`game-assets\` ga ON hp.assetId = ga.id
      LEFT JOIN (
        SELECT host_id, SUM(amount) AS totalAmount
        FROM giftings
        WHERE YEAR(createdAt) = YEAR(CURRENT_DATE)
        AND MONTH(createdAt) = MONTH(CURRENT_DATE)
        GROUP BY host_id
      ) g ON u.id = g.host_id
      LEFT JOIN \`host-hobbies\` hh ON u.id = hh.hostProfileId
      LEFT JOIN hobbies h ON hh.hobbyId = h.id
      WHERE 
        u.role = 'host' 
      GROUP BY 
        u.id, 
        u.username, 
        u.email, 
        u.firstName, 
        u.lastName, 
        u.nickName, 
        u.gender, 
        u.siteId, 
        u.status, 
        u.role, 
        u.birthdate, 
        u.profilePicture, 
        u.isActive, 
        u.accountId,
        u.uuid,
        hp.hostName, 
        hp.location, 
        hp.birthday, 
        hp.facebookLink, 
        hp.assetId
      ORDER BY 
        totalAmount DESC`,
      {
        model: User,
        mapToModel: true,
        raw: false,
      }
    );

    if (hosts.length === 0) {
      return errorResponse('No hosts found', reply, 'custom');
    }

    return successResponse(hosts, 'All hosts fetched successfully!', reply);
  } catch (error) {
    return errorResponse(`Error fetching hosts: ${error.message}`, reply, 'custom');
  }
};





const getDailyPlayerRanking = async (request, reply) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const players = await sequelize.query(
      `SELECT u.*, COALESCE(t.totalWon, 0) AS totalWon
      FROM 
        users u
      LEFT JOIN (
        SELECT wallet_id, SUM(amount) AS totalWon
        FROM transactions
        WHERE createdAt BETWEEN :startOfDay AND :endOfDay AND type = 'wonprize'
        GROUP BY wallet_id
      ) t ON u.id = t.wallet_id
      WHERE 
        u.role = 'player' AND totalWon > 0 
      ORDER BY 
        totalWon DESC`,
      {
        replacements: { startOfDay, endOfDay },
        model: User,
        mapToModel: true,
        raw: false,
      }
    );

    if (players.length === 0) {
      return errorResponse('No players found', reply, 'custom');
    }

    return successResponse(players, 'Daily player ranking fetched successfully!', reply);
  } catch (error) {
    return errorResponse(`Error fetching daily player ranking: ${error.message}`, reply, 'custom');
  }
};



const getTopGiversRanking = async (request, reply) => {
  try {
    const hostId = request.query.hostId;

    if (!hostId) {
      return errorResponse('Host ID is required', reply, 'custom');
    }

    const topGivers = await sequelize.query(
      `SELECT u.*, COALESCE(g.totalAmount, 0) AS totalAmount
       FROM users u
       LEFT JOIN (
         SELECT gifter_id, SUM(amount) AS totalAmount
         FROM giftings
         WHERE host_id = :hostId
           AND MONTH(createdAt) = MONTH(CURRENT_DATE)
           AND YEAR(createdAt) = YEAR(CURRENT_DATE)
         GROUP BY gifter_id
       ) g ON u.id = g.gifter_id
       WHERE g.totalAmount > 0
       ORDER BY totalAmount DESC`,
      {
        replacements: { hostId },
        type: QueryTypes.SELECT,
      }
    );

    return successResponse(topGivers, 'Top givers fetched successfully!', reply);
  } catch (error) {
    return errorResponse(`Error fetching top givers: ${error.message}`, reply, 'custom');
  }
};


async function getOverallTopGiversRanking(request, reply) {
  try {
    const topGivers = await sequelize.query(
      `SELECT u.*, COALESCE(g.totalAmount, 0) AS totalAmount
       FROM users u
       LEFT JOIN (
         SELECT gifter_id, SUM(amount) AS totalAmount
         FROM giftings
         WHERE MONTH(createdAt) = MONTH(CURRENT_DATE)
           AND YEAR(createdAt) = YEAR(CURRENT_DATE)
         GROUP BY gifter_id
       ) g ON u.id = g.gifter_id
       WHERE g.totalAmount > 0
       ORDER BY totalAmount DESC`,
      {
        type: QueryTypes.SELECT,
      }
    );

    return successResponse(topGivers, 'Top givers fetched successfully!', reply);
  } catch (error) {
    return errorResponse(`Error fetching top givers: ${error.message}`, reply, 'custom');
  }
}




const getPlayerIdByUUID = async (request, reply) => {
    try {
      const uuid = request.query.uuid; // Get userId from query parameters
  
      if (!uuid) {
        return errorResponse('UUID is required', reply, 'custom');
      }
  
      const fetchedUUID = await User.findByUUID(uuid);
  
      if (!fetchedUUID) {
        return errorResponse('UUID not found', reply, 'custom');
      }
  
      return successResponse(fetchedUUID, 'All active users fetched successfully!', reply);
    } catch (error) {
      return errorResponse(`Error fetching conversations: ${error.message}`, reply, 'custom');
    }
  };

  const generateUniqueId = () => {
    return Math.floor(Math.random() * 1000000); // Replace with your unique ID logic
  };

  const createConversation = async (request, reply) => {
      try {
          const { player_id, csr_id } = request.body; // Only player_id and csr_id

          // Validation for required fields
          if (!player_id || !csr_id) {
              return errorResponse('Player ID and CSR ID are required', reply, 'custom');
          }

          // Fetch player's mobile number
          const player = await User.findByPk(player_id);
          if (!player) {
              return errorResponse('Player not found', reply, 'custom');
          }
          let mobileNumber = player.mobile;
          let mobileLastTwoDigits = mobileNumber.slice(-2);

          // Format the current date as MMDDYYYY
          const today = new Date();
          const formattedDate = `${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}${today.getFullYear()}`;

          // Generate the unique ID
          const uniqueId = generateUniqueId();

          // Construct the ticket
          const ticket = `${formattedDate}${mobileLastTwoDigits}-${uniqueId}`;

          // Create the conversation with the ticket
          const newConversation = await Conversation.create({
              player_id,
              csr_id,
              ticket,
              // concern_id will be set later
          });

          return successResponse({ id: newConversation.id }, 'Conversation created successfully!', reply);
      } catch (error) {
          return errorResponse(`Error creating conversation: ${error.message}`, reply, 'custom');
      }
  };




  const rateChat = async (request, reply) => {
    try {
      const { player_id, csr_id, conversation_id, rate } = request.body; // Should use request.body for POST
     
      const newConversation = await ChatRate.create({
        player_id,
        csr_id,
        conversation_id,
        rate
      });
      
      return successResponse("SUCCESS", 'rating created successfully!', reply);
    } catch (error) {
      return errorResponse(`Error rating a chat: ${error.message}`, reply, 'custom');
    }
  };
  
const createConversationUpdate = async (request, reply) => {
    try {
      const { conversation_id, status, updated_by } = request.body;
      const newStatusUpdate = await ConversationStatusUpdate.create({
        conversation_id,
        status,
        updated_by,
      });
      return successResponse({ update_id: newStatusUpdate.id }, 'Conversation created successfully!', reply);
    } catch (error) {
        return errorResponse('Error creating createConversationUpdate', reply, 'custom');
    }
  }

  const getMessagesByConvoId = async (request, reply) => {
    try {
        const convoId = request.query.convoId;
        if (!convoId) {
            return errorResponse('convoId is required', reply, 'custom');
        }

        const getSenderInfo = async (id) => {
            const user = await User.findByPk(id);
            return { role: user.role, nickName: user.nickName };
        };

        const messages = await Message.findAll({ where: { conversation_id: convoId } });
        const conversation = await Conversation.findByPk(convoId);

        if (!conversation) {
            return errorResponse('Conversation not found', reply, 'custom');
        }

        const player = await User.findOne({ where: { id: conversation.player_id } });
        const csr = await User.findOne({ where: { id: conversation.csr_id } });

        // Ensure player and csr exist
        if (!player || !csr) {
            return errorResponse('Player or CSR not found', reply, 'custom');
        }

        const formattedMessages = await Promise.all(messages.map(async (msg) => {
            const senderInfo = await getSenderInfo(msg.sender_id);
            return {
                message_id: msg.id,
                conversation_id: msg.conversation_id,
                sender_id: msg.sender_id,
                message_text: msg.message_text,
                createdAt: msg.createdAt,
                sender_nickName: senderInfo.nickName,
                player_nickName: player.nickName,
                csr_nickName: csr.nickName,
                sender_role: senderInfo.role,
                isRead:msg.isRead,
                isImage:msg.isImage,
                isReadByCsr:msg.isReadByCSR
            };
        }));

        return successResponse(formattedMessages, 'All active messages fetched successfully!', reply);

    } catch (error) {
        return errorResponse(`Error fetching messages: ${error.message}`, reply, 'custom');
    }
};

const getRepresentativeTransaction = async (request, reply) => {
  try {
    const representativeId = request.query.representativeId;
    if (!representativeId) {
      return errorResponse('representativeId is required', reply, 'custom');
    }

    // Step 1: Get all RepresentativeBetInfo for the given representativeId
    const representativeBetInfo = await RepresentativeBetInfo.findAll({
      where: { representative_id: representativeId }
    });

    if (!representativeBetInfo.length) {
      return errorResponse('No representative bet information found', reply, 'custom');
    }

    // Step 2: Get all RepresentativePlayerBets related to these betInfos
    const representativeBetInfoIds = representativeBetInfo.map(betInfo => betInfo.id);
    const representativePlayerBets = await RepresentativePlayerBets.findAll({
      where: {
        representative_bet_info_id: representativeBetInfoIds
      }
    });

    // Step 3: Map player bets by bet info ID for easy lookup
    const playerBetsByBetInfoId = representativePlayerBets.reduce((acc, playerBet) => {
      if (!acc[playerBet.representative_bet_info_id]) {
        acc[playerBet.representative_bet_info_id] = [];
      }
      acc[playerBet.representative_bet_info_id].push({
        bet_id: playerBet.id,
        zodiac_ball_name: playerBet.zodiac_ball_name,
        quantity: playerBet.quantity,
        total_bet: playerBet.total_bet,
        bet_type: playerBet.bet_type
      });
      return acc;
    }, {});

    // Step 4: Get the current day and overall transaction counts and amounts
    const currentDate = new Date();
    const currentStartOfDay = new Date(currentDate.setHours(0, 0, 0, 0)); // current day 00:00:00
    const currentEndOfDay = new Date(currentDate.setHours(23, 59, 59, 999)); // current day 23:59:59

    const currentDayTransactions = await RepresentativeBetInfo.findAll({
      where: {
        representative_id: representativeId,
        createdAt: {
          [Op.between]: [currentStartOfDay, currentEndOfDay]
        }
      }
    });

    const overallTransactions = await RepresentativeBetInfo.findAll({
      where: { representative_id: representativeId }
    });

    // Aggregate data
    const currentDayTransactionCount = currentDayTransactions.length;
    const overallTransactionCount = overallTransactions.length;

    // Sum up the `total_amount` fields directly as numbers and avoid leading zeros
    const currentDayTotalAmount = currentDayTransactions.reduce((total, betInfo) => {
      return total + Number(betInfo.total_amount);
    }, 0);

    const overallTotalAmount = overallTransactions.reduce((total, betInfo) => {
      return total + Number(betInfo.total_amount);
    }, 0);

    // Optionally, you can format the total amount to 2 decimal places
    const formattedCurrentDayTotalAmount = currentDayTotalAmount.toFixed(2);
    const formattedOverallTotalAmount = overallTotalAmount.toFixed(2);

    // Step 5: Format the result
    const formattedTransactions = representativeBetInfo.map(betInfo => {
      const playerBets = playerBetsByBetInfoId[betInfo.id] || [];
      return {
        bet_info_id: betInfo.id,
        game_name: betInfo.game_name,
        ticket_number: betInfo.ticket_number,
        total_number_of_bets: betInfo.total_number_of_bets,
        total_amount: betInfo.total_amount,
        payment_amount: betInfo.payment_amount,
        change_amount: betInfo.change_amount,
        transaction_date: betInfo.createdAt,
        player_bets: playerBets
      };
    });

    // Include the aggregated data in the response
    const response = {
      formattedTransactions,
      current_day_transaction_count: currentDayTransactionCount,
      overall_transaction_count: overallTransactionCount,
      current_day_total_amount: formattedCurrentDayTotalAmount, // Formatted value
      overall_total_amount: formattedOverallTotalAmount, // Formatted value
    };

    return successResponse(response, 'Representative transactions fetched successfully!', reply);

  } catch (error) {
    return errorResponse(`Error fetching representative transaction: ${error.message}`, reply, 'custom');
  }
};







const getPlayerBalance = async (request, reply) => {
  try {
      const id = request.query.id;
      if (!id) {
          return errorResponse('id is required', reply, 'custom');
      }
      const user = await User.findOne({ where: { uuid: id } });
      const playerBalance = await Wallet.findOne({ where: { user_id: user?.id } });
      return successResponse(playerBalance.balance, 'balance fetched!', reply);

  } catch (error) {
      return errorResponse(`Error fetching messages: ${error.message}`, reply, 'custom');
  }
};

const getTopWinnerAmount = async (request, reply) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const result = await sequelize.query(`
     SELECT         
     w.id AS wallet_id, u.uuid AS user_id, u.profilePicture, u.firstName, u.lastName, 
     SUM(t.amount) AS totalWonPrize FROM transactions t JOIN wallets w ON t.wallet_id = w.id      
     JOIN users u ON w.user_id = u.id      
     WHERE t.createdAt BETWEEN :startOfDay AND :endOfDay AND t.type = 'wonprize' GROUP BY w.id, u.uuid, u.profilePicture 
     ORDER BY totalWonPrize DESC LIMIT 3;
    `, { replacements: { startOfDay, endOfDay },type: QueryTypes.SELECT });

    if (result.length > 0) {
      return successResponse({ topWinners: result }, 'Top winner amount fetched!', reply);
    } else {
      return null; // No transactions found
    }
  } catch (error) {
    return errorResponse(`Error fetching top winner amount: ${error.message}`, reply, 'custom');
  }
};



const getUserById = async (request, reply) => {
  try {
      const id = request.query.id;
      if (!id) {
          return errorResponse('id is required', reply, 'custom');
      }
      const user = await User.findOne({ where: { id: id } });
      

      return successResponse(user, 'user fetched!', reply);

  } catch (error) {
      return errorResponse(`Error fetching messages: ${error.message}`, reply, 'custom');
  }
};


const updateConversationConcern = async (request, reply) => {
    try {
        const { id, concern_id } = request.body;

        if (!id || !concern_id) {
            return errorResponse('Both conversationId and concernId are required', reply, 'custom');
        }

        const conversation = await Conversation.findOne({ where: { id: id } });

        if (!conversation) {
            return errorResponse('Conversation not found', reply, 'custom');
        }

        // Update concern_id
        conversation.concern_id = concern_id;

        // Fetch the concern to get the initials
        const concern = await Concern.findByPk(concern_id);
        let initials = "";

        if (concern) {
            const concernTypeWords = concern.concern_type.split(' ');
            initials = concernTypeWords.map(word => word.charAt(0).toUpperCase()).join('');
        }

        // Get the current ticket value
        const currentTicket = conversation.ticket;

        // Prepend initials to the current ticket
        conversation.ticket = `${initials}${currentTicket}`;

        // Save the updated conversation
        await conversation.save();

        return successResponse({ message: 'Conversation concern updated successfully!' }, 'Conversation concern updated successfully!', reply);
    } catch (error) {
        return errorResponse(`Error updating conversation concern: ${error.message}`, reply, 'custom');
    }
  };

  const getConvo = async (request, reply) => {
    try {
        const { conversationId } = request.query;

        if (!conversationId) {
            return errorResponse('Both conversationId and concernId are required', reply, 'custom');
        }

        const conversation = await Conversation.findOne({ where: { id: conversationId } });
        const conversationStatusUpdates = await ConversationStatusUpdate.findOne({ where: { conversation_id: conversationId } });
        const chatRate = await ChatRate.findOne({ where: { conversation_id: conversationId } });

        if (!conversation) {
            return errorResponse('Conversation not found', reply, 'custom');
        }

        

        return successResponse({ conversation, conversationStatusUpdates, chatRate }, 'Fetched Convo successfully!', reply);
    } catch (error) {
        return errorResponse(`Error fetching conversation concern: ${error.message}`, reply, 'custom');
    }
  };


  const checkConvoHasConcern = async (request, reply) => {
    try {
      const { convoId } = request.query;
  
      if (!convoId) {
        return errorResponse('ConvoId is required', reply, 'custom');
      }
  
      const conversation = await Conversation.findOne({ where: { id: convoId } });
  
      if (!conversation) {
        return errorResponse('Conversation not found', reply, 'custom');
      }
  
      const concern = conversation.concern_id;
  
      return successResponse({ hasConcern: concern ? true : false }, 'Conversation concern has fetched successfully!', reply);
    } catch (error) {
      return errorResponse(`Error fetching conversation concern: ${error.message}`, reply, 'custom');
    }
  };
  

  const updateConversationStatus = async (request, reply) => {
    try {
      const { id, status } = request.body;
  
      if (!id || !status) {
        return errorResponse('Both conversationId and status are required', reply, 'custom');
      }
  
      const conversationStatusUpdates = await ConversationStatusUpdate.findOne({ where: { conversation_id: id } });
  
      if (!conversationStatusUpdates) {
        return errorResponse('ConversationStatusUpdates not found', reply, 'custom');
      }
  
      conversationStatusUpdates.status = status;
      await conversationStatusUpdates.save();
  
      return successResponse({ message: 'Conversation status updated successfully!' }, 'Conversation status updated successfully!', reply);
    } catch (error) {
      return errorResponse(`Error updating conversation concern: ${error.message}`, reply, 'custom');
    }
  };
  const updateMessageRead = async (request, reply) => {
    try {
      const { conversation_id, role } = request.body;
  
      // Check if conversation_id is provided
      if (!conversation_id) {
        return errorResponse('conversation_id is required', reply, 'custom');
      }
  
      // Check if role is valid
      if (!role || (role !== 'player' && role !== 'csr')) {
        return errorResponse('Invalid role. Expected "player" or "csr".', reply, 'custom');
      }
  
      let updatedCount;
  
      // Handle 'player' role
      if (role === 'player') {
        // Update unread messages for player
        [updatedCount] = await Message.update(
          { isRead: true },
          { where: { conversation_id, isRead: false } } // Update only unread messages
        );
      }
  
      // Handle 'csr' role
      if (role === 'csr') {
        // Update unread messages for CSR
        [updatedCount] = await Message.update(
          { isReadByCSR: true },
          { where: { conversation_id, isReadByCSR: false } } // Update only unread messages
        );
      }
  
      // Return success response
      return successResponse(
        { message: 'Messages marked as read successfully!', updatedCount },
        'Messages updated successfully!',
        reply
      );
  
    } catch (error) {
      // Catch and handle any errors
      return errorResponse(`Error updating messages: ${error.message}`, reply, 'custom');
    }
  };
  
  

  const sendGift = async (request, reply) => {
    const t = await sequelize.transaction(); // Start a transaction
  
    try {
      const { hostId, senderId, amount } = request.body;
  
      // Validate input
      if (!hostId || !senderId || !amount) {
        return errorResponse("Missing required fields: hostId, senderId, gameId, or amount", reply);
      }

      const latestGameId = await Game.findOne({
        order: [['id', 'DESC']],  // Order by id in descending order to get the latest
        attributes: ['id'],  // Only select the game_id column
      });
      
      const latestGameIdValue = latestGameId ? latestGameId.id : null;
  
      // Find the sender's wallet
      const senderWallet = await Wallet.findByUserId(senderId);
      if (!senderWallet) {
        throw new Error("Sender's wallet not found");
      }
  
      // Check if the sender has enough balance
      if (senderWallet.balance < amount) {
        throw new Error("Insufficient balance");
      }
  
      // Create the gifting record
      const gifting = await Gifting.create(
        {
          host_id: hostId,
          gifter_id: senderId,
          amount: amount,
        },
        { transaction: t } // Use the transaction
      );
  
      // Create the transaction record
      const transaction = await Transaction.create({
        wallet_id: senderWallet.id,
        game_id: latestGameIdValue,
        amount,
        type: "sendGift",
        previousBalance: senderWallet.balance,
        status:'SUCCESS',
      }, { transaction: t });
  
      // Update the sender's wallet balance
      senderWallet.balance -= amount;
      await senderWallet.save({ transaction: t }); // Save wallet changes
  
      // Update GiftWallet where id is 1
      const giftWallet = await GiftWallet.findByPk(1); // Find the GiftWallet by ID 1
      if (!giftWallet) {
        throw new Error("GiftWallet not found");
      }
  
      // Update the GiftWallet amount, latest_sender_id, latest_host_id, and updatedAt
      giftWallet.amount += amount; // Add the new amount
      giftWallet.latest_sender_id = senderId; // Update latest_sender_id
      giftWallet.latest_host_id = hostId; // Update latest_host_id
      giftWallet.updatedAt = new Date(); // Update timestamp
      await giftWallet.save({ transaction: t }); // Save changes
  
      await t.commit(); // Commit the transaction
  
      return successResponse({ message: 'Successfully sent gift!' }, 'Successfully sent gift!', reply);
    } catch (error) {
      await t.rollback(); // Rollback the transaction in case of an error
      return errorResponse(`Error sending gift: ${error.message}`, reply, 'custom');
    }
  };
  

  const likeHost = async (request, reply) => {
    try {
      const { hostId, likerId } = request.body;
  
      // Validate input
      if (!hostId || !likerId) {
        return errorResponse("Missing required fields: hostId, likerId", reply);
      }
  
      // Check for existing like
      const existingLike = await HostLikes.findOne({
        where: {
          host_id: hostId,
          liker_id: likerId
        }
      });
  
      if (existingLike) {
        // If already liked, remove the like (unlike)
        await existingLike.destroy();
        return successResponse({ liked: false }, "Successfully unliked the host!", reply);
      } else {
        // If not liked yet, create the like record
        await HostLikes.create({
          host_id: hostId,
          liker_id: likerId
        });
        return successResponse({ liked: true }, "Successfully liked the host!", reply);
      }
    } catch (error) {
      return errorResponse(`Error liking/unliking the host: ${error.message}`, reply, 'custom');
    }
  };

  const checkLikedHost = async (request, reply) => {
    try {
      const { hostId, likerId } = request.query;
  
      // Validate input
      if (!hostId || !likerId) {
        return errorResponse("Missing required fields: hostId, likerId", reply);
      }
  
      // Check for existing like
      const existingLike = await HostLikes.findOne({
        where: {
          host_id: hostId,
          liker_id: likerId
        }
      });
  
      if (existingLike) {
        return successResponse({ liked: true }, "Host is Liked!", reply);
      } else {
        return successResponse({ liked: false }, "Host is not already liked!", reply);
      }
    } catch (error) {
      return errorResponse(`Error liking/unliking the host: ${error.message}`, reply, 'custom');
    }
  };

  const countLikes = async (request, reply) => {
    try {
      const { hostId } = request.query;
  
      // Validate input
      if (!hostId) {
        return errorResponse("Missing required fields: hostId", reply);
      }
      const count = await HostLikes.count({
        where: {
          host_id: hostId
        }
      });
      return successResponse({ count }, "Count successfully!", reply);
    } catch (error) {
      return errorResponse(`Error counting the likes: ${error.message}`, reply, 'custom');
    }
  };

  const getGameHistory = async (request, reply) => {
    try {
        const { game } = request.query;

        // Validate input
        if (!game) {
            return errorResponse("Missing required field: game", reply);
        }

        // Find all winning balls for the specified game, ordered by id descending
        const winningBalls = await WinningBall.findAll({
            where: {
                game: game
            },
            order: [['id', 'DESC']]
        });

        return successResponse({ winningBalls }, "Winning balls retrieved successfully!", reply);
    } catch (error) {
        return errorResponse(`Error retrieving winning balls: ${error.message}`, reply, 'custom');
    }
  };


  const getTransactionStatistics2 = async (request, reply) => {
    try {
      let query = `
        SELECT 
          u.nickName AS player_name, 
          g.name AS game_name, 
          SUM(CASE WHEN t.type = 'bet' THEN t.amount ELSE 0 END) AS total_bet, 
          SUM(CASE WHEN t.type = 'wonprize' THEN t.amount ELSE 0 END) AS total_wonprize
        FROM transactions t
        LEFT JOIN users u ON u.id = t.wallet_id  -- Assuming wallet_id is a reference to User
        LEFT JOIN games g ON g.id = t.game_id
        WHERE t.type IN ('bet', 'wonprize')
        GROUP BY u.id, g.id, u.nickName, g.name  -- Include non-aggregated columns in GROUP BY
        ORDER BY t.createdAt DESC;  -- Sorting by the createdAt field of the transaction in descending order
      `;
  
      const transactionStats = await sequelize.query(query, {
        type: 'SELECT',
      });
  
      return successResponse(transactionStats, 'Transaction statistics fetched successfully!', reply);
  
    } catch (error) {
      console.error(error);
      return errorResponse(`Error fetching transaction statistics: ${error.message}`, reply, 'custom');
    }
  };
  
  const getTransactionStatistics = async (request, reply) => {
    const { page, size, sort, filter } = request.query;
    let whereConditions = {};

    // whereConditions["type"] = { [Op.in]: ["bet", "wonprize"] };

    const offset = page * size;

    // Get today's date (start of day and end of day)
    const startOfDay = moment().startOf('day').toDate();
    const endOfDay = moment().endOf('day').toDate();

    const options: any = {
      where: {
        type: 'wonprize', // Only consider 'wonprize' type transactions
        createdAt: {
          [Op.gte]: startOfDay, // greater than or equal to start of today
          [Op.lte]: endOfDay    // less than or equal to end of today
        }
      },
      attributes: [
        [
          sequelize.fn(
            'SUM',
            sequelize.literal("CASE WHEN type = 'wonprize' THEN amount ELSE 0 END")
          ),
          'totalWonPrize'
        ]
      ],
      group: ['wallet_id'], // Group by game name and player
      include: [
        {
          model: Game,
          attributes: ['name'], // Include the game name
        },
        {
          model: Wallet,
          attributes: ["user_id", "balance"],
          include: [
            {
              model: User,
              attributes: ["nickName"], // Include player name (nickName)
            },
          ],
        },
      ],
      offset,
      limit: size,
      order: [
        ['createdAt', 'DESC'] // Order by createdAt in descending order
      ]
    };

    const result = await Transaction.findAll(options);

    const payload = {
      content: result.map((item: any) => ({
        totalWonPrize: item.get('totalWonPrize') || 0,
        gameName: item?.game?.name || "",
        playerName: item?.Wallet?.User?.nickName || ""
      }))
    };

    return successResponse(
      payload,
      "Total Winnings per Player and Game for Today fetched successfully!",
      reply
    );
  }

  const getRepresentativePlayerTransactions = async (request, reply) => {
    try {
      // Get today's date
      const currentDate = new Date();
      const startOfDay = new Date(currentDate.setHours(0, 0, 0, 0)); // Reset to midnight for the start of today
      const endOfDay = new Date(currentDate.setHours(23, 59, 59, 999)); // End of today (23:59:59)
  
      // Query for unclaimedWinnings (status: 'Unclaimed', 'unclaimedWinnings')
      const unclaimedWinnings = await RepresentativePlayerTransactions.findAll({
        where: {
          status: 'Unclaimed',
        },
      });
  
      // Query for claimedWinnings (status: 'Claimed', 'claimedWinnings')
      const claimedWinnings = await RepresentativePlayerTransactions.findAll({
        where: {
          status: 'Claimed',
        },
        include: [
          {
            model: Cashier,
            as: 'cashiers', // Use the alias defined in the `hasMany` association
            required: true, // Ensures only transactions with a corresponding cashier are returned
          },
        ],
      });
  
      // Query for loseBettings (status: 'Unavailable', 'loseBettings')
      const loseBettings = await RepresentativePlayerTransactions.findAll({
        where: {
          status: 'Unavailable',
        },
      });
  
      // Counts for each type of transaction
      const unclaimedWinningsCount = unclaimedWinnings.length;
      const claimedWinningsCount = claimedWinnings.length;
      const loseBettingsCount = loseBettings.length;
  
      // Daily sum of winning_amount for claimedWinnings (sum for today)
      const dailyClaimedWinnings = await RepresentativePlayerTransactions.sum('winning_amount', {
        where: {
          status: 'Claimed',
          updatedAt: {
            [Op.between]: [startOfDay, endOfDay], // Filter for today's transactions
          },
        },
      });
  
      // Overall sum of winning_amount for claimedWinnings (sum for all time)
      const overallClaimedWinnings = await RepresentativePlayerTransactions.sum('winning_amount', {
        where: {
          status: 'Claimed',
        },
      });
  
      // Calculate total_player_bets_per_today (Sum of total_bet from RepresentativePlayerBets for today's date)
      const totalPlayerBetsToday = await RepresentativePlayerBets.sum('total_bet', {
        where: {
          createdAt: {
            [Op.between]: [startOfDay, endOfDay], // Filter for today's bets
          },
        },
      });
  
      // Calculate total_player_losses_today (Sum of total_bet for 'Unavailable' bets today)
      const totalPlayerLossesToday = await RepresentativePlayerTransactions.sum('bet_amount', {
        where: {
          status: 'Unavailable',
          createdAt: {
            [Op.between]: [startOfDay, endOfDay], // Filter for today's losses
          },
        },
      });
  
      // Format the response
      return successResponse(
        {
          unclaimedWinnings,
          claimedWinnings,
          loseBettings,
          unclaimedWinningsCount,
          claimedWinningsCount,
          loseBettingsCount,
          dailyClaimedWinnings: dailyClaimedWinnings || 0,
          overallClaimedWinnings: overallClaimedWinnings || 0,
          totalPlayerBetsToday: totalPlayerBetsToday || 0,
          totalPlayerLossesToday: totalPlayerLossesToday || 0,
        },
        'Representative player transactions fetched successfully!',
        reply
      );
    } catch (error) {
      return errorResponse(`Error fetching representative player transactions: ${error.message}`, reply, 'custom');
    }
  };

  
const claimRepresentativePlayerTransactions = async (request, reply) => {
  const { representativePlayerTransactions, user_id } = request.body; // Array of transactions to claim, and the user_id

  // Check if both parameters are provided
  if (!representativePlayerTransactions || !user_id) {
    return errorResponse('Please provide representativePlayerTransactions and user_id', reply, 'custom');
  }

  let t;

  try {
    // Start a transaction
    t = await sequelize.transaction();

    // Find the wallet for the user
    // const wallet = await Wallet.findByUserId(user_id);
    const user = await User.findByPk(user_id);
    // if (!wallet) {
    //   throw new Error('Wallet not found for the user');
    // }

    // Calculate the total amount to deduct from wallet
    let totalDeduction = 0;
    for (const transaction of representativePlayerTransactions) {
      const { id, amount } = transaction;

      // Fetch the representative player transaction by ID
      const representativeTransaction = await RepresentativePlayerTransactions.findOne({
        where: { id },
        transaction: t,
      });

      if (!representativeTransaction) {
        throw new Error(`Representative player transaction with ID ${id} not found`);
      }

      // Ensure the transaction is unclaimed
      if (representativeTransaction.status !== 'Unclaimed') {
        throw new Error(`Transaction ID ${id} is not in an unclaimed state`);
      }

      // Add the amount to the total deduction
      totalDeduction += parseFloat(amount);

      // Update the transaction status to 'Claimed'
      representativeTransaction.status = 'Claimed';
      await representativeTransaction.save({ transaction: t });

      await Cashier.create({
        transactionId: representativeTransaction.id, // You can use the transaction ID for reference
        cashierId: user.uuid, // The user who is claiming the transaction
      }, { transaction: t });
    }

    // Ensure the wallet has enough balance for the deduction
    // if (wallet.balance < totalDeduction) {
    //   throw new Error('Insufficient wallet balance');
    // }

    // Deduct the total amount from the user's wallet
    // wallet.balance = parseFloat((wallet.balance - totalDeduction).toFixed(2));
    // await wallet.save({ transaction: t });

    // Commit the transaction
    await t.commit();

    return successResponse({message:'Representative player transactions claimed successfully!'},'Representative player transactions claimed successfully!', reply);
  } catch (error) {
    if (t) await t.rollback(); // Rollback in case of error
    return errorResponse(`Error claiming transactions: ${error.message}`, reply, 'custom');
  }
};

const generateVideo = async (request, reply) => {
  try {
    const { images, prompt } = request.body.params;
    
    // Initialize RunwayML client with your API secret
    const client = new RunwayML({
      apiKey: process.env.RUNWAYML_API_SECRET
    });

    // Ensure the directory exists
    const generatedVideosDir = path.join(__dirname, '../public/uploads/images/generatedVideos');
    if (!fs.existsSync(generatedVideosDir)) {
      fs.mkdirSync(generatedVideosDir, { recursive: true });
    }
    
    const details = await client.organization.retrieve();
    console.log('CREDIT BALANCE IS ', details.creditBalance);
    console.log('CLIENT DETAILS ', details);
    
    // We'll process the first image only for this example
    const imageData = images[0];
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Create a temporary file path
    const tempFileName = `temp_${Date.now()}.png`;
    const tempFilePath = path.join(generatedVideosDir, tempFileName);
    
    // Save the temporary image file
    fs.writeFileSync(tempFilePath, buffer);

    try {
      // Create a new image-to-video task
      const imageToVideo = await client.imageToVideo.create({
        model: 'gen4_turbo',
        promptImage: `data:image/png;base64,${base64Data}`,
        promptText: prompt || 'Generate a video from this image',
        ratio: '1280:720',
        duration: 10, // 10 seconds
      });

      const taskId = imageToVideo.id;
      console.log(`Started video generation task: ${taskId}`);

      // Poll the task until it's complete
      let task;
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts * 10 seconds = 5 minutes max
      
      do {
        // Wait for ten seconds before polling
        await new Promise(resolve => setTimeout(resolve, 10000));
        task = await client.tasks.retrieve(taskId);
        attempts++;
        
        console.log(`Task status (attempt ${attempts}): ${task.status}`);
        
        // ADD THIS: Log the entire task object to see its structure
        console.log('Full task object:', JSON.stringify(task, null, 2));
        
        if (attempts >= maxAttempts) {
          throw new Error('Video generation timed out');
        }
      } while (!['SUCCEEDED', 'FAILED'].includes(task.status));

      if (task.status === 'FAILED') {
        throw new Error('Video generation failed: ' + (task.error || 'Unknown error'));
      }

      // MODIFIED: Try different possible property names for the video URL
      let videoUrl = null;
      
      // Check various possible property names
      if (task.result) {
        videoUrl = task.result;
      } else if (task.output) {
        videoUrl = task.output;
      } else if (task.outputs && task.outputs.length > 0) {
        videoUrl = task.outputs[0];
      } else if (task.artifacts && task.artifacts.length > 0) {
        videoUrl = task.artifacts[0].url || task.artifacts[0];
      } else if (task.video) {
        videoUrl = task.video;
      } else if (task.videoUrl) {
        videoUrl = task.videoUrl;
      }

      console.log('Found video URL:', videoUrl);

      if (!videoUrl) {
        console.error('Task object structure:', JSON.stringify(task, null, 2));
        throw new Error('No video URL found in task result. Check console for task structure.');
      }

      // Download the video
      const videoFileName = `video_${Date.now()}.mp4`;
      const videoFilePath = path.join(generatedVideosDir, videoFileName);
      
      console.log('Downloading video from:', videoUrl);
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }
      
      // Use arrayBuffer() for fetch response
      const videoArrayBuffer = await response.arrayBuffer();
      const videoBuffer = Buffer.from(videoArrayBuffer);
      fs.writeFileSync(videoFilePath, videoBuffer);

      console.log('Video saved to:', videoFilePath);

      // Clean up temporary image file
      fs.unlinkSync(tempFilePath);

      // Use your custom success response format
      return successResponse(
        {
          videoFile: videoFileName,
          message: 'Video generated successfully'
        },
        'Video generated successfully!',
        reply
      );

    } catch (error) {
      // Clean up temporary file if something went wrong
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error generating video:', error);
    
    // Use your custom error response format
    return errorResponse(
      `Error generating video: ${error.message}`,
      reply,
      'custom'
    );
  }
};

  

  
  
  

export default {
  getAllConversations,
  createConversation,
  createConversationUpdate,
  getPlayerIdByUUID,
  getMessagesByConvoId,
  getConcerns,
  updateConversationConcern,
  updateConversationStatus,
  checkConvoHasConcern,
  getPlayerBalance,
  getUserById,
  getTopWinnerAmount,
  getHosts,
  sendGift,
  getHostRanking,
  getTopGiversRanking,
  getDailyPlayerRanking,
  likeHost,
  checkLikedHost,
  countLikes,
  rateChat,
  updateMessageRead,
  getConvo,
  getTotalPlayerBetsForLastMonth,
  getTransactionCountForLastWeek,
  checkUserLoginLastWeek,
  getTopGifters,
  checkIfUserHasActiveBadge,
  createPlayerBadge,
  getRepresentativeTransaction,
  getTransactionStatistics,
  getTransactionStatistics2,
  getWinningBallsWithProbabilities,
  getRepresentativePlayerTransactions,
  claimRepresentativePlayerTransactions,
  getOverallTopGiversRanking,
  login,
  getGames,
  getGameHistory,
  generateVideo,
};
