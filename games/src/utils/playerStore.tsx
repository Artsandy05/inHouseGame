import { create } from "zustand";
import { getRequiredUrl } from "../services/common";
import { arrayToMap, ClientCommands, hasValue } from "./gameutils";

enum LocalState {
  Connected = "Connected",
  Disconnected = "Disconnected",
}
type State = {
  liveUsers: { zodiac: number; dos: number };
  socket: WebSocket | null;
  localState: string;
  gameState: any;
  eventData: any; // Adjust this type to match your event data
  socketState: string;
  selectedIndex: number;
  lastSelectedIndex: number;
  output: string[];
  winnerIndex: number;
  selectedButton: any; // Adjust this type as needed
  isWinner: boolean;
  balance: any; // Adjust type for balance
  openModal: boolean;
  bet: number;
  tempSelectedIndex: number;
  odds: Map<string, number>;
  prize: number;
  winners: any[]; // Adjust this type as needed
  showBetting: boolean;
  topPlayers: any[]; // Adjust this type as needed
  slots: Map<string, number>;
  hasBet: boolean;
  countdown: number;
  allBets: any; // Adjust type for allBets
  activePlayerCount: number;
  playerInfo: number;
  hasVIPBadge: number;
  host: any; // Adjust type for host
  showSlideHostRanking: any; 
  showSlideTopGiversRanking: any;
  selectedHostRank: boolean;
  giftSent: boolean;
  hostLikesByPlayer: boolean;
  gameId: boolean;
  betOnGame: string;
  winningBall: boolean;
  showWinner: boolean;
  showTopWinners: boolean;
  gameSelectionId: boolean;
  giftSuggestion: boolean;
  showWinningBall: boolean;
  showCustomAlert: boolean;
  playerHasWon: boolean;
  voidMessage: boolean;
  triggerRefetchBalance: boolean;
  isHostGifted: boolean;
};

