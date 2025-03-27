import { BetCalculator } from "../../src/game/Bet/BetCalculator";
import { GameDataManager } from "../../src/game/Bet/GameDataManager";
import { Odds } from "../../src/game/Bet/Odds";
import { OddsManager } from "../../src/game/Bet/OddsManager";
import { Prize } from "../../src/game/Bet/Prize";
import { PrizeManager } from "../../src/game/Bet/PrizeManager";
import { Game, GameData, Input, Output } from "../../src/game/Code";
import { Player } from "../../src/game/Player";
import { TestUtils, getStringKey, getTestData, getTestData1 } from "../../utils/tests/TestUtils";


describe('BetCalculator', () => {
  test('TestGroupAccumulatedBets', async () => {
		let game = new Game();

    let gameData = new GameData();
		game
      .create(
        gameData
      );

    function objectToMap<T>(obj: { [key: string]: T }): Map<string, T> {
      const map = new Map<string, T>();
      Object.keys(obj).forEach(key => {
        map.set(key, obj[key]);
      });
      return map;
    }
    
    const bets = [
      objectToMap({ '0': 10 }),
      objectToMap({ '0': 10 }),
      objectToMap({ '1': 20 }),
      objectToMap({ '1': 20 }),
      objectToMap({ '2': 50 }),
    ]

    bets.forEach((bet) => {
      let player = new Player();
      player.slots = bet;

      game.create(
        new Input,
        new Output,
        player
      );
    });

    setTimeout(() => {
      gameData.calculateAllBets['bbp'] = true;
    }, 50)

    setTimeout(() => {
      expect(gameData.slotBets.bbp.get(getStringKey([0]))).toBe(20);
      expect(gameData.slotBets.bbp.get(getStringKey([1]))).toBe(40);
      expect(gameData.slotBets.bbp.get(getStringKey([2]))).toBe(50);
      
      game.stop();
    }, 100);
    

		game
      .addPlugin(new GameDataManager)
			.addPlugin(new BetCalculator);

		await game.run();
	});

  test('CalculateSlotBets', async () => {
    const rootFolder = process.cwd();
    let worksheet = await TestUtils.getWorksheet(
      `${rootFolder}/tests/integration/files/BettingTests.xlsx`,
      1
    );
    const testData = getTestData1(worksheet);

		let game = new Game();

    let gameData = new GameData();
    gameData.commission.bbp = testData.commission;
		game
      .create(
        gameData
      );

    testData.players.forEach((p) => {
      let player = new Player();
      player.slots = p.slots;

      game.create(
        new Input,
        new Output,
        player
      );
    });

    setTimeout(() => {
      gameData.calculateAllBets['bbp'] = true;
    }, 50)

    setTimeout(() => {
      testData.gross.forEach((val, idx) => {
        expect(gameData.slotBets['bbp'].get(getStringKey([idx]))).toBe(val);
      });
      game.stop();
    }, 100);

		game
      .addPlugin(new GameDataManager)
			.addPlugin(new BetCalculator);

		await game.run();
	});

  test('CalculateOdds', async () => {
    const rootFolder = process.cwd();
    let worksheet = await TestUtils.getWorksheet(
      `${rootFolder}/tests/integration/files/BettingTests.xlsx`,
      1
    );
    const testData = getTestData1(worksheet);
		let game = new Game();
    let gameData = new GameData();
    gameData.commission.bbp = testData.commission;

    let odds = new Odds();
		game
      .create(
        gameData,
        odds
      );

    testData.players.forEach((p) => {
      let player = new Player();
      player.slots = p.slots;

      game.create(
        new Input,
        new Output,
        player
      );
    });

    setTimeout(() => {
      gameData.calculateAllBets['bbp'] = true;
    }, 50)

    setTimeout(() => {
      testData.odds.forEach((val, key) => {
        expect(odds.values.get(key)).toBe(val);
      });
      game.stop();
    }, 100);

		game
      .addPlugin(new GameDataManager)
			.addPlugin(new BetCalculator)
      .addPlugin(new OddsManager);

		await game.run();
	});

  test('CalculatePlayerPrizesIfTheyWin', async () => {
    const rootFolder = process.cwd();
    let worksheet = await TestUtils.getWorksheet(
      `${rootFolder}/tests/integration/files/BettingTests.xlsx`,
      1
    );
    const testData = getTestData1(worksheet);
		let game = new Game();
    let gameData = new GameData();
    gameData.commission.bbp = testData.commission;

    let odds = new Odds();
		game
      .create(
        gameData,
        odds
      );

    testData.players.forEach((p) => {
      let player = new Player();
      player.uuid = p.uuid;
      player.slots = p.slots;

      game.create(
        new Input,
        new Output,
        player,
        new Prize
      );
    });

    setTimeout(() => {
      gameData.calculateAllBets['bbp'] = true;
    }, 50)

    setTimeout(() => {
      let count = 0;
      testData.players.forEach((p) => {
        game.view(Player, Prize).each((entity, player, prize) => {
          if (p.uuid === player.uuid) {
            p.prizes.forEach((val, key) => {
              // console.log(`key: ${key}, val: ${val}`);
              expect(val).toBe(prize.values.get(key));
            });

            count++;
            return;
          }
        });
      });

      expect(count).toBe(testData.players.length);
      game.stop();
    }, 100);

		game
      .addPlugin(new GameDataManager)
			.addPlugin(new BetCalculator)
      .addPlugin(new OddsManager)
      .addPlugin(new PrizeManager);

		await game.run();
	});

});

