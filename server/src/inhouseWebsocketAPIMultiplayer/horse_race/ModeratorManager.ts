
import { GameState, hasValue, ModeratorCommands } from "../../../../common/gameutils";
import Bet from "../../../models/Bet";
import Config from "../../../models/Config";
import { CountdownStateChanged, HorseRaceGameStateChanged, Game, GameData, Input, Input as InputMsg, Output, Plugin, SelectedHostStateChanged, ZodiacGameStateChanged } from "./Code";
import { Moderator } from "./Moderator";
import { Player } from "./Player";
import { GameDb } from "./plugins/GameDbPlugin";
import { UserData } from "./UserData";
import raf from 'raf';

let horses = [
  { id: 'thunder', name: 'Thunder', color: '#00008B', laneColor: '#A0522D' },
  { id: 'lightning', name: 'Lightning', color: '#006400', laneColor: '#dba556' },
  { id: 'storm', name: 'Storm', color: '#8B0000', laneColor: '#A0522D' },
  { id: 'blaze', name: 'Blaze', color: '#FFD700', laneColor: '#dba556' },
];

let horsesStats = [
  { id: 1, name: 'Thunder', position: -9, speed: 0.02, stamina: 0.7, fatigue: 0, finished: false, animationSpeed: 0.1, frameCount: 11, currentFrame: 0, raceProgress: 0, recoveryRate: 0, burstChance: 0, performanceProfile: 0, baseSpeed: 0, baseAnimationSpeed: 0 },
  { id: 2, name: 'Lightning', position: -9, speed: 0.02, stamina: 0.8, fatigue: 0, finished: false, animationSpeed: 0.1, frameCount: 11, currentFrame: 0, raceProgress: 0, recoveryRate: 0, burstChance: 0, performanceProfile: 0, baseSpeed: 0, baseAnimationSpeed: 0 },
  { id: 3, name: 'Storm', position: -9, speed: 0.02, stamina: 0.6, fatigue: 0, finished: false, animationSpeed: 0.1, frameCount: 11, currentFrame: 0, raceProgress: 0, recoveryRate: 0, burstChance: 0, performanceProfile: 0, baseSpeed: 0, baseAnimationSpeed: 0 },
  { id: 4, name: 'Blaze', position: -9, speed: 0.02, stamina: 0.75, fatigue: 0, finished: false, animationSpeed: 0.1, frameCount: 11, currentFrame: 0, raceProgress: 0, recoveryRate: 0, burstChance: 0, performanceProfile: 0, baseSpeed: 0, baseAnimationSpeed: 0 }
];

