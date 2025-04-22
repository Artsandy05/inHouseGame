
import { GameState, hasValue, ModeratorCommands } from "../../../../common/gameutils";
import Bet from "../../../models/Bet";
import Config from "../../../models/Config";
import { CountdownStateChanged, BBPGameStateChanged, Game, GameData, Input, Input as InputMsg, Output, Plugin, SelectedHostStateChanged, ZodiacGameStateChanged } from "./Code";
import { Moderator } from "./Moderator";
import { Player } from "./Player";
import { GameDb } from "./plugins/GameDbPlugin";
import { UserData } from "./UserData";

export class ModeratorManager implements Plugin {

	build(game: Game): void {
		game
			.system(this.update);
	}

	update(game) {
		game.view(GameDb).each((entity, gameDb) => {
			game.remove(entity, GameDb);
		})

		let gameData: GameData;
		let gameDataEntity;
		game.view(GameData).each((entity, g) => {
			gameData = g;
			gameDataEntity = entity;
		});


		let curState = gameData.state;
    let currHost = gameData.host;
    let currentCountDownState = gameData.countdown;
    let previousHostId = gameData.host ? gameData.host : null;

		game.view(Moderator, InputMsg, Output).each((entity, mod, input, output) => {
     

      game.view(BBPGameStateChanged).each((entity, state) => {
				game.remove(entity, BBPGameStateChanged);
			});

			if (input.msg !== undefined) {

				requestInit(gameData, input.msg, output);
        selectHost(gameData, input.msg, output);
				requestIdle(gameData, input.msg, output);
				requestNewGame(gameData, input.msg, output);
				requestOpen(gameData, input.msg, output);
				requestWinnerDeclared(game, gameDataEntity, gameData, input.msg, output);
        requestRollingState(gameData, input.msg, output);
        requestJuanAndPedroChoice(gameData, input.msg, output);
			}
		});

    game.view(Player, InputMsg, Output).each((entity, mod, input, output) => {
			game.view(BBPGameStateChanged).each((entity, state) => {
				game.remove(entity, BBPGameStateChanged);
			});

			if (input.msg !== undefined) {
				requestOpen(gameData, input.msg, output);
			}
		});

    game.view(Player, InputMsg, Output).each((entity, mod, input, output) => {
			game.view(SelectedHostStateChanged).each((entity, state) => {
				game.remove(entity, SelectedHostStateChanged);
			});

			if (input.msg !== undefined) {
				requestOpen(gameData, input.msg, output);
			}
		});

    game.view(Player, InputMsg, Output).each((entity, mod, input, output) => {
			game.view(CountdownStateChanged).each((entity, state) => {
				game.remove(entity, CountdownStateChanged);
			});

			if (input.msg !== undefined) {
				requestOpen(gameData, input.msg, output);
			}
		});
    
    if (curState.bbp !== gameData.prevState.bbp) {
      gameData.hasBBPGameStateChanged = true;
      game.view(Output).each((entity, output) => {
          game.emplace(entity, new BBPGameStateChanged); // Trigger state change event
      });
  
      // After the change, reset the flag and update previous state
      gameData.hasBBPGameStateChanged = false;
      gameData.prevState = { ...curState }; // Deep copy or assign
    }

    if (currentCountDownState.bbp !== gameData.prevCountdown.bbp) {
      gameData.hasCountdownStateChanged = true;
      game.view(Output).each((entity, output) => {
          game.emplace(entity, new CountdownStateChanged); // Trigger state change event
      });
  
      // After the change, reset the flag and update previous state
      gameData.hasCountdownStateChanged = false;
      gameData.prevCountdown = { ...currentCountDownState }; // Deep copy or assign
    }

    

    let currentHostId = gameData.host ? gameData.host : null;
		if (currentHostId !== previousHostId) {
      game.view(Player, Output).each((entity, output) => {
          game.emplace(entity, new SelectedHostStateChanged); 
      });
    }
	}
}

async function requestInit(gameData, msg, output) {
	if (hasValue(msg.cmd) && msg.cmd === ModeratorCommands.Init) {
    gameData.setCompanyCommission(await getCompanyCommission());
    gameData.setBBPCommission(await getBBPCommission());

		output.msg = {
			state: gameData.state,
      gameId:gameData.gameId,
      host: gameData.host.id !== null && gameData.host,
		};
	}
}

function requestIdle(gameData, msg, output) {
  if (gameData.state[msg.game] === GameState.WinnerDeclared &&
    hasValue(msg.cmd) && 
    msg.cmd === GameState.Idle) {
		gameData.setState(msg.cmd, msg.game)
		output.msg = {
      slots: gameData.playerSlots,
      state: gameData.state,
		};
	}
}

function requestJuanAndPedroChoice(gameData, msg, output) {
  if(msg.result && msg.result.juanChoice && msg.result.pedroChoice){
    gameData.setJuanChoice(msg.result.juanChoice);
    gameData.setPedroChoice(msg.result.pedroChoice);
  }
}

function requestNewGame(gameData, msg, output) {
	const winnerDeclaredOrIdle = gameData.state[msg.game] === GameState.WinnerDeclared || gameData.state[msg.game] === GameState.Idle || gameData.state[msg.game] === GameState.Closed ||
    gameData.state[msg.game] === "Void";

	if (winnerDeclaredOrIdle && hasValue(msg.cmd) && msg.cmd === GameState.NewGame) {

		gameData.setState(msg.cmd, msg.game);
		output.msg = {
      state: gameData.state
    }
	}
}

async function getConfig(){
  const config = await Config.findOne({ where: { id: 1 } });
  return config.fee;
}