export const playerStore = create<State>((set) => ({
  socket: null,
  output: [],
  localState: LocalState.Disconnected,
  setLocalState: (s) => {
    set({ localState: s });
  },
  gameState: null,
  setGameState: (g) => {
    set({ gameState: g });
  },
  eventData: null,
  setEventData: (g) => {
    set({ eventData: g });
  },
  socketState: "",
  connect: () => {
    connect(set);
  },
  sendMessage: (message) => {
    const { socket } = playerStore.getState();
    if (socket) {
      socket.send(message);
      set((state) => ({
        output: [...state.output, "Sent message: " + message],
      }));
    }
  },
  selectedIndex: -1,
  setSelectedIndex: (index) => {
    set({ selectedIndex: index });
  },
  lastSelectedIndex: -1,
  setLastSelectedIndex: (i) => {
    set({ lastSelectedIndex: i });
  },
  winnerIndex: -1,
  setWinnerIndex: (index) => {
    set({ winnerIndex: index });
  },
  selectedButton: null,
  setSelectedButton: (s) => {
    set({ selectedButton: s });
  },
  isWinner: false,
  setIsWinner: (w) => {
    set({ isWinner: w });
  },
  balance: null,
  setBalance: (m) => {
    set({ balance: m });
  },
  openModal: false,
  setOpenModal: (o) => {
    set({ openModal: o });
  },
  bet: 0,
  setBet: (b) => {
    set({ bet: b });
  },
  tempSelectedIndex: 0,
  setTempSelectedIndex: (i) => {
    set({ tempSelectedIndex: i });
  },
  odds: new Map<string, number>(),
  setOdds: (b) => {
    set({ odds: b });
  },
  prize: 0,
  setPrize: (s) => {
    set({ prize: s });
  },
  winners: [],
  setWinners: (s) => {
    set({ winners: s });
  },
  showBetting: false,
  setShowBetting: (s) => {
    set({ showBetting: s });
  },
  topPlayers: [],
  setTopPlayers: (s) => {
    set({ topPlayers: s });
  },
  slots: new Map<string, number>(),
  setSlots: (b) => {
    set({ slots: b });
  },
  hasBet: false, // Added state to track if a bet has been placed
  setHasBet: (b) => {
    set({ hasBet: b });
  },
  countdown: 0,
  setCountdown: (c) => {
    set({ countdown: c });
  },
  allBets: null,
  setAllBets: (b) => {
    set({ allBets: b });
  },
  activePlayerCount: 0,
  setActivePlayerCount: (c) => {
    set({ activePlayerCount: c });
  },
  playerInfo: 0,
  setPlayerInfo: (p) => {
    set({ playerInfo: p });
  },
  hasVIPBadge: 0,
  setHasVIPBadge: (p) => {
    set({ hasVIPBadge: p });
  },
  host: null,
  setHost: (h) => {
    set({ host: h });
  },
  showSlideHostRanking: null,
  setShowSlideHostRanking: (h) => {
    set({ showSlideHostRanking: h });
  },
  showSlideTopGiversRanking: null,
  showSlideOverallTopGiversanking: null,
  selectedHostRank: false,
  setSelectedHostRank: (h) => {
    set({ selectedHostRank: h });
  },
  giftSent: false,
  setGiftSent: (h) => {
    set({ giftSent: h });
  },
  hostLikesByPlayer: false,
  setHostLikes: (h) => {
    set({ hostLikesByPlayer: h });
  },
  gameId: false,
  setGameId: (g) => {
    set({ gameId: g });
  },
  betOnGame: '',
  setBetOnGame: (g) => {
    set({ betOnGame: g });
  },
  winningBall: false,
  setWinningBall: (g) => {
    set({ winningBall: g });
  },
  showWinner: false,
  setShowWinner: (g) => {
    set({ showWinner: g });
  },
  liveUsers: { zodiac: 0, dos: 0 },
  setLiveUsers: (count: number, game: string) => {
    set((state:State) => ({
      liveUsers: {
        ...state.liveUsers,  // Preserve other properties of liveUsers
        [game]: count,       // Dynamically update the property for the specific game
      },
    }));
  },
  showTopWinners: false,
  setShowTopWinners: (g) => {
    set({ showTopWinners: g });
  },
  gameSelectionId: false,
  setGameSelectionId: (g) => {
    set({ gameSelectionId: g });
  },
  giftSuggestion: false,
  setGiftSuggestion: (g) => {
    set({ giftSuggestion: g });
  },
  showWinningBall: false,
  setShowWinningBall: (g) => {
    set({ showWinningBall: g });
  },
  showCustomAlert: false,
  setShowCustomAlert: (g) => {
    set({ showCustomAlert: g });
  },
  playerHasWon: false,
  setPlayerHasWon: (g) => {
    set({ playerHasWon: g });
  },
  voidMessage: false,
  setVoidMessage: (g) => {
    set({ voidMessage: g });
  },
  triggerRefetchBalance: false,
  setTriggerRefetchBalance: (g) => {
    set({ triggerRefetchBalance: g });
  },
  isHostGifted: false,
  setIsHostGifted: (g) => {
    set({ isHostGifted: g });
  },
}));

export default function connect(set) {
  
  //const isBatoBatoPik = window.location.pathname.includes('/bato_bato_pik');
  const url = getRequiredUrl();
  if (!hasValue(url)) {
    throw `No valid url: ${url}`;
  }
  const socket = new WebSocket(url);

  if (!hasValue(socket)) {
    // TODO: Implement redirect to /login
    console.log("No uuid and token");
    return;
  }

  socket.addEventListener("open", () => {
    set({ socket });
    set({ gameState: "Connected, waiting for betting to open" });
    set({ dosGameState: "Connected, waiting for betting to open" });
    set({ socketState: "open" });
    open(set, socket);
    const isBatoBatoPik = window.location.pathname.includes('/bato_bato_pik');
    socket.send(JSON.stringify({
      cmd: ClientCommands.Init,
      game: isBatoBatoPik ? 'bbp' : ''
    }));
  });
  socket.addEventListener("message", (event) => {
    update(set, event.data);
  });
  socket.addEventListener("error", (event: Event) => {
    // Type casting to ErrorEvent to access the 'message' property
    const errorEvent = event as ErrorEvent;
    set((state) => ({
      output: [...state.output, "Error: " + errorEvent.message],
    }));
  });
  socket.addEventListener("close", () => {
    set((state) => ({ output: [...state.output, "Connection closed"] }));
  });
}

