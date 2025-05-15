import WebSocket from 'ws';
import { hasValue } from '../../../common/gameutils';
import User from '../../models/User';
import GoldenGoosePrize from '../../models/GoldenGoosePrize';
import GoldenGooseRound from '../../models/GoldenGooseRound';
import GoldenGooseJackpotLog from '../../models/GoldenGooseJackpotLog';
import { JACKPOT_CONFIG } from '../../config/goldenGoose/jackpot_config';
import sequelize from "../../config/database";
import GameList from '../../models/GameList';
import createEncryptor from '../../utils/createEncryptor';
import GoldenGooseTransaction from '../../models/GoldenGooseTransaction';
import { UUIDV4 } from 'sequelize';
import { randomBytes } from 'crypto';
import axios from 'axios';
const { Mutex } = require('async-mutex');
const mutex = new Mutex();

const fs = require('fs');
const path = require('path');

interface UserInfo {
  id: number;                
  name: string; 
  credits: number;
}

type ResponseData = {
  event: string;
  data: any[];
  id: any;
  luckyPlayer?: string;  // Optional property
  jackpotPrize?: number; // Optional property
  jackpotType?: string;  // Optional property
  currentPrizePool: any;
  updatedCredit: any;
};

const wss = new WebSocket.Server({ noServer: true });
const clients: Set<WebSocket> = new Set();
type PlayerData = {
  userId: string; // Assuming userId is a string, adjust if needed
  bet: number;
  gameStarted: boolean;
  gameOver: boolean;
  clickedEgg: any; // Replace 'any' with the actual type of clickedEgg
  isWinner: boolean;
  eggs: any[]; // Replace 'any' with the actual type of your eggs array
  jackpotPrize: number;
  jackpotType: string;
  game_id: string;
  round_id: string;
  transaction_number: string;
  playerGameOver: boolean;
};

const encryptor = createEncryptor(process.env.ENCRYPTION_SECRET);

const allPlayerData: Map<string, PlayerData> = new Map();

const PING_INTERVAL = 10000;
let pingIntervalId: NodeJS.Timeout | null = null;

