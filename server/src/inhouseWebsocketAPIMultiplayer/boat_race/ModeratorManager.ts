
import { GameState, hasValue, ModeratorCommands } from "../../../../common/gameutils";
import Bet from "../../../models/Bet";
import Config from "../../../models/Config";
import { CountdownStateChanged, BoatRaceGameStateChanged, Game, GameData, Input, Input as InputMsg, Output, Plugin, SelectedHostStateChanged, ZodiacGameStateChanged } from "./Code";
import { Moderator } from "./Moderator";
import { Player } from "./Player";
import { GameDb } from "./plugins/GameDbPlugin";
import { UserData } from "./UserData";
import raf from 'raf';

const boats = [
  { id: 'blue', name: 'Blue', color: '#00008B', laneColor: '#A0522D' },
  { id: 'green', name: 'Green', color: '#006400', laneColor: '#dba556' },
  { id: 'red', name: 'Red', color: '#8B0000', laneColor: '#A0522D' },
  { id: 'yellow', name: 'Yellow', color: '#FFD700', laneColor: '#dba556' },
];

const boatsStats = [
  { id: 1, name: 'Blue', position: -9, speed: 0.02, stamina: 0.7, fatigue: 0, finished: false, animationSpeed: 0.1, frameCount: 6, currentFrame: 0, raceProgress: 0, recoveryRate: 0, burstChance: 0, performanceProfile: 0, baseSpeed: 0, baseAnimationSpeed: 0 },
  { id: 2, name: 'Green', position: -9, speed: 0.02, stamina: 0.8, fatigue: 0, finished: false, animationSpeed: 0.1, frameCount: 6, currentFrame: 0, raceProgress: 0, recoveryRate: 0, burstChance: 0, performanceProfile: 0, baseSpeed: 0, baseAnimationSpeed: 0 },
  { id: 3, name: 'Red', position: -9, speed: 0.02, stamina: 0.6, fatigue: 0, finished: false, animationSpeed: 0.1, frameCount: 6, currentFrame: 0, raceProgress: 0, recoveryRate: 0, burstChance: 0, performanceProfile: 0, baseSpeed: 0, baseAnimationSpeed: 0 },
  { id: 4, name: 'Yellow', position: -9, speed: 0.02, stamina: 0.75, fatigue: 0, finished: false, animationSpeed: 0.1, frameCount: 6, currentFrame: 0, raceProgress: 0, recoveryRate: 0, burstChance: 0, performanceProfile: 0, baseSpeed: 0, baseAnimationSpeed: 0 }
];

let animationFrameRef = { current: null };

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
     

      game.view(BoatRaceGameStateChanged).each((entity, state) => {
				game.remove(entity, BoatRaceGameStateChanged);
			});

			if (input.msg !== undefined) {

				requestInit(gameData, input.msg, output);
        selectHost(gameData, input.msg, output);
				requestIdle(gameData, input.msg, output);
				requestNewGame(gameData, input.msg, output);
				requestOpen(game, gameDataEntity, gameData, input.msg, output);
				requestWinnerDeclared(game, gameDataEntity, gameData, input.msg, output);
        requestRollingState(gameData, input.msg, output);
        requestUpdateBoatStats(gameData, input.msg, output);
			}
		});

    game.view(Player, InputMsg, Output).each((entity, mod, input, output) => {
			game.view(BoatRaceGameStateChanged).each((entity, state) => {
				game.remove(entity, BoatRaceGameStateChanged);
			});

			if (input.msg !== undefined) {
				requestOpen(game, gameDataEntity,gameData, input.msg, output);
			}
		});

    game.view(Player, InputMsg, Output).each((entity, mod, input, output) => {
			game.view(SelectedHostStateChanged).each((entity, state) => {
				game.remove(entity, SelectedHostStateChanged);
			});

			if (input.msg !== undefined) {
				requestOpen(game, gameDataEntity,gameData, input.msg, output);
			}
		});

    game.view(Player, InputMsg, Output).each((entity, mod, input, output) => {
			game.view(CountdownStateChanged).each((entity, state) => {
				game.remove(entity, CountdownStateChanged);
			});

			if (input.msg !== undefined) {
				requestOpen(game, gameDataEntity,gameData, input.msg, output);
			}
		});
    
    if (curState.boatRace !== gameData.prevState.boatRace) {
      gameData.hasBoatRaceGameStateChanged = true;
      game.view(Output).each((entity, output) => {
          game.emplace(entity, new BoatRaceGameStateChanged); // Trigger state change event
      });
  
      // After the change, reset the flag and update previous state
      gameData.hasBoatRaceGameStateChanged = false;
      gameData.prevState = { ...curState }; // Deep copy or assign
    }

    if (currentCountDownState.boatRace !== gameData.prevCountdown.boatRace) {
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
    gameData.setBoatRaceCommission(await getBoatRaceCommission());

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

function requestUpdateBoatStats(gameData, msg, output) {
  if(msg.boatStats){
    gameData.setBoatStats(msg.boatStats);
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

async function getBoatRaceCommission(){
	const config = await Config.findOne({ where: { id: 3 } });
	return config.companyFee;
}

// function processOpenBetting(gameData, msg, output){

// }

async function requestOpen(game, gameDataEntity,gameData, msg, output) {
  
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
              setTimeout(() => {
                gameData.setState(GameState.NewGame, 'boatRace');
                output.msg = {
                  state: gameData.state
                }
                setTimeout(() => {
                  autoOpen(game,gameDataEntity, gameData, output);
                }, 4000);
              }, 1500);

              clearInterval(timer);
              return;
            }
            gameData.setState(GameState.Closed, msg.game);
            output.msg = { state: gameData.state };
            clearInterval(timer);
            startRace(game,gameDataEntity,gameData,output)
        }
      }, 1000);
    
  }
}