function open(set, socket) {
  set({ socket });
  set({ socketState: "STANDBY" });
  set({ localState: LocalState.Connected });
  set({ gameState: null });
  set({ dosGameState: null });
  const isBatoBatoPik = window.location.pathname.includes('/bato_bato_pik');
  setTimeout(() => {
    socket.send(
      JSON.stringify({
        cmd: ClientCommands.Init,
        game: isBatoBatoPik ? 'bbp' : '',
      })
    );
  }, 100);
}


async function update(set, eventData) {
  let meta = JSON.parse(eventData);
  console.log(meta)
  const isBatoBatoPik = window.location.pathname.includes('/bato_bato_pik');
  
  if ((hasValue(meta.host)) || (typeof meta === 'string' && meta.includes('host'))) {
    const host = typeof meta ==='string' ? JSON.parse(meta) : meta;
    set({ host: isBatoBatoPik ? host.host.bbp : null });
    
  }
  if ((hasValue(meta.betOnGame)) || (typeof meta === 'string' && meta.includes('betOnGame'))) {
    const betOnGame = typeof meta ==='string' ? JSON.parse(meta) : meta;
    set({ betOnGame: meta.betOnGame });
    set({ betOnGame: betOnGame.betOnGame });
  }
  if ((typeof meta === 'string' && meta.includes('gameId'))) {
    const gameId = typeof meta ==='string' ? JSON.parse(meta) : meta;
    set({ gameId: isBatoBatoPik ? gameId.gameId.bbp : null });
  }
  if ((hasValue(meta.gameId))) {
    set({ gameId: isBatoBatoPik ? meta.gameId.bbp : null });
  }

  

  if (meta.voidGameMessage) {
    const voidGameMessage = typeof meta ==='string' ? JSON.parse(meta) : meta;
    set({ voidMessage: meta.voidGameMessage });
    set({ voidMessage: voidGameMessage.voidGameMessage });
  }

  if (typeof meta === 'string' && meta.includes('winningBall')) {
    const winningBall = JSON.parse(meta);
    if (isBatoBatoPik ? winningBall.winningBall.bbp !== '' : false) {
        set({ winningBall: winningBall.winningBall });
    }
  }

  if (hasValue(meta.winningBall)) {
    if (isBatoBatoPik ? meta.winningBall.bbp !== '' : false) {
        set({ winningBall: meta.winningBall });
    }
  }

  
  if (hasValue(meta.slots)) {
    const slots = isBatoBatoPik ? meta.slots.bbp : null;
    if (hasValue(slots)) {  
      set({ slots: arrayToMap(slots) });
    }
  }

  if (typeof meta === 'string' && meta.includes('slots')) {
    const slots = JSON.parse(meta);
    if (hasValue(slots)) { 
      set({ slots: arrayToMap(slots.slots) });
    }
  }

  if (hasValue(meta.activePlayerCount)) {
    set({ activePlayerCount: meta.activePlayerCount });
  }

  if ((hasValue(meta.allBets)) || (typeof meta === 'string' && meta.includes('allBets'))) {
    const allBets = typeof meta === 'string' ? JSON.parse(meta) : meta;
    // Check kung may laman ang allBets.dos
    if (isBatoBatoPik ? hasValue(arrayToMap(allBets.allBets.bbp)) : false) {
        set({ allBets: isBatoBatoPik ? arrayToMap(allBets.allBets.bbp) : null});
    }
  }

  if (hasValue(meta.odds)) {
    const odds = isBatoBatoPik ? arrayToMap(meta.odds.bbp) : null;
    set({ odds: odds });
  }
  
  if ((typeof meta === 'string' && meta.includes('odds'))) {
    const newMeta = JSON.parse(meta);
    const newOdds = isBatoBatoPik ? arrayToMap(newMeta.odds.bbp) : null;
    if(hasValue(newOdds)){
      set({ odds: newOdds });
    }
  }

  if (hasValue(meta.nets) || (typeof meta === 'string' && meta.includes('nets'))){
    let map = new Map<string, number>(meta.nets);
    const nets = typeof meta ==='string' ? JSON.parse(meta) : meta;
    let newNets = new Map<string, number>(nets.nets);
    set({ nets: map });
    set({ nets: newNets });
  }
  if (hasValue(meta.winnerIndex) || (typeof meta === 'string' && meta.includes('winnerIndex'))) {
    const winnerIndex = typeof meta ==='string' ? JSON.parse(meta) : meta;
    set({ winnerIndex: meta.winnerIndex });
    set({ winnerIndex: winnerIndex.winnerIndex });
  }
  if (hasValue(meta.prize) || (typeof meta === 'string' && meta.includes('prize'))) {
    const prize = typeof meta ==='string' ? JSON.parse(meta) : meta;
    set({ prize: meta.prize });
    set({ prize: prize.prize });
  }
  
  if (hasValue(meta.state) || (typeof meta === 'string' && meta.includes('state'))) {
    const state = typeof meta === 'string' ? JSON.parse(meta) : meta;
    if (state.state.bbp) {
        set({ gameState:state.state.bbp});
    }
  }

  if (hasValue(meta.winners) || (typeof meta === 'string' && meta.includes('winners'))) {
    const winners = typeof meta ==='string' ? JSON.parse(meta) : meta;
    if(isBatoBatoPik ? winners.winners.bbp : false){
      set({ winners: isBatoBatoPik ? meta.winners.bbp : false});
      set({ winners: isBatoBatoPik ? winners.winners.bbp : false});
    }
  }

  if (hasValue(meta.countdown) || (typeof meta === 'string' && meta.includes('countdown'))) {
    const countdown = typeof meta ==='string' ? JSON.parse(meta) : meta;
    set({ countdown: isBatoBatoPik ? meta.countdown.bbp : null});
    set({ countdown: isBatoBatoPik ? countdown.countdown.bbp : null});
  }
  if (hasValue(meta.topPlayers) || (typeof meta === 'string' && meta.includes('topPlayers'))) {
    const topPlayers = typeof meta ==='string' ? JSON.parse(meta) : meta;
    if(hasValue(meta.topPlayers)){
      set({ topPlayers: isBatoBatoPik ? meta.topPlayers.bbp : null});
    }
    set({ topPlayers: isBatoBatoPik ? topPlayers.topPlayers.bbp : null});
  }

  newGameState(set, meta, isBatoBatoPik);
}