let raceWinner = null;
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
     

      game.view(HorseRaceGameStateChanged).each((entity, state) => {
				game.remove(entity, HorseRaceGameStateChanged);
			});

			if (input.msg !== undefined) {

				requestInit(gameData, input.msg, output);
        selectHost(gameData, input.msg, output);
				requestIdle(gameData, input.msg, output);
				requestNewGame(gameData, input.msg, output);
				requestOpen(game, gameDataEntity, gameData, input.msg, output);
				requestWinnerDeclared(game, gameDataEntity, gameData, input.msg, output);
        requestRollingState(gameData, input.msg, output);
        requestUpdateHorseStats(gameData, input.msg, output);
			}
		});

    game.view(Player, InputMsg, Output).each((entity, mod, input, output) => {
			game.view(HorseRaceGameStateChanged).each((entity, state) => {
				game.remove(entity, HorseRaceGameStateChanged);
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
				requestOpen(game, gameDataEntity, gameData, input.msg, output);
			}
		});
    
    if (curState.horseRace !== gameData.prevState.horseRace) {
      gameData.hasHorseRaceGameStateChanged = true;
      game.view(Output).each((entity, output) => {
          game.emplace(entity, new HorseRaceGameStateChanged); // Trigger state change event
      });
  
      // After the change, reset the flag and update previous state
      gameData.hasHorseRaceGameStateChanged = false;
      gameData.prevState = { ...curState }; // Deep copy or assign
    }

    if (currentCountDownState.horseRace !== gameData.prevCountdown.horseRace) {
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
    gameData.setHorseRaceCommission(await getHorseRaceCommission());

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

function requestUpdateHorseStats(gameData, msg, output) {
  if(msg.horseStats){
    gameData.setHorseStats(msg.horseStats);
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

async function getHorseRaceCommission(){
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
                gameData.setState(GameState.NewGame, 'horseRace');
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
  const gameKey = 'horseRace';
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
                gameData.setState(GameState.NewGame, 'horseRace');
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
  
  horsesStats.map((horse, idx) => {
    // Reset position and stats
    horse.position = -9;
    horse.finished = false;
    horse.fatigue = 0;
    horse.raceProgress = 0;
    
    // Assign randomized attributes
    horse.speed = baseSpeedMin + (Math.random() * (baseSpeedMax - baseSpeedMin));
    horse.stamina = 0.5 + (Math.random() * 0.4); // 0.5-0.9
    horse.recoveryRate = 0.0003 + (Math.random() * 0.0003); // 0.0003-0.0006
    horse.burstChance = 0.02 + (Math.random() * 0.03); // 2%-5% chance for speed burst
    
    // Set performance profile (0: fast starter, 1: consistent, 2: strong finisher)
    horse.performanceProfile = Math.floor(Math.random() * 3);
    
    // Store base values for reference
    horse.baseSpeed = horse.speed;
    horse.baseAnimationSpeed = horse.animationSpeed;
    
    return horse;
  });

  // Send initial horse stats to players
  gameData.setHorseStats(horsesStats);
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
  horsesStats.forEach(horse => {
    if (horse) {
      horse.speed *= 0.95 + Math.random() * 0.1;
      horse.baseAnimationSpeed = horse.animationSpeed; // Store original animation speed
    }
  });

  const updateRace = () => {
    frameCount++;
    
    // Speed adjustments every 30 frames (0.5 seconds at 60fps)
    if (frameCount % 30 === 0 && raceActive) {
      
      let leaderPosition = Math.max(...horsesStats.map(h => h?.position || 0));
      let lastPlacePosition = Math.min(...horsesStats
        .filter(h => h && !h.finished)
        .map(h => h.position || 0));

        horsesStats.forEach((horse, index) => {
        if (!horse || horse.finished) return;

        horse.raceProgress = (horse.position - startPosition) / raceDistance;
        const distanceBehindLeader = leaderPosition - horse.position;
        const prevSpeed = horse.speed;

        // --- Speed variation with fatigue limit ---
        let speedVariation = (Math.random() - 0.5) * 1.5;

        // Weaken variation if horse is tired
        const fatigueFactor = 1 - horse.fatigue * 2;
        speedVariation *= Math.max(0.2, fatigueFactor);

        // Slight rubber banding for those behind
        if (distanceBehindLeader > 0.05 && horse.fatigue < 0.4) {
          speedVariation += 0.03;
        }

        // Mid-race burst
        const inBurstZone = horse.raceProgress > 0.3 && horse.raceProgress < 0.9;
        let burstChance = 0.03 + horse.stamina * 0.001;

        if (horse.position === lastPlacePosition) {
          burstChance += 0.3;
        }

        if (
          inBurstZone &&
          Math.random() < burstChance &&
          horse.fatigue < 0.25
        ) {
          speedVariation += 0.2 + Math.random() * 0.05;
          horse.fatigue += 0.00005;
        }

        // Fatigue accumulation
        const fatigueGain =
          0.0001 + (1 - horse.stamina) * 0.0001 +
          horse.raceProgress * 0.00003;

        horse.fatigue += fatigueGain;

        // Mild recovery if going slow and not near finish
        if (prevSpeed < 0.007 && horse.fatigue > 0.01 && horse.raceProgress < 0.9) {
          horse.fatigue -= 0.2;
        }

        // Clamp fatigue
        horse.fatigue = Math.min(0.5, Math.max(0, horse.fatigue));

        // Apply variation & fatigue to speed
        let newSpeed = prevSpeed * (2 + speedVariation);
        newSpeed *= (0.5 - horse.fatigue);

        // Clamp speed
        horse.speed = Math.max(0.05, Math.min(0.07, newSpeed));

        // Animation speed sync
        horse.animationSpeed = horse.baseAnimationSpeed * ((horse.speed * 1.1) / 0.015);
      });
    }

    allFinished = true;
    let maxPosition = 0;

    horsesStats.forEach((horse, idx) => {
      if (!horse) return;
      raceWinner = null;
      if (raceActive) {
        // Update animation frame based on current speed
        if (horse.position > maxPosition && !horse.finished) {
          maxPosition = horse.position;
        }
        horse.currentFrame = (horse.currentFrame + horse.animationSpeed * 1) % horse.frameCount;

        // Move horse
        if (!horse.finished) {
          horse.position += horse.speed * 0.65;

          // Check if horse finished
          if (horse.position >= finishLine) {
            horse.finished = true;
            horse.position = finishLine;
            horse.animationSpeed = horse.baseAnimationSpeed;
            raceActive = false;
            // Send winner update
            gameData.setHorseStats(horsesStats);
            gameData.setState(GameState.WinnerDeclared, 'horseRace');
            output.msg = {
              state: gameData.state,
              winnerDeclareStatus: {game:'horseRace', value:'Success'}  // Notify that the declaration was successful
            };
            gameData.winnerOrders['horseRace'] = horses[idx].id;  // Store the winner orders in the game data

            game.emplace(gameDataEntity, new GameDb());

            setTimeout(() => {
              gameData.setState(GameState.NewGame, 'horseRace');
              horsesStats.forEach((horse) => {
                if (!horse) return;
                horse.position = -9;
                horse.finished = false;
                horse.fatigue = 0;
                horse.raceProgress = 0;
                horse.stamina = 0;
                horse.baseSpeed = 0;
                horse.speed = horse.baseSpeed;
                horse.baseAnimationSpeed = 0.1;
                horse.animationSpeed = horse.baseAnimationSpeed;
                horse.currentFrame = 0;
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

      if (!horse.finished) {
        allFinished = false;
      }
    });

    // Throttled update: send stats every 5 frames (~12fps)
    gameData.setHorseStats(horsesStats);

    // Continue animation if not all horses finished
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
    const winnerOrders = raceWinner;
    const gameKey = 'horseRace';
    const moderatorUUID = msg.uuid;
  }
}




