
import { ClientCommands, GameState, ZODIAC_LABELS, arrayToMap, hasValue, mapToArray } from "../../../../common/gameutils";
import Config from "../../../models/Config";
import Transaction from "../../../models/Transaction";
import Wallet from "../../../models/Wallet";
import BetModel from "../../../models/Bet";
import { Bet } from "./Bet";
import { Prize } from "./Bet/Prize";
import { CountdownStateChanged, BBPGameStateChanged, Game, GameData, Input, Output, Plugin, SelectedHostStateChanged, ZodiacGameStateChanged } from "./Code";
import { Player } from "./Player";
import { GameDb } from "./plugins/GameDbPlugin";
import { UserData } from "./UserData";
import WinningBets from "../../../models/WinningBets";
import WinningBall from "../../../models/WinningBall";
import LosingBets from "../../../models/LosingBets";
import axios from "axios";
import { randomBytes } from "crypto";
const isTesting = process.env.IS_TESTING;

export class PlayerManager implements Plugin {
	build(game: Game): void {
		game
			.before(before)
			.system(this.update)
			.system(broadcastWinners);
	}
  
	update(game: Game) {
		let gameData: GameData;
    let gameDataEntity;
    game.view(GameData).each((entity, g) => {
			gameDataEntity = entity;
		});
		game.view(GameData).each((entity, g) => {
			gameData = g;
		});

    if(gameData.state.bbp === GameState.Closed) {
      game.view(Player, Input, Output, UserData).each((entity, player, input, output, userData) => {
        if(hasValue(output.msg) && typeof output.msg === 'string'){
          let newOutPut = JSON.parse(output.msg);
          newOutPut.juanChoice = gameData.juanChoice;
          newOutPut.pedroChoice = gameData.pedroChoice;
          output.msg = JSON.stringify(newOutPut);
        }else{
          output.insert("juanChoice", gameData.juanChoice);
          output.insert("pedroChoice", gameData.pedroChoice);
        }
      });
    }

    

    if(isTesting === 'false'){
      game.view(Player, Input, Output, UserData).each((entity, player, input, output, userData) => {
        const callbackData = {
          player_id: userData.data.dataValues.id,
          action: 'get-balance',
        };
        // if(input.msg){
        //   axios.post(process.env.KINGFISHER_API, callbackData)
        //     .then(callbackResponse => {
        //       console.log(callbackResponse.data.credit);
        //       if (hasValue(output.msg) && typeof output.msg === 'string') {
        //         let newOutPut = JSON.parse(output.msg);
        //         newOutPut.latestBalance = callbackResponse.data.credit;
        //         output.msg = JSON.stringify(newOutPut);
        //       } else {
        //         output.insert("latestBalance", callbackResponse.data.credit);
        //       }
        //     })
        //     .catch(error => {
        //       console.error('Error while fetching balance:', error);
        //   });
        // }
        // if(gameData.state.bbp === GameState.WinnerDeclared){
        //   axios.post(process.env.KINGFISHER_API, callbackData)
        //     .then(callbackResponse => {
        //       console.log(callbackResponse.data.credit);
        //       if (hasValue(output.msg) && typeof output.msg === 'string') {
        //         let newOutPut = JSON.parse(output.msg);
        //         newOutPut.latestBalance = callbackResponse.data.credit;
        //         output.msg = JSON.stringify(newOutPut);
        //       } else {
        //         output.insert("latestBalance", callbackResponse.data.credit);
        //       }
        //     })
        //     .catch(error => {
        //       console.error('Error while fetching balance:', error);
        //   });
        // }
        axios.post(process.env.KINGFISHER_API, callbackData)
            .then(callbackResponse => {
              console.log(callbackResponse.data.credit);
              if (hasValue(output.msg) && typeof output.msg === 'string') {
                let newOutPut = JSON.parse(output.msg);
                newOutPut.latestBalance = callbackResponse.data.credit;
                output.msg = JSON.stringify(newOutPut);
              } else {
                output.insert("latestBalance", callbackResponse.data.credit);
              }
            })
            .catch(error => {
              console.error('Error while fetching balance:', error);
          });
      });
    }

    
    

    gameData.games.forEach(gameName => {
      game.view(gameName === 'bbp' ? BBPGameStateChanged : null, Output).each((entity, stateChanged, output) => {
        const convertedAllBets = {bbp:[]};
        
        for (let key in convertedAllBets) {
          const slots = gameData.slotBets[key];
          const walkinSlots = gameData.slotBetsWalkin[key];
          let combinedSlots = new Map(walkinSlots);
          slots.forEach((value, key) => {
            if (combinedSlots.has(key)) {
              combinedSlots.set(key, combinedSlots.get(key) + value);
            } else {
              combinedSlots.set(key, value);
            }
          });
          convertedAllBets[key] = mapToArray(combinedSlots);
        }
  
        let secondParam = {};
  
        if (gameData.voidGame['bbp']) {
            // Either 'dos' or 'zodiac' is true, set the corresponding game and message
            
            secondParam = {
                game: gameData.voidGame['bbp'] && 'bbp',
                message: 'Void Game!'
            };
        } else {
            // Both 'dos' and 'zodiac' are false, set empty object
            secondParam = {};
        }
        if(hasValue(output.msg) && typeof output.msg === 'string'){
          let newOutPut = JSON.parse(output.msg);
          newOutPut.state = gameData.state;
          newOutPut.voidGameMessage = secondParam;
          newOutPut.allBets = convertedAllBets;
          newOutPut.gameId = gameData.gameId;
          newOutPut.winningBall = gameData.winnerOrders;
          output.msg = JSON.stringify(newOutPut);
        }else{
          output.insert("state", gameData.state);
          output.insert("voidGameMessage", secondParam);
          output.insert("allBets", convertedAllBets);
          output.insert("gameId", gameData.gameId);
          output.insert("winningBall", gameData.winnerOrders);
        }
      });
    })

    game.view(CountdownStateChanged, Output).each((entity, stateChanged, output) => {
      if(hasValue(output.msg) && typeof output.msg === 'string'){
        let newOutPut = JSON.parse(output.msg);
        newOutPut.countdown = gameData.countdown;
        newOutPut.gameId = gameData.gameId;
        output.msg = JSON.stringify(newOutPut);
      }else{
        output.insert("countdown", gameData.countdown);
        output.insert("gameId", gameData.gameId);
      }
		});

    game.view(SelectedHostStateChanged, Output).each((entity, stateChanged, output) => {
      if(hasValue(output.msg) && typeof output.msg === 'string'){
        let newOutPut = JSON.parse(output.msg);
        newOutPut.host = gameData.host;
        output.msg = JSON.stringify(newOutPut);
      }else{
        output.insert("host", gameData.host);
      }
		});

		game.view(Player, Input, Output, UserData).each((entity, player, input, output, userData) => {
        if (input.msg !== undefined) {
            requestInit(game, entity, gameData, input.msg, output, player, userData);
            requestRollingState(gameData, input.msg, output);
            onBettingState(game, entity, gameData, player, input.msg, userData, output);
            requestWinnerDeclared(game, gameDataEntity, gameData, input.msg, output);
        }
    });
	}
}

