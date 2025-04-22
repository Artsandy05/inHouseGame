import { GameState, hasValue } from "../../../../common/gameutils";
import { World } from 'uecs';

export class Input {
	msg: string;
}

export class Output {
	msg;

  insert(name, data) {
    if (hasValue(this.msg)) {
      this.msg[name] = data;
    } else {
      this.msg = {};
      this.msg[name] = data;
    }
  }
}


export class Game extends World {
  running = false;
  private initSystems = [];
  private beforeSystems = [];
  private currentSystems = [];
  private afterSystems = [];

  addPlugin(plugin: Plugin) {
    plugin.build(this);
    return this;
  }
  init(system) {
    this.initSystems.push(system);
    return this;
  }
  before(system) {
    this.beforeSystems.push(system);
    return this;
  }
  system(system) {
    this.currentSystems.push(system);
    return this;
  }
  after(system) {
    this.afterSystems.push(system);
    return this;
  }
  async run() {
    this.running = true;

    this.initSystems.forEach((s) => {
      s(this);
    });

    const fps = 60;
    const interval = 1000 / fps;
    while (this.running) {
      this.beforeSystems.forEach((s) => {
        s(this);
      });
      
      await new Promise(resolve => setTimeout(resolve, interval));
      this.currentSystems.forEach((s) => {
        s(this);
      });
      this.afterSystems.forEach((s) => {
        s(this);
      });
    }
  }
  async loaded() {
    return new Promise<void>(resolve => {
      const interval = setInterval(() => {
        if (this.running) {
          clearInterval(interval);
          resolve();
        }
      }, 1000 / 30);
    });
  }
  stop() {
    this.running = false;
  }
}

export interface Plugin {
  build(game: Game): void;
}

// async function getConfig(){
//   const config = await Config.findOne({ where: { id: 1 } });
//   return config.fee;
// }


export class GameData {
  prevState: {karakrus:GameState};
  state: {karakrus:GameState};
  processedGames: Set<string>;
  prizes:{karakrus:[]};
  games = ['karakrus'];
  isInsertGameDatabase = {game:'', state: false};
  hasKaraKrusGameStateChanged = false;
  hasCountdownStateChanged = false;
  hasSelectedHostStateChanged = false;
  gameId: {karakrus:number};
  gamesTableId: {karakrus:number};
  calculateAllBets = {karakrus:false};
  calculateAllBetsForWalkin = {karakrus:false};
  commission: {karakrus:number};
  companyCommission: number;
  karakrusCommission: number;
  slotBets = {karakrus:new Map<string, number>()};
  slotBetsWalkin = {karakrus:new Map<string, number>()};
  odds = {karakrus:new Map<string, number>()};
  winnerOrders = {karakrus:[]};
  loseOrders = {karakrus:[]};
  winners = {karakrus:[]};
  countdown = {karakrus:0};
  prevCountdown = {karakrus:0};
  playerSlots = {karakrus:[]};
  prevHost = {karakrus: {id:null}};
  host = {karakrus: {id:null}};
  playerCurrentBalance = {karakrus:[]};
  moderatorsWinningBall = {karakrus:[]};
  walkinPlayers = {karakrus:[]};
  topPlayers = {karakrus:[]};
  voidGame = {karakrus:false};
  walkinPlayersId = {karakrus:0};
  coinResult = false;

  constructor() {
    this.processedGames = new Set();
    this.state = {
      karakrus: GameState.Idle,
    };
    this.prevState = {
      karakrus: GameState.Idle,
    };
    this.countdown = {
      karakrus: 0,
    };
    this.prevCountdown = {
      karakrus: 0,
    };
    this.gameId = {
      karakrus: 0,
    };
    this.gamesTableId = {
      karakrus: 0,
    };
    this.commission = {
      karakrus: 0.10,
    };
    this.winners = {
      karakrus: [],
    };
    
    this.coinResult = false;
  }

  setState(state, gameName) {
    this.prevState[gameName] = this.state[gameName];
    this.state[gameName]= state;
  }

  setCoinResult(result) {
    this.coinResult = result;
  }

  setWalkinPlayers(data, game) {
    this.walkinPlayers[game]= data;
  }
  setWalkinPlayersId(id, game) {
    this.walkinPlayersId[game]= id;
  }
  

  setCountdownState(countdown, gameName) {
    this.prevCountdown[gameName] = this.countdown[gameName];
    this.countdown[gameName]= countdown;
  }
  
  setHost(host, gameName) {
    this.prevHost[gameName] = this.host[gameName];
    this.host[gameName] = host;
  }

  setCompanyCommission(companyCommission){
    this.companyCommission = companyCommission;
  }
  
  setKaraKrusCommission(companyCommission){
    this.karakrusCommission = companyCommission;
  }

  getTotalNet(gameName) {
    let totalNet = 0;
    const slots = this.slotBets[gameName];
    const walkinSlots = this.slotBetsWalkin[gameName];
    let combinedSlots = new Map(walkinSlots);

    // Combine the two maps (slots + walkinSlots)
    slots.forEach((value, key) => {
      if (combinedSlots.has(key)) {
        combinedSlots.set(key, combinedSlots.get(key) + value);
      } else {
        combinedSlots.set(key, value);
      }
    });
    
    if (combinedSlots) {
      combinedSlots.forEach((betAmount:any) => {
            totalNet += betAmount;
        });
      totalNet = totalNet - (totalNet * (this.commission[gameName]));
    }
    return totalNet;
  }
}


export class ZodiacGameStateChanged { }
export class KaraKrusGameStateChanged { }
export class CountdownStateChanged { }
export class SelectedHostStateChanged { }

export class Winner {
  uuid: string;
  prize: number;
  constructor(uuid, prize) {
    this.uuid = uuid;
    this.prize = prize;
  }
}


