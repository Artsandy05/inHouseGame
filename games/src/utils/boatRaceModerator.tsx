import { create } from "zustand";
import { useEffect } from "react";
import { getRequiredUrl } from "../services/common";
import { GameState, hasValue, ModeratorCommands } from "./gameutils";


enum LocalState {
  Connected = "Connected",
  Disconnected = "Disconnected",
}

export enum UIRightFloatingState {
  Default = "Default",
  ShowGameStatus = "ShowGameStatus",
  ShowWinnersSelection = "ShowWinnersSelection",
}

type State = {
  socket: WebSocket | null;
  output: string[];
  localState: string;
  gameState: any;  // Adjust the type for your game state
  setGameState: (g: any) => void;  // Adjust the type for gameState
  socketState: string;
  connect: () => void;
  sendMessage: (message: string) => void;
  userInfo: any;
  setUserInfo: (userInfo: any) => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  winner: number;
  setWinner: (index: number) => void;
  selectedButton: any;
  setSelectedButton: (s: any) => void;
  
  totalBets: number;
  setTotalBets: (total: number) => void;
  odds: Map<string, number>;
  setOdds: (b: Map<string, number>) => void;
  gross: number;
  setGross: (g: number) => void;
  net: number;
  setNet: (g: number) => void;
  result: any[];  // Adjust type for result
  setResult: (r: any[]) => void;
  
  countdown: number | null;
  setCountdown: (c: number | null) => void;
  winnerDeclareStatus: any;  // Adjust type for winnerDeclareStatus
  setWinnerDeclareStatus: (c: any) => void;
  
  activePlayerCount: number;
  setActivePlayerCount: (c: number) => void;
  host: any;  // Adjust type for host
  setHost: (h: any) => void;
  
  topPlayers: any[];  // Adjust type for topPlayers
  setTopPlayers: (s: any[]) => void;
  
  gameId: boolean;
  setGameId: (g: boolean) => void;
  
  voidMessage: boolean;
  setVoidMessage: (g: boolean) => void;
};

export const moderatorStore = create<State>((set) => ({
  socket: null,
  output: [],
  localState: LocalState.Disconnected,
  gameState: null,
  setGameState: (g) => {
    set({ gameState: g });
  },
  userInfo: null,
  setUserInfo: (g) => {
    set({ userInfo: g });
  },
  socketState: "",
  connect: () => {
    const { userInfo } = moderatorStore.getState();
    const url = getRequiredUrl('boat-race', userInfo);
    if (!hasValue(url)) {
      throw `No valid url: ${url}`;
    }
    const socket = new WebSocket(url);

    socket.addEventListener("open", () => {
      open(set, socket);
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
      set({ socketState: "close" });
      set((state) => ({ output: [...state.output, "Connection closed"] }));
    });
  },
  sendMessage: (message) => {
    const { socket } = moderatorStore.getState();
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
  winner: -1,
  setWinner: (index) => {
    set({ winner: index });
  },
  selectedButton: null,
  setSelectedButton: (s) => {
    set({ selectedButton: s });
  },

  totalBets: 0,
  setTotalBets: (total) => { set( {totalBets: total})},
  odds: new Map<string, number>(),
  setOdds: (b) => {
    set({ odds: b });
  },
  gross: 0,
  setGross: (g) => {
    set({ gross: g });
  },
  net: 0,
  setNet: (g) => {
    set({ net: g });
  },
  result: [],
  setResult: (r) => {
    set({ result: r });
  },
  countdown: null,
  setCountdown: (c) => {
    set({ countdown: c });
  },
  winnerDeclareStatus: null,
  setWinnerDeclareStatus: (c) => {
    set({ winnerDeclareStatus: c });
  },
  activePlayerCount: 0,
  setActivePlayerCount: (c) => {
    set({ activePlayerCount: c });
  },
  host: null,
  setHost: (h) => {
    set({ host: h });
  },
  topPlayers: [],
  setTopPlayers: (s) => {
    set({ topPlayers: s });
  },
  gameId: false,
  setGameId: (g) => {
    set({ gameId: g });
  },
  voidMessage: false,
  setVoidMessage: (g) => {
    set({ voidMessage: g });
  },
}));

export default moderatorStore;

function open(set, socket) {
  set({ socket });
  set({ socketState: "open" });
  setTimeout(() => {
    socket.send(
      JSON.stringify({
        cmd: ModeratorCommands.Init,
        game: 'boatRace'
      })
    );
  }, 100)
  
}

function update(set, eventData) {
  const meta = JSON.parse(eventData);
  //console.log(meta)
  if (hasValue(meta.winnerIndex)) {
    set({ winner: meta.winnerIndex });
  }
  if (hasValue(meta.odds)) {
    const odds = new Map<string, []>(meta.odds.boatRace);
    set({ odds: odds });
  }

  if (hasValue(meta.gross)) {
    set({ gross: meta.gross });
  }

  if (hasValue(meta.gameId)) {
    set({ gameId: meta.gameId.boatRace });
  }
  if (hasValue(meta.host)) {
    set({ host: meta.host.boatRace });
  }

  if (hasValue(meta.countdown)) {
    set({ countdown: meta.countdown.boatRace });
  }

  if (hasValue(meta.voidGameMessage)) {
    set({ voidMessage: meta.voidGameMessage });
  }

  if (hasValue(meta.activePlayerCount)) {
    set({ activePlayerCount: meta.activePlayerCount });
  }

  if (hasValue(meta.net)) {
    set({ net: meta.net });
  }
  if (hasValue(meta.state)) {
    set({ gameState: meta.state.boatRace });
  }
  if (hasValue(meta.topPlayers)) {
    set({ topPlayers: meta.topPlayers });
  }
  
  if (hasValue(meta.winnerDeclareStatus)) {
    set({ winnerDeclareStatus: meta.winnerDeclareStatus });
  }

  updateNotOnSchedule(meta, set);
  
  if(meta.state === GameState.NewGame){
    set({ gameId: '' });
  }
}

function updateNotOnSchedule(meta, set) {
  if (meta.state != GameState.Idle) {
    return;
  }
  set({ gross: 0 });
  set({ net: 0 });
  set({ result: [] });
  set({ winner: null });
}


