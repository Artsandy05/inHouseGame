import { GameState, ModeratorCommands, arrayToMap, delay, jsonToMapArray, mapToArray } from "../../../../common/gameutils";
import { BetCalculator } from "../../../src/game/Bet/BetCalculator";
import { GameDataManager } from "../../../src/game/Bet/GameDataManager";
import { Odds } from "../../../src/game/Bet/Odds";
import { OddsManager } from "../../../src/game/Bet/OddsManager";
import { Prize } from "../../../src/game/Bet/Prize";
import { PrizeManager } from "../../../src/game/Bet/PrizeManager";
import { Game, GameData, Input, Output } from "../../../src/game/Code";
import { Moderator } from "../../../src/game/Moderator";
import { ModeratorManager } from "../../../src/game/ModeratorManager";
import { Player } from "../../../src/game/Player";
import { PlayerManager } from "../../../src/game/PlayerManager";
import { SocketManager } from "../../../src/game/SocketManager";
import { TestUtils, getTestData1 } from "../../../utils/tests/TestUtils";
import { Socket } from "../../Common";

describe('BettingTests', () => {
  /*
    Use unique ports
    Unique database
  */
  beforeAll(async () => {
    SocketManager.setClassType(Socket);
  });

  afterAll(async () => {
    // Terminate server
  });

  beforeEach(async () => {

  });

  afterEach(async () => {

	});

  test('CalculateOddsWithReply', async () => {
    let runner = {
      done: false,
    };
    
    let modSocket = new Socket(modOutput);
    let playerSocket = new Socket(playerOutput);
    let gameData = new GameData();
    gameData.commission.zodiac = 0.1;

    let game = new Game();
		game
      .create(
        gameData,
        new Odds()
      );

    game.create(
      new Input,
      new Output,
      new Moderator,
      new Prize,
      modSocket
    );

    game.create(
      new Input,
      new Output,
      new Player(),
      new Prize,
      playerSocket
    );

		game
      .addPlugin(new SocketManager)
      .addPlugin(new GameDataManager)
      .addPlugin(new ModeratorManager)
      .addPlugin(new PlayerManager)

			.addPlugin(new BetCalculator)
      .addPlugin(new OddsManager);

		game.run();
    await game.loaded();
    modSocket.simulateMessage(JSON.stringify({
      cmd: GameState.Open
    }));

    playerSocket.simulateMessage(JSON.stringify({
      slots: jsonToMapArray({
        "0":10 
      })
    }));

    function modOutput(message: string) {
      // console.log(message);
      
    }
    function playerOutput(message: string) {
      const msg = JSON.parse(message);
      msg.odds = arrayToMap(msg.odds);
      expect(msg.odds.get("0")).toBe(0.9);
      runner.done = true;
    }
    await hold(runner);
    game.stop();
	});

  test('CalculateMultiplePlayerOddsWithReply', async () => {
    let runner = {
      done: false,
    };
    let game = setupGame();

    const rootFolder = process.cwd();
    let worksheet = await TestUtils.getWorksheet(
      `${rootFolder}/tests/integration/files/BettingTests.xlsx`,
      1
    );

    const testData = getTestData1(worksheet);
    let playerSockets = [];
    const players = testData.players.slice();

    let count = 0;
    players.forEach((p) => {
      let playerSocket = setupPlayer(game, p, (message) => {
        const msg = JSON.parse(message);
        msg.odds = arrayToMap(msg.odds);
        if (mapsAreEqual(testData.odds, msg.odds)) {
          count += 1;
          if (count === players.length) {
            runner.done = true;
          }
        }
      });
      playerSockets.push(playerSocket);
    });

    let modSocket = setupModerator(game, (message) => {});
    await game.loaded();
    modSocket.simulateMessage(JSON.stringify({
      cmd: GameState.Open
    }));

    await delay(40);
    sendSlotMessages(testData, playerSockets);

    await hold(runner);
    game.stop();
	});

  test('CalculateMultiplePlayerPrizes', async () => {
    let runner = {
      done: false,
    };
    let game = setupGame();
    game.addPlugin(new PrizeManager);

    const rootFolder = process.cwd();
    let worksheet = await TestUtils.getWorksheet(
      `${rootFolder}/tests/integration/files/BettingTests.xlsx`,
      1
    );

    const testData = getTestData1(worksheet);
    let playerSockets = [];
    const players = testData.players.slice();

    let count = 0;
    players.forEach((p) => {
      let playerSocket = setupPlayer(game, p, (message) => {
        const msg = JSON.parse(message);
        const prizes = arrayToMap(msg.prizes);
        if (mapsAreEqual(p.prizes, prizes)) {
          count += 1;
          if (count === players.length) {
            runner.done = true;
          }
        }
      });
      playerSockets.push(playerSocket);
    });

    let modSocket = setupModerator(game, (message) => {});
    await game.loaded();
    modSocket.simulateMessage(JSON.stringify({
      cmd: GameState.Open
    }));

    await delay(40);
    sendSlotMessages(testData, playerSockets);

    await hold(runner);
    game.stop();
	});

  test('SelectWinner', async () => {
    let runner = {
      done: false,
    };
    let game = setupGame();
    game.addPlugin(new PrizeManager);

    const rootFolder = process.cwd();
    let worksheet = await TestUtils.getWorksheet(
      `${rootFolder}/tests/integration/files/BettingTests.xlsx`,
      1
    );

    const testData = getTestData1(worksheet);
    let playerSockets = [];
    const players = testData.players.slice();

    let count = 0;
    players.forEach((p) => {
      let playerSocket = setupPlayer(game, p, (message) => {
        const msg = JSON.parse(message);
        const prizes = arrayToMap(msg.prizes);
        if (mapsAreEqual(p.prizes, prizes)) {
          count += 1;
          if (count === players.length) {
            runner.done = true;
          }
        }
      });
      playerSockets.push(playerSocket);
    });

    let modSocket = setupModerator(game, (message) => {});
    await game.loaded();
    modSocket.simulateMessage(JSON.stringify({
      cmd: GameState.Open
    }));

    await delay(40);
    sendSlotMessages(testData, playerSockets);

    await hold(runner);
    game.stop();
	});

});

