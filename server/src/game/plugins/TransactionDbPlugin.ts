import { arrayToMap, GameState, hasValue, ZODIAC_LABELS } from "../../../../common/gameutils";
import Game from "../../../models/Game";
import Transaction from "../../../models/Transaction";
import Wallet from "../../../models/Wallet";
import { Odds } from "../Bet/Odds";
import { Prize } from "../Bet/Prize";
import { Game as GameWorld, GameData, Plugin, Output } from "../Code";
import { Player } from "../Player";
import { UserData } from "../UserData";
import { GameDb } from "./GameDbPlugin";
import Bet from "../../../models/Bet";
import WinningBall from "../../../models/WinningBall";
import Games from "../../../models/Game";
import user from "../../../schema/user";
import RepresentativePlayerTransactions from "../../../models/RepresentativePlayerTransactions";
import User from "../../../models/User";
import WinningBets from "../../../models/WinningBets";
import LosingBets from "../../../models/LosingBets";
import { Sequelize } from "sequelize";
import Config from "../../../models/Config";
import Referral from "../../../models/Referral";
import CommissionTransaction from "../../../models/CommissionTransaction";
import { contructMoney, displayMoney, displayNumber, toFixedTrunc } from "../../../utils/logic";

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
	await WinningBall.new(gameData.gamesTableId[gameName], gameName === 'bbp' && gameData.winnerOrders[gameName], gameName);
}

export class TransactionDb { }

