import { Game, GameData, Plugin } from "../Code";

export class GameDataManager implements Plugin {
	build(game: Game): void {
		game
			.before(before)
	}
}

function before(game: Game) {
	game.view(GameData).each((entity, gameData) => {
    gameData.games.forEach(gameName => {
      if (gameData.calculateAllBets[gameName]) {
        gameData.calculateAllBets[gameName] = false;
      }
      
      if (gameData.calculateAllBetsForWalkin[gameName]) {
        gameData.calculateAllBetsForWalkin[gameName] = false;
      }
    });
	});
	
}
