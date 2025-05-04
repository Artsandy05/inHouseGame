import { GameState, hasValue, mapToArray } from "../../../../common/gameutils";
import { Bet as BetData } from "./Bet";
import { HorseRaceGameStateChanged, Game, GameData, Output, Plugin } from "./Code";
import { Player } from "./Player";
import { UserData } from "./UserData";


export class BetDbManager implements Plugin {
	build(game: Game): void {
		game
			.system(update);
	}
}


function update(game: Game) {
	let gameData: GameData;
	let gameEntity;
	game.view(GameData).each((entity, g) => {
		gameEntity = entity;
		gameData = g;
	});
  
  
      gameData.games.forEach(gameName => {
        game.view(gameName === 'horseRace' && HorseRaceGameStateChanged, Player, UserData, Output).each((entity, state, player, userData, output) => { 
          // && player.slots.size > 0
          if (player.game === gameName && gameData.state[gameName] === GameState.WinnerDeclared) {
            
              const playerSlots = new Map();
              playerSlots.set(userData.data.id, {
                  userId: userData.data.id,
                  uuid: userData.data.uuid,
                  gameId: gameData.gamesTableId[gameName],
                  slots: mapToArray(player.slots)
              });

              gameData.playerSlots[gameName] = Array.from(playerSlots.values());
          }
      });
  });


  game.view(BetData, UserData, Player, Output).each((entity, bet, userData, player, output) => {
    game.remove(gameEntity, BetDbSuccess);
    game.view(Output).each((entity, output) => {
      const convertedAllBets = {horseRace:[]};
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
      
      if(hasValue(output.msg) && typeof output.msg === 'string'){
        let newOutPut = JSON.parse(output.msg);
        newOutPut.allBets = convertedAllBets;
        output.msg = JSON.stringify(newOutPut);
      }else{
        output.insert("allBets", convertedAllBets);
      }
      //output.insert("allBets", convertedAllBets);
      
    });
  });
}

export class BetDbSuccess { }