function requestWinnerDeclared(game, gameDataEntity, gameData, msg, output) {
  const isRolling = gameData.state[msg.game] === GameState.Rolling;
  const isClosed = gameData.state[msg.game] === GameState.Closed;
  const isWinnerDeclared = hasValue(msg.cmd) && msg.cmd === GameState.WinnerDeclared;

  if ((isRolling || isClosed) && isWinnerDeclared) {
    const winnerOrders = msg.winnerOrders;
    const gameKey = msg.game;

    gameData.setState(msg.cmd, msg.game);
      output.msg = {
        state: gameData.state,
        winnerDeclareStatus: {game:gameKey, value:'Success'}  // Notify that the declaration was successful
      };
      gameData.winnerOrders[gameKey] = winnerOrders;  // Store the winner orders in the game data

      game.emplace(gameDataEntity, new GameDb());
  }
}

function broadcastWinners(game: Game) {
	let gameData: GameData;
	game.view(GameData).each((entity, g) => {
		gameData = g;
	});

 

  gameData.games.forEach(gameName => {
    game.view(gameName === 'bbp' ? BBPGameStateChanged : null, UserData, Player, Prize, Output)
    .each((entity, stateChanged, userData, player, prize, output) => {
      if (gameData.state[gameName] === GameState.WinnerDeclared) {
        
        const winner = gameName === 'bbp' && gameData.winnerOrders[gameName];
        if(player.game === gameName){
          let totalWin = 0;
          let totalBet = 0;
          const betTransactionNo = `KFH-${randomBytes(10).toString('hex')}`;
          const transactionNo = `KFH-${randomBytes(10).toString('hex')}`;
          
          // Convert forEach to a proper async function with Promise.all to handle all bets
          const processBets = async () => {
            const betPromises = [];
            
            // First calculate totalBet from all slots
            for (const [key, val] of player.slots.entries()) {
              totalBet += Number(val);
            }
            
            // Process each bet
            for (const [key, val] of player.slots.entries()) {
              const processPromise = (async () => {
                if (String(winner) === String(key) && gameName === prize.game) {
                  const p = prize.values.get(key);
                  const odds = gameData.odds[gameName].get(key);
                  gameData.winners[gameName].push({
                    key,
                    userId: userData.data.dataValues.id,
                    name: userData.data.dataValues.nickName,
                    prize: p,
                    bet: val,
                    winOnGame: player.game,
                    odds,
                    uuid: userData.data.dataValues.uuid
                  });
                  
                  const wallet = await getWallet(userData.data.dataValues.id);
                  let finalWinPrize = Number(wallet.balance) + Number(p);
                  const transaction = await Transaction.new(wallet.id, gameData.gamesTableId[gameName], p, "wonprize", odds, gameData.gameId[gameName]);
                  
                  //process bet part
                  const w = await Wallet.findByUserId(userData.data.dataValues.id);
                  const companyCommission = Number(val * (gameData.bbpCommission));
                  const betTransaction = await Transaction.new(w.id, gameData.gamesTableId[gameName], val, "bet", odds, gameData.gameId[gameName]);
                  const config = await Config.findOne({ where: { id: 3} });
                  const overAllCommission = Number(val * config.fee);
                  await BetModel.new(gameData.gamesTableId[gameName], transaction.id, key, gameData.gameId[gameName], companyCommission, overAllCommission);
                  
                  // end of process bet
                  await WinningBets.new(transaction.id, key, val, p);
                  await Wallet.update(
                    { balance: finalWinPrize - val },
                    { where: { user_id: userData.data.dataValues.id } }
                  );
                  
                  if(hasValue(output.msg) && typeof output.msg === 'string'){
                    let newOutPut = JSON.parse(output.msg);
                    newOutPut.prize = p;
                    output.msg = JSON.stringify(newOutPut);
                  }else{
                    output.insert("prize", p);
                  }
                  
                  // Add to the total win amount
                  totalWin += Number(p);
                }else{
                  const p = prize.values.get(key);
                  const odds = gameData.odds[gameName].get(key);
                  gameData.loseOrders[gameName].push({
                    key,
                    userId: userData.data.dataValues.id,
                    name: userData.data.dataValues.nickName,
                    prize: val,
                    loseOnGame: player.game,
                    odds
                  });
                  
                  const wallet = await getWallet(userData.data.dataValues.id);
                  const transaction = await Transaction.new(wallet.id, gameData.gamesTableId[gameName], val, "losebet", odds, gameData.gameId[gameName]);
        
                  // start of process bet
                  const w = await Wallet.findByUserId(userData.data.dataValues.id);
                  const companyCommission = Number(val * (gameData.bbpCommission));
                  const betTransaction = await Transaction.new(w.id, gameData.gamesTableId[gameName], val, "bet", odds, gameData.gameId[gameName]);
                  const config = await Config.findOne({ where: { id: 3} });
                  const overAllCommission = Number(val * config.fee);
                  await BetModel.new(gameData.gamesTableId[gameName], transaction.id, key, gameData.gameId[gameName], companyCommission, overAllCommission);
                  
                  // end of process bet
                  await LosingBets.new(transaction.id, key, val, 0);
                }
              })();
              
              betPromises.push(processPromise);
            }
            
            // Wait for all bet processing to complete
            await Promise.all(betPromises);
            
            // Log final totals after all processing is complete
            if (isTesting === 'false' && totalBet) {
              try {
                const callbackData = {
                  player_id: userData.data.dataValues.id,
                  action: 'bet',
                  round_id: gameData.gameId[gameName],
                  amount: totalBet,
                  game_uuid: `KFH-${gameData.gamesTableId[gameName]}`,
                  transaction_id: `KFH-${betTransactionNo}`
                };
            
                axios.post(process.env.KINGFISHER_API, callbackData)
                  .then((callbackResponse) => {
                    if (hasValue(output.msg) && typeof output.msg === 'string') {
                      let newOutPut = JSON.parse(output.msg);
                      newOutPut.latestBalance = callbackResponse.data.credit;
                      output.msg = JSON.stringify(newOutPut);
                    } else {
                      output.insert("latestBalance", callbackResponse.data.credit);
                    }
                  })
                  .catch((callbackError) => {
                    console.error('Error in API callback:', callbackError);
                  });
              } catch (callbackError) {
                console.error('Error in API callback:', callbackError);
              }
            }
            
            // Add this function to create delay
            const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            
            // Wrap in an async IIFE to use await
            (async () => {
              if (isTesting === 'false' && totalBet) {
                await delay(1000); // Delay 1 second before processing win/lose
              }
            
              if (isTesting === 'false' && totalWin > 0) {
                try {
                  const callbackData = {
                    player_id: userData.data.dataValues.id,
                    action: 'win',
                    round_id: gameData.gameId[gameName],
                    amount: totalWin,
                    game_uuid: `KFH-${gameData.gamesTableId[gameName]}`,
                    transaction_id: `KFH-${transactionNo}`,
                    transaction_bet_id: `KFH-${betTransactionNo}`
                  };
            
                  axios.post(process.env.KINGFISHER_API, callbackData)
                    .then((callbackResponse) => {
                      if (hasValue(output.msg) && typeof output.msg === 'string') {
                        let newOutPut = JSON.parse(output.msg);
                        newOutPut.latestBalance = callbackResponse.data.credit;
                        output.msg = JSON.stringify(newOutPut);
                      } else {
                        output.insert("latestBalance", callbackResponse.data.credit);
                      }
                    })
                    .catch((callbackError) => {
                      console.error('Error in API callback:', callbackError);
                    });
                } catch (callbackError) {
                  console.error('Error in API callback:', callbackError);
                }
              }
            
              if (isTesting === 'false' && totalWin === 0) {
                try {
                  const callbackData = {
                    player_id: userData.data.dataValues.id,
                    action: 'lose',
                    round_id: gameData.gameId[gameName],
                    amount: 0,
                    game_uuid: `KFH-${gameData.gamesTableId[gameName]}`,
                    transaction_id: `KFH-${transactionNo}`,
                    transaction_bet_id: `KFH-${betTransactionNo}`
                  };
            
                  axios.post(process.env.KINGFISHER_API, callbackData)
                    .then((callbackResponse) => {
                      if (hasValue(output.msg) && typeof output.msg === 'string') {
                        let newOutPut = JSON.parse(output.msg);
                        newOutPut.latestBalance = callbackResponse.data.credit;
                        output.msg = JSON.stringify(newOutPut);
                      } else {
                        output.insert("latestBalance", callbackResponse.data.credit);
                      }
                    })
                    .catch((callbackError) => {
                      console.error('Error in API callback:', callbackError);
                    });
                } catch (callbackError) {
                  console.error('Error in API callback:', callbackError);
                }
              }
            })();
            
          };
          
          // Execute the async function
          processBets();
        }
      }
    });
  })

	

  gameData.games.forEach(gameName => {
    if (gameData.winners[gameName].length > 0) {
      gameData.winners[gameName].sort((a, b) => b.prize - a.prize);
    }
  });

  gameData.games.forEach(gameName => {
    game.view(gameName === 'bbp' ? BBPGameStateChanged : null, Output)
    .each((entity, stateChanged, output) => {
      if (gameData.state[gameName] === GameState.WinnerDeclared) {
        const topPlayers = gameData.winners[gameName].slice(0, 3);
        gameData.topPlayers[gameName] = topPlayers;

        if(hasValue(output.msg) && typeof output.msg === 'string'){
          let newOutPut = JSON.parse(output.msg);
          newOutPut.topPlayers = gameData.topPlayers;
          output.msg = JSON.stringify(newOutPut);
        }else{
          output.insert("topPlayers", gameData.topPlayers);
        }
        
      }
    });
  });
}

