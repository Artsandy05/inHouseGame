import { GameState, ModeratorCommands } from "../../../../common/gameutils";
import { Game, GameData, Input, Output, Plugin } from "../../../src/inhouseWebsocketAPIMultiplayer/bato_bato_pik/Code";
import { Moderator } from "../../../src/inhouseWebsocketAPIMultiplayer/bato_bato_pik/Moderator";
import { ModeratorManager } from "../../../src/inhouseWebsocketAPIMultiplayer/bato_bato_pik/ModeratorManager";
import { SocketManager } from "../../../src/inhouseWebsocketAPIMultiplayer/bato_bato_pik/SocketManager";
import { Socket } from "../../Common";

describe('BasicSystemSetup', () => {

	beforeAll(async () => {
		SocketManager.setClassType(Socket);
  });

  afterAll(async () => {
    
  });

  beforeEach(async () => {
  });

  afterEach(async () => {
  });

	test('TestBasicSocketInputOutput', async () => {
		let game = new Game();
		let socket = new Socket(reply);
		setTimeout(() => {
			socket.simulateMessage(JSON.stringify({test: "test"}));
		}, 50);

		function reply(message) {
			const msg = JSON.parse(message);
			expect(msg).toBe(1);
			game.stop();
		}

		game.create(new GameData);

		game.create(
			socket,
			new Input,
			new Output,
		);

		game
			.addPlugin(new BasicReply)
			.addPlugin(new SocketManager);

		await game.run();
	});

	test('Test1000RandomOrderBasicReply', async () => {
		let game = new Game();

		game.create(new GameData);

		let replies = 0;
		const MAX_COUNT = 1;
		for (let i = 0; i < MAX_COUNT; i++) {
			let socket = new Socket(reply);
			setTimeout(() => {
				socket.simulateMessage(JSON.stringify({test: "test"}));
			}, getRandomNumber(50, 100));

			function reply(message) {
				const msg = JSON.parse(message);
				expect(msg).toBe(i + 1);
				replies++;
				// console.log(`replies: ${replies} msg: ${msg}`);
				if (replies === MAX_COUNT) {
					game.stop();
				}
			}

			game.create(
				socket,
				new Input,
				new Output,
			);
		}
		
		game
			.addPlugin(new BasicReply)
			.addPlugin(new SocketManager);

		await game.run();
	});

 	test('TestModeratorCommandInit', async () => {
		let game = new Game();
		let socket = new Socket(output);
		setTimeout(() => {
			socket.simulateMessage(JSON.stringify({
				cmd: ModeratorCommands.Init
			}));
		}, 50);

		function output(message) {
			const msg = JSON.parse(message);
			expect(msg.state).toBe(GameState.Idle);
			game.stop();
		}

		game.create(new GameData);

		game.create(
			socket,
			new Input,
			new Output,
			new Moderator
		);

		game
			.addPlugin(new ModeratorManager)
			.addPlugin(new SocketManager);

		await game.run();
	});

	test('TestModeratorSetGameIdle', async () => {
		let game = new Game();
		let socket = new Socket(output);
		setTimeout(() => {
			socket.simulateMessage(JSON.stringify({
				cmd: GameState.Idle
			}));
		}, 50);

		function output(msgStr) {
			const msg = JSON.parse(msgStr);
			expect(msg.state).toBe(GameState.Idle);
			game.stop();
		}

		
		let data = new GameData;
		data.state['zodiac'] = GameState.WinnerDeclared;
		game.create(data);

		game.create(
			socket,
			new Input,
			new Output,
			new Moderator
		);

		game
			.addPlugin(new ModeratorManager)
			.addPlugin(new SocketManager);

		await game.run();
	});

 	test('TestModeratorSetGameNewGame', async () => {
		let game = new Game();
		let socket = new Socket(output);
		setTimeout(() => {
			socket.simulateMessage(JSON.stringify({
				cmd: GameState.NewGame
			}));
		}, 50);

		function output(msgStr) {
			const msg = JSON.parse(msgStr);
			expect(msg.state).toBe(GameState.NewGame);
			game.stop();
		}

		let data = new GameData;
		data.state['zodiac'] = GameState.Idle;
		game.create(data);
		game.create(
			socket,
			new Input,
			new Output,
			new Moderator
		);

		game
			.addPlugin(new ModeratorManager)
			.addPlugin(new SocketManager);

		await game.run();
	});

	test('TestModeratorSetGameOpen', async () => {
		let game = new Game();
		let socket = new Socket(output);
		setTimeout(() => {
			socket.simulateMessage(JSON.stringify({
				cmd: GameState.Open
			}));
		}, 50);

		function output(msgStr) {
			const msg = JSON.parse(msgStr);
			expect(msg.state).toBe(GameState.Open);
			game.stop();
		}

		let data = new GameData;
		data.state['zodiac'] = GameState.NewGame;
		game.create(data);
		game.create(
			socket,
			new Input,
			new Output,
			new Moderator
		);

		game
			.addPlugin(new ModeratorManager)
			.addPlugin(new SocketManager);

		await game.run();
	});

	test('TestModeratorSetGameLastCall', async () => {
		let game = new Game();
		let socket = new Socket(output);
		setTimeout(() => {
			socket.simulateMessage(JSON.stringify({
				cmd: GameState.LastCall
			}));
		}, 50);

		function output(msgStr) {
			const msg = JSON.parse(msgStr);
			expect(msg.state).toBe(GameState.LastCall);
			game.stop();
		}

		let data = new GameData;
		data.state['zodiac'] = GameState.Open;
		game.create(data);
		game.create(
			socket,
			new Input,
			new Output,
			new Moderator
		);

		game
			.addPlugin(new ModeratorManager)
			.addPlugin(new SocketManager);

		await game.run();
	});

	test('TestModeratorSetGameClosed', async () => {
		let game = new Game();
		let socket = new Socket(output);
		setTimeout(() => {
			socket.simulateMessage(JSON.stringify({
				cmd: GameState.Closed
			}));
		}, 50);

		function output(msgStr) {
			const msg = JSON.parse(msgStr);
			expect(msg.state).toBe(GameState.Closed);
			game.stop();
		}

		let data = new GameData;
		data.state['zodiac'] = GameState.LastCall;
		game.create(data);
		game.create(
			socket,
			new Input,
			new Output,
			new Moderator
		);

		game
			.addPlugin(new ModeratorManager)
			.addPlugin(new SocketManager);

		await game.run();
	});

	test('TestModeratorSetGameWinnerDeclared', async () => {
		let game = new Game();
		let socket = new Socket(output);
		setTimeout(() => {
			socket.simulateMessage(JSON.stringify({
				cmd: GameState.WinnerDeclared
			}));
		}, 50);

		function output(msgStr) {
			const msg = JSON.parse(msgStr);
			expect(msg.state).toBe(GameState.WinnerDeclared);
			game.stop();
		}

		let data = new GameData;
		data.state['zodiac'] = GameState.Closed;
		game.create(data);
		game.create(
			socket,
			new Input,
			new Output,
			new Moderator
		);

		game
			.addPlugin(new ModeratorManager)
			.addPlugin(new SocketManager);

		await game.run();
	});

});

class BasicReply implements Plugin {
	build(game: Game): void {
		game
			.system(this.update);
	}
	update(game) {
		game.view(Input, Output).each((entity, input, output) => {
			if (input.msg !== undefined) {
				input.msg = undefined;
				output.msg = entity;
			}
		});
	}
}

function getRandomNumber(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

