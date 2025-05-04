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
  prevState: {horseRace:GameState};
  state: {horseRace:GameState};
  processedGames: Set<string>;
  prizes:{horseRace:[]};
  games = ['horseRace'];
  isInsertGameDatabase = {game:'', state: false};
  hasHorseRaceGameStateChanged = false;
  hasCountdownStateChanged = false;
  hasSelectedHostStateChanged = false;
  gameId: {horseRace:number};
  gamesTableId: {horseRace:number};
  calculateAllBets = {horseRace:false};
  calculateAllBetsForWalkin = {horseRace:false};
  commission: {horseRace:number};
  companyCommission: number;
  horseRaceCommission: number;
  slotBets = {horseRace:new Map<string, number>()};
  slotBetsWalkin = {horseRace:new Map<string, number>()};
  odds = {horseRace:new Map<string, number>()};
  winnerOrders = {horseRace:[]};
  loseOrders = {horseRace:[]};
  winners = {horseRace:[]};
  countdown = {horseRace:0};
  prevCountdown = {horseRace:0};
  playerSlots = {horseRace:[]};
  prevHost = {horseRace: {id:null}};
  host = {horseRace: {id:null}};
  playerCurrentBalance = {horseRace:[]};
  moderatorsWinningBall = {horseRace:[]};
  walkinPlayers = {horseRace:[]};
  topPlayers = {horseRace:[]};
  voidGame = {horseRace:false};
  walkinPlayersId = {horseRace:0};
  horseStats = false;

  constructor() {
    this.processedGames = new Set();
    this.state = {
      horseRace: GameState.Idle,
    };
    this.prevState = {
      horseRace: GameState.Idle,
    };
    this.countdown = {
      horseRace: 0,
    };
    this.prevCountdown = {
      horseRace: 0,
    };
    this.gameId = {
      horseRace: 0,
    };
    this.gamesTableId = {
      horseRace: 0,
    };
    this.commission = {
      horseRace: 0.10,
    };
    this.winners = {
      horseRace: [],
    };
    this.horseStats = false;
  }

  setState(state, gameName) {
    this.prevState[gameName] = this.state[gameName];
    this.state[gameName]= state;
  }
  
  setHorseStats(horseStats) {
    this.horseStats = horseStats;
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
  
  setHorseRaceCommission(companyCommission){
    this.horseRaceCommission = companyCommission;
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
export class HorseRaceGameStateChanged { }
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


