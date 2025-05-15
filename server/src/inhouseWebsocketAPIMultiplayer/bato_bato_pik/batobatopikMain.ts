import WebSocket from 'ws';
import { Game, GameData, Input, Output } from './Code';
import { ModeratorManager } from './ModeratorManager';
import { DatabaseManager } from './DatabaseManager';
import { PlayerManager } from './PlayerManager';
import { Moderator } from './Moderator';
import { Player } from './Player';
import { UserData } from './UserData';
import { SocketManager } from './SocketManager';
import { BetDbManager } from './BetDbManager';
import { GameDataManager } from './Bet/GameDataManager';
import { BetCalculator } from './Bet/BetCalculator';
import { OddsManager } from './Bet/OddsManager';
import { PrizeManager } from './Bet/PrizeManager';
import { Odds } from './Bet/Odds';
import { Prize } from './Bet/Prize';
import { Restart, RestartPlugin } from './plugins/RestartPlugin';
import { GameDbPlugin } from './plugins/GameDbPlugin';
import { TransactionDb, TransactionDbPlugin } from './plugins/TransactionDbPlugin';
import User from '../../../models/User';
interface CustomWebSocket extends WebSocket {
  uuid: string;
}

export class Main {
  private static instance: Main = null;
  public game: Game;
  private constructor() {}

  public static getInstance(): Main {
    if (!Main.instance) {
      Main.instance = new Main();

      Main.instance.game = new Game();

      SocketManager.setClassType(WebSocket);
      Main.instance.game.create(
        new GameData,
        new Odds,
        new Restart,
      )

      Main.instance.game
        .addPlugin(new SocketManager)
        .addPlugin(new GameDataManager)
        .addPlugin(new ModeratorManager)
        .addPlugin(new PlayerManager)

        .addPlugin(new BetCalculator)
        .addPlugin(new OddsManager)
        .addPlugin(new PrizeManager)

        .addPlugin(new BetDbManager)
        .addPlugin(new DatabaseManager)
        .addPlugin(new GameDbPlugin)
        .addPlugin(new TransactionDbPlugin)
        .addPlugin(new RestartPlugin)
        ;
    }
    return Main.instance;
  }

  public async load(socket, data) {
    
    socket.uuid = data.uuid;
    
    let create = true;
    Main.instance.game.view(WebSocket).each((entity, existingSocket: CustomWebSocket) => {
      if (existingSocket.uuid === socket.uuid) {
        Main.instance.game.emplace(entity, socket);
        create = false;
        return;
      }
    });

    if (create) {
      
      const d = await User.findByPk(data.id);
      let components = [
        new Input,
        new Output,
        socket,
        new UserData(d),
        new Prize
      ];
      
      if (d?.role === "moderator" || d?.role === "superadmin") {
        components.push(new Moderator);
      } else {
        components.push(new Player)
        components.push(new TransactionDb);
      }
      Main.instance.game.create(...components);
      
    }
  }
  public async restart() {

  }

}