async function autoOpen(game, gameDataEntity, gameData, output) {
  const gameKey = 'boatRace';
  const isIdleOrNewGame = gameData.state[gameKey] === GameState.Idle || gameData.state[gameKey] === GameState.NewGame;

  if (isIdleOrNewGame) {
      gameData.setState(GameState.Open, gameKey);
      output.msg = { state: gameData.state };
      gameData.setCountdownState(30, gameKey);
      gameData.isInsertGameDatabase = {game: gameKey, state: true};
      
      const timer = setInterval(() => {
        if (gameData.countdown[gameKey] > 0) {
            gameData.countdown[gameKey] -= 1;
            output.msg = { countdown: gameData.countdown };
            if(gameData.countdown[gameKey] === 10){
              gameData.setState(GameState.LastCall, gameKey);
              output.msg = { state: gameData.state };
            }
        } else {
            const odds = gameData.odds[gameKey];
            const invalidRound = [...odds.values()].some(value => value < 1);
            const slots = gameData.slotBets[gameKey];
            const walkinSlots = gameData.slotBetsWalkin[gameKey];
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
              output.msg = { voidGameMessage: {game:gameKey, message:'Void game!'} };

              // (async () => {
              //   await WinningBall.new(gameData.gamesTableId[gameKey], 'void', gameKey);
              // })();
              
              gameData.voidGame[gameKey] = true;
              gameData.setState("Void", gameKey);
              output.msg = {
                state: gameData.state
              }
              setTimeout(() => {
                gameData.setState(GameState.NewGame, 'boatRace');
                output.msg = {
                  state: gameData.state
                }
                setTimeout(() => {
                  autoOpen(game, gameDataEntity, gameData, output);
                }, 4000);
              }, 1500);
              
              clearInterval(timer);
              return;
            }
            gameData.setState(GameState.Closed, gameKey);
            output.msg = { state: gameData.state };
            clearInterval(timer);
            startRace(game, gameDataEntity,gameData,output);
        }
      }, 1000);
  }
}

const startRace = (game, gameDataEntity, gameData, output) => {
  const baseSpeedMin = 0.01;
  const baseSpeedMax = 0.03;
  
  boatsStats.map((boat, idx) => {
    // Reset position and stats
    boat.position = -9;
    boat.finished = false;
    boat.fatigue = 0;
    boat.raceProgress = 0;
    
    // Assign randomized attributes
    boat.speed = baseSpeedMin + (Math.random() * (baseSpeedMax - baseSpeedMin));
    boat.stamina = 0.5 + (Math.random() * 0.4); // 0.5-0.9
    boat.recoveryRate = 0.0003 + (Math.random() * 0.0003); // 0.0003-0.0006
    boat.burstChance = 0.02 + (Math.random() * 0.03); // 2%-5% chance for speed burst
    
    // Set performance profile (0: fast starter, 1: consistent, 2: strong finisher)
    boat.performanceProfile = Math.floor(Math.random() * 3);
    
    // Store base values for reference
    boat.baseSpeed = boat.speed;
    boat.baseAnimationSpeed = boat.animationSpeed;
    
    return boat;
  });

  // Send initial boat stats to players
  gameData.setBoatStats(boatsStats);
  animateRace(game, gameDataEntity, gameData,output);
};