async function getDosConfig(){
  const config = await Config.findOne({ where: { id: 2 } });
  return config.fee;
}

async function getCompanyCommission(){
	const config = await Config.findOne({ where: { id: 1 } });
	return config.companyFee;
}

async function getBBPCommission(){
	const config = await Config.findOne({ where: { id: 3 } });
	return config.companyFee;
}

// function processOpenBetting(gameData, msg, output){

// }

async function requestOpen(gameData, msg, output) {
  
  const isOpenCommand = msg.cmd === GameState.Open;
  const isIdleOrNewGame = gameData.state[msg.game] === GameState.Idle || gameData.state[msg.game] === GameState.NewGame;

  if (isIdleOrNewGame && isOpenCommand && hasValue(msg.cmd)) {
      gameData.setState(msg.cmd, msg.game);
      output.msg = { state: gameData.state };
      gameData.setCountdownState(30, msg.game)
      gameData.isInsertGameDatabase = {game: msg.game, state: true};
      
      const timer = setInterval(() => {
        if (gameData.countdown[msg.game] > 0) {
            gameData.countdown[msg.game] -= 1;
            output.msg = { countdown: gameData.countdown };
            if(gameData.countdown[msg.game] === 10){
              gameData.setState(GameState.LastCall, msg.game);
              output.msg = { state: gameData.state };
            }
        } else {
            const odds = gameData.odds[msg.game];
            const invalidRound = [...odds.values()].some(value => value < 1);
            const slots = gameData.slotBets[msg.game];
            const walkinSlots = gameData.slotBetsWalkin[msg.game];
            let combinedSlots = new Map(walkinSlots);

            // Combine the two maps (slots + walkinSlots)
            slots.forEach((value, key) => {
              if (combinedSlots.has(key)) {
                combinedSlots.set(key, combinedSlots.get(key) + value);
              } else {
                combinedSlots.set(key, value);
              }
            });

            if(invalidRound || combinedSlots.size === 0){
              output.msg = { voidGameMessage: {game:msg.game, message:'Void game!'} };

              // (async () => {
              //   await WinningBall.new(gameData.gamesTableId[msg.game], 'void', msg.game);
              // })();
              
              gameData.voidGame[msg.game] = true;
              gameData.setState("Void", msg.game);
              output.msg = {
                state: gameData.state
              }
              clearInterval(timer);
              return;
            }
            gameData.setState(GameState.Closed, msg.game);
            output.msg = { state: gameData.state };
            clearInterval(timer);
        }
      }, 1000);
    
  }
}
  

function selectHost(gameData, msg, output) {
	if (hasValue(msg.selectedHost)) {
		gameData.setHost(msg.selectedHost, msg.game);
		output.msg = {
			host: gameData.host,
      state:gameData.state
		};
	}
}

function requestRollingState(gameData, msg, output) {
	if (gameData.state[msg.game] === GameState.Closed && hasValue(msg.cmd) && msg.cmd === GameState.Rolling || gameData.state[msg.game] === 'Init') {
		gameData.setState(msg.cmd, msg.game)
    output.msg = {
      state: gameData.state
    }
	}
}

function requestWinnerDeclared(game, gameDataEntity, gameData, msg, output) {
  const isRolling = gameData.state[msg.game] === GameState.Rolling;
  const isClosed = gameData.state[msg.game] === GameState.Closed;
  const isWinnerDeclared = hasValue(msg.cmd) && msg.cmd === GameState.WinnerDeclared;

  // Check if the game is in a valid state and if the winner declaration command is valid
  if ((isRolling || isClosed) && isWinnerDeclared) {
    // Get the winner orders for the current game
    const winnerOrders = msg.winnerOrders;
    const gameKey = msg.game;
    const moderatorUUID = msg.uuid;

    // Initialize the list for this game if not already initialized
    if (!gameData.moderatorsWinningBall[gameKey]) {
      gameData.moderatorsWinningBall[gameKey] = [];
    }

    // Check if the moderator has already submitted their winner orders
    const existingOrder = gameData.moderatorsWinningBall[gameKey].find(order => order.uuid === moderatorUUID);
    if (existingOrder) {
      // If the moderator has already submitted their orders, return without processing
      return;
    }

    // Add the new winner orders to the list with the moderator's UUID
    gameData.moderatorsWinningBall[gameKey].push({
      uuid: moderatorUUID,
      winnerOrders: winnerOrders
    });

    // Check if exactly three moderators have declared their winner orders
    const currentWinnerOrders = gameData.moderatorsWinningBall[gameKey];
    if (currentWinnerOrders.length < 1) {
      // If not enough moderators have submitted orders, just return without processing
      return;
    }

    // Check if all three declarations match
    const areAllOrdersSame = currentWinnerOrders.every(order => JSON.stringify(order.winnerOrders) === JSON.stringify(winnerOrders));
    
    if (!areAllOrdersSame) {
      // Reset the winner orders for all moderators if they don't match
      gameData.moderatorsWinningBall[gameKey] = [];
      output.msg = {
        winnerDeclareStatus: {game: gameKey, value:'Failed'}  // Notify that the declaration failed
      };
    } else {
      // If all winner orders match, process the winner declaration
      gameData.setState(msg.cmd, msg.game);
      output.msg = {
        state: gameData.state,
        winnerDeclareStatus: {game:gameKey, value:'Success'}  // Notify that the declaration was successful
      };
      gameData.winnerOrders[gameKey] = winnerOrders;  // Store the winner orders in the game data

      game.emplace(gameDataEntity, new GameDb());  // Persist the changes in the game data
    }
  }
}




