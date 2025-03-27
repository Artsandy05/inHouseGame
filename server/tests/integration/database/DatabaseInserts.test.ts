import { GameState, ModeratorCommands, arrayToMap, delay, jsonToMapArray, mapToArray } from "../../../../common/gameutils";
import { Bet as BetData } from "../../../src/game/Bet";
import { BetCalculator } from "../../../src/game/Bet/BetCalculator";
import { GameDataManager } from "../../../src/game/Bet/GameDataManager";
import { Odds } from "../../../src/game/Bet/Odds";
import { OddsManager } from "../../../src/game/Bet/OddsManager";
import { Prize } from "../../../src/game/Bet/Prize";
import { PrizeManager } from "../../../src/game/Bet/PrizeManager";
import { BetDbManager } from "../../../src/game/BetDbManager";
import { Game, GameData, Input, Output } from "../../../src/game/Code";
import { Moderator } from "../../../src/game/Moderator";
import { ModeratorManager } from "../../../src/game/ModeratorManager";
import { Player } from "../../../src/game/Player";
import { PlayerManager } from "../../../src/game/PlayerManager";
import { SocketManager } from "../../../src/game/SocketManager";
import { UserData } from "../../../src/game/UserData";
import { TestUtils, getTestData1 } from "../../../utils/tests/TestUtils";
import { Socket } from "../../Common";
import sequelize from "../../../config/database";
import Bet from "../../../models/Bet";
import Wallet from "../../../models/Wallet";
import User from "../../../models/User";

describe('BettingTests', () => {
	const dbName = "ZodiacBetTest";

  beforeAll(async () => {
    SocketManager.setClassType(Socket);
  });

  afterAll(async () => {
    sequelize.close();
  });

  beforeEach(async () => {
		await sequelize.query(`DROP DATABASE IF EXISTS ${dbName}`);
		await sequelize.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
		await sequelize.query(`USE ${dbName}`);

		// await createTableUsers(sequelize);
		// await createTableWallets(sequelize);
		// await createTableTransactions(sequelize);
		// await createTableConfigs(sequelize);
		// await createTableGames(sequelize);
		// await createTableBets(sequelize);
		

		// FIXME: User table is out of whack, need to refactor to make address or other tables
		// 				reference by userId instead of adding it as column in users table
		//				Reason: Cannot create test because it can't be modularized
		// try {
		// 	await User.sync({force: true});
		// } catch (e) {
		// 	console.error(e)
		// }
		
		// await Wallet.sync({force: true});

		// const wallets = [
		// 	{ user_id: 1}
		// ]
		// Wallet.bulkCreate(wallets);
  });

  afterEach(async () => {
		// await sequelize.query(`DROP DATABASE IF EXISTS ${dbName}`);
	});

  test('1PlayerBetInsert', async () => {
		// let runner = {
    //   done: false,
    // };
    
    // let game = new Game();
		// createData(game);

		// let modSocket = createModerator(game, (message) => {});
    // let playerSocket = createPlayer(game, playerSocketReply);
		// addPlugins(game);
		// game.run();
    // await game.loaded();

    // modSocket.simulateMessage(JSON.stringify({
    //   cmd: GameState.Open
    // }));

    // playerSocket.simulateMessage(JSON.stringify({
    //   slots: jsonToMapArray({
    //     "0":10 
    //   })
    // }));

		// async function playerSocketReply(message) {
		// 	const bets = await Bet.findAll();
		// 	console.log(bets);
		// }

		// runner.done = false;

    // await hold(runner);
    // game.stop();



		/*
			Player bet
			Database creation of:
				bets
					record
				transactions
					record
				wallets
					update amount
		*/
	});

});


async function hold(runner) {
  return new Promise<void>(resolve => {
    const interval = setInterval(() => {
      if (runner.done) {
        clearInterval(interval);
        resolve();
      }
    }, 1000 / 30);
  });
}


function createData(game: Game) {
	let gameData = new GameData();
	gameData.commission.bbp = 0.1;

	game
		.create(
			gameData,
			new Odds()
		);
}

function createModerator(game: Game, cbFn) {
	let socket = new Socket(cbFn);
	game.create(
		new Input,
		new Output,
		new Moderator,
		new Prize,
		socket
	);
	return socket;
}

