import { GameState } from "../../../../common/gameutils";
import GameRoundData from "../../../models/GameRoundData";
import GameRoundPlayerData from "../../../models/GameRoundPlayerData";
import { Odds } from "../Bet/Odds";
import { Game, GameData, Output, Plugin } from "../Code";
import { Player } from "../Player";

export class RestartPlugin implements Plugin {
	build(game: Game): void {
		game
			.system(update);
	}
}

function update(game: Game) {
  game.view(GameData, Odds, Restart)
  .each((entity, gameData, odds, restart) => {
    gameData.games.forEach(gameName => {
      const currentState = gameData.state[gameName];

      if (currentState === GameState.NewGame) {
        if (!restart.restarted) {
          restart.restarted = true;

          gameData.slotBets[gameName] = new Map<string, number>();  // Optional chaining in case it's undefined
          gameData.slotBetsWalkin[gameName] = new Map<string, number>();
          gameData.odds[gameName] = new Map<string, number>();      // Optional chaining in case it's undefined
          gameData.winners[gameName] = [];
          gameData.winnerOrders[gameName] = gameName === 'bbp' && '';
          gameData.loseOrders[gameName] = [];
          gameData.playerSlots[gameName] = [];
          gameData.playerCurrentBalance[gameName] = [];
          gameData.moderatorsWinningBall[gameName] = [];
          gameData.topPlayers[gameName] = [];  
          gameData.voidGame[gameName] = false;
          if(odds.game === gameName){
            odds.values.clear();
            odds.game = '';
          }
          gameData.walkinPlayers[gameName].forEach(player => {
            player.isAddedToSlotBetsWalkin = false;
            player.isProcessed = false;
          })
          
          

          game.view(Player).each((entity, player) => {
            if(player.game === gameName){
              player.hasBet = false;
              player.slots.clear();
              player.game = '';
              player.uuid = '';
              player.isSavedToDb = false;
            }
          });
          
        }
        restart.restarted = false;
      }
      
    });
  });
}




export class Restart {
	restarted = false;
}

