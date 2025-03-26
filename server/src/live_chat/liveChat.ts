import WebSocket from 'ws';
import { hasValue } from '../../../common/gameutils';
import User from '../../models/User';
import GoldenGoosePrize from '../../models/GoldenGoosePrize';
import GoldenGooseRound from '../../models/GoldenGooseRound';
import GoldenGooseJackpotLog from '../../models/GoldenGooseJackpotLog';
import { JACKPOT_CONFIG } from '../../config/goldenGoose/jackpot_config';
import sequelize from "../../config/database";
import GameList from '../../models/GameList';

const fs = require('fs');
const path = require('path');

interface UserInfo {
  id: number;                           // User's ID
  uuid: string;                         // Unique identifier (UUID)
  firstName: string;                    // First name of the user
  lastName: string;                     // Last name of the user
  nickName: string;                     // Nickname of the user
  role: string;                         // Role (e.g. 'player')
  mobile: string;                       // Mobile number of the user
  isActive: boolean;                    // Whether the user is active or not
  game: string;                         // Game the user is associated with (e.g. 'zodiac', 'dos')
  isPlayerInChatSupport?: boolean;      // Optional: Indicates if the player is in chat support
}

type ResponseData = {
  event: string;
  data: any[];
  id: any;
  luckyPlayer?: string;  // Optional property
  jackpotPrize?: number; // Optional property
  jackpotType?: string;  // Optional property
};