function createPlayer(game: Game, cbFn) {
	let socket = new Socket(cbFn);
	game.create(
		new Input,
		new Output,
		new Player(),
		new Prize,
		new BetData,
		new UserData({id: 1}),
		socket
	);
	return socket;
}

function addPlugins(game: Game) {
	game
		.addPlugin(new SocketManager)
		.addPlugin(new GameDataManager)
		.addPlugin(new ModeratorManager)
		.addPlugin(new PlayerManager)

		.addPlugin(new BetCalculator)
		.addPlugin(new OddsManager)
		.addPlugin(new BetDbManager);
}

async function tableExists(sequelize, dbName, tableName) {
  const [results, metadata] = await sequelize.query(
    `SELECT table_name FROM ${dbName}.tables WHERE table_name = '${tableName}' LIMIT 1`
  );
	console.log(results)
  return results.length > 0;
}

async function createTableUsers(sequelize) {
	try {
		await sequelize.query(`
			CREATE TABLE users (
				id int NOT NULL AUTO_INCREMENT,
				uuid char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
				role enum('superadmin','admin','supervisor','verifier','superagent','masteragent','agent','operator','moderator','accounting','player') NOT NULL DEFAULT 'player',
				PRIMARY KEY (id)
			)
		`);
	} catch (e) {
		console.log(e);
	}
}

async function createTableWallets(sequelize) {
	try {
		await sequelize.query(`
			CREATE TABLE wallets (
				id int NOT NULL AUTO_INCREMENT,
				user_id int NOT NULL,
				balance decimal(10,2) NOT NULL DEFAULT '0.00',
				createdAt datetime DEFAULT CURRENT_TIMESTAMP,
				updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
				PRIMARY KEY (id),
				UNIQUE KEY user_id (user_id)
			)
		`);
	} catch (e) {
		console.log(e);
	}
}

async function createTableTransactions(sequelize) {
	try {
		await sequelize.query(`
			CREATE TABLE transactions (
				id int NOT NULL AUTO_INCREMENT,
				wallet_id int NOT NULL,
				game_id int DEFAULT NULL,
				amount decimal(10,4) NOT NULL,
				type enum('bet','wonprize','deposit','load','withdrawal') NOT NULL,
				status varchar(255) DEFAULT NULL,
				callbackId varchar(255) DEFAULT NULL,
				merchant varchar(255) DEFAULT NULL,
				createdAt datetime NOT NULL,
				updatedAt datetime NOT NULL,
				PRIMARY KEY (id),
				KEY wallet_id (wallet_id),
				CONSTRAINT transactions_ibfk_1 FOREIGN KEY (wallet_id) REFERENCES wallets (id) ON UPDATE CASCADE
			)
		`);
	} catch (e) {
		console.log(e);
	}
}

async function createTableConfigs(sequelize) {
	try {
		await sequelize.query(`
			CREATE TABLE configs (
				id int NOT NULL AUTO_INCREMENT,
				fee decimal(10,2) DEFAULT NULL,
				createdAt datetime DEFAULT CURRENT_TIMESTAMP,
				updatedAt datetime DEFAULT CURRENT_TIMESTAMP,
				config_id int DEFAULT NULL,
				PRIMARY KEY (id)
			)
		`);
	} catch (e) {
		console.log(e);
	}
}

async function createTableGames(sequelize) {
	try {
		await sequelize.query(`
			CREATE TABLE games (
				id int NOT NULL AUTO_INCREMENT,
				user_id int NOT NULL,
				config_id int NOT NULL,
				name varchar(100) NOT NULL,
				label varchar(255) DEFAULT NULL,
				gross decimal(10,6) DEFAULT NULL,
				createdAt datetime NOT NULL,
				updatedAt datetime NOT NULL,
				PRIMARY KEY (id)
			)
		`);
	} catch (e) {
		console.log(e);
	}
}

async function createTableBets(sequelize) {
	try {
		await sequelize.query(`
			CREATE TABLE bets (
				id int NOT NULL AUTO_INCREMENT,
				game_id int NOT NULL,
				transaction_id int NOT NULL,
				zodiac varchar(255) NOT NULL,
				createdAt datetime NOT NULL,
				updatedAt datetime NOT NULL,
				PRIMARY KEY (id),
				KEY game_id (game_id),
				CONSTRAINT bets_ibfk_1 FOREIGN KEY (game_id) REFERENCES games (id) ON UPDATE CASCADE
			)
		`);
	} catch (e) {
		console.log(e);
	}
}
