import { GameState, hasValue } from "../../../../common/gameutils";
import { World } from 'uecs';

export class Input {
	msg: any;
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
  prevState: {bbp:GameState};
  state: {bbp:GameState};
  processedGames: Set<string>;
  prizes:{bbp:[]};
  games = ['bbp'];
  isInsertGameDatabase = {game:'', state: false};
  hasBBPGameStateChanged = false;
  hasCountdownStateChanged = false;
  hasSelectedHostStateChanged = false;
  gameId: {bbp:number};
  gamesTableId: {bbp:number};
  calculateAllBets = {bbp:false};
  calculateAllBetsForWalkin = {bbp:false};
  commission: {bbp:number};
  companyCommission: number;
  bbpCommission: number;
  slotBets = {bbp:new Map<string, number>()};
  slotBetsWalkin = {bbp:new Map<string, number>()};
  odds = {bbp:new Map<string, number>()};
  winnerOrders = {bbp:[]};
  loseOrders = {bbp:[]};
  winners = {bbp:[]};
  countdown = {bbp:0};
  prevCountdown = {bbp:0};
  playerSlots = {bbp:[]};
  prevHost = {bbp: {id:null}};
  host = {bbp: {id:null}};
  playerCurrentBalance = {bbp:[]};
  moderatorsWinningBall = {bbp:[]};
  walkinPlayers = {bbp:[]};
  topPlayers = {bbp:[]};
  voidGame = {bbp:false};
  walkinPlayersId = {bbp:0};
  juanChoice = false;
  pedroChoice = false;

  constructor() {
    this.processedGames = new Set();
    this.state = {
      bbp: GameState.Idle,
    };
    this.prevState = {
      bbp: GameState.Idle,
    };
    this.countdown = {
      bbp: 0,
    };
    this.prevCountdown = {
      bbp: 0,
    };
    this.gameId = {
      bbp: 0,
    };
    this.gamesTableId = {
      bbp: 0,
    };
    this.commission = {
      bbp: 0.10,
    };
    this.winners = {
      bbp: [],
    };
    this.juanChoice = false;
    this.pedroChoice = false;
  }

  setState(state, gameName) {
    this.prevState[gameName] = this.state[gameName];
    this.state[gameName]= state;
  }
  setJuanChoice(juanChoice) {
    this.juanChoice = juanChoice;
  }
  setPedroChoice(pedroChoice) {
    this.pedroChoice = pedroChoice;
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
  
  setBBPCommission(companyCommission){
    this.bbpCommission = companyCommission;
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
export class BBPGameStateChanged { }
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


