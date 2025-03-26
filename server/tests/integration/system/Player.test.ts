import { GameState, ModeratorCommands } from "../../../../common/gameutils";
import { Game, GameData, Input, Output, Plugin } from "../../../src/game/Code";
import { Moderator } from "../../../src/game/Moderator";
import { ModeratorManager } from "../../../src/game/ModeratorManager";
import { Player } from "../../../src/game/Player";
import { PlayerManager } from "../../../src/game/PlayerManager";
import { SocketManager } from "../../../src/game/SocketManager";
import { Socket2 } from "../../Common";

describe('BasicSystemSetup', () => {

	beforeAll(async () => {
		SocketManager.setClassType(Socket2);
  });

  afterAll(async () => {
    
  });

  beforeEach(async () => {
  });

  afterEach(async () => {
  });

	test('ListenToServerStateChange', async () => {
		const TOTAL_PLAYERS = 10;
    let game = new Game();
		let data = new GameData;
		let modSocket = new Socket2();
		let playerSockets = [];
		let newGameReplies = [];
		sendDelayedMessage();
		initGameData();
		initModeratorData();
		initPlayersData();
		initPlugins();
		subscribePlayersSocket();
		
		game.run();
		await onNewGameState();
		await doneGettingNewGameStateReplies();
		game.stop();
		

		function output(msgStr) {
			const msg = JSON.parse(msgStr);
		}
		function sendDelayedMessage() {
			setTimeout(() => {
				modSocket.simulateMessage(JSON.stringify({
					cmd: GameState.NewGame
				}));
			}, 50);
	
		}
		function initGameData() {
			data.state['zodiac'] = GameState.Idle;
			game.create(data);
		}
		function initModeratorData() {
			game.create(
				modSocket,
				new Input,
				new Output,
				new Moderator
			);
		}
		function initPlayersData() {
			for (let i = 0; i < TOTAL_PLAYERS; i++) {
				let socket = new Socket2();
				game.create(
					socket,
					new Input,
					new Output,
					new Player
				);
				playerSockets.push(socket);
			}
		}
		function initPlugins() {
			game
				.addPlugin(new SocketManager)
				.addPlugin(new ModeratorManager)
				.addPlugin(new PlayerManager);

		}
		function subscribePlayersSocket() {
			playerSockets.forEach((socket, idx) => {
				socket.onReply((message) => {
					const msg = JSON.parse(message);
					if (msg.state === GameState.NewGame) {
						newGameReplies.push(message);
					}
				});
			});
		}

		async function onNewGameState() {
			return new Promise<void>(resolve => {
				const interval = setInterval(() => {
					if (data.state['zodiac'] === GameState.NewGame) {
						clearInterval(interval);
						resolve();
					}
				}, 1000 / 60);
			});
		}
		async function doneGettingNewGameStateReplies() {
			return new Promise<void>(resolve => {
				const interval = setInterval(() => {
					if (newGameReplies.length === TOTAL_PLAYERS) {
						clearInterval(interval);
						resolve();
					}
				}, 1000 / 60);
			});
		}
	});

});