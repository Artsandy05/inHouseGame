import { Sequelize } from "sequelize";
import { GameState } from "../../../../common/gameutils";
import Config from "../../../models/Config";
import Game from "../../../models/Game";
import { Odds } from "../Bet/Odds";
import { Game as GameWorld, GameData, Plugin } from "../Code";
import { Player } from "../Player";

export class GameDbPlugin implements Plugin {
	build(game: GameWorld): void {
		game
			.system(update);
	}
}

function update(game: GameWorld) {
	game.view(GameData, GameDb)
	.each((entity, gameData, gameDb) => {
    gameData.games.forEach(gameName => {
      if(gameData.state[gameName] === GameState.WinnerDeclared)
        updateDb(gameData);
    });
	});
}

async function updateDb(gameData: GameData) {
  try {
    let previouseCompanyShare = 0;
    // Loop through the game names using a for...of loop to support async/await
    for (const gameName of gameData.games) {  // Changed to loop directly through the array
      let gross = 0;
      let commission = 0;
      
      if(gameData.gamesTableId[gameName] !== 0){
        // Wait for the database query to finish before proceeding
        const g = await Game.findByPk(gameData.gamesTableId[gameName]);
        // Check if slotBets[gameName] is a Map and sum the values
        const slots = gameData.slotBets[gameName];
        const walkinSlots = gameData.slotBetsWalkin[gameName];
        let combinedSlots = new Map(walkinSlots);

        // Combine the two maps (slots + walkinSlots)
        slots.forEach((value, key) => {
          if (combinedSlots.has(key)) {
            combinedSlots.set(key, combinedSlots.get(key) + value);
          } else {
            combinedSlots.set(key, value);
          }
        });

        if (combinedSlots instanceof Map) {
          // Use Map's forEach method to sum the values
          combinedSlots.forEach((val:any) => {
            commission += (val * gameData.commission[gameName]);
            gross += val;
          });
        } else {
          // Handle the case where it's not a Map or is undefined
          console.error(`slotBets for ${gameName} is not a Map or is undefined`);
        }

        g.gross = gross;
        g.totalCommission = commission;
        //console.log(commission, "@@@@@@@@@");
        await g.save();
      }
      
    }
  } catch (e) {
    console.error(e);
  }
}





export class GameDb { }

