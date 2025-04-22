import { GameState } from "../../../../../common/gameutils";
import WinningBall from "../../../../models/WinningBall";
import { GameData, Game as GameWorld, Plugin } from "../Code";
import { GameDb } from "./GameDbPlugin";


export class TransactionDbPlugin implements Plugin {
	build(game: GameWorld): void {
		game.system(update);
	}
}

async function update(game: GameWorld) {
    game.view(GameData, GameDb).each((entity, gameData, gameDb) => {
      gameData.games.forEach(async (gameName) => {
        if (gameData.state[gameName] === GameState.WinnerDeclared) {
          await insertWinningBall(gameData, gameName);
        }
      });
    });
}


const insertWinningBall = async (gameData: GameData, gameName) => {
	await WinningBall.new(gameData.gamesTableId[gameName], gameName === 'karakrus' && gameData.winnerOrders[gameName], gameName);
}

export class TransactionDb { }

