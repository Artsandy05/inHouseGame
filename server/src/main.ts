import WebSocket from 'ws';
import { Game, GameData, Input, Output } from './game/Code';
import { ModeratorManager } from './game/ModeratorManager';
import { DatabaseManager } from './game/DatabaseManager';
import { PlayerManager } from './game/PlayerManager';
import User from '../models/User';
import { Moderator } from './game/Moderator';
import { Player } from './game/Player';
import { UserData } from './game/UserData';
import { SocketManager } from './game/SocketManager';
import { BetDbManager } from './game/BetDbManager';
import { GameDataManager } from './game/Bet/GameDataManager';
import { BetCalculator } from './game/Bet/BetCalculator';
import { OddsManager } from './game/Bet/OddsManager';
import { PrizeManager } from './game/Bet/PrizeManager';
import { Odds } from './game/Bet/Odds';
import { Prize } from './game/Bet/Prize';
import { Restart, RestartPlugin } from './game/plugins/RestartPlugin';
import { GameDbPlugin } from './game/plugins/GameDbPlugin';
import { TransactionDb, TransactionDbPlugin } from './game/plugins/TransactionDbPlugin';

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
    Main.instance.game.view(WebSocket).each((entity, existingSocket) => {
      if (existingSocket.uuid === socket.uuid) {
        Main.instance.game.emplace(entity, socket);
        create = false;
        return;
      }
    });

    if (create) {
      const d = await User.findByUUID(data.uuid);

      let components = [
        new Input,
        new Output,
        socket,
        new UserData(d),
        new Prize
      ];
      
      if (d?.role === "moderator" || d?.role === "superadmin") {
        console.log("moderator");
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

