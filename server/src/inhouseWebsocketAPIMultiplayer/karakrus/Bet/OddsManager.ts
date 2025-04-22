
import { hasValue, mapToArray } from "../../../../../common/gameutils";
import { Game, GameData, Output, Plugin } from "../Code";
import { Odds } from "./Odds";

export class OddsManager implements Plugin {
	build(game: Game): void {
		game
			.system(update)
	}
}

async function update(game: Game) {
  game.view(GameData, Odds).each((entity, gameData, odds) => {
      gameData.games.forEach(gameName => {
        // || gameData.hasLoadedGameSlots[gameName]
        if (gameData.calculateAllBets[gameName]) {
          
          let totalNet = gameData.getTotalNet(gameName);
          odds.values = new Map<string, number>;
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

          combinedSlots.forEach((val:any, key:any) => {
              odds.values.set(key, totalNet / val);
              odds.game = gameName;
          });
        }
        
        if (gameData.calculateAllBetsForWalkin[gameName]) {
          let totalNet = gameData.getTotalNet(gameName);
          odds.values = new Map<string, number>;
          const slots = gameData.slotBets[gameName];
          const walkinSlots = gameData.slotBetsWalkin[gameName];
          let combinedSlots = new Map(walkinSlots);

          
          slots.forEach((value, key) => {
            if (combinedSlots.has(key)) {
              combinedSlots.set(key, combinedSlots.get(key) + value);
            } else {
              combinedSlots.set(key, value);
            }
          });

          combinedSlots.forEach((val:any, key:any) => {
              odds.values.set(key, totalNet / val);
              odds.game = gameName;
          });
        }
      });
      
      gameData.games.forEach(gameName => {
        if (gameData.calculateAllBets[gameName] || gameData.calculateAllBetsForWalkin[gameName]) {
          game.view(Output).each((entity, output) => {
              if (hasValue(output.msg)) {
                gameData.odds[gameName] = odds.values;
                const convertedOdds = {karakrus:[]};
                for (let key in gameData.odds) {
                  convertedOdds[key] = mapToArray(gameData.odds[key]);
                }
                const convertedAllBets = {karakrus:[]};
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
                
                if(typeof output.msg === 'string'){
                  let newOutPut = JSON.parse(output.msg);
                  newOutPut.odds = convertedOdds;
                  newOutPut.allBets = convertedAllBets;
                  output.msg = JSON.stringify(newOutPut);
                }else{
                  output.msg.odds = convertedOdds;
                  output.msg.allBets = convertedAllBets;
                }
                // output.msg.odds = convertedOdds;
                // output.msg.allBets = convertedAllBets;
              } else {
                gameData.odds[gameName] = odds.values;
                const convertedOdds = {karakrus:[]};
                for (let key in gameData.odds) {
                  convertedOdds[key] = mapToArray(gameData.odds[key]);
                }
                const convertedAllBets = {karakrus:[]};
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
                output.msg = { odds: convertedOdds, allBets: convertedAllBets };
              }
          });
          
        }
        
      });
  });
}

