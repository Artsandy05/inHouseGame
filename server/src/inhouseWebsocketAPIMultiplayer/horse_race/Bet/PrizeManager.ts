
import { hasValue, mapToArray } from "../../../../../common/gameutils";
import { Game, GameData, Output, Plugin } from "../Code";
import { Player } from "../Player";
import { Odds } from "./Odds";
import { Prize } from "./Prize";

export class PrizeManager implements Plugin {
	build(game: Game): void {
		game
			.system(update)
	}
}



async function update(game: Game) {
	let gameData: GameData;
	game.view(GameData).each((entity, g) => {
		gameData = g;
	});

  function getSlotGross(key:any, gameName){
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
    
    return combinedSlots.get(key) as number;
  }
  
	game.view(Player, Prize, Output).each((entity, player, prize, output) => {
    gameData.games.forEach(gameName => {
      if (gameData.calculateAllBetsForWalkin[gameName] || gameData.calculateAllBets[gameName]) {
        if(player.game === gameName){
          player.slots.forEach((amount, key:any) => {
            const slotGross = getSlotGross(key, gameName);
            const ratio = amount / slotGross;
            const totalNet = gameData.getTotalNet(gameName);
            prize.values.set(key, totalNet * ratio);
            prize.game = gameName;
            if(hasValue(output.msg) && typeof output.msg === 'string'){
              let newOutPut = JSON.parse(output.msg);
              newOutPut.prizes = mapToArray(prize.values);
              output.msg = JSON.stringify(newOutPut);
            }else{
              output.insert("prizes", mapToArray(prize.values));
            }
          });
        }
      }
    });
	});
}

