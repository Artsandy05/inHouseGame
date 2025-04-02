import WebSocket from 'ws';
import { hasValue } from '../../../common/gameutils';
import User from '../../models/User';
import GoldenGoosePrize from '../../models/GoldenGoosePrize';
import GoldenGooseRound from '../../models/GoldenGooseRound';
import GoldenGooseJackpotLog from '../../models/GoldenGooseJackpotLog';
import { JACKPOT_CONFIG } from '../../config/goldenGoose/jackpot_config';
import sequelize from "../../config/database";
import GameList from '../../models/GameList';
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
};

const allPlayerData: Map<string, PlayerData> = new Map();

const PING_INTERVAL = 10000;
let pingIntervalId: NodeJS.Timeout | null = null;

function liveChat(fastify) {
  fastify.register(require("@fastify/static"), {
    root: path.join(__dirname, "src/live_chat"), // Path to your chatImages folder
    prefix: `${process.env.PREFIX}/imgs`,  // The prefix for frontend access
  });
  
  fastify.server.on('upgrade', async (request, socket, head) => {
    const url = new URL(request.url, 'http://localhost');
    const path = url.pathname;
    
    if (path === '/api/livechat') {
      try {
        const queryParams = url.searchParams;
        const userData: UserInfo = JSON.parse(queryParams.get('userInfo'))
        wss.handleUpgrade(request, socket, head, async (ws) => {
          wss.emit('connection', ws, userData);
        });
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
          let jackpotPrize = { amount: null as number | null, type: null as string | null };
          jackpotPrize = await checkJackpot();
          if (jackpotPrize && jackpotPrize.amount) {
            await awardJackpot(userId, jackpotPrize.amount);
            const jackpotAmountStr = jackpotPrize.amount.toString();
            const eggs = playerData.eggs;
            playerData.jackpotPrize = jackpotPrize.amount;
            playerData.jackpotType = jackpotPrize.type;
        
            // Case 1: May existing na 3+ matching scratched eggs -> palitan ang value
            const itemCounts: Record<string, number> = {};
            eggs.forEach(egg => {
                if (egg.scratched) itemCounts[egg.item] = (itemCounts[egg.item] || 0) + 1;
            });
            const winningItem = Object.entries(itemCounts).find(([_, count]) => count >= 3)?.[0];
        
            if (winningItem) {
                // Palitan lahat ng winningItem eggs ng jackpot value
                eggs.forEach(egg => {
                    if (egg.item === winningItem) egg.item = jackpotAmountStr;
                });
            } 
            // Case 2: Walang 3 matches -> magdagdag ng 3 bagong eggs na may jackpot value
            else {
                // Alisin ang 3 random eggs (kung may enough eggs)
                for (let i = 0; i < 3 && eggs.length > 0; i++) {
                    const randomIndex = Math.floor(Math.random() * eggs.length);
                    eggs.splice(randomIndex, 1); // Remove 1 egg at random position
                }
        
                const jackpotColor = getRandomColor();  // Metallic gold color
                // Dagdagan ng 3 bagong eggs na may jackpot value (random positions)
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
                    eggs.splice(randomPos, 0, newEgg); // Insert at random position
                }
            }
          }
        
          allPlayerData.set(userId, playerData);
  
          try {
              // Convert bet to number to ensure proper math operations
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
                          amount: Number(instantPrize.amount) + (betAmount * 0.5),
                      })
                      : GoldenGoosePrize.create({
                          type: 'instant_prize',
                          amount: betAmount * 0.5,
                      }),
                  
                  jackpotPrize
                      ? jackpotPrize.update({ 
                          amount: Number(jackpotPrize.amount) + (betAmount * 0.1),
                      }) 
                      : GoldenGoosePrize.create({
                          type: 'jackpot_prize',
                          amount: betAmount * 0.1,
                          count: 0
                      }),
                  
                  appProfit
                      ? appProfit.update({ 
                          amount: Number(appProfit.amount) + (betAmount * 0.4),
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
  
          const instantPrizePool = await GoldenGoosePrize.findOne({
              where: { type: 'instant_prize' },
          });
  
          // Convert Map values to array for response
          const playersArray = Array.from(allPlayerData.values());
          
          // Initialize the response object
          const responseData: ResponseData = {
              event: 'receiveAllPlayerData',
              data: playersArray,
              id: userId,
              currentPrizePool: instantPrizePool?.amount || 0
          };
  
          const response = JSON.stringify(responseData);
  
          clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                  client.send(response);
              }
          });
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
                // Update the gameOver status first
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

                    await GoldenGooseRound.create({
                        user_id: updatedPlayer.userId,
                        result: !winningItem ? 'Lose' : 'Win',
                        winning_amount: winningAmount.toFixed(2),
                        jackpot_amount: jackpotAmount.toFixed(2),
                        jackpot_type: jackpotType,
                        crack_count: scratchedEggsCount,
                        eggs: updatedPlayer.eggs
                    });

                    allPlayerData.delete(userId);
                    const playersArray = Array.from(allPlayerData.values());

                    // Send immediate update with gameOver status
                    const immediateResponse = JSON.stringify({
                        event: 'receiveAllPlayerData',
                        data: playersArray,
                        id: userId
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

    async function awardJackpot(userId: number, prizeToAward: number) {
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
    
        switch (jackpotLevel) {
          case 'mini':
            if (jackpotPrize.amount >= 500) {
              // Deduct from prize pool
              jackpotPrize.amount -= prizeToAward;
              await jackpotPrize.save({ transaction });
    
              // Log the jackpot win
              await GoldenGooseJackpotLog.create({
                userId: userId,
                amount: prizeToAward,
                type: 'mini'
              }, { transaction });
    
              // Decrement mini count
              mini.count -= 1;
              await mini.save({ transaction });
    
              // Check if we need to level up
              if (mini.count <= 0) {
                game.jackpot_level = 'minor';
                shouldUpdateLevel = true;
              }
            }
            break;
    
          case 'minor':
            if (jackpotPrize.amount >= 2500) {
              jackpotPrize.amount -= prizeToAward;
              await jackpotPrize.save({ transaction });
    
              await GoldenGooseJackpotLog.create({
                userId: userId,
                amount: prizeToAward,
                type: 'minor'
              }, { transaction });
    
              minor.count -= 1;
              await minor.save({ transaction });
    
              if (minor.count <= 0) {
                game.jackpot_level = 'major';
                shouldUpdateLevel = true;
              }
            }
            break;
    
          case 'major':
            if (jackpotPrize.amount >= 10000) {
              jackpotPrize.amount -= prizeToAward;
              await jackpotPrize.save({ transaction });
    
              await GoldenGooseJackpotLog.create({
                userId: userId,
                amount: prizeToAward,
                type: 'major'
              }, { transaction });
    
              major.count -= 1;
              await major.save({ transaction });
    
              if (major.count <= 0) {
                game.jackpot_level = 'grand';
                shouldUpdateLevel = true;
              }
            }
            break;
    
          case 'grand':
            if (jackpotPrize.amount >= 25000) {
              jackpotPrize.amount -= prizeToAward;
              await jackpotPrize.save({ transaction });
    
              await GoldenGooseJackpotLog.create({
                userId: userId,
                amount: prizeToAward,
                type: 'grand'
              }, { transaction });
    
              grand.count -= 1;
              await grand.save({ transaction });
    
              if (grand.count <= 0) {
                // Reset all counts and cycle back to mini
                game.jackpot_level = 'mini';
                shouldUpdateLevel = true;
                
                // Reset all counts
                mini.count = JACKPOT_CONFIG.MINI.count;
                minor.count = JACKPOT_CONFIG.MINOR.count;
                major.count = JACKPOT_CONFIG.MAJOR.count;
                grand.count = JACKPOT_CONFIG.GRAND.count;
                
                await Promise.all([
                  mini.save({ transaction }),
                  minor.save({ transaction }),
                  major.save({ transaction }),
                  grand.save({ transaction })
                ]);
              }
            }
            break;
    
          default:
            throw new Error(`Unknown jackpot level: ${jackpotLevel}`);
        }
    
        if (shouldUpdateLevel) {
          await game.save({ transaction });
        }
    
        await transaction.commit();
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

  // async function updateConnectedClientsCount(){
  //   const uniqueActivePlayers = new Set<UserInfo>();
  //   const activePlayerArray = Array.from(activePlayer);

  //   // Iterate over the array and add unique users to the Set based on the `uuid`
  //   activePlayerArray.forEach(user => {
  //       if (![...uniqueActivePlayers].some(existingUser => existingUser.uuid === user.uuid)) {
  //           uniqueActivePlayers.add(user);
  //       }
  //   });
  //   let connectedClients = {zodiac:0, dos: 0, tres: 0};
    
  //   uniqueActivePlayers.forEach(player => {

  //     if (player.game === 'zodiac') {
  //       connectedClients.zodiac += 1;
  //     } else if (player.game === 'dos') {
  //       connectedClients.dos += 1;
  //     } else if (player.game === 'tres') {
  //       connectedClients.tres += 1;
  //     }
  //   });

  //   const response = JSON.stringify({
  //       event: 'receiveClientsCount',
  //       data: {
  //           connectedClients: connectedClients,  // Send updated list of connected clients
  //       },
  //   });

  //   // Send the response to all connected clients
  //   clients.forEach(client => {
  //       if (client.readyState === WebSocket.OPEN) {
  //           client.send(response);
  //       }
  //   });
  // }

  // const getSenderInfo = async (id) => {
  //     const user = await User.findByPk(id);
  //     return { role: user.role, nickName: user.nickName };
  // };

  // const verifyToken = async (request, reply) => {
  //   try {
  //     await request.jwtVerify();
  //   } catch (err) {
  //     console.error('Token verification failed:', err.message);
  //     reply.code(401).send({ error: 'Token is invalid' });
  //   }
  // };


  
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


export default liveChat;