const animateRace = (game, gameDataEntity, gameData, output) => {
  const startPosition = -9;
  const finishLine = 7 + 101.9;
  const raceDistance = finishLine - startPosition;
  let allFinished = true;
  let frameCount = 0;
  let winnerDetermined = false;
  let raceActive = true;

  // Initialize speeds with small variations
  boatsStats.forEach(boat => {
    if (boat) {
      boat.speed *= 0.95 + Math.random() * 0.1;
      boat.baseAnimationSpeed = boat.animationSpeed; // Store original animation speed
    }
  });

  const updateRace = () => {
    frameCount++;
    
    // Speed adjustments every 30 frames (0.5 seconds at 60fps)
    if (frameCount % 30 === 0 && raceActive) {
      
      let leaderPosition = Math.max(...boatsStats.map(h => h?.position || 0));
      let lastPlacePosition = Math.min(...boatsStats
        .filter(h => h && !h.finished)
        .map(h => h.position || 0));

        boatsStats.forEach((boat, index) => {
        if (!boat || boat.finished) return;

        boat.raceProgress = (boat.position - startPosition) / raceDistance;
        const distanceBehindLeader = leaderPosition - boat.position;
        const prevSpeed = boat.speed;

        // --- Speed variation with fatigue limit ---
        let speedVariation = (Math.random() - 0.5) * 1.5;

        // Weaken variation if boat is tired
        const fatigueFactor = 1 - boat.fatigue * 2;
        speedVariation *= Math.max(0.2, fatigueFactor);

        // Slight rubber banding for those behind
        if (distanceBehindLeader > 0.05 && boat.fatigue < 0.4) {
          speedVariation += 0.03;
        }

        // Mid-race burst
        const inBurstZone = boat.raceProgress > 0.3 && boat.raceProgress < 0.8;
        let burstChance = 0.03 + boat.stamina * 0.001;

        if (boat.position === lastPlacePosition) {
          burstChance += 0.65;
        }

        if (
          inBurstZone &&
          Math.random() < burstChance &&
          boat.fatigue < 0.25
        ) {
          speedVariation += 0.2 + Math.random() * 0.05;
          boat.fatigue += 0.00005;
        }

        // Fatigue accumulation
        const fatigueGain =
          0.0001 + (1 - boat.stamina) * 0.0001 +
          boat.raceProgress * 0.00003;

        boat.fatigue += fatigueGain;

        // Mild recovery if going slow and not near finish
        if (prevSpeed < 0.007 && boat.fatigue > 0.01 && boat.raceProgress < 0.9) {
          boat.fatigue -= 0.2;
        }

        // Clamp fatigue
        boat.fatigue = Math.min(0.5, Math.max(0, boat.fatigue));

        // Apply variation & fatigue to speed
        let newSpeed = prevSpeed * (2 + speedVariation);
        newSpeed *= (0.5 - boat.fatigue);

        // Clamp speed
        boat.speed = Math.max(0.04, Math.min(0.09, newSpeed));

        // Animation speed sync
        boat.animationSpeed = boat.baseAnimationSpeed * ((boat.speed * 1.1) / 0.018);
      });
    }

    allFinished = true;
    let maxPosition = 0;

    boatsStats.forEach((boat, idx) => {
      if (!boat) return;
      if (raceActive) {
        // Update animation frame based on current speed
        if (boat.position > maxPosition && !boat.finished) {
          maxPosition = boat.position;
        }
        boat.currentFrame = (boat.currentFrame + boat.animationSpeed * 1) % boat.frameCount;

        // Move boat
        if (!boat.finished) {
          boat.position += boat.speed * 0.65;

          // Check if boat finished
          if (boat.position >= finishLine) {
            boat.finished = true;
            boat.position = finishLine;
            boat.animationSpeed = boat.baseAnimationSpeed;
            raceActive = false;
            // Send winner update
            gameData.setBoatStats(boatsStats);
            gameData.setState(GameState.WinnerDeclared, 'boatRace');
            output.msg = {
              state: gameData.state,
              winnerDeclareStatus: {game:'boatRace', value:'Success'}  // Notify that the declaration was successful
            };
            gameData.winnerOrders['boatRace'] = boats[idx].id;  // Store the winner orders in the game data

            game.emplace(gameDataEntity, new GameDb());

            setTimeout(() => {
              gameData.setState(GameState.NewGame, 'boatRace');
              boatsStats.forEach((boat) => {
                if (!boat) return;
                boat.position = -9;
                boat.finished = false;
                boat.fatigue = 0;
                boat.raceProgress = 0;
                boat.stamina = 0;
                boat.baseSpeed = 0;
                boat.speed = boat.baseSpeed;
                boat.baseAnimationSpeed = 0.1;
                boat.animationSpeed = boat.baseAnimationSpeed;
                boat.currentFrame = 0;
              });
              output.msg = {
                state: gameData.state
              }
              setTimeout(() => {
                autoOpen(game, gameDataEntity, gameData, output);
              }, 4000);
            }, 6000);
            raf.cancel(animationFrameRef.current);
          }
        }
      }

      if (!boat.finished) {
        allFinished = false;
      }
    });

    // Throttled update: send stats every 5 frames (~12fps)
    gameData.setBoatStats(boatsStats);

    // Continue animation if not all boats finished
    if (!allFinished) {
      animationFrameRef.current = raf(updateRace);
    }
  };

  animationFrameRef.current = raf(updateRace);
};
  

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