function newGameState(set, meta, isBatoBatoPik) {
  if(meta.event){
    return;
  }
  if(!meta.state){
    return;
  }

  let newMeta;
  if(typeof meta === 'string'){
    newMeta = JSON.parse(meta);
  }else{
    newMeta = meta
  } 
  
  const gameState = isBatoBatoPik && newMeta.state && newMeta.state.bbp;

  if (gameState === 'NewGame') {
    set({ gross: 0 });
    set({ net: 0 });
    set({ result: [] });
    set({ winner: null });
    set({ winnerIndex: -1 });
    set({ winningBall: false });
    set({ selectedIndex: -1 });
    set({ selectedButton: null });
    set({ allBets: null });
    set({ bet: 0 });
    set({ odds: new Map<string, number>() });
    set({ nets: new Map<string, number>() });
    set({ prize: 0 });
    set({ balance: null });
    set({ slots: new Map<string, number>() });
    set({ hasBet: false }); // Reset hasBet on new game
    set({ countdown: null }); 
    set({ giftSuggestion: false });
  }
}

function updateNotOnSchedule(meta, set) {
  if (meta.state === 'Idle' || meta.state === 'NewGame') {
    set({ gross: 0 });
    set({ net: 0 });
    set({ result: [] });
    set({ winner: null });
    set({ winnerIndex: -1 });
    set({ selectedIndex: -1 });
    set({ selectedButton: null });
    set({ bet: 0 });
    set({ odds: new Map<string, number>() });
    set({ nets: new Map<string, number>() });
  }
}
