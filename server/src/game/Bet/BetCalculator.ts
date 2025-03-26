import { arrayToMap, GameState, hasValue } from "../../../../common/gameutils";
import { Game, GameData, Plugin } from "../Code";
import { Player } from "../Player";
import { BetDbSuccess } from "../BetDbManager";
import GameRoundPlayerData from "../../../models/GameRoundPlayerData";

export class BetCalculator implements Plugin {
	build(game: Game): void {
		game
			.system(update);
	}
}

function update(game: Game) {
	// Questionnable implementation
	game.view(GameData).each((entity, gameData) => {
    gameData.games.forEach(gameName => {
      // || gameData.hasIncompleteRound[gameName]
      if (gameData.calculateAllBets[gameName]) {
          gameData.slotBets[gameName].clear();
          game.view(Player).each((entity, player) => {
            if(player.game === gameName){
              player.slots.forEach((amount, key) => {
                let val = gameData.slotBets[gameName].get(key);
                if (hasValue(val)) {
                  val += amount;
                } else {
                  val = amount;
                }
                gameData.slotBets[gameName].set(key, val);
              });
            }
          });

        // else if(gameData.hasIncompleteRound[gameName]){
        //   gameData.slotBets[gameName].clear();
        //   GameRoundPlayerData.findAll({ 
        //     where: { 
        //       isComplete: false, 
        //       gameId: gameData.gamesTableId[gameName], 
        //       gameName 
        //     } 
        //   }).then(players => {
        //     if (players.length > 0) {
        //       players.forEach(player => {
        //         if (player.gameName === gameName) {
        //           const slots = arrayToMap(JSON.parse(player.slots));
        //           slots.forEach((amount, key) => {
        //             let val = gameData.slotBets[gameName].get(key); 
                    
        //             if (hasValue(val)) { 
        //               val += amount; 
        //             } else {
        //               val = amount; 
        //             }
        //             gameData.slotBets[gameName].set(key, val); 
        //           });
        //         }
        //       });
        //       gameData.hasLoadedGameSlots[gameName] = true
        //     }
        //   }).catch(error => {
        //     console.error("Error during query:", error);
        //   });
        // }
      }
      
      //|| gameData.hasIncompleteRound[gameName]
      if (gameData.calculateAllBetsForWalkin[gameName]) {
        if(gameData.walkinPlayers[gameName].length > 0){
          gameData.walkinPlayers[gameName].forEach(player => {
            if(!player.isAddedToSlotBetsWalkin){
              player.data.forEach(bet => {
                const key = bet.id.toString();
                let val = gameData.slotBetsWalkin[gameName].get(key);
                if (hasValue(val)) {
                  val += bet.total_bet / (bet.betType === 'single' ? 1 : bet.roundCount);
                } else {
                  val = bet.total_bet / (bet.betType === 'single' ? 1 : bet.roundCount);
                }
                gameData.slotBetsWalkin[gameName].set(key, val);
              })
              player.isAddedToSlotBetsWalkin = true;
            }
          })
        }
      }
    });
	});

	// Recalculating if database has been successful
	// Have to change implementation where
	// Nothing should be changed until validated from the database
	game.view(GameData, BetDbSuccess).each((entity, gameData, betDbSuccess) => {
    gameData.games.forEach(gameName => {
      gameData.slotBets[gameName].clear();
      game.view(Player).each((entity, player) => {
        if(player.game === gameName){
          player.slots.forEach((amount, key) => {
            let val = gameData.slotBets[gameName].get(key);
            if (hasValue(val)) {
              val += amount;
            } else {
              val = amount;
            }
            gameData.slotBets[gameName].set(key, val);
          })
        }
      });
    });
	});
}

/*
	Validate first from database
	They calculate
	Have to check if there is enough balance
 */