async function sendSlotMessages(testData, sockets) {
  let totalSent = 0;

  function sendMessage() {
    if (totalSent >= testData.players.length) {
      return;
    }

    let p = testData.players[totalSent];
    sockets.forEach((socket) => {
      if (p.uuid === socket.uuid) {
        socket.simulateMessage(JSON.stringify({
          slots: mapToArray(p.slots)
        }));
        totalSent++;
      }
    })
  }

  return new Promise<void>(resolve => {
    const interval = setInterval(() => {
      if (totalSent === sockets.length) {
        // console.log(`totalSent ${totalSent}`);
        clearInterval(interval);
        resolve();
      }
      sendMessage();
    }, 1000 / 60);
  });
}

function setupGame(): Game {
  let game = new Game();

  let gameData = new GameData();
  // Set up the `calculateAllBets` structure with the correct conditions for each game.
  gameData.calculateAllBets = {
    zodiac: true,  // Assuming you're setting this to true for zodiac
    dos: false,    // Assuming false for dos, adjust according to your requirements
  };
  gameData.commission.zodiac = 0.1;

  let odds = new Odds();
  game.create(gameData, odds);

  game
    .addPlugin(new SocketManager)
    .addPlugin(new GameDataManager)
    .addPlugin(new ModeratorManager)
    .addPlugin(new PlayerManager)
    .addPlugin(new BetCalculator)
    .addPlugin(new OddsManager);

  game.run();
  return game;
}

function setupModerator(game, cbFn): Socket {
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

function setupPlayer(game, dataPlayer, cbFn): Socket {
  let socket = new Socket(cbFn);
  socket.uuid = dataPlayer.uuid;

  let player = new Player();
  player.uuid = dataPlayer.uuid;
  // player.slots = dataPlayer.slots;
  game.create(
    new Input,
    new Output,
    player,
    new Prize,
    socket
  );
  return socket;
}

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

function mapsAreEqual(map1, map2) {
  if (map1.size !== map2.size) {
    return false;
  }

  for (let [key, value] of map1) {
    if (!map2.has(key) || map2.get(key) !== value) {
      return false;
    }
  }
  return true;
}


/*
  Spawn server
	Login
  Query database
  Provide username and password
  Connect to websocket
*/