function goldenGoose(fastify) {
  fastify.register(require("@fastify/static"), {
    root: path.join(__dirname, "src/live_chat"), // Path to your chatImages folder
    prefix: `${process.env.PREFIX}/imgs`,  // The prefix for frontend access
  });
  
  fastify.server.on('upgrade', async (request, socket, head) => {
    const url = new URL(request.url, 'http://localhost');
    const path = url.pathname;
    
    if (path === '/api/golden-goose') {
      try {
        const queryParams = url.searchParams;
        const encryptedUserInfo = queryParams.get('userInfo');
        if (hasValue(encryptedUserInfo)) {
          const decrypted = encryptor.decryptParams(encryptedUserInfo);
          const userData: UserInfo = decrypted;
          wss.handleUpgrade(request, socket, head, async (ws) => {
            wss.emit('connection', ws, userData);
          });
        }
        
      } catch (err) {
        console.error('JWT token verification failed:', err.message);
        socket.destroy();
      }
    }
  });
  
  wss.on('connection', async (socket: WebSocket, userData: UserInfo ) => {
    console.log(`User connected: ${JSON.stringify(userData.name)} with ID ${JSON.stringify(userData.id)}`);
    
    clients.add(socket);

    socket.on('message', async (message) => {
      
      const data = JSON.parse(message.toString());

      if (data.event === 'startGame') {
        const playerData = data.data;
        const userId = playerData.userId;
    
        if (userId) {
            try {
                const game_id = '4'; // Fixed game_id as per requirement
                const round_id = `4${userId}${Date.now()}`; // Unique round_id combining game_id, userId and timestamp
                const transaction_number = `KFH-${randomBytes(10).toString('hex')}`; // Using UUID for unique transaction number
                
                // Create transaction record
                const transaction = await GoldenGooseTransaction.create({
                    game_id,
                    round_id,
                    transaction_number,
                    amount: Number(playerData.bet),
                    type: 'bet' as const,
                    user_id: userId, 
                });
    
                const isTesting = process.env.IS_TESTING;
                if (isTesting === 'false') {
                    try {
                        const callbackData = {
                            player_id: userId,
                            action: 'bet',
                            round_id: round_id,
                            amount: playerData.bet.toString(),
                            game_uuid: game_id,
                            transaction_id: transaction_number
                        };
    
                        const callbackResponse = await axios.post(process.env.KINGFISHER_API, callbackData);
                        console.log('Callback successful:', callbackResponse.data);
                        
                        playerData.updatedCredit = callbackResponse.data.credit;
                    } catch (callbackError) {
                        console.error('Error in API callback:', callbackError);
                        playerData.updatedCredit = 0;
                    }
                }
                
                console.log('Transaction record created:', transaction.transaction_number);
                
                playerData.game_id = game_id;
                playerData.round_id = round_id;
                playerData.transaction_number = transaction_number;
                playerData.playerGameOver = false;
    
                // Check and award jackpot with the round_id
                let jackpotPrize = { amount: null as number | null, type: null as string | null };
                jackpotPrize = await checkJackpot();
                
                if (jackpotPrize?.amount) {
                    await awardJackpot(userId, jackpotPrize.amount, round_id); // Pass round_id here
                    const jackpotAmountStr = jackpotPrize.amount.toString();
                    const eggs = playerData.eggs;
                    playerData.jackpotPrize = jackpotPrize.amount;
                    playerData.jackpotType = jackpotPrize.type;
                
                    // Handle egg updates for jackpot display
                    const itemCounts: Record<string, number> = {};
                    eggs.forEach(egg => {
                        if (egg.scratched) itemCounts[egg.item] = (itemCounts[egg.item] || 0) + 1;
                    });
                    const winningItem = Object.entries(itemCounts).find(([_, count]) => count >= 3)?.[0];
                
                    if (winningItem) {
                        // Replace all winningItem eggs with jackpot value
                        eggs.forEach(egg => {
                            if (egg.item === winningItem) egg.item = jackpotAmountStr;
                        });
                    } else {
                        // Remove 3 random eggs (if enough eggs)
                        for (let i = 0; i < 3 && eggs.length > 0; i++) {
                            const randomIndex = Math.floor(Math.random() * eggs.length);
                            eggs.splice(randomIndex, 1);
                        }
                
                        const jackpotColor = getRandomColor(); // Metallic gold color
                        // Add 3 new eggs with jackpot value
                        for (let i = 0; i < 3; i++) {
                            const newEgg = {
                                id: eggs.length > 0 ? Math.max(...eggs.map(e => e.id)) + 1 : i,
                                item: jackpotAmountStr,
                                scratched: false,
                                cracked: false,
                                showCracked: false,
                                color: jackpotColor, 
                                textShadow: '0 0 3.5px white, 0 0 3.5px white'
                            };
                            const randomPos = Math.floor(Math.random() * (eggs.length + 1));
                            eggs.splice(randomPos, 0, newEgg);
                        }
                    }
                }
    
                allPlayerData.set(userId, playerData);
    
                // Update prize pools
                try {
                    const betAmount = Number(playerData.bet);
                    
                    // Find existing records
                    const [instantPrize, jackpotPrize, appProfit] = await Promise.all([
                        GoldenGoosePrize.findOne({ where: { type: 'instant_prize' } }),
                        GoldenGoosePrize.findOne({ where: { type: 'jackpot_prize' } }),
                        GoldenGoosePrize.findOne({ where: { type: 'app_profit' } })
                    ]);
                
                    // Update or create records with proper numeric operations
                    await Promise.all([
                        instantPrize 
                            ? instantPrize.update({ 
                                amount: sequelize.literal(`amount + ${betAmount * 0.5}`),
                            })
                            : GoldenGoosePrize.create({
                                type: 'instant_prize',
                                amount: betAmount * 0.5,
                            }),
                        
                        jackpotPrize
                            ? jackpotPrize.update({ 
                                amount: sequelize.literal(`amount + ${betAmount * 0.1}`),
                            }) 
                            : GoldenGoosePrize.create({
                                type: 'jackpot_prize',
                                amount: betAmount * 0.1,
                                count: 0
                            }),
                        
                        appProfit
                            ? appProfit.update({ 
                                amount: sequelize.literal(`amount + ${betAmount * 0.4}`),
                            })
                            : GoldenGoosePrize.create({
                                type: 'app_profit',
                                amount: betAmount * 0.4,
                            })
                    ]);
                
                    console.log('Successfully updated prize records');
                } catch (error) {
                    console.error('Error updating prize records:', error);
                }
    
                // Get updated instant prize pool
                const instantPrizePool = await GoldenGoosePrize.findOne({
                    where: { type: 'instant_prize' },
                });
                
                // Prepare response
                const playersArray = Array.from(allPlayerData.values());
                const responseData: ResponseData = {
                    event: 'receiveAllPlayerData',
                    data: playersArray,
                    id: userId,
                    currentPrizePool: instantPrizePool?.amount || 0,
                    updatedCredit: playerData.updatedCredit
                };
            
                // Broadcast to all clients
                const response = JSON.stringify(responseData);
                clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(response);
                    }
                });
    
            } catch (error) {
                console.error('Error in startGame handler:', error);
            }
        }
      }

      if (data.event === 'updatePlayerEggs') {
        const playerData = data.data;
        const userId = playerData.userId ? playerData.userId : false;
        
        if (userId) {
          // Check if player exists in the Map
          if (allPlayerData.has(userId)) {
              // Get the existing player data
              const existingPlayer = allPlayerData.get(userId);
              
              // Update only the eggs property
              allPlayerData.set(userId, {
                  ...existingPlayer,
                  eggs: playerData.eggs
              });
  
              const instantPrizePool = await GoldenGoosePrize.findOne({
                  where: { type: 'instant_prize' },
              });
  
              // Convert Map values to array for response
              const playersArray = Array.from(allPlayerData.values());
              
              const response = JSON.stringify({
                  event: 'receiveAllPlayerData',
                  data: playersArray,
                  id: userId,
                  currentPrizePool: instantPrizePool?.amount || 0
              });
            
              // Send to all connected clients
              clients.forEach(client => {
                  if (client.readyState === WebSocket.OPEN) {
                      client.send(response);
                  }
              });
          } else {
              console.log(`Player with userId ${userId} not found`);
          }
        }
      }

      if (data.event === 'updatePlayerIsWinner') {
        const playerData = data.data;
        const userId = playerData.userId ?? false;  // Using nullish coalescing for cleaner code
        
        if (userId) {
          // Check if player exists in the Map
          if (allPlayerData.has(userId)) {
              // Get the existing player data and update isWinner status
              const existingPlayer = allPlayerData.get(userId);
              
              allPlayerData.set(userId, {
                  ...existingPlayer,
                  isWinner: playerData.isWinner
              });
  
              const instantPrizePool = await GoldenGoosePrize.findOne({
                  where: { type: 'instant_prize' },
              });
  
              // Convert Map values to array for response
              const playersArray = Array.from(allPlayerData.values());
              
              const response = JSON.stringify({
                  event: 'receiveAllPlayerData',
                  data: playersArray,
                  id: userId,
                  currentPrizePool: instantPrizePool?.amount || 0  // Safe navigation
              });
            
              // Broadcast to all connected clients
              clients.forEach(client => {
                  if (client.readyState === WebSocket.OPEN) {
                      client.send(response);
                  }
              });
          } else {
              console.log(`Player with userId ${userId} not found`);
          }
        }
      }

      if (data.event === 'updatePlayerClickedEgg') {
        const playerData = data.data;
        const userId = playerData.userId ?? false; // Using nullish coalescing operator
        
        if (userId) {
          // Check if player exists in the Map
          if (allPlayerData.has(userId)) {
              // Get existing player data and update clickedEgg
              const existingPlayer = allPlayerData.get(userId)!; // Non-null assertion as we checked has()
              
              // Update player data immutably
              allPlayerData.set(userId, {
                  ...existingPlayer,
                  clickedEgg: playerData.clickedEgg
              });
  
              // Get current prize pool
              const instantPrizePool = await GoldenGoosePrize.findOne({
                  where: { type: 'instant_prize' },
              });
  
              // Prepare response with all player data
              const response = JSON.stringify({
                  event: 'receiveAllPlayerData',
                  data: Array.from(allPlayerData.values()), // Convert Map values to array
                  id: userId,
                  currentPrizePool: instantPrizePool?.amount || 0 // Safe access with fallback
              });
              
              // Broadcast update to all connected clients
              clients.forEach(client => {
                  if (client.readyState === WebSocket.OPEN) {
                      client.send(response);
                  }
              });
          } else {
              console.log(`Player with userId ${userId} not found`);
          }
        }
      }

      if (data.event === 'updatePlayerGameOver') {
        const playerData = data.data;
        const userId = playerData.userId ? playerData.userId : false;
        
        if (userId) {
            if (allPlayerData.has(userId)) {
                const resultTransactionNumber = `KFH-${randomBytes(10).toString('hex')}`;
                const player = allPlayerData.get(userId)!;
                const updatedPlayer = {
                    ...player,
                    gameOver: playerData.gameOver
                };
                allPlayerData.set(userId, updatedPlayer);
    
                const eggs = updatedPlayer.eggs;
    
                const itemOccurrences = eggs.reduce((acc: Record<string, number>, egg) => {
                    if (egg.scratched) {
                        acc[egg.item] = (acc[egg.item] || 0) + 1;
                    }
                    return acc;
                }, {});
              
                const winningItem = Object.entries(itemOccurrences).find(([item, count]: [string, number]) => count >= 3);
    
                
                
                // Create GoldenGooseRound record with prize logic
                try {
                    let winningAmount = 0;
                    let prizeToDeduct = 0;
                    let jackpotAmount = 0;
                    let jackpotType = 'none';
                    let updatedCredit = 0;
                    
                    // Check if this is a jackpot win
                    const isJackpotWin = updatedPlayer.jackpotPrize !== 0 && 
                                        winningItem && 
                                        parseFloat(winningItem[0]) === updatedPlayer.jackpotPrize;
                    
                      if (winningItem) {
                        if (isJackpotWin) {
                            // For jackpot win, use the jackpot prize directly without deducting from instant prize
                            winningAmount = updatedPlayer.jackpotPrize;
                            jackpotAmount = winningAmount;
                            jackpotType = updatedPlayer.jackpotType || 'jackpot';
                        } else {
                            // Regular win - deduct from instant prize
                            const instantPrize = await GoldenGoosePrize.findOne({
                                where: { type: 'instant_prize' }
                            });
                            
                            if (instantPrize) {
                                const itemValue = parseFloat(winningItem[0]);
                                const availablePrize = parseFloat(instantPrize.amount.toString());
                                
                                // Determine the actual winning amount
                                winningAmount = Math.min(itemValue, availablePrize);
                                prizeToDeduct = winningAmount;
                                
                                // Update the instant_prize amount
                                const newPrizeAmount = availablePrize - prizeToDeduct;
                                await instantPrize.update({
                                    amount: newPrizeAmount
                                });
                                
                                console.log(`Updated instant_prize to ${newPrizeAmount}`);
                            }
                        }
                      }
                    
                    // Create the round record
                    const scratchedEggsCount = eggs.filter(egg => egg.scratched === true).length;
                    if (!updatedPlayer.playerGameOver) {
                      
                      const updatedPlayerWithGameOver = {
                          ...updatedPlayer,
                          playerGameOver: true
                      };

                      allPlayerData.set(userId, updatedPlayerWithGameOver);

                      await GoldenGooseRound.create({
                        user_id: updatedPlayer.userId,
                        result: !winningItem ? 'Lose' : 'Win',
                        winning_amount: winningAmount,
                        jackpot_amount: jackpotAmount,
                        jackpot_type: jackpotType,
                        transaction_number: updatedPlayer.transaction_number, // Added from playerData
                        game_id: updatedPlayer.game_id, // Added from playerData
                        round_id: updatedPlayer.round_id,
                        crack_count: scratchedEggsCount,
                        eggs: updatedPlayer.eggs,
                      });
                      
                      await GoldenGooseTransaction.create({
                        game_id: '4',
                        round_id: updatedPlayer.round_id,
                        transaction_number: resultTransactionNumber,
                        amount: winningAmount,
                        type: 'payout',
                        user_id: userId, 
                      });
                    }

                  
                    const isTesting = process.env.IS_TESTING_GOLDEN_GOOSE;
                    if(isTesting === 'false'){try {
                      if (!updatedPlayer.playerGameOver) {
                        
                        const updatedPlayerWithGameOver = {
                            ...updatedPlayer,
                            playerGameOver: true
                        };

                        allPlayerData.set(userId, updatedPlayerWithGameOver);
                        
                        const callbackData = {
                            player_id: userId,
                            action: !winningItem ? 'lose' : 'win',
                            round_id: updatedPlayer.round_id,
                            amount: winningAmount,
                            game_uuid: updatedPlayer.game_id,
                            transaction_id: resultTransactionNumber,
                            transaction_bet_id: updatedPlayer.transaction_number
                        };
                
                        const callbackResponse = await axios.post(process.env.KINGFISHER_API, callbackData);
                        console.log('Callback successful:', callbackResponse.data);
                        updatedCredit = callbackResponse.data.credit;
                      }
                    } catch (callbackError) {
                        console.error('Error in API callback:', callbackError);
                        playerData.updatedCredit = 0;
                    }}
                    
                    allPlayerData.delete(userId);
                    const playersArray = Array.from(allPlayerData.values());

                    // Send immediate update with gameOver status
                    const immediateResponse = JSON.stringify({
                        event: 'receiveAllPlayerData',
                        data: playersArray,
                        id: userId,
                        updatedCredit: updatedCredit
                    });
                    
                    clients.forEach(client => {
                      if (client.readyState === WebSocket.OPEN) {
                          client.send(immediateResponse);
                      }
                  });
                    
                    console.log('GoldenGooseRound record created successfully');
                } catch (error) {
                  console.error('Error in gameOver processing:', error);
                  // Ensure player is removed even if there's an error
                  if (allPlayerData.has(userId)) {
                    allPlayerData.delete(userId);
                  }
                  console.error('Error processing prize or creating GoldenGooseRound record:', error);
                }

                const playersArray = Array.from(allPlayerData.values());

                const delayedResponse = JSON.stringify({
                    event: 'receiveAllPlayerData',
                    data: playersArray
                });
                
                clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(delayedResponse);
                    }
                });

                // Get the main jackpot prize pool
                const instantPrizePool = await GoldenGoosePrize.findOne({
                  where: { type: 'instant_prize' },
                });

                if(instantPrizePool){
                  const instantPrizeResponse = JSON.stringify({
                    event: 'receiveCurrentInstantPrize',
                    data: {currentPrizePool: instantPrizePool.amount }
                  });
              
                  clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                      client.send(instantPrizeResponse);
                    }
                  });
                }
            } else {
                console.log(`Player with userId ${userId} not found`);
            }
        }
      }

      if (data.event === 'updatePlayerGameStarted') {
        const playerData = data.data;
        const userId = playerData.userId ? playerData.userId : false;
        
        if (userId) {
          const instantPrizePool = await GoldenGoosePrize.findOne({
            where: { type: 'instant_prize' },
          });
          if (allPlayerData.has(userId)) {
            const existingPlayer = allPlayerData.get(userId)!;
            allPlayerData.set(userId, {
              ...existingPlayer,
              gameStarted: playerData.gameStarted
          });
              const response = JSON.stringify({
                event: 'receiveAllPlayerData',
                data: Array.from(allPlayerData.values()),
                id: userId,
                currentPrizePool: instantPrizePool.amount 
              });
            
              clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(response);
                }
              });
          } else {
              console.log(`Player with userId ${userId} not found`);
          }
        }
      }
    });

    socket.on('close', async (code, reason) => {
      console.log(`User disconnected with code: ${code} and reason: ${reason}`);
      clients.delete(socket);
    });

    
    
    async function initializeJackpots() {
      const transaction = await sequelize.transaction();
      
      // Initialize the main jackpot prize pool
      const [jackpotPrize] = await GoldenGoosePrize.findOrCreate({
        where: { type: 'jackpot_prize' },
        defaults: { amount: 0, count: 0 }, // Initialize with 0 amount and count
        transaction,
        lock: transaction.LOCK.UPDATE
      });
    
      const [mini] = await GoldenGoosePrize.findOrCreate({
        where: { type: 'mini_jackpot' },
        defaults: { amount: JACKPOT_CONFIG.MINI.amount, count: JACKPOT_CONFIG.MINI.count },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
    
      const [minor] = await GoldenGoosePrize.findOrCreate({
        where: { type: 'minor_jackpot' },
        defaults: { amount: JACKPOT_CONFIG.MINOR.amount, count: JACKPOT_CONFIG.MINOR.count },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
    
      const [major] = await GoldenGoosePrize.findOrCreate({
        where: { type: 'major_jackpot' },
        defaults: { amount: JACKPOT_CONFIG.MAJOR.amount, count: JACKPOT_CONFIG.MAJOR.count },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
    
      const [grand] = await GoldenGoosePrize.findOrCreate({
        where: { type: 'grand_jackpot' },
        defaults: { amount: JACKPOT_CONFIG.GRAND.amount, count: JACKPOT_CONFIG.GRAND.count },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
    
      await transaction.commit();
      
      return { jackpotPrize, mini, minor, major, grand };
    }
    

    async function checkJackpot() {
      const transaction = await sequelize.transaction();
      
      try {
        // First ensure all jackpots are initialized
        const { jackpotPrize } = await initializeJackpots();
    
        // Get current game jackpot level
        const game = await GameList.findOne({
          where: { id: 2 },
          transaction,
          lock: transaction.LOCK.UPDATE
        });
    
        if (!game) {
          throw new Error('Game not found');
        }
    
        const jackpotLevel = game.jackpot_level;
        let prizeToAward = 0;
        let jackpotType = '';
    
        // Process based on current jackpot level
        switch (jackpotLevel) {
          case 'mini':
            if (jackpotPrize.amount >= 500) {
              prizeToAward = 500;
              jackpotType = 'mini';
            }
            break;
    
          case 'minor':
            if (jackpotPrize.amount >= 2500) {
              prizeToAward = 2500;
              jackpotType = 'minor';
            }
            break;
    
          case 'major':
            if (jackpotPrize.amount >= 10000) {
              prizeToAward = 10000;
              jackpotType = 'major';
            }
            break;
    
          case 'grand':
            if (jackpotPrize.amount >= 25000) {
              prizeToAward = 25000;
              jackpotType = 'grand';
            }
            break;
    
          default:
            throw new Error(`Unknown jackpot level: ${jackpotLevel}`);
        }
    
        await transaction.commit();
    
        if (prizeToAward > 0) {
          return {
            amount: prizeToAward,
            type: jackpotType
          };
        }
    
        return null;
      } catch (error) {
        await transaction.rollback();
        console.error('Error in checkAndAwardJackpot:', error);
        return null;
      }
    }

    async function awardJackpot(
      userId: number, 
      prizeToAward: number,
      gameRoundId?: string  // Add optional gameRoundId parameter
    ) {
      const transaction = await sequelize.transaction();
      
      try {
        const { mini, minor, major, grand, jackpotPrize } = await initializeJackpots();
    
        // Get current game jackpot level
        const game = await GameList.findOne({
          where: { id: 2 },
          transaction,
          lock: transaction.LOCK.UPDATE
        });
    
        if (!game) {
          throw new Error('Game not found');
        }
    
        const jackpotLevel = game.jackpot_level;
        let shouldUpdateLevel = false;
    
        // Common jackpot award logic
        const awardJackpotPrize = async (level: 'mini' | 'minor' | 'major' | 'grand') => {
          // Verify sufficient funds in the jackpot pool
          if (jackpotPrize.amount < prizeToAward) {
            throw new Error(`Insufficient funds in ${level} jackpot pool`);
          }
    
          // Deduct from prize pool
          jackpotPrize.amount -= prizeToAward;
          await jackpotPrize.save({ transaction });
    
          // Log the jackpot win with gameRoundId if provided
          await GoldenGooseJackpotLog.create({
            user_id: userId,
            amount: prizeToAward,
            type: level,
            game_round_id:gameRoundId  // Include the game round ID if provided
          }, { transaction });
    
          // Return the prize level object
          switch (level) {
            case 'mini': return mini;
            case 'minor': return minor;
            case 'major': return major;
            case 'grand': return grand;
          }
        };
    
        switch (jackpotLevel) {
          case 'mini':
            const miniPrize = await awardJackpotPrize('mini');
            miniPrize.count -= 1;
            await miniPrize.save({ transaction });
    
            if (miniPrize.count <= 0) {
              game.jackpot_level = 'minor';
              shouldUpdateLevel = true;
            }
            break;
    
          case 'minor':
            const minorPrize = await awardJackpotPrize('minor');
            minorPrize.count -= 1;
            await minorPrize.save({ transaction });
    
            if (minorPrize.count <= 0) {
              game.jackpot_level = 'major';
              shouldUpdateLevel = true;
            }
            break;
    
          case 'major':
            const majorPrize = await awardJackpotPrize('major');
            majorPrize.count -= 1;
            await majorPrize.save({ transaction });
    
            if (majorPrize.count <= 0) {
              game.jackpot_level = 'grand';
              shouldUpdateLevel = true;
            }
            break;
    
          case 'grand':
            const grandPrize = await awardJackpotPrize('grand');
            grandPrize.count -= 1;
            await grandPrize.save({ transaction });
    
            if (grandPrize.count <= 0) {
              // Reset all counts and cycle back to mini
              game.jackpot_level = 'mini';
              shouldUpdateLevel = true;
              
              // Reset all counts
              const [updatedMini, updatedMinor, updatedMajor, updatedGrand] = await Promise.all([
                GoldenGoosePrize.update(
                  { count: JACKPOT_CONFIG.MINI.count },
                  { where: { type: 'mini' }, transaction }
                ),
                GoldenGoosePrize.update(
                  { count: JACKPOT_CONFIG.MINOR.count },
                  { where: { type: 'minor' }, transaction }
                ),
                GoldenGoosePrize.update(
                  { count: JACKPOT_CONFIG.MAJOR.count },
                  { where: { type: 'major' }, transaction }
                ),
                GoldenGoosePrize.update(
                  { count: JACKPOT_CONFIG.GRAND.count },
                  { where: { type: 'grand' }, transaction }
                )
              ]);
            }
            break;
    
          default:
            throw new Error(`Unknown jackpot level: ${jackpotLevel}`);
        }
    
        if (shouldUpdateLevel) {
          await game.save({ transaction });
        }
    
        await transaction.commit();
        return { success: true, jackpotLevel, amountAwarded: prizeToAward };
      } catch (error) {
        await transaction.rollback();
        console.error('Error in awardJackpot:', error);
        throw error;
      }
    }

    // Get the main jackpot prize pool
    const instantPrizePool = await GoldenGoosePrize.findOne({
      where: { type: 'instant_prize' },
    });

    if(userData){
      const isTesting = process.env.IS_TESTING_GOLDEN_GOOSE;
      
      if (isTesting === 'false'){try {
          const callbackData = {
              player_id: userData.id,
              action: 'get-balance',
          };

          const callbackResponse = await axios.post(process.env.KINGFISHER_API, callbackData);
          const reponseData = JSON.stringify({
            event: 'receivedUpdatedCredits',
            data: {updatedCredit: callbackResponse.data.credit },
            id: userData.id
          });
      
          clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(reponseData);
            }
          });

          console.log('Callback successful:', callbackResponse.data.credit);
      } catch (callbackError) {
          console.error('Error in API callback:', callbackError);
      }}
    }

    if(instantPrizePool){
      const instantPrizeResponse = JSON.stringify({
        event: 'receiveCurrentInstantPrize',
        data: {currentPrizePool: instantPrizePool.amount }
      });
  
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(instantPrizeResponse);
        }
      });
    }
    
  
    if (allPlayerData.size > 0) {
      const response = JSON.stringify({
        event: 'receiveAllPlayerData',
        data: Array.from(allPlayerData.values()),
        id: userData.id,
      });
    
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(response);
        }
      });
    }
  
  });

  startPingInterval();

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 3; i++) {
      let channel = '';
      
      for (let j = 0; j < 2; j++) {
        channel += letters[Math.floor(Math.random() * 8)]; 
      }
      color += channel;
    }
  
    return color;
  };

  function extractTokenFromURL(url) {
    const urlParts = url.split('?');
    if (urlParts.length > 1) {
      const queryParams = new URLSearchParams(urlParts[1]);
      return queryParams.get('token');
    }
    return null;
  }

  function broadcastToClients(message: string) {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
  }



  
  function startPingInterval() {
    
    pingIntervalId = setInterval(() => {
      const pingMessage = JSON.stringify({
        event: 'websocketPinging',
        data: {
          message: 'Ping'
        }
      });
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) { 
          client.send(pingMessage);
        }
      });
    }, PING_INTERVAL);
    
  }
  
  function stopPingInterval() {
    if (pingIntervalId) {
      clearInterval(pingIntervalId);
      pingIntervalId = null;
      console.log('Stopped websocket pinging.');
    }
  }

  process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing WebSocket server.');
    stopPingInterval();
  });
  
  process.on('SIGTERM', async () => {
    console.log('SIGINT signal received: closing WebSocket server.');
    stopPingInterval();
  });
}


export default goldenGoose;