const wss = new WebSocket.Server({ noServer: true });
const clients: Set<WebSocket> = new Set();
const activePlayer: Set<WebSocket> = new Set<UserInfo>();
const allPlayerData = [];

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
      const token = extractTokenFromURL(request.url);
      
      
      try {
        const queryParams = url.searchParams;
        const userData = JSON.parse(queryParams.get('userInfo'))
        const uuid = userData?.uuid;
        if (hasValue(token)) {
          await fastify.jwt.verify(token);
        } else {
          console.log("No uuid nor token");
        }
        
        
        wss.handleUpgrade(request, socket, head, async (ws) => {
          wss.emit('connection', ws, userData);
        });
      } catch (err) {
        console.error('JWT token verification failed:', err.message);
        socket.destroy();
      }
    }
  });
  
  wss.on('connection', async (socket: WebSocket, userData) => {
    console.log(`User connected: ${JSON.stringify(userData.nickName)}`);
    
    clients.add(socket);

    socket.on('message', async (message) => {
      
      const data = JSON.parse(message.toString());

      if (data.event === 'startGame') {
        const playerData = data.data;
        const userId = playerData.userId;

        if(userId){
          if(playerData.jackpotPrize && playerData.jackpotPrize && playerData.jackpotPrize !== 0 && playerData.jackpotType !== ''){ 
            await awardJackpot(userId, playerData.jackpotPrize);
          }
          const existingPlayerIndex = allPlayerData.findIndex(player => player.userId === userId);
          
          if (existingPlayerIndex !== -1) {
            allPlayerData[existingPlayerIndex] = playerData;
          } else {
            allPlayerData.push(playerData);
          }
          
          // Update or create the three prize records
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
                    count:0
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

          let luckyPlayer: string | null = null;
          let jackpotPrize = { amount: null as number | null, type: null as string | null };

          if (allPlayerData.length > 0) {
              const randomIndex = Math.floor(Math.random() * allPlayerData.length);
              luckyPlayer = allPlayerData[randomIndex].userId;
              jackpotPrize = await checkJackpot(parseInt(luckyPlayer));
          }

          // Initialize the response object
          const responseData: ResponseData = {
              event: 'receiveAllPlayerData',
              data: allPlayerData,
              id: userId
          };

          // Conditionally add the properties
          if(jackpotPrize){
            if (jackpotPrize.amount !== null && luckyPlayer !== null) {
              responseData.luckyPlayer = luckyPlayer;
              responseData.jackpotPrize = jackpotPrize.amount;
              responseData.jackpotType = jackpotPrize.type;
            }
          }

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
          const playerIndex = allPlayerData.findIndex(player => player.userId === userId);
          
          if (playerIndex !== -1) {
            allPlayerData[playerIndex].eggs = playerData.eggs;
            
            const response = JSON.stringify({
              event: 'receiveAllPlayerData',
              data: allPlayerData,
              id: userId
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

      if (data.event === 'updatePlayerIsWinner') {
        const playerData = data.data;
        const userId = playerData.userId ? playerData.userId : false; 
        
        if (userId) {
          const playerIndex = allPlayerData.findIndex(player => player.userId === userId);
          
          if (playerIndex !== -1) {
              allPlayerData[playerIndex].isWinner = playerData.isWinner;
              const response = JSON.stringify({
                event: 'receiveAllPlayerData',
                data: allPlayerData,
                id: userId
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

      if (data.event === 'updatePlayerClickedEgg') {
        const playerData = data.data;
        const userId = playerData.userId ? playerData.userId : false;
        
        if (userId) {
          const playerIndex = allPlayerData.findIndex(player => player.userId === userId);
          
          if (playerIndex !== -1) {
              allPlayerData[playerIndex].clickedEgg = playerData.clickedEgg;
              const response = JSON.stringify({
                event: 'receiveAllPlayerData',
                data: allPlayerData,
                id: userId
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

      if (data.event === 'updatePlayerScratchCount') {
        const playerData = data.data;
        const userId = playerData.userId ? playerData.userId : false;
        
        if (userId) {
          const playerIndex = allPlayerData.findIndex(player => player.userId === userId);
          
          if (playerIndex !== -1) {
              allPlayerData[playerIndex].scratchCount = playerData.scratchCount;
              const response = JSON.stringify({
                event: 'receiveAllPlayerData',
                data: allPlayerData,
                id: userId
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

      if (data.event === 'updatePlayerGameOver') {
        const playerData = data.data;
        const userId = playerData.userId ? playerData.userId : false;
        
        if (userId) {
            const playerIndex = allPlayerData.findIndex(player => player.userId === userId);
            
            if (playerIndex !== -1) {
                // Update the gameOver status first
                allPlayerData[playerIndex].gameOver = playerData.gameOver;
    
                const eggs = allPlayerData[playerIndex].eggs;
    
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
                    const isJackpotWin = allPlayerData[playerIndex].jackpotPrize !== 0 && 
                                        winningItem && 
                                        parseFloat(winningItem[0]) === allPlayerData[playerIndex].jackpotPrize;
                    
                    if (winningItem) {
                        if (isJackpotWin) {
                            // For jackpot win, use the jackpot prize directly without deducting from instant prize
                            winningAmount = allPlayerData[playerIndex].jackpotPrize;
                            jackpotAmount = winningAmount;
                            jackpotType = allPlayerData[playerIndex].jackpotType || 'jackpot';
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
                    await GoldenGooseRound.create({
                        user_id: allPlayerData[playerIndex].userId,
                        result: !winningItem ? 'Lose' : 'Win',
                        winning_amount: winningAmount.toFixed(2),
                        jackpot_amount: jackpotAmount.toFixed(2),
                        jackpot_type: jackpotType,
                        crack_count: allPlayerData[playerIndex].scratchCount,
                        eggs: allPlayerData[playerIndex].eggs
                    });
                    
                    console.log('GoldenGooseRound record created successfully');
                } catch (error) {
                    console.error('Error processing prize or creating GoldenGooseRound record:', error);
                }
                
                // Send immediate update with gameOver status
                const immediateResponse = JSON.stringify({
                    event: 'receiveAllPlayerData',
                    data: allPlayerData,
                    id: userId
                });
                
                clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(immediateResponse);
                    }
                });
                
                allPlayerData.splice(playerIndex, 1); // Remove the player
                    
                const delayedResponse = JSON.stringify({
                    event: 'receiveAllPlayerData',
                    data: allPlayerData
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
          const playerIndex = allPlayerData.findIndex(player => player.userId === userId);
          
          if (playerIndex !== -1) {
              allPlayerData[playerIndex].gameStarted = playerData.gameStarted;
              const response = JSON.stringify({
                event: 'receiveAllPlayerData',
                data: allPlayerData,
                id: userId
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

    
    
    async function initializeJackpots(transaction: any) {
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
    
      return { mini, minor, major, grand };
    }

    async function checkJackpot(luckyPlayerId: number) {
      const transaction = await sequelize.transaction();
      
      try {
        await initializeJackpots(transaction);
    
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
    
        // Get the main jackpot prize pool
        const jackpotPrizePool = await GoldenGoosePrize.findOne({
          where: { type: 'jackpot_prize' },
          transaction,
          lock: transaction.LOCK.UPDATE
        });
    
        if (!jackpotPrizePool) {
          throw new Error('Jackpot prize pool not found');
        }
    
        // Process based on current jackpot level
        switch (jackpotLevel) {
          case 'mini':
            if (jackpotPrizePool.amount >= 500) {
              prizeToAward = 500;
              jackpotType = 'mini';
            }
            break;
    
          case 'minor':
            if (jackpotPrizePool.amount >= 2500) {
              prizeToAward = 2500;
              jackpotType = 'minor';
            }
            break;
    
          case 'major':
            if (jackpotPrizePool.amount >= 10000) {
              prizeToAward = 10000;
              jackpotType = 'major';
            }
            break;
    
          case 'grand':
            if (jackpotPrizePool.amount >= 25000) {
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

    async function awardJackpot(userId: number, prizeToAward:number) {
      const transaction = await sequelize.transaction();
      const { mini, minor, major, grand } = await initializeJackpots(transaction);
    
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
  
      // Get the main jackpot prize pool
      const jackpotPrizePool = await GoldenGoosePrize.findOne({
        where: { type: 'jackpot_prize' },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
  
      if (!jackpotPrizePool) {
        throw new Error('Jackpot prize pool not found');
      }

      switch (jackpotLevel) {
        case 'mini':
          if (jackpotPrizePool.amount >= 500) {
            // Deduct from prize pool
            jackpotPrizePool.amount -= prizeToAward;
            await jackpotPrizePool.save({ transaction });

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
          if (jackpotPrizePool.amount >= 2500) {
            jackpotPrizePool.amount -= prizeToAward;
            await jackpotPrizePool.save({ transaction });
  
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
          if (jackpotPrizePool.amount >= 10000) {
            jackpotPrizePool.amount -= prizeToAward;
            await jackpotPrizePool.save({ transaction });
  
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
          if (jackpotPrizePool.amount >= 25000) {
            
            jackpotPrizePool.amount -= prizeToAward;
            await jackpotPrizePool.save({ transaction });
  
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
              mini.count = 10;
              minor.count = 50;
              major.count = 10;
              major.count = 1;
              
              await Promise.all([
                mini.save({ transaction }),
                minor.save({ transaction }),
                major.save({ transaction })
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
    
  
    if (allPlayerData.length > 0) {
      const response = JSON.stringify({
        event: 'receiveAllPlayerData',
        data: allPlayerData,
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

  function sanitizeFileName(fileName) {
      return fileName
          .replace(/[<>:"/\\|?*]/g, '_')   // Replace unsafe characters with underscores
          .replace(/\s+/g, '_')            // Replace spaces with underscores
          .toLowerCase();                  // Optionally convert to lowercase
  }

  function extractTokenFromURL(url) {
    const urlParts = url.split('?');
    if (urlParts.length > 1) {
      const queryParams = new URLSearchParams(urlParts[1]);
      return queryParams.get('token');
    }
    return null;
  }

  async function updateConnectedClientsCount(){
    const uniqueActivePlayers = new Set<UserInfo>();
    const activePlayerArray = Array.from(activePlayer);

    // Iterate over the array and add unique users to the Set based on the `uuid`
    activePlayerArray.forEach(user => {
        if (![...uniqueActivePlayers].some(existingUser => existingUser.uuid === user.uuid)) {
            uniqueActivePlayers.add(user);
        }
    });
    let connectedClients = {zodiac:0, dos: 0, tres: 0};
    
    uniqueActivePlayers.forEach(player => {

      if (player.game === 'zodiac') {
        connectedClients.zodiac += 1;
      } else if (player.game === 'dos') {
        connectedClients.dos += 1;
      } else if (player.game === 'tres') {
        connectedClients.tres += 1;
      }
    });

    const response = JSON.stringify({
        event: 'receiveClientsCount',
        data: {
            connectedClients: connectedClients,  // Send updated list of connected clients
        },
    });

    // Send the response to all connected clients
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(response);
        }
    });
  }

  const getSenderInfo = async (id) => {
      const user = await User.findByPk(id);
      return { role: user.role, nickName: user.nickName };
  };

  const verifyToken = async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      console.error('Token verification failed:', err.message);
      reply.code(401).send({ error: 'Token is invalid' });
    }
  };


  
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