function before(game: Game) {
	game.view(Bet).each((entity, bet) => {
		game.remove(entity, Bet);
	});
}

async function requestInit(game: Game, entity, gameData, msg, output, player, userData) {
	if (hasValue(msg.cmd) && msg.cmd === ClientCommands.Init) {
    const topPlayers = gameData.winners[msg.game].slice(0, 3);
    gameData.topPlayers[msg.game] = topPlayers;
    const convertedOdds = {bbp:[]};
    const convertedAllBets = {bbp:[]};
    for (let key in gameData.odds) {
      convertedOdds[key] = mapToArray(gameData.odds[key]);
    }
    for (let key in convertedAllBets) {
      const slots = gameData.slotBets[key];
      const walkinSlots = gameData.slotBetsWalkin[key];
      let combinedSlots = new Map(walkinSlots);
      slots.forEach((value, key) => {
        if (combinedSlots.has(key)) {
          combinedSlots.set(key, combinedSlots.get(key) + value);
        } else {
          combinedSlots.set(key, value);
        }
      });
      convertedAllBets[key] = mapToArray(combinedSlots);
    }

    const callbackData = {
      player_id: userData.data.dataValues.id,
      action: 'get-balance',
    };

    const callbackResponse = await axios.post(process.env.KINGFISHER_API, callbackData);
    const isTesting = process.env.IS_TESTING;
 
		output.msg = JSON.stringify({
			state: gameData.state,
      topPlayers:gameData.topPlayers,
      host: gameData.host,
      gameId:gameData.gameId,
      balance: gameData.playerCurrentBalance[msg.game],
      slots: mapToArray(player.slots),
      betOnGame:player.game,
      odds: convertedOdds,
      allBets: convertedAllBets,
      winningBall:gameData.winnerOrders,
      latestBalance: !isTesting ? callbackResponse.data.credit : 0
		});
	}
}


