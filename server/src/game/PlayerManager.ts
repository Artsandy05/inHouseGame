
import { ClientCommands, GameState, ZODIAC_LABELS, arrayToMap, hasValue, mapToArray } from "../../../common/gameutils";
import Wallet from "../../models/Wallet";
import { Bet } from "./Bet";
import { Prize } from "./Bet/Prize";
import { CountdownStateChanged, BBPGameStateChanged, Game, GameData, Input, Output, Plugin, SelectedHostStateChanged, ZodiacGameStateChanged } from "./Code";
import { Player } from "./Player";
import { GameDb } from "./plugins/GameDbPlugin";
import { SocketManager } from "./SocketManager";
import { UserData } from "./UserData";


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
      // && player.slots.size > 0
      if (gameData.state[gameName] === GameState.WinnerDeclared) {
        
        const winner = gameName === 'bbp' && gameData.winnerOrders[gameName];
        if(player.game === gameName){
          player.slots.forEach((val, key:any) => {
            if (winner === key && gameName === prize.game) {
              const p = prize.values.get(key);
              const odds = gameData.odds[gameName].get(key);
              gameData.winners[gameName].push({
                key,
                userId: userData.data.dataValues.id,
                name: userData.data.dataValues.nickName,
                prize: p,
                bet:val,
                winOnGame: player.game,
                odds,
                uuid: userData.data.dataValues.uuid
              });
              if(hasValue(output.msg) && typeof output.msg === 'string'){
                let newOutPut = JSON.parse(output.msg);
                newOutPut.prize = p;
                output.msg = JSON.stringify(newOutPut);
              }else{
                output.insert("prize", p);
              }
              
            }else{
              const p = prize.values.get(key);
              const odds = gameData.odds[gameName].get(key);
              gameData.loseOrders[gameName].push({
                key,
                userId: userData.data.dataValues.id,
                name: userData.data.dataValues.nickName,
                prize: val,
                loseOnGame:player.game,
                odds
              });
            }
          });
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

    //incompleteGameRound ?  JSON.parse(incompleteGameRound.dataValues.slots) : 
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
		});
	}
}


function requestRollingState(gameData, msg, output) {
	if (msg.isRolling) {
    output.insert('isRolling', msg.isRolling);
	}
}


// async function resetPlayerBets(gameData, player: Player, msg, userData: UserData, output) {
//   const userBalance = await Wallet.findOne({ where: { user_id: userData.data.dataValues.id } });
//   if (msg.resetSlots) {
//     if (player.uuid === msg.resetSlots.uuid && player.game === msg.game) {
//       player.slots = new Map<string, number>();
//       player.game = '';
//     }

//     const existingBalanceEntry = gameData.playerCurrentBalance[msg.game].find(balance => 
//       balance.playerUUID === userData.data.dataValues.uuid
//     );

//     if (existingBalanceEntry) {
//       existingBalanceEntry.currentBalance = userBalance.balance;
//     } else {
//       gameData.playerCurrentBalance[msg.game].push({ playerUUID: userData.data.dataValues.uuid, currentBalance: userBalance.balance });
//     }

//     if(hasValue(output.msg) && typeof output.msg === 'string'){
//       let newOutPut = JSON.parse(output.msg);
//       newOutPut.balance = [{ playerUUID: userData.data.dataValues.uuid, currentBalance: userBalance.balance }];
//       newOutPut.betOnGame = player.game;
//       output.msg = JSON.stringify(newOutPut);
//     }else{
//       output.insert('balance', [{ playerUUID: userData.data.dataValues.uuid, currentBalance: userBalance.balance }]);
//       output.insert('betOnGame', player.game);
//     }

//     gameData.calculateAllBets[msg.game] = true;
//   }
// }



// async function processRepresentativePlayerBets(game: Game, entity, gameData: GameData,  msg, output) {
//   if(msg.isRepresentative && (gameData.state[msg.game] === GameState.Open || gameData.state[msg.game] === GameState.LastCall)){
    
//     const representativeBetInfo = await RepresentativeBetInfo.create({
//       representative_id:msg.data.representative_id,
//       game_name: msg.data.game_name,  // Using msg.game_name from the top level
//       ticket_number: msg.data.ticket_number,  // msg.ticket_number from the top level
//       total_number_of_bets: msg.data.total_number_of_bets,  // msg.total_number_of_bets from the top level
//       total_amount: msg.data.total_amount,  // msg.total_amount from the top level
//       payment_amount: msg.data.payment_amount,  // msg.payment_amount from the top level
//       change_amount: msg.data.change_amount  // msg.change_amount from the top level
//     });

//     // Step 2: Insert related data into RepresentativePlayerBets table
//     // Loop through msg.data and insert each player's bet data
//     for (const bet of msg.data.data) {  // Looping through the msg.data array which contains the bets
//       await RepresentativePlayerBets.create({
//         representative_bet_info_id: representativeBetInfo.id,  
//         zodiac_ball_name: bet.zodiac_ball_name,
//         quantity: bet.qty,
//         total_bet: bet.total_bet,
//         bet_type: bet.betType
//       });
//     }

//     const representativeWallet = await Wallet.findOne({ where: { user_id: msg.data.representative_id } });
    
//     await Wallet.update(
//       { balance: representativeWallet.balance - msg.data.total_amount },
//       { where: { user_id: msg.data.representative_id } }
//     );


//     game.insert(entity, new Bet);
//     gameData.calculateAllBetsForWalkin[msg.game] = true;
//     msg.data.isAddedToSlotBetsWalkin = false;
//     gameData.walkinPlayers[msg.game].push(msg.data);
//   }
// }


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

// async function sendGift(game: Game, entity, gameData: GameData, player: Player, msg, userData: UserData, output) {
//   if(msg.cmdType === 'gift'){
//     const userBalance = await Wallet.findOne({ where: { user_id: userData.data.dataValues.id } });
//     const playerUUID = userData.data.dataValues.uuid;
//     const existingBalanceEntry = gameData.playerCurrentBalance[msg.game].find(entry => entry.playerUUID === playerUUID);
    
//     if (existingBalanceEntry) {
//       // Update the existing balance
//       existingBalanceEntry.currentBalance -= msg.giftAmount;
//     } else {
//       gameData.playerCurrentBalance[msg.game].push({ playerUUID, currentBalance: userBalance.balance });
//     }

//     output.insert('balance', [{ playerUUID, currentBalance: existingBalanceEntry ? existingBalanceEntry.currentBalance : userBalance.balance}]);
//   }
// }

// async function withdrawBalance(game: Game, entity, gameData: GameData, player: Player, msg, userData: UserData, output) {

//   if(msg.msgType === 'withdraw'){
  
//     const userBalance = await Wallet.findOne({ include:{ 
//       model:User,
//       where:{ uuid: userData.data.dataValues.uuid }
//     } 
//   });
//     const playerUUID = userData.data.dataValues.uuid;
//     const existingBalanceEntry = gameData.playerCurrentBalance[msg.game].find(entry => entry.playerUUID === playerUUID);
    
//     if (existingBalanceEntry) {
//       // Update the existing balance
//       existingBalanceEntry.currentBalance -= msg.amount;
//     } else {
//       gameData.playerCurrentBalance[msg.game].push({ playerUUID, currentBalance: userBalance.balance });
//     }

//     output.insert('balance', [{ playerUUID, currentBalance: existingBalanceEntry ? existingBalanceEntry.currentBalance : userBalance.balance}]);
//   }
// }



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
