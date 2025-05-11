import React, { useEffect, useRef, useState } from 'react';
import { 
  Button, 
  Typography, 
  Box, 
  Paper, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle, 
  Slide, 
  Fade, 
  Zoom,
  Grid,
  Chip,
  Divider,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { GameState } from '../utils/gameutils';
import batobatopikModerator from '../utils/batobatoPikModerator';
import karakrusModerator from '../utils/karakrusModerator';
import horseRaceModerator from '../utils/horseRaceModerator';
import boatRaceModerator from '../utils/boatRaceModerator';
import { useNavigate } from 'react-router-dom';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import CasinoIcon from '@mui/icons-material/Casino';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { styled, keyframes } from '@mui/system';
import { removeCookie } from '../utils/cookie';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Custom animations
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const floating = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const AnimatedButton = styled(Button)(({ theme }) => ({
  animation: `${pulse} 3s infinite ease-in-out`,
  '&:hover': {
    animation: 'none',
    transform: 'scale(1.05)'
  }
}));

const GameIcon = styled(SportsEsportsIcon)({
  fontSize: '4rem',
  animation: `${floating} 4s infinite ease-in-out`,
  color: '#d4af37'
});

const KaraKrusIcon = styled(CasinoIcon)({
  fontSize: '4rem',
  animation: `${floating} 4s infinite ease-in-out`,
  color: '#800020'
});

const HorseRaceIcon = styled(EmojiEventsIcon)({
  fontSize: '4rem',
  animation: `${floating} 4s infinite ease-in-out`,
  color: '#4CAF50'
});
const BoatRaceIcon = styled(EmojiEventsIcon)({
  fontSize: '4rem',
  animation: `${floating} 4s infinite ease-in-out`,
  color: '#4CAF50'
});

const CountdownBadge = styled(Chip)(({ theme }) => ({
  fontSize: '1.2rem',
  fontWeight: 'bold',
  padding: theme.spacing(1),
  minWidth: 60,
  '& .MuiChip-label': {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1)
  }
}));