function requestRollingState(gameData, msg, output) {
	if (msg.isRolling) {
    output.insert('isRolling', msg.isRolling);
	}
}



async function onBettingState(game: Game, entity, gameData: GameData, player: Player, msg, userData: UserData, output) {

	if (gameData.state[msg.game] === GameState.Open || gameData.state[msg.game] === GameState.LastCall) {
		const slots = arrayToMap(msg.slots);
		const userBalance = await Wallet.findOne({ where: { user_id: userData.data.dataValues.id } });
    
    slots.forEach(async (amount, key) => {
      userBalance.balance -= amount; // Update user balance correctly
      const playerUUID = userData.data.dataValues.uuid;

      // Check if current balance already exists for this player
      const existingBalanceEntry = gameData.playerCurrentBalance[msg.game].find(entry => entry.playerUUID === playerUUID);
      
      if (existingBalanceEntry) {
        // Update the existing balance
        existingBalanceEntry.currentBalance = userBalance.balance;
      } else {
        // Push a new balance entry
        gameData.playerCurrentBalance[msg.game].push({ playerUUID, currentBalance: userBalance.balance });
      }

      // Insert balance update into output
      if(hasValue(output.msg) && typeof output.msg === 'string'){
        let newOutPut = JSON.parse(output.msg);
        newOutPut.balance = [{ playerUUID, currentBalance: userBalance.balance }];
        output.msg = JSON.stringify(newOutPut);
      }else{
        output.insert('balance', [{ playerUUID, currentBalance: userBalance.balance }]);
      }
    });

    if (hasValue(slots) && slots.size > 0 && hasKeys(player.slots, slots)) {
      player.slots = appendMaps(player.slots, slots);
      player.uuid = userData.data.dataValues.uuid;
      player.game = msg.game;
      game.insert(entity, new Bet);	
      gameData.calculateAllBets[msg.game] = true;	
    }
	}
}




function hasKeys<K, V>(map1: Map<K, V>, map2: Map<K, V>): boolean {
	for (let key of map1.keys()) {
		if (!map2.has(key)) {
			return false;
		}
	}
	return true;
}

function appendMaps<K, V>(map1: Map<K, V>, map2: Map<K, V>): Map<K, V> {
	let appendedMap = new Map<K, V>(map1);
	for (let [key, value] of map2.entries()) {
		appendedMap.set(key, value);
	}
	return appendedMap;
}

async function processBet(userId, bet, odds, gameName, gameData, ball, winLossTransaction) {
  

}

async function getWallet(userId){
  const wallet = await Wallet.findByUserId(userId);
  return wallet;
}

const insertWinningBall = async (gameData: GameData, gameName) => {
	await WinningBall.new(gameData.gamesTableId[gameName], gameName === 'bbp' && gameData.winnerOrders[gameName], gameName);
}