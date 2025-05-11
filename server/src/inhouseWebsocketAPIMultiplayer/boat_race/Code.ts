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
  prevState: {boatRace:GameState};
  state: {boatRace:GameState};
  processedGames: Set<string>;
  prizes:{boatRace:[]};
  games = ['boatRace'];
  isInsertGameDatabase = {game:'', state: false};
  hasBoatRaceGameStateChanged = false;
  hasCountdownStateChanged = false;
  hasSelectedHostStateChanged = false;
  gameId: {boatRace:number};
  gamesTableId: {boatRace:number};
  calculateAllBets = {boatRace:false};
  calculateAllBetsForWalkin = {boatRace:false};
  commission: {boatRace:number};
  companyCommission: number;
  boatRaceCommission: number;
  slotBets = {boatRace:new Map<string, number>()};
  slotBetsWalkin = {boatRace:new Map<string, number>()};
  odds = {boatRace:new Map<string, number>()};
  winnerOrders = {boatRace:[]};
  loseOrders = {boatRace:[]};
  winners = {boatRace:[]};
  countdown = {boatRace:0};
  prevCountdown = {boatRace:0};
  playerSlots = {boatRace:[]};
  prevHost = {boatRace: {id:null}};
  host = {boatRace: {id:null}};
  playerCurrentBalance = {boatRace:[]};
  moderatorsWinningBall = {boatRace:[]};
  walkinPlayers = {boatRace:[]};
  topPlayers = {boatRace:[]};
  voidGame = {boatRace:false};
  walkinPlayersId = {boatRace:0};
  boatStats = false;

  constructor() {
    this.processedGames = new Set();
    this.state = {
      boatRace: GameState.Idle,
    };
    this.prevState = {
      boatRace: GameState.Idle,
    };
    this.countdown = {
      boatRace: 0,
    };
    this.prevCountdown = {
      boatRace: 0,
    };
    this.gameId = {
      boatRace: 0,
    };
    this.gamesTableId = {
      boatRace: 0,
    };
    this.commission = {
      boatRace: 0.10,
    };
    this.winners = {
      boatRace: [],
    };
    this.boatStats = false;
  }

  setState(state, gameName) {
    this.prevState[gameName] = this.state[gameName];
    this.state[gameName]= state;
  }
  
  setBoatStats(boatStats) {
    this.boatStats = boatStats;
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
  
  setBoatRaceCommission(companyCommission){
    this.boatRaceCommission = companyCommission;
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
export class BoatRaceGameStateChanged { }
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