const Moderator = () => {
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
  const [isLoadingBBP, setIsLoadingBBP] = useState(false);
  const [isLoadingKK, setIsLoadingKK] = useState(false);
  const [isLoadingBoatRace, setIsLoadingBoatRace] = useState(false);
  const [isLoadingHorseRace, setIsLoadingHorseRace] = useState(false);
  const [raceWinner, setRaceWinner] = useState(null);
  const [boatRaceWinner, setBoatRaceWinner] = useState(null);
  const navigate = useNavigate();
  const localStorageUser = JSON.parse(localStorage.getItem('user') || 'null');
  const userInfo = localStorageUser.userData.data.user; 
  const horses = [
    { id: 'thunder', name: 'Thunder', color: '#00008B', laneColor: '#A0522D' },
    { id: 'lightning', name: 'Lightning', color: '#006400', laneColor: '#dba556' },
    { id: 'storm', name: 'Storm', color: '#8B0000', laneColor: '#A0522D' },
    { id: 'blaze', name: 'Blaze', color: '#FFD700', laneColor: '#dba556' },
  ];
  const boats = [
    { id: 'blue', name: 'Blue', color: '#00008B', laneColor: '#A0522D' },
    { id: 'green', name: 'Green', color: '#006400', laneColor: '#dba556' },
    { id: 'red', name: 'Red', color: '#8B0000', laneColor: '#A0522D' },
    { id: 'yellow', name: 'Yellow', color: '#FFD700', laneColor: '#dba556' },
  ];
  const horsesRef = useRef([
    { id: 1, name: 'Thunder', position: -9, speed: 0.02, stamina: 0.7, fatigue: 0, finished: false, animationSpeed: 0.1, frameCount: 11, currentFrame: 0, raceProgress: 0, recoveryRate: 0, burstChance: 0, performanceProfile: 0, baseSpeed: 0, baseAnimationSpeed: 0 },
    { id: 2, name: 'Lightning', position: -9, speed: 0.02, stamina: 0.8, fatigue: 0, finished: false, animationSpeed: 0.1, frameCount: 11, currentFrame: 0, raceProgress: 0, recoveryRate: 0, burstChance: 0, performanceProfile: 0, baseSpeed: 0, baseAnimationSpeed: 0 },
    { id: 3, name: 'Storm', position: -9, speed: 0.02, stamina: 0.6, fatigue: 0, finished: false, animationSpeed: 0.1, frameCount: 11, currentFrame: 0, raceProgress: 0, recoveryRate: 0, burstChance: 0, performanceProfile: 0, baseSpeed: 0, baseAnimationSpeed: 0 },
    { id: 4, name: 'Blaze', position: -9, speed: 0.02, stamina: 0.75, fatigue: 0, finished: false, animationSpeed: 0.1, frameCount: 11, currentFrame: 0, raceProgress: 0, recoveryRate: 0, burstChance: 0, performanceProfile: 0, baseSpeed: 0, baseAnimationSpeed: 0 }
  ]);
  const boatsRef = useRef([
    { id: 1, name: 'Blue', position: -9, speed: 0.02, stamina: 0.7, fatigue: 0, finished: false, animationSpeed: 0.1, frameCount: 6, currentFrame: 0, raceProgress: 0, recoveryRate: 0, burstChance: 0, performanceProfile: 0, baseSpeed: 0, baseAnimationSpeed: 0 },
    { id: 2, name: 'Green', position: -9, speed: 0.02, stamina: 0.8, fatigue: 0, finished: false, animationSpeed: 0.1, frameCount: 6, currentFrame: 0, raceProgress: 0, recoveryRate: 0, burstChance: 0, performanceProfile: 0, baseSpeed: 0, baseAnimationSpeed: 0 },
    { id: 3, name: 'Red', position: -9, speed: 0.02, stamina: 0.6, fatigue: 0, finished: false, animationSpeed: 0.1, frameCount: 6, currentFrame: 0, raceProgress: 0, recoveryRate: 0, burstChance: 0, performanceProfile: 0, baseSpeed: 0, baseAnimationSpeed: 0 },
    { id: 4, name: 'Yellow', position: -9, speed: 0.02, stamina: 0.75, fatigue: 0, finished: false, animationSpeed: 0.1, frameCount: 6, currentFrame: 0, raceProgress: 0, recoveryRate: 0, burstChance: 0, performanceProfile: 0, baseSpeed: 0, baseAnimationSpeed: 0 }
  ]);
  const animationFrameRef = useRef(null);
  const animationFrameBoatRef = useRef(null);

  // Bato Bato Pik state
  const {
    connect: connectBatoBatoPik,
    gameState: batoBatoPikGameState,
    sendMessage: sendMessageBatoBatoPik,
    setUserInfo: setUserInfoBatoBatoPik,
    countdown: batoBatoPikCountdown,
    socket: bbpSocket
  } = batobatopikModerator();

  const {
    connect: connectBoatRace,
    gameState: boatRaceGameState,
    sendMessage: sendMessageBoatRace,
    setUserInfo: setUserInfoBoatRace,
    countdown: boatRaceCountdown,
    socket: boatRaceSocket
  } = boatRaceModerator();

  // Kara Krus state
  const {
    connect: connectKaraKrus,
    gameState: karaKrusGameState,
    sendMessage: sendMessageKaraKrus,
    setUserInfo: setUserInfoKaraKrus,
    countdown: karaKrusCountdown,
    socket: kkSocket
  } = karakrusModerator();

  // Horse Race state
  const {
    connect: connectHorseRace,
    gameState: horseRaceGameState,
    sendMessage: sendMessageHorseRace,
    setUserInfo: setUserInfoHorseRace,
    countdown: horseRaceCountdown,
    socket: horseRaceSocket
  } = horseRaceModerator();

  const getRandomChoice = () => {
    const choices = ["rock", "paper", "scissors"];
    return choices[Math.floor(Math.random() * choices.length)];
  };

  const determineWinner = (juan, pedro) => {
    if (juan === pedro) return "tie";
    if (
      (juan === "rock" && pedro === "scissors") ||
      (juan === "scissors" && pedro === "paper") ||
      (juan === "paper" && pedro === "rock")
    ) {
      return "juan";
    }
    return "pedro";
  };

  useEffect(() => {
    if(userInfo){
      setUserInfoBatoBatoPik(userInfo);
      setUserInfoKaraKrus(userInfo);
      setUserInfoHorseRace(userInfo);
      setUserInfoHorseRace(userInfo);
      setUserInfoBoatRace(userInfo);
    }
  }, []);

  useEffect(() => {
    connectBatoBatoPik();
    connectKaraKrus();
    connectHorseRace();
    connectBoatRace();

    return () => {
      if (bbpSocket) bbpSocket.close();
      if (kkSocket) kkSocket.close();
      if (boatRaceSocket) boatRaceSocket.close();
      if (horseRaceSocket) horseRaceSocket.close();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (animationFrameBoatRef.current) {
        cancelAnimationFrame(animationFrameBoatRef.current);
      }
    };
  }, []);

  // Function to send current horse stats to clients
  const updateHorseStatsToClients = () => {
    sendMessageHorseRace(JSON.stringify({ 
      game: "horseRace", 
      horseStats: horsesRef.current
    }));
  };
  const updateBoatStatsToClients = () => {
    sendMessageBoatRace(JSON.stringify({ 
      game: "boatRace", 
      boatStats: boatsRef.current
    }));
  };


  
  
  
  // Bato Bato Pik game state effects
  useEffect(() => {
    if(batoBatoPikGameState === GameState.NewGame){
      setTimeout(() => {
        startBBPGame();
      }, 2000);
    }
    if(batoBatoPikGameState === 'Void'){
      setTimeout(() => {
        newBBPGame();
      }, 1500);
    }
    if(batoBatoPikGameState === GameState.WinnerDeclared){
      setTimeout(() => {
        newBBPGame();
      }, 4000);
    }
  }, [batoBatoPikGameState]);

  // Kara Krus game state effects
  useEffect(() => {
    if(karaKrusGameState === GameState.NewGame){
      setTimeout(() => {
        startKKGame();
      }, 2000);
    }
    if(karaKrusGameState === 'Void'){
      setTimeout(() => {
        newKKGame();
      }, 1500);
    }
    if(karaKrusGameState === GameState.WinnerDeclared){
      setTimeout(() => {
        newKKGame();
      }, 4000);
    }
  }, [karaKrusGameState]);

  // Horse Race game state effects
  useEffect(() => {
    if(horseRaceGameState === GameState.NewGame){
      setTimeout(() => {
        startHorseRaceGame();
      }, 4000);
    }
    if(horseRaceGameState === 'Void'){
      setTimeout(() => {
        newHorseRaceGame();
      }, 1500);
    }
    if(horseRaceGameState === GameState.WinnerDeclared){
      setTimeout(() => {
        newHorseRaceGame();
      }, 6000);
    }
    if(horseRaceGameState === GameState.Closed){
      startRace();
    }
  }, [horseRaceGameState]);

  useEffect(() => {
    if(boatRaceGameState === GameState.NewGame){
      setTimeout(() => {
        startBoatRaceGame();
      }, 4000);
    }
    if(boatRaceGameState === 'Void'){
      setTimeout(() => {
        newBoatRaceGame();
      }, 1500);
    }
    if(boatRaceGameState === GameState.WinnerDeclared){
      setTimeout(() => {
        newBoatRaceGame();
      }, 6000);
    }
    if(boatRaceGameState === GameState.Closed){
      startBoatRace();
    }
  }, [boatRaceGameState]);

  useEffect(() => {
    if (raceWinner) {
      setTimeout(() => {
        sendMessageHorseRace(
          JSON.stringify({
            cmd: GameState.WinnerDeclared,
            game: "horseRace",
            winnerOrders: raceWinner,
            uuid: userInfo.uuid,
          })
        );
      }, 2000);
      
      // Ensure animation is stopped
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
}, [raceWinner]);

useEffect(() => {
  if (boatRaceWinner) {
    setTimeout(() => {
      sendMessageBoatRace(
        JSON.stringify({
          cmd: GameState.WinnerDeclared,
          game: "boatRace",
          winnerOrders: boatRaceWinner,
          uuid: userInfo.uuid,
        })
      );
    }, 2000);
    
    // Ensure animation is stopped
    if (animationFrameBoatRef.current) {
      cancelAnimationFrame(animationFrameBoatRef.current);
    }
  }
}, [boatRaceWinner]);

  useEffect(() => {
    if(batoBatoPikGameState === GameState.Closed){
      const juanChoice = getRandomChoice();
      const pedroChoice = getRandomChoice();
      sendMessageBatoBatoPik(JSON.stringify({ game: "bbp", result: {juanChoice, pedroChoice}}));
      setTimeout(() => {
        sendMessageBatoBatoPik(
          JSON.stringify({
            cmd: GameState.WinnerDeclared,
            game: "bbp",
            winnerOrders: determineWinner(juanChoice, pedroChoice),
            uuid: userInfo.uuid,
          })
        );
        }, 5000);
    }
  }, [batoBatoPikGameState]);

  useEffect(() => {
    if(karaKrusGameState === GameState.Closed){
      const newResult = Math.random() > 0.5 ? 'heads' : 'tails';
      const animationDuration = 5000 + Math.random() * 1000;
      sendMessageKaraKrus(JSON.stringify({ game: "karakrus", result: newResult, animationDuration }));
      setTimeout(() => {
        sendMessageKaraKrus(
          JSON.stringify({
            cmd: GameState.WinnerDeclared,
            game: "karakrus",
            winnerOrders: newResult,
            uuid: userInfo.uuid,
          })
        );
        }, 5000);
    }
  }, [karaKrusGameState]);

  const startBBPGame = () => {
    setIsLoadingBBP(true);
    sendMessageBatoBatoPik(JSON.stringify({ game: "bbp", cmd: GameState.Open }));
    setTimeout(() => setIsLoadingBBP(false), 1000);
  };

  const newBBPGame = () => {
    sendMessageBatoBatoPik(JSON.stringify({ game: "bbp", cmd: GameState.NewGame }));
  };

  const startKKGame = () => {
    setIsLoadingKK(true);
    sendMessageKaraKrus(JSON.stringify({ game: "karakrus", cmd: GameState.Open }));
    setTimeout(() => setIsLoadingKK(false), 1000);
  };

  const newKKGame = () => {
    sendMessageKaraKrus(JSON.stringify({ game: "karakrus", cmd: GameState.NewGame }));
  };

  const startHorseRaceGame = () => {
    setIsLoadingHorseRace(true);
    sendMessageHorseRace(JSON.stringify({ game: "horseRace", cmd: GameState.Open }));
    setTimeout(() => setIsLoadingHorseRace(false), 1000);
  };
  const startBoatRaceGame = () => {
    setIsLoadingBoatRace(true);
    sendMessageBoatRace(JSON.stringify({ game: "boatRace", cmd: GameState.Open }));
    setTimeout(() => setIsLoadingBoatRace(false), 1000);
  };

  const newHorseRaceGame = () => {
    sendMessageHorseRace(JSON.stringify({ game: "horseRace", cmd: GameState.NewGame }));
    if (horsesRef.current) {
      horsesRef.current.forEach((horse) => {
        if (!horse) return;
        horse.position = -9;
        horse.finished = false;
        horse.fatigue = 0;
        horse.raceProgress = 0;
        horse.stamina = 0;
        horse.baseSpeed = 0;
        horse.speed = horse.baseSpeed;
        horse.baseAnimationSpeed = 0.1;
        horse.animationSpeed = horse.baseAnimationSpeed;
        horse.currentFrame = 0;
      });
    }
    setRaceWinner(null);
  };

  const newBoatRaceGame = () => {
    sendMessageBoatRace(JSON.stringify({ game: "boatRace", cmd: GameState.NewGame }));
    if (boatsRef.current) {
      boatsRef.current.forEach((boat) => {
        if (!boat) return;
        boat.position = -9;
        boat.finished = false;
        boat.fatigue = 0;
        boat.raceProgress = 0;
        boat.stamina = 0;
        boat.baseSpeed = 0;
        boat.speed = boat.baseSpeed;
        boat.baseAnimationSpeed = 0.1;
        boat.animationSpeed = boat.baseAnimationSpeed;
        boat.currentFrame = 0;
      });
    }
    setBoatRaceWinner(null);
  };

  const startRace = () => {
    const baseSpeedMin = 0.01;
    const baseSpeedMax = 0.03;
    
    horsesRef.current = horsesRef.current.map((horse, idx) => {
      // Reset position and stats
      horse.position = -9;
      horse.finished = false;
      horse.fatigue = 0;
      horse.raceProgress = 0;
      
      // Assign randomized attributes
      horse.speed = baseSpeedMin + (Math.random() * (baseSpeedMax - baseSpeedMin));
      horse.stamina = 0.5 + (Math.random() * 0.4); // 0.5-0.9
      horse.recoveryRate = 0.0003 + (Math.random() * 0.0003); // 0.0003-0.0006
      horse.burstChance = 0.02 + (Math.random() * 0.03); // 2%-5% chance for speed burst
      
      // Set performance profile (0: fast starter, 1: consistent, 2: strong finisher)
      horse.performanceProfile = Math.floor(Math.random() * 3);
      
      // Store base values for reference
      horse.baseSpeed = horse.speed;
      horse.baseAnimationSpeed = horse.animationSpeed;
      
      return horse;
    });

    // Send initial horse stats to players
    updateHorseStatsToClients();
    animateRace();
  };

  const startBoatRace = () => {
    const baseSpeedMin = 0.01;
    const baseSpeedMax = 0.03;
    
    boatsRef.current = boatsRef.current.map((boat, idx) => {
      // Reset position and stats
      boat.position = -9;
      boat.finished = false;
      boat.fatigue = 0;
      boat.raceProgress = 0;
      
      // Assign randomized attributes
      boat.speed = baseSpeedMin + (Math.random() * (baseSpeedMax - baseSpeedMin));
      boat.stamina = 0.5 + (Math.random() * 0.4); // 0.5-0.9
      boat.recoveryRate = 0.0003 + (Math.random() * 0.0003); // 0.0003-0.0006
      boat.burstChance = 0.02 + (Math.random() * 0.03); // 2%-5% chance for speed burst
      
      // Set performance profile (0: fast starter, 1: consistent, 2: strong finisher)
      boat.performanceProfile = Math.floor(Math.random() * 3);
      
      // Store base values for reference
      boat.baseSpeed = boat.speed;
      boat.baseAnimationSpeed = boat.animationSpeed;
      
      return boat;
    });

    // Send initial horse stats to players
    updateBoatStatsToClients();
    animateBoatRace();
  };

  const animateRace = () => {
    const startPosition = -9;
    const finishLine = 7 + 101.9;
    const raceDistance = finishLine - startPosition;
    let allFinished = true;
    let frameCount = 0;
    let winnerDetermined = false;
    let raceActive = true;
  
    // Initialize speeds with small variations
    horsesRef.current.forEach(horse => {
      if (horse) {
        horse.speed *= 0.95 + Math.random() * 0.1;
        horse.baseAnimationSpeed = horse.animationSpeed; // Store original animation speed
      }
    });
  
    const updateRace = () => {
      frameCount++;
  
      // Speed adjustments every 30 frames (0.5 seconds at 60fps)
      if (frameCount % 30 === 0 && raceActive) {
        let leaderPosition = Math.max(...horsesRef.current.map(h => h?.position || 0));
        let lastPlacePosition = Math.min(...horsesRef.current
          .filter(h => h && !h.finished)
          .map(h => h.position || 0));
  
        horsesRef.current.forEach((horse, index) => {
          if (!horse || horse.finished) return;
  
          horse.raceProgress = (horse.position - startPosition) / raceDistance;
          const distanceBehindLeader = leaderPosition - horse.position;
          const prevSpeed = horse.speed;
  
          // --- Speed variation with fatigue limit ---
          let speedVariation = (Math.random() - 0.5) * 1;
  
          // Weaken variation if horse is tired
          const fatigueFactor = 1 - horse.fatigue * 2;
          speedVariation *= Math.max(0.2, fatigueFactor);
  
          // Slight rubber banding for those behind
          if (distanceBehindLeader > 0.05 && horse.fatigue < 0.4) {
            speedVariation += 0.03;
          }
  
          // Mid-race burst
          const inBurstZone = horse.raceProgress > 0.3 && horse.raceProgress < 0.8;
          let burstChance = 0.03 + horse.stamina * 0.001;
  
          if (horse.position === lastPlacePosition) {
            burstChance += 0.4;
          }
  
          if (
            inBurstZone &&
            Math.random() < burstChance &&
            horse.fatigue < 0.25
          ) {
            speedVariation += 0.2 + Math.random() * 0.05;
            horse.fatigue += 0.00005;
          }
  
          // Fatigue accumulation
          const fatigueGain =
            0.0001 + (1 - horse.stamina) * 0.0001 +
            horse.raceProgress * 0.00003;
  
          horse.fatigue += fatigueGain;
  
          // Mild recovery if going slow and not near finish
          if (prevSpeed < 0.007 && horse.fatigue > 0.01 && horse.raceProgress < 0.9) {
            horse.fatigue -= 0.2;
          }
  
          // Clamp fatigue
          horse.fatigue = Math.min(0.5, Math.max(0, horse.fatigue));
  
          // Apply variation & fatigue to speed
          let newSpeed = prevSpeed * (2 + speedVariation);
          newSpeed *= (0.5 - horse.fatigue);
  
          // Clamp speed
          horse.speed = Math.max(0.02, Math.min(0.04, newSpeed));
  
          // Animation speed sync
          horse.animationSpeed = horse.baseAnimationSpeed * ((horse.speed * 1.1) / 0.02);
        });
      }
  
      allFinished = true;
      let maxPosition = 0;
  
      horsesRef.current.forEach((horse, idx) => {
        if (!horse) return;
  
        if (raceActive) {
          // Update animation frame based on current speed
          if (horse.position > maxPosition && !horse.finished) {
            maxPosition = horse.position;
          }
          horse.currentFrame = (horse.currentFrame + horse.animationSpeed * 1.1) % horse.frameCount;
  
          // Move horse
          if (!horse.finished) {
            horse.position += horse.speed * 0.65;
  
            // Check if horse finished
            if (horse.position >= finishLine) {
              horse.finished = true;
              horse.position = finishLine;
              horse.animationSpeed = horse.baseAnimationSpeed;
              setRaceWinner(horses[idx].id)
              raceActive = false;
              // Send winner update
              updateHorseStatsToClients();
              cancelAnimationFrame(animationFrameRef.current);
            }
          }
        }
  
        if (!horse.finished) {
          allFinished = false;
        }
      });
  
      // Throttled update: send stats every 5 frames (~12fps)
      if (frameCount % 5 === 0) {
        updateHorseStatsToClients();
      }
  
      // Continue animation if not all horses finished
      if (!allFinished) {
        animationFrameRef.current = requestAnimationFrame(updateRace);
      }
    };
  
    animationFrameRef.current = requestAnimationFrame(updateRace);
  };

  const animateBoatRace = () => {
    const startPosition = -9;
    const finishLine = 7 + 101.9;
    const raceDistance = finishLine - startPosition;
    let allFinished = true;
    let frameCount = 0;
    let winnerDetermined = false;
    let raceActive = true;
  
    // Initialize speeds with small variations
    boatsRef.current.forEach(boat => {
      if (boat) {
        boat.speed *= 0.95 + Math.random() * 0.1;
        boat.baseAnimationSpeed = boat.animationSpeed; // Store original animation speed
      }
    });
  
    const updateRace = () => {
      frameCount++;
  
      // Speed adjustments every 30 frames (0.5 seconds at 60fps)
      if (frameCount % 30 === 0 && raceActive) {
        let leaderPosition = Math.max(...boatsRef.current.map(h => h?.position || 0));
        let lastPlacePosition = Math.min(...boatsRef.current
          .filter(h => h && !h.finished)
          .map(h => h.position || 0));
  
          boatsRef.current.forEach((boat, index) => {
          if (!boat || boat.finished) return;
  
          boat.raceProgress = (boat.position - startPosition) / raceDistance;
          const distanceBehindLeader = leaderPosition - boat.position;
          const prevSpeed = boat.speed;
  
          // --- Speed variation with fatigue limit ---
          let speedVariation = (Math.random() - 0.5) * 1.5;
  
          // Weaken variation if horse is tired
          const fatigueFactor = 1 - boat.fatigue * 2;
          speedVariation *= Math.max(0.2, fatigueFactor);
  
          // Slight rubber banding for those behind
          if (distanceBehindLeader > 0.05 && boat.fatigue < 0.4) {
            speedVariation += 0.03;
          }
  
          // Mid-race burst
          const inBurstZone = boat.raceProgress > 0.3 && boat.raceProgress < 0.8;
          let burstChance = 0.03 + boat.stamina * 0.001;
  
          if (boat.position === lastPlacePosition) {
            burstChance += 0.4;
          }
  
          if (
            inBurstZone &&
            Math.random() < burstChance &&
            boat.fatigue < 0.25
          ) {
            speedVariation += 0.2 + Math.random() * 0.05;
            boat.fatigue += 0.00005;
          }
  
          // Fatigue accumulation
          const fatigueGain =
            0.0001 + (1 - boat.stamina) * 0.0001 +
            boat.raceProgress * 0.00003;
  
          boat.fatigue += fatigueGain;
  
          // Mild recovery if going slow and not near finish
          if (prevSpeed < 0.007 && boat.fatigue > 0.01 && boat.raceProgress < 0.9) {
            boat.fatigue -= 0.2;
          }
  
          // Clamp fatigue
          boat.fatigue = Math.min(0.5, Math.max(0, boat.fatigue));
  
          // Apply variation & fatigue to speed
          let newSpeed = prevSpeed * (2 + speedVariation);
          newSpeed *= (0.5 - boat.fatigue);
  
          // Clamp speed
          boat.speed = Math.max(0.02, Math.min(0.04, newSpeed));
  
          // Animation speed sync
          boat.animationSpeed = boat.baseAnimationSpeed * ((boat.speed * 1.1) / 0.05);
        });
      }
  
      allFinished = true;
      let maxPosition = 0;
  
      boatsRef.current.forEach((boat, idx) => {
        if (!boat) return;
  
        if (raceActive) {
          // Update animation frame based on current speed
          if (boat.position > maxPosition && !boat.finished) {
            maxPosition = boat.position;
          }
          boat.currentFrame = (boat.currentFrame + boat.animationSpeed * 1.1) % boat.frameCount;
  
          // Move boat
          if (!boat.finished) {
            boat.position += boat.speed * 0.65;
  
            // Check if boat finished
            if (boat.position >= finishLine) {
              boat.finished = true;
              boat.position = finishLine;
              boat.animationSpeed = boat.baseAnimationSpeed;
              setBoatRaceWinner(boats[idx].id);
              raceActive = false;
              // Send winner update
              updateBoatStatsToClients();
              cancelAnimationFrame(animationFrameBoatRef.current);
            }
          }
        }
  
        if (!boat.finished) {
          allFinished = false;
        }
      });
  
      // Throttled update: send stats every 5 frames (~12fps)
      if (frameCount % 5 === 0) {
        updateBoatStatsToClients();
      }
  
      // Continue animation if not all boats finished
      if (!allFinished) {
        animationFrameBoatRef.current = requestAnimationFrame(updateRace);
      }
    };
  
    animationFrameBoatRef.current = requestAnimationFrame(updateRace);
  };
  

  const handleLogout = () => {
    localStorage.removeItem('user');
    removeCookie('token');
    navigate('/');
  };

  const handleOpenLogoutDialog = () => {
    setOpenLogoutDialog(true);
  };

  const handleCloseLogoutDialog = () => {
    setOpenLogoutDialog(false);
  };

  const getGameStatusText = (gameState) => {
    switch(gameState) {
      case GameState.NewGame:
        return 'Preparing new game...';
      case 'Void':
        return 'Resetting game session...';
      case GameState.WinnerDeclared:
        return raceWinner ? `${raceWinner.name} won the race!` : 'Congratulations to the winner!';
      case GameState.Open:
        return 'Game in progress...';
      case GameState.Closed:
        return 'Race is running...';
      default:
        return 'Ready to start the next game';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a2035 0%, #0d1220 100%)',
        p: 3,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 30%, rgba(212, 175, 55, 0.1) 0%, transparent 40%)',
          zIndex: 0
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 80% 70%, rgba(128, 0, 32, 0.1) 0%, transparent 40%)',
          zIndex: 0
        }
      }}
    >
      {/* Floating decorative elements */}
      <Fade in={true} timeout={2000}>
        <Box sx={{
          position: 'absolute',
          top: '10%',
          left: '15%',
          width: 50,
          height: 50,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.4) 0%, transparent 70%)',
          filter: 'blur(2px)'
        }} />
      </Fade>
      
      <Fade in={true} timeout={3000}>
        <Box sx={{
          position: 'absolute',
          bottom: '20%',
          right: '20%',
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(128, 0, 32, 0.3) 0%, transparent 70%)',
          filter: 'blur(3px)'
        }} />
      </Fade>

      <Zoom in={true} timeout={800}>
        <Paper
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 3,
            backgroundColor: '#242b45',
            color: '#f0f0f0',
            maxWidth: 1000,
            width: '100%',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
            border: '1px solid rgba(212, 175, 55, 0.2)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}
        >
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', gap: 4 }}>
            <GameIcon />
            <KaraKrusIcon />
            <HorseRaceIcon />
            <BoatRaceIcon />
          </Box>
          
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(45deg, #d4af37 30%, #800020 50%, #4CAF50 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2
            }}
          >
            Game Control Panel
          </Typography>
          
          <Typography 
            variant="subtitle1" 
            sx={{ 
              mb: 4,
              color: '#c0c0c0'
            }}
          >
            Manage all game sessions
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {/* Bato Bato Pik Section */}
            <Grid item xs={12} md={4}>
              <Paper 
                sx={{ 
                  p: 1, 
                  borderRadius: 2, 
                  backgroundColor: 'rgba(212, 175, 55, 0.05)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  height: '100%'
                }}
              >
                <Typography variant="h6" sx={{ color: '#d4af37', mb: 2 }}>
                  Bato Bato Pik
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
                  <AccessTimeIcon sx={{ color: '#d4af37' }} />
                  <CountdownBadge
                    label={batoBatoPikCountdown || '--'}
                    color="primary"
                    sx={{ backgroundColor: 'rgba(212, 175, 55, 0.2)', color: '#d4af37' }}
                  />
                </Box>
                
                <Typography variant="body2" sx={{ color: '#c0c0c0', mb: 3, minHeight: 24 }}>
                  {getGameStatusText(batoBatoPikGameState)}
                </Typography>
                
                <Tooltip title="Start a new Bato Bato Pik game session">
                  <AnimatedButton
                    variant="contained"
                    size="large"
                    onClick={startBBPGame}
                    disabled={isLoadingBBP}
                    sx={{
                      backgroundColor: '#d4af37',
                      color: '#1a2035',
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: '#e8c870'
                      },
                      '&:disabled': {
                        backgroundColor: '#3a3a3a'
                      }
                    }}
                  >
                    {isLoadingBBP ? (
                      <CircularProgress size={24} sx={{ color: '#1a2035' }} />
                    ) : (
                      'Start BBP'
                    )}
                  </AnimatedButton>
                </Tooltip>
              </Paper>
            </Grid>
            
            {/* Kara Krus Section */}
            <Grid item xs={12} md={4}>
              <Paper 
                sx={{ 
                  p: 1, 
                  borderRadius: 2, 
                  backgroundColor: 'rgba(128, 0, 32, 0.05)',
                  border: '1px solid rgba(128, 0, 32, 0.2)',
                  height: '100%'
                }}
              >
                <Typography variant="h6" sx={{ color: '#800020', mb: 2 }}>
                  Kara Krus
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
                  <AccessTimeIcon sx={{ color: '#800020' }} />
                  <CountdownBadge
                    label={karaKrusCountdown || '--'}
                    color="primary"
                    sx={{ backgroundColor: 'rgba(128, 0, 32, 0.2)', color: '#800020' }}
                  />
                </Box>
                
                <Typography variant="body2" sx={{ color: '#c0c0c0', mb: 3, minHeight: 24 }}>
                  {getGameStatusText(karaKrusGameState)}
                </Typography>
                
                <Tooltip title="Start a new Kara Krus game session">
                  <AnimatedButton
                    variant="contained"
                    size="large"
                    onClick={startKKGame}
                    disabled={isLoadingKK}
                    sx={{
                      backgroundColor: '#800020',
                      color: '#f0f0f0',
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: '#a03050'
                      },
                      '&:disabled': {
                        backgroundColor: '#3a3a3a'
                      }
                    }}
                  >
                    {isLoadingKK ? (
                      <CircularProgress size={24} sx={{ color: '#f0f0f0' }} />
                    ) : (
                      'Start Kara Krus'
                    )}
                  </AnimatedButton>
                </Tooltip>
              </Paper>
            </Grid>

            {/* Horse Race Section */}
            <Grid item xs={12} md={4}>
              <Paper 
                sx={{ 
                  p: 1, 
                  borderRadius: 2, 
                  backgroundColor: 'rgba(76, 175, 80, 0.05)',
                  border: '1px solid rgba(76, 175, 80, 0.2)',
                  height: '100%'
                }}
              >
                <Typography variant="h6" sx={{ color: '#4CAF50', mb: 2 }}>
                  Horse Race
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
                  <AccessTimeIcon sx={{ color: '#4CAF50' }} />
                  <CountdownBadge
                    label={horseRaceCountdown || '--'}
                    color="primary"
                    sx={{ backgroundColor: 'rgba(76, 175, 80, 0.2)', color: '#4CAF50' }}
                  />
                </Box>
                
                <Typography variant="body2" sx={{ color: '#c0c0c0', mb: 3, minHeight: 24 }}>
                  {getGameStatusText(horseRaceGameState)}
                </Typography>
                
                <Tooltip title="Start a new Horse Race game session">
                  <AnimatedButton
                    variant="contained"
                    size="large"
                    onClick={startHorseRaceGame}
                    disabled={isLoadingHorseRace}
                    sx={{
                      backgroundColor: '#4CAF50',
                      color: '#f0f0f0',
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: '#66BB6A'
                      },
                      '&:disabled': {
                        backgroundColor: '#3a3a3a'
                      }
                    }}
                  >
                    {isLoadingHorseRace ? (
                      <CircularProgress size={24} sx={{ color: '#f0f0f0' }} />
                    ) : (
                      'Start Horse Race'
                    )}
                  </AnimatedButton>
                </Tooltip>
              </Paper>
            </Grid>
            {/* Boat Race Section */}
            <Grid item xs={12} md={4}>
              <Paper 
                sx={{ 
                  p: 1, 
                  borderRadius: 2, 
                  backgroundColor: 'rgba(76, 175, 80, 0.05)',
                  border: '1px solid rgba(76, 175, 80, 0.2)',
                  height: '100%'
                }}
              >
                <Typography variant="h6" sx={{ color: '#4CAF50', mb: 2 }}>
                  Boat Race
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
                  <AccessTimeIcon sx={{ color: '#4CAF50' }} />
                  <CountdownBadge
                    label={boatRaceCountdown || '--'}
                    color="primary"
                    sx={{ backgroundColor: 'rgba(76, 175, 80, 0.2)', color: '#4CAF50' }}
                  />
                </Box>
                
                <Typography variant="body2" sx={{ color: '#c0c0c0', mb: 3, minHeight: 24 }}>
                  {getGameStatusText(boatRaceGameState)}
                </Typography>
                
                <Tooltip title="Start a new Horse Race game session">
                  <AnimatedButton
                    variant="contained"
                    size="large"
                    onClick={startBoatRaceGame}
                    disabled={isLoadingBoatRace}
                    sx={{
                      backgroundColor: '#4CAF50',
                      color: '#f0f0f0',
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: '#66BB6A'
                      },
                      '&:disabled': {
                        backgroundColor: '#3a3a3a'
                      }
                    }}
                  >
                    {isLoadingBoatRace ? (
                      <CircularProgress size={24} sx={{ color: '#f0f0f0' }} />
                    ) : (
                      'Start Boat Race'
                    )}
                  </AnimatedButton>
                </Tooltip>
              </Paper>
            </Grid>
          </Grid>
          
          <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
            <Button
              onClick={handleOpenLogoutDialog}
              startIcon={<PowerSettingsNewIcon />}
              sx={{
                color: '#c0c0c0',
                '&:hover': {
                  color: '#d4af37',
                  backgroundColor: 'rgba(212, 175, 55, 0.1)'
                }
              }}
            >
              Logout
            </Button>
          </Box>
        </Paper>
      </Zoom>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={openLogoutDialog}
        onClose={handleCloseLogoutDialog}
        TransitionComponent={Slide}
        PaperProps={{
          sx: {
            backgroundColor: '#242b45',
            color: '#f0f0f0',
            borderRadius: 3,
            border: '1px solid rgba(212, 175, 55, 0.3)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            maxWidth: '400px',
            width: '90%',
            mx: 'auto',
            overflow: 'hidden',
            backgroundImage: 'linear-gradient(to bottom, #242b45, #1a2035)'
          }
        }}
      >
        <Box
          sx={{
            background: 'rgba(212, 175, 55, 0.1)',
            borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
            padding: '16px 24px',
            textAlign: 'center'
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              padding: '12px',
              backgroundColor: 'rgba(212, 175, 55, 0.2)',
              borderRadius: '50%',
              mb: 1
            }}
          >
            <PowerSettingsNewIcon 
              sx={{ 
                fontSize: '2.5rem',
                color: '#d4af37'
              }} 
            />
          </Box>
          <DialogTitle 
            sx={{ 
              color: '#d4af37', 
              fontWeight: 700,
              fontSize: '1.5rem',
              padding: 0,
              mt: 1
            }}
          >
            Confirm Logout
          </DialogTitle>
        </Box>
        
        <DialogContent sx={{ padding: '24px' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            <DialogContentText 
              sx={{ 
                color: '#c0c0c0',
                fontSize: '1rem',
                mb: 2
              }}
            >
              Are you sure you want to logout from the moderator panel?
            </DialogContentText>
            <HelpOutlineIcon 
              sx={{ 
                color: 'rgba(212, 175, 55, 0.6)',
                fontSize: '4rem',
                opacity: 0.7,
                mt: 1
              }} 
            />
          </Box>
        </DialogContent>
        
        <DialogActions
          sx={{
            padding: '16px 24px',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.2)',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          <Button 
            onClick={handleCloseLogoutDialog}
            startIcon={<CancelIcon />}
            sx={{
              color: '#c0c0c0',
              backgroundColor: 'rgba(160, 48, 80, 0.2)',
              padding: '8px 20px',
              borderRadius: '4px',
              '&:hover': {
                color: '#f0f0f0',
                backgroundColor: 'rgba(160, 48, 80, 0.4)',
                boxShadow: '0 2px 10px rgba(160, 48, 80, 0.3)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleLogout}
            startIcon={<ExitToAppIcon />}
            sx={{
              color: '#f0f0f0',
              backgroundColor: 'rgba(212, 175, 55, 0.2)',
              padding: '8px 24px',
              borderRadius: '4px',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: 'rgba(212, 175, 55, 0.4)',
                boxShadow: '0 2px 10px rgba(212, 175, 55, 0.3)'
              }
            }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Moderator;