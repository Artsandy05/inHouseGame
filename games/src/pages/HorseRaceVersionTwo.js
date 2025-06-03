import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
  IconButton
} from '@mui/material';
import Phaser from 'phaser';
import { playerStore } from '../utils/horseRace';
import { formatTruncatedMoney, GameState, mapToArray } from '../utils/gameutils';
import { useNavigate, useSearchParams } from 'react-router-dom';
import createEncryptor from '../utils/createEncryptor';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { getGameHistory } from '../services/gameService';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowLeftIcon from '@mui/icons-material/ChevronLeft';
import ArrowRightIcon from '@mui/icons-material/ChevronRight';
import { Collapse } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import HelpIcon from '@mui/icons-material/Help';

const theme = createTheme({
  typography: {
    fontFamily: 'Keania One, cursive',
  },
  palette: {
    primary: {
      main: '#795548',
    },
    secondary: {
      main: '#4CAF50',
    },
  },
});

const casinoChips = {
  black: '/assets/black.png',
  purple: '/assets/purple.png',
  blue: '/assets/blue.png', 
  green: '/assets/green.png',
  yellow: '/assets/yellow.png',
  red: '/assets/red.png',
};

const chipValues = {
  black: 100,
  purple: 50,
  blue: 25, 
  green: 10,
  yellow: 5,
  red: 1
};

const horseColor = {
  thunder: '#00008B',
  lightning: '#006400',
  storm: '#8B0000',
  blaze: '#FFD700',
};

const encryptor = createEncryptor(process.env.REACT_APP_DECRYPTION_KEY);

const HorseRacingGameVersionTwo = () => {
  const gameRef = useRef(null);
  const phaserGameRef = useRef(null);
  const [isLandscape, setIsLandscape] = useState(false);
  const [raceStarted, setRaceStarted] = useState(false);
  const [raceFinished, setRaceFinished] = useState(false);
  const [raceTime, setRaceTime] = useState(0);
  const [winner, setWinner] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [selectedChip, setSelectedChip] = useState(null);
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [gameHistory, setGameHistory] = useState(null);
  const [visible, setVisible] = useState(true);
  const [totalBets, setTotalBets] = useState(0);
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  const [credits, setCredits] = useState(0);
  const [leftPosition, setLeftPosition] = useState('20px');
  const updatedBalance = Number(credits) - Number(totalBets);

  const [leader, setLeader] = useState('-');
  const [raceStatus, setRaceStatus] = useState('Ready to Start');
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);

  const { gameState, setPlayerInfo, sendMessage, countdown, slots,setSlots,odds, allBets, winningBall, setUserInfo, topPlayers, voidMessage, horseStats, latestBalance } = playerStore();
  const { connect } = playerStore.getState();
  const [searchParams] = useSearchParams();
  const userDetailsParam = searchParams.get('data');
  const navigate = useNavigate();
  let decrypted;

  if(userDetailsParam){
    decrypted = encryptor.decryptParams(userDetailsParam);
  }
  const urlUserDetails = decrypted ? decrypted : null;
  const localStorageUser = JSON.parse(localStorage.getItem('user') || 'null');
  const userInfo = {
    userData: {
      data: {
        user: {
          id: Number(urlUserDetails?.id) || localStorageUser?.userData?.data?.user?.id || 0,
          firstName: urlUserDetails?.first_name || localStorageUser?.userData?.data?.user?.firstName || 'Guest',
          lastName: urlUserDetails?.last_name || localStorageUser?.userData?.data?.user?.lastName || 'Guest',
          balance: urlUserDetails?.credits || localStorageUser?.userData?.data?.wallet?.balance || 0,
          mobile: urlUserDetails?.mobile || localStorageUser?.userData?.data?.user?.mobile || 'N/A',
          uuid: urlUserDetails?.uuid || localStorageUser?.userData?.data?.user?.uuid || '0',
          email: urlUserDetails?.email || localStorageUser?.userData?.data?.user?.email || 'test@gmail.com',
          role: 'player',
        },
        wallet: {
          balance: urlUserDetails?.credits || localStorageUser?.userData?.data?.wallet?.balance || 0
        }
      }
    }
  };

  const toggleVisibility = () => {
    setVisible(!visible);
    setLeftPosition(visible ? '-250px' : '20px');
  };

  useEffect(() => {
    if (slots.size > 0) {
      let total = 0;
  
      slots.forEach(value => {
        total += value;
      });
      setTotalBets(total);
    }else{
      setTotalBets(0);
    }
  }, [slots]);

  useEffect(() => {
    if (gameState === GameState.NewGame || gameState === GameState.WinnerDeclared) {
      setTotalBets(0);
    }
  }, [gameState]);

  useEffect(() => {
    if(userInfo){
      setUserInfo(userInfo.userData.data.user);
    }
  }, []);

  useEffect(() => {
    const fetchGameHistory = async () => {
      try {
        const response = await getGameHistory('horseRace');
        setGameHistory(response.data.winningBalls);
      } catch (error) {
        console.error('Error fetching game history:', error);
      }
    };
  
    fetchGameHistory();
  }, [gameState]);

  useEffect(() => {
    if (voidMessage) {
      setShowVoidDialog(true);
      setTimeout(() => {
        setShowVoidDialog(false);
      }, 3000);
    }
  }, [voidMessage]);

  useEffect(() => {
    if(latestBalance){
      setCredits(latestBalance);
    }else{
      setCredits(urlUserDetails?.credits || localStorageUser?.userData?.data?.wallet?.balance);
    }
  }, [latestBalance]);

  useEffect(() => {
    if(gameState === 'WinnerDeclared'){
      setTimerActive(false);
      setRaceTime(0);
    }
  }, [gameState]);

  useEffect(() => {
    connect();

    return () => {
      const { socket } = playerStore.getState();
      if (socket) {
        socket.close();
      }
    };
  }, []);

  const getOdds = (horseId) => {
    let str = "0.00";
    if (odds.has(horseId)) {
      return odds.get(horseId);
    }
    return Number(parseFloat(str).toFixed(2));
  };

  const totalBet = Array.from(slots.values()).reduce((sum, bet) => sum + bet, 0);
  const possibleWinHorse = slots.size > 0 ? 
    Array.from(slots.keys())[Math.floor(Math.random() * slots.size)] : 
    null;
  const possibleWin = possibleWinHorse ? slots.get(possibleWinHorse) * getOdds(possibleWinHorse) : 0;

  useEffect(() => {
    let timeoutId;
  
    const tick = () => {
      setRaceTime(prevTime => prevTime + 1);
      timeoutId = setTimeout(tick, 1000);
    };
  
    if (timerActive) {
      timeoutId = setTimeout(tick, 1000);
    }
  
    return () => clearTimeout(timeoutId);
  }, [timerActive]);

  function truncateToTwoDecimals(num) {
    return Math.trunc(num * 100) / 100;
  }

  const openBetDialog = () => {
    setBetDialogOpen(true);
  };
  
  const closeBetDialog = () => {
    setBetDialogOpen(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const placeBetOnHorse = (horseId) => {
    if (!selectedChip) return;
    if(!credits){
      alert("No Credits");
      return;
    }
    
    const chipValue = chipValues[selectedChip];
    if ((updatedBalance - Number(chipValue)) < 0) {
      alert("Insufficient Balance");
      return;
    }

    const hasSlots = slots.has(horseId);

    if (hasSlots) {
      let currentValue = slots.get(horseId);
      slots.set(horseId, currentValue += parseFloat(chipValue));
    }else{
      slots.set(horseId, parseFloat(chipValue));
    }
    setSlots(new Map(slots));

    sendMessage(
      JSON.stringify({game: 'horseRace', slots: mapToArray(slots)})
    );
  };
  

  // Game constants
  const horses = [
    { id: 'thunder', name: 'Thunder', color: '#00008B', laneColor: '#A0522D' },
    { id: 'lightning', name: 'Lightning', color: '#006400', laneColor: '#dba556' },
    { id: 'storm', name: 'Storm', color: '#8B0000', laneColor: '#A0522D' },
    { id: 'blaze', name: 'Blaze', color: '#FFD700', laneColor: '#dba556' },
  ];

  const horseSpriteSheets = {
    thunder: '/assets/blueHorse.webp',
    lightning: '/assets/greenHorse.webp',
    storm: '/assets/redHorse.webp',
    blaze: '/assets/yellowHorse.webp',
  };

  const checkOrientation = () => {
    const landscape = window.innerWidth > window.innerHeight;
    setIsLandscape(landscape);
  
    if (landscape && !phaserGameRef.current) {
      let attempts = 0;
      const tryInitGame = () => {
        if (gameRef.current) {
          initGame();
        } else if (attempts < 5) {
          attempts++;
          setTimeout(tryInitGame, 100); // retry after 100ms
        }
      };
      tryInitGame();
    }
  };
  

  
  // Phaser Game Scene
  class RaceScene extends Phaser.Scene {
    constructor() {
      super({ key: 'RaceScene' });
      this.horses = [];
      this.gates = [];
      this.raceDistance = 3500;
      this.finishLinePosition = 109; // When position reaches this value in horseStats (7 + 101.9)
      this.leadingHorse = null;
      this.cameraFollowSpeed = 0.05;
      this.trees = [];
      this.clouds = [];
      this.gameComponent = null;
    }

    setGameComponent(component) {
      this.gameComponent = component;
    }

    preload() {
      this.load.on('loaderror', (file) => {
        console.error('Failed to load asset:', file.key);
      });
      // Load horse sprite sheets
      horses.forEach(horse => {
        this.load.spritesheet(horse.id, horseSpriteSheets[horse.id], {
          frameWidth: 91,
          frameHeight: 86,
          endFrame: 11
        });
      });

      // Load environment assets
      const treeImages = [
        '/assets/trees1.png',
        '/assets/trees2.png',
        '/assets/trees3.png',
        '/assets/trees4.png',
        '/assets/trees5.png',
        '/assets/trees6.png'
      ];

      const cloudImages = [
        '/assets/cloud1.png',
        '/assets/cloud2.png',
        '/assets/cloud3.png'
      ];

      treeImages.forEach((tree, index) => {
        this.load.image(`tree${index + 1}`, tree);
      });

      cloudImages.forEach((cloud, index) => {
        this.load.image(`cloud${index + 1}`, cloud);
      });
    }

    create() {
      // Set world bounds
      this.physics.world.setBounds(0, 0, this.raceDistance + 400, 600);
      
      // Create background
      this.add.rectangle(this.raceDistance / 2, 300, this.raceDistance + 800, 600, 0x87CEEB);
      
      // Create race track
      this.createRaceTrack();
      
      // Create environment
      this.createEnvironment();
      
      // Create horses
      this.createHorses();
      
      // Create start gates
      this.createStartGates();
      
      // Create finish line
      this.createFinishLine();
      
      // Setup camera
      this.cameras.main.setBounds(0, 0, this.raceDistance + 400, 600);
      this.cameras.main.setZoom(0.8);
    }

    createRaceTrack() {
      const trackWidth = this.raceDistance + 500;
      const trackHeight = 400;
      
      // Ground/grass
      this.add.rectangle(trackWidth / 2, 300, trackWidth, trackHeight + 100, 0x05a80c);
      
      // Race lanes
      horses.forEach((horse, index) => {
        const laneY = 180 + (index * 80);
        const laneColor = horse.laneColor === '#A0522D' ? 0xA0522D : 0xdba556;
        
        // Create lane
        this.add.rectangle(trackWidth / 2, laneY, trackWidth, 80, laneColor);
        
        // Create lane dividers
        if (index < horses.length - 1) {
          this.add.rectangle(trackWidth / 2, laneY + 40, trackWidth, 2, 0xFFFFFF);
        }
      });
      
      // Track fences
      this.add.rectangle(trackWidth / 2, 120, trackWidth, 8, 0x808080);
      this.add.rectangle(trackWidth / 2, 430, trackWidth, 8, 0x808080);
      
      // Fence posts
      for (let i = 0; i < trackWidth / 40; i++) {
        this.add.rectangle(i * 40 + 20, 130, 4, 20, 0x808080);
        this.add.rectangle(i * 40 + 20, 440, 4, 20, 0x808080);
      }
    }

    createEnvironment() {
      // Create trees
      const treeCount = 50;
      const trackLength = this.raceDistance + 500;
      
      for (let i = 0; i < treeCount; i++) {
        const treeType = Phaser.Math.Between(1, 6);
        const treeX = Phaser.Math.Between(50, trackLength - 50);
        const treeY = Math.random() > 0.5 ? 50 : 490;
        const topTreeScale = 0.2 * Math.random() *1.2;
        const treeScale = treeY === 50 ? topTreeScale : 0.25;
        
        const tree = this.add.image(treeX, treeY, `tree${treeType}`);
        tree.setScale(treeScale);
        tree.setDepth(treeY > 300 ? 10 : 1);
        this.trees.push(tree);
      }
      
      // Create clouds
      const cloudCount = 60;
      for (let i = 0; i < cloudCount; i++) {
        const cloudType = Phaser.Math.Between(1, 3);
        const cloudX = Phaser.Math.Between(0, trackLength);
        const cloudY = Phaser.Math.Between(0, 10);
        const cloudScale = 0.005 + Math.random() * 0.2;
        
        const cloud = this.add.image(cloudX, cloudY, `cloud${cloudType}`);
        cloud.setScale(cloudScale);
        cloud.setDepth(0);
        cloud.setAlpha(0.8);
        this.clouds.push(cloud);
      }
    }

    createHorses() {
      horses.forEach((horse, index) => {
        const laneY = 140 + (index * 80);
        
        // Create horse sprite
        const horseSprite = this.physics.add.sprite(50, laneY, horse.id);
        horseSprite.setScale(1.4);
        horseSprite.setCollideWorldBounds(true);
        
        // Create running animation
        this.anims.create({
          key: `${horse.id}_run`,
          frames: this.anims.generateFrameNumbers(horse.id, { 
            start: 0, 
            end: 10
          }),
          frameRate: 10,
          repeat: -1
        });

        // Horse data structure - simplified since we'll use horseStats
        const horseData = {
          sprite: horseSprite,
          id: horse.id,
          name: horse.name,
          finished: false,
          lane: index,
          statsId: index + 1, // Map to horseStats id (1-4)
          distanceTraveled: 0
        };

        this.horses.push(horseData);
      });
    }

    createStartGates() {
      const startX = 90;
      
      // Main gate structure
      const gateHeight = 320;
      const gatePlatform = this.add.rectangle(startX, 300, 15, gateHeight, 0x555555);
      gatePlatform.setDepth(5);
      this.gates.push(gatePlatform);
      
      // Top and bottom beams
      const topBeam = this.add.rectangle(startX, 140, 20, 10, 0x777777);
      const bottomBeam = this.add.rectangle(startX, 460, 20, 10, 0x777777);
      topBeam.setDepth(5);
      bottomBeam.setDepth(5);
      this.gates.push(topBeam, bottomBeam);
      
      // Individual stall gates
      horses.forEach((horse, i) => {
        const laneCenterY = 180 + (i * 80);
        
        // Gate door
        const gate = this.add.rectangle(startX, laneCenterY, 20, 50, 0xC0C0C0);
        gate.setDepth(6);
        gate.setRotation(-0.1);
        gate.userData = { isGate: true, horseIndex: i };
        this.gates.push(gate);
        
        // Gate number plate
        const plate = this.add.rectangle(startX, laneCenterY, 15, 15, 0x808080);
        plate.setDepth(7);
        this.gates.push(plate);
        
        // Gate number (using horse color)
        const numberColor = horse.color === '#00008B' ? 0x00008B : 
                           horse.color === '#006400' ? 0x006400 : 
                           horse.color === '#8B0000' ? 0x8B0000 : 0xFFD700;
        const number = this.add.rectangle(startX, laneCenterY, 10, 10, numberColor);
        number.setDepth(8);
        this.gates.push(number);
        
        // Stall dividers
        if (i > 0) {
          const topDivider = this.add.rectangle(startX, laneCenterY - 25, 10, 5, 0x808080);
          topDivider.setDepth(5);
          this.gates.push(topDivider);
        }
        if (i < horses.length - 1) {
          const bottomDivider = this.add.rectangle(startX, laneCenterY + 25, 10, 5, 0x808080);
          bottomDivider.setDepth(5);
          this.gates.push(bottomDivider);
        }
      });
      
      // Control tower
      const towerBase = this.add.rectangle(startX-30, 120-25, 25, 40, 0x555555);
      const towerTop = this.add.rectangle(startX-30, 90-25, 35, 25, 0x777777);
      const towerWindow = this.add.rectangle(startX-30, 120-25, 15, 12, 0xAADDFF);
      
      towerBase.setDepth(5);
      towerTop.setDepth(5);
      towerWindow.setDepth(6);
      this.gates.push(towerBase, towerTop, towerWindow);
    }

    createFinishLine() {
      const finishX = this.raceDistance + 50;
      
      // Checkered finish line
      const tileCount = 20;
      for (let i = 0; i < tileCount; i++) {
        const tileColor = i % 2 === 0 ? 0xFFFFFF : 0x000000;
        const tile = this.add.rectangle(finishX, 140 + (i * 16), 30, 16, tileColor);
        tile.setDepth(5);
      }
      
      // Flag poles
      const topPole = this.add.rectangle(finishX, 120, 3, 60, 0xC0C0C0);
      const bottomPole = this.add.rectangle(finishX, 420, 3, 60, 0xC0C0C0);
      topPole.setDepth(5);
      bottomPole.setDepth(5);
      
      // Flags
      const topFlag = this.add.rectangle(finishX + 15, 100, 25, 20, 0xFF0000);
      const bottomFlag = this.add.rectangle(finishX + 15, 400, 25, 20, 0xFF0000);
      topFlag.setDepth(6);
      bottomFlag.setDepth(6);
    }

    startRace() {
      // Animate gate opening
      this.openGates();
      
      // Start horse animations
      this.horses.forEach(horse => {
        horse.sprite.play(`${horse.id}_run`);
      });
    }

    openGates() {
      const gateObjects = this.gates.filter(gate => gate.userData && gate.userData.isGate);
      
      this.tweens.add({
        targets: gateObjects,
        rotation: -1.5,
        x: '+=20',
        duration: 1300,
        ease: 'Power2.easeOut',
        onComplete: () => {
          // Remove gates after opening
          this.time.delayedCall(500, () => {
            this.gates.forEach(gate => gate.destroy());
            this.gates = [];
          });
        }
      });
    }

    // Convert horseStats position to Phaser x coordinate
    convertStatsPositionToX(statsPosition) {
      // When statsPosition reaches finishLinePosition (109), horse should be at finish line
      const progress = Math.min(statsPosition / this.finishLinePosition, 1);
      const startX = 50;
      const finishX = this.raceDistance + 20;
      return startX + (progress * (finishX - startX));
    }

    update() {
      if (!this.gameComponent) return;
      const { raceStarted, raceFinished } = this.gameComponent.state;
      
      if (!raceStarted || raceFinished) return;
      
      // Get current horseStats from the component
      const currentHorseStats = this.gameComponent.getHorseStats();
      
      if (currentHorseStats && Array.isArray(currentHorseStats)) {
        // Update horses based on real-time stats
        this.horses.forEach(horse => {
          this.updateHorseFromStats(horse, currentHorseStats);
        });
      }
      
      // Update camera to follow leading horse
      this.updateCamera();
      
      // Update UI
      this.updateUI();
      
      // Check for race finish
      this.checkRaceFinish(currentHorseStats);
    }

    updateHorseFromStats(horse, horseStats) {
      // Find corresponding stats for this horse
      const stats = horseStats.find(stat => stat.id === horse.statsId);
      
      if (!stats) return;
    
      // Update horse position based on stats
      const newX = this.convertStatsPositionToX(stats.position);
      horse.distanceTraveled = newX;
      
      // Handle animation based on horse movement and stats
      const isMoving = newX >= 50; // Horse starts moving when x >= 50
      
      if (isMoving && !horse.finished) {
        horse.sprite.x = newX;
        // Start animation if not already playing
        if (!horse.sprite.anims.isPlaying) {
          horse.sprite.play(`${horse.id}_run`);
        }
        
        // Update animation using currentFrame from horseStats
        if (horse.sprite.anims.currentAnim && stats.currentFrame !== undefined) {
          // Calculate frame rate based on animationSpeed (convert to reasonable range)
          const frameRate = Math.max(5, Math.min(20, stats.animationSpeed * 60));
          horse.sprite.anims.currentAnim.frameRate = frameRate;
          
          // Use currentFrame from stats for precise animation sync
          // Ensure frame is within valid range (0-10 for 11 frames)
          const targetFrame = Math.floor(stats.currentFrame) % 11;
          
          // Only update frame if it's different to avoid constant frame jumping
          const currentFrameIndex = horse.sprite.anims.currentFrame ? horse.sprite.anims.currentFrame.index : 0;
          if (Math.abs(currentFrameIndex - targetFrame) > 1) {
            // Set the specific frame from horseStats
            if (horse.sprite.anims.currentAnim.frames[targetFrame]) {
              horse.sprite.anims.setCurrentFrame(horse.sprite.anims.currentAnim.frames[targetFrame]);
            }
          }
        }
      } else if (!isMoving) {
        // Stop animation if horse hasn't started moving yet
        if (horse.sprite.anims.isPlaying) {
          horse.sprite.stop();
          // Set to first frame when stopped
          if (horse.sprite.anims.currentAnim && horse.sprite.anims.currentAnim.frames[0]) {
            horse.sprite.anims.setCurrentFrame(horse.sprite.anims.currentAnim.frames[0]);
          }
        }
      }
      
      // Update finished status
      horse.finished = stats.finished || stats.position >= this.finishLinePosition;
      
      // Stop animation if finished
      if (horse.finished && horse.sprite.anims.isPlaying) {
        horse.sprite.stop();
        // Set to last frame when finished
        if (horse.sprite.anims.currentAnim) {
          const lastFrameIndex = horse.sprite.anims.currentAnim.frames.length - 1;
          if (horse.sprite.anims.currentAnim.frames[lastFrameIndex]) {
            horse.sprite.anims.setCurrentFrame(horse.sprite.anims.currentAnim.frames[lastFrameIndex]);
          }
        }
      }
    }

    updateCamera() {
      // Find leading horse based on current position
      let leadingHorse = this.horses[0];
      this.horses.forEach(horse => {
        if (horse.distanceTraveled > leadingHorse.distanceTraveled) {
          leadingHorse = horse;
        }
      });
      
      this.leadingHorse = leadingHorse;
      
      // Smooth camera follow
      const targetX = leadingHorse.sprite.x + 200;
      const currentX = this.cameras.main.scrollX + this.cameras.main.width / 2;
      const newX = currentX + (targetX - currentX) * this.cameraFollowSpeed;
      
      this.cameras.main.scrollX = Math.max(0, newX - this.cameras.main.width / 2);
    }

    updateUI() {
      if (this.leadingHorse && this.gameComponent) {
        this.gameComponent.updateLeader(this.leadingHorse.name);
      }
    }

    checkRaceFinish(horseStats) {
      if (!horseStats) return;
      
      // Check if any horse has finished based on horseStats
      const finishedHorse = horseStats.find(stats => 
        stats.finished || stats.position >= this.finishLinePosition
      );
      
      if (finishedHorse && this.gameComponent && !this.gameComponent.state.winner) {
        // Find the corresponding horse object
        const winnerHorse = this.horses.find(horse => horse.statsId === finishedHorse.id);
        if (winnerHorse) {
          this.gameComponent.endRace(winnerHorse);
        }
      }
    }

    resetRace() {
      // Reset horses to starting positions
      this.horses.forEach((horse, index) => {
        horse.sprite.x = 50;
        horse.sprite.y = 180 + (index * 80);
        horse.finished = false;
        horse.distanceTraveled = 0;
        horse.sprite.stop();
      });
      
      // Reset camera
      this.cameras.main.scrollX = 0;
      
      // Recreate gates
      this.createStartGates();
    }
  }

  const initGame = () => {
    if (phaserGameRef.current || !gameRef.current) return;
  
    const config = {
      type: Phaser.AUTO,
      width: gameRef.current.clientWidth,
      height: gameRef.current.clientHeight,
      parent: gameRef.current,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: RaceScene,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };
  
    phaserGameRef.current = new Phaser.Game(config);
  
    // Set reference to this component for the scene
    setTimeout(() => {
      const scene = phaserGameRef.current.scene.scenes[0];
      if (scene) {
        scene.gameComponent = {
          state: { raceStarted, raceFinished, winner },
          updateLeader: (leaderName) => setLeader(leaderName),
          getHorseStats: () => horseStats, // Provide access to current horseStats
          endRace: (winnerHorse) => {
            setWinner(winnerHorse);
            setRaceFinished(true);
            setRaceStatus(`Winner: ${winnerHorse.name}!`);
            setShowWinnerDialog(true);
          }
        };
      }
    }, 1);
  };

  useEffect(() => {
    if(gameState === GameState.Closed){
      startRace();
    }
  }, [gameState]);

  useEffect(() => {
    if(gameState === GameState.NewGame){
      resetRace();
    }
  }, [gameState]);
  
  const startRace = () => {
    if (raceStarted || raceFinished) return;
    
    setRaceStarted(true);
    setRaceStatus('Racing!');
    
    if (phaserGameRef.current && phaserGameRef.current.scene.scenes[0]) {
      phaserGameRef.current.scene.scenes[0].startRace();
    }
  };

  const resetRace = () => {
    setRaceStarted(false);
    setRaceFinished(false);
    setWinner(null);
    setLeader('-');
    setRaceStatus('Ready to Start');
    setShowWinnerDialog(false);
    
    if (phaserGameRef.current && phaserGameRef.current.scene.scenes[0]) {
      phaserGameRef.current.scene.scenes[0].resetRace();
    }
  };

  // const handleCloseWinnerDialog = () => {
  //   setShowWinnerDialog(false);
  // };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkOrientation();
    }, 200);
  
    const handleResize = () => {
      checkOrientation();
    };
  
    const handleOrientationChange = () => {
      setTimeout(checkOrientation, 100);
    };
  
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
  
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      clearTimeout(timeoutId);
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
  
      gameRef.current = null;
    };
  }, []);
  
  // Update the scene component reference when state changes
  useEffect(() => {
    if (phaserGameRef.current && phaserGameRef.current.scene.scenes[0]) {
      phaserGameRef.current.scene.scenes[0].gameComponent = {
        state: { raceStarted, raceFinished, winner },
        updateLeader: (leaderName) => setLeader(leaderName),
        getHorseStats: () => horseStats, // Always provide current horseStats
        endRace: (winnerHorse) => {
          setWinner(winnerHorse);
          setRaceFinished(true);
          setRaceStatus(`Winner: ${winnerHorse.name}!`);
          setShowWinnerDialog(true);
        }
      };
    }
  }, [raceStarted, raceFinished, winner, horseStats]); 

  const renderBetPanel = () => {
    // Determine if betting is allowed based on game state
    const isBettingAllowed = gameState === GameState.Open || gameState === GameState.LastCall;
    
    // Format countdown timer
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };
    
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: betDialogOpen ? 0 : '-100%',
          left: 0,
          right: 0,
          height: '100vh',
          backgroundColor: 'rgba(30, 10, 5, 0.98)',
          backgroundImage: 'linear-gradient(to bottom, rgba(80, 20, 10, 1), rgba(30, 10, 5, 1))',
          borderTop: '4px solid #FFD700',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          boxShadow: '0 -5px 20px rgba(0, 0, 0, 0.6)',
          transition: 'bottom 0.3s ease-out',
          zIndex: 1200,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '12px',
            background: 'repeating-linear-gradient(90deg, #FFD700, #FFD700 8px, transparent 8px, transparent 16px)',
          }
        }}
      >
        {/* Close Button */}
        <Box 
          onClick={closeBetDialog}
          sx={{
            height: '36px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            backgroundColor: 'rgba(255, 215, 0, 0.1)',
            borderBottom: '1px solid rgba(255, 215, 0, 0.3)',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: 'rgba(255, 215, 0, 0.2)',
              '& .close-icon': {
                transform: 'translateY(2px)',
                color: '#FFF'
              }
            }
          }}
        >
          <Box 
            className="close-icon"
            sx={{
              color: '#FFD700',
              fontSize: '20px',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            ▼
            <Typography sx={{
              color: 'inherit',
              fontSize: '0.65rem',
              fontWeight: 'bold',
              mt: '-4px'
            }}>
              CLOSE
            </Typography>
          </Box>
        </Box>
        
        {/* Main content area - now with two columns */}
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          overflow: 'hidden'
        }}>
          {/* Left Column - Horses */}
          <Box sx={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRight: '1px solid rgba(255,215,0,0.2)',
            padding: '8px'
          }}>
            {/* Game Status moved to first column */}
            <Box sx={{
              padding: '6px 12px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              borderBottom: '1px solid #FFD700',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: '8px'
            }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Box sx={{
                  backgroundColor: gameState === GameState.LastCall ? '#FF5722' : 
                                  gameState === GameState.Open ? '#4CAF50' : '#F44336',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  boxShadow: '0 0 6px currentColor',
                  flexShrink: 0
                }} />
                
                <Typography sx={{
                  color: '#FFF',
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                }}>
                  STATUS: <span style={{ color: '#FFD700' }}>{gameState}</span>
                </Typography>
              </Box>
              
              <Box sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid #FFD700',
                borderRadius: '6px',
                padding: '3px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Box component="span" sx={{
                  color: countdown <= 10 ? '#F44336' : countdown <= 30 ? '#FF9800' : '#4CAF50',
                  animation: countdown <= 10 ? 'pulse 1s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                    '100%': { opacity: 1 },
                  }
                }}>
                  ⏱️
                </Box>
                <Typography sx={{
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  color: countdown <= 10 ? '#F44336' : countdown <= 30 ? '#FF9800' : '#4CAF50',
                }}>
                  {formatTime(countdown)}
                </Typography>
              </Box>
            </Box>

            {/* Title Area */}
            <Box sx={{
              padding: '8px',
              borderBottom: '1px solid #FFD700',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              textAlign: 'center',
              mb: '8px'
            }}>
              <Typography sx={{ 
                color: '#FFD700',
                fontSize: '1rem',
                fontWeight: 'bold',
                textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)',
                textTransform: 'uppercase'
              }}>
                {isBettingAllowed ? 'Place Your Bets' : 'Betting Closed'}
              </Typography>
            </Box>
            
            {/* Horses Grid */}
            <Box sx={{ 
              flex: 1,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: '1fr 1fr',
              gap: '8px',
              overflow: 'hidden'
            }}>
              {horses.slice(0, 4).map((horse) => (
                <Box
                  key={horse.id}
                  onClick={() => isBettingAllowed && selectedChip && placeBetOnHorse(horse.id)}
                  sx={{
                    backgroundColor: horse.color,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1), rgba(0,0,0,0.2))',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: slots.has(horse.id) 
                      ? '2px solid #FFD700' 
                      : '1px solid rgba(255,255,255,0.2)',
                    boxShadow: slots.has(horse.id)
                      ? '0 0 10px rgba(255, 215, 0, 0.4)'
                      : '0 2px 4px rgba(0, 0, 0, 0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: isBettingAllowed && selectedChip ? 'pointer' : 'default',
                    opacity: isBettingAllowed ? 1 : 0.7,
                    p: '5px',
                    transition: 'all 0.2s ease',
                    '&:hover': isBettingAllowed && selectedChip ? {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                    } : {}
                  }}
                >
                  {/* Horse Name and Odds */}
                  <Box sx={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 0.2
                  }}>
                    <Typography sx={{ 
                      color: '#FFF',
                      fontWeight: 'bold',
                      fontSize: '0.9em',
                      textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
                      maxWidth: '70%'
                    }}>
                      {horse.name}
                    </Typography>
                    
                    <Box sx={{
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      color: '#FFD700',
                      fontWeight: 'bold',
                      fontSize: '0.7rem',
                      borderRadius: '4px',
                      padding: '2px 4px',
                      border: '1px solid #FFD700',
                    }}>
                      x{truncateToTwoDecimals(getOdds(horse.id))}
                    </Box>
                  </Box>
                  
                  {/* Total bets */}
                  <Box sx={{
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    borderRadius: '4px',
                    padding: '2px 3.5px',
                    border: '1px dashed rgba(255,215,0,0.2)',
                    mb:0.5
                  }}>
                    <Typography sx={{
                      color: '#FFF',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span>TOTAL:</span>
                      <span style={{ 
                        color: '#FFD700', 
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        padding: '1px 2px',
                        borderRadius: '3px',
                        fontSize: '0.7rem',
                      }}>
                        ₱{allBets && allBets.has(horse.id) ? allBets.get(horse.id).toLocaleString() : '0'}
                      </span>
                    </Typography>
                  </Box>
                  
                  {/* Current Bet */}
                  <Box sx={{
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    padding: '2px',
                    borderRadius: '4px',
                    textAlign: 'center',
                    marginTop: 'auto',
                    border: slots.has(horse.id) ? '1px solid rgba(255,215,0,0.4)' : 'none',
                  }}>
                    <Typography sx={{ 
                      color: slots.has(horse.id) ? '#4CAF50' : '#FFD700',
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {slots.has(horse.id) ? (
                        <>
                          <span style={{ marginRight: '4px', color: '#FFD700' }}>💰</span>
                          ₱{slots.get(horse.id).toLocaleString()}
                        </>
                      ) : 'No bet'}
                    </Typography>
                  </Box>
  
                  {!isBettingAllowed && (
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                    }}>
                      <Typography sx={{
                        color: '#FFD700',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        border: '1px solid rgba(255,215,0,0.3)'
                      }}>
                        BETTING CLOSED
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
          
          {/* Right Column - Chips and Bet Summary */}
          <Box sx={{ 
            width: '40%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            padding: '8px',
            gap: '8px'
          }}>
            {/* Chips panel - MODIFIED FOR 3x3 GRID */}
            <Grid container sx={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: '8px',
              padding: '8px',
              border: '1px solid rgba(255,215,0,0.3)',
            }}>
              <Grid item xs={12}>
                <Typography sx={{
                  color: '#FFD700',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  fontSize: '0.85rem',
                }}>
                  SELECT CHIP
                </Typography>
              </Grid>
              
              {/* 3x3 Grid for chips */}
              <Grid container spacing={0} sx={{
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
              }}>
                {Object.entries(casinoChips).map(([color, src]) => (
                  <Grid item xs={4} key={color} sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center', 
                  }}>
                    <Box 
                      sx={{ 
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isBettingAllowed ? 'pointer' : 'default',
                        transform: selectedChip === color && isBettingAllowed ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        pointerEvents: isBettingAllowed ? 'auto' : 'none',
                        borderRadius: '50%',
                        padding: '2px',
                        backgroundColor: selectedChip === color && isBettingAllowed ? 'rgba(255,215,0,0.15)' : 'transparent',
                        border: selectedChip === color && isBettingAllowed ? '1px solid rgba(255,215,0,0.5)' : 'none',
                        
                        '&:hover': isBettingAllowed ? {
                          transform: 'scale(1.1)',
                          boxShadow: '0 0 8px rgba(255,215,0,0.5)'
                        } : {}
                      }}
                      onClick={() => isBettingAllowed && setSelectedChip(color)}
                    >
                      <Box 
                        component="img" 
                        src={src} 
                        alt={`${color} chip`}
                        sx={{ 
                          width: '100%',
                          objectFit: 'contain',
                          filter: selectedChip === color && isBettingAllowed ? 
                            'drop-shadow(0 0 6px rgba(255,215,0,0.7))' : 'none',
                        }}
                      />
                      <Typography 
                        sx={{ 
                          color: '#FFF', 
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          padding: '1px 3px',
                          borderRadius: '6px',
                        }}
                      >
                        ₱{chipValues[color].toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            
            {/* Bet Summary Section - Now in a single row */}
            <Box sx={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              borderRadius: '8px',
              padding: '8px',
              border: '1px solid rgba(255,215,0,0.4)',
            }}>
              <Typography sx={{
                color: '#FFD700',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                textAlign: 'center',
                mb: '6px',
                borderBottom: '1px solid rgba(255,215,0,0.2)',
                pb: '4px',
              }}>
                BET SUMMARY
              </Typography>
              
              <Box sx={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography sx={{ color: '#FFF', fontWeight: 'bold', fontSize: '0.7rem' }}>
                    TOTAL BET
                  </Typography>
                  <Typography sx={{ 
                    color: '#FFD700', 
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                  }}>
                    ₱{totalBet.toLocaleString()}
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  width: '1px',
                  height: '24px',
                  backgroundColor: 'rgba(255,215,0,0.3)'
                }} />
                
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography sx={{ color: '#FFF', fontWeight: 'bold', fontSize: '0.7rem' }}>
                    POSSIBLE WIN
                  </Typography>
                  <Typography sx={{ 
                    color: '#4CAF50', 
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                  }}>
                    ₱{possibleWin.toLocaleString()}
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  width: '1px',
                  height: '24px',
                  backgroundColor: 'rgba(255,215,0,0.3)'
                }} />
                
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography sx={{ color: '#FFF', fontWeight: 'bold', fontSize: '0.7rem' }}>
                    BALANCE
                  </Typography>
                  <Typography sx={{ 
                    color: '#FFD700', 
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                  }}>
                    {formatTruncatedMoney(updatedBalance)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderVoidDialog = () => {
    return (
      <Dialog
        open={showVoidDialog}
        onClose={() => setShowVoidDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#0f172a',
            backgroundImage: 'linear-gradient(to bottom, #0f172a, #1e293b)',
            borderRadius: '12px',
            border: '2px solid #ef4565',
            boxShadow: '0 0 20px rgba(239, 69, 101, 0.4)',
          }
        }}
      >
        <DialogTitle sx={{
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          borderBottom: '1px solid rgba(239, 69, 101, 0.3)',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Typography sx={{
            color: '#e2e8f0',
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: '1.1rem',
            letterSpacing: '0.5px',
          }}>
            ⚠️ RACE VOIDED
          </Typography>
          <IconButton 
            onClick={() => setShowVoidDialog(false)}
            sx={{ 
              color: '#94a3b8',
              '&:hover': {
                color: '#e2e8f0',
                backgroundColor: 'rgba(239, 69, 101, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ padding: '16px', textAlign: 'center' }}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: '16px',
          }}>
            <Box sx={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 69, 101, 0.2)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: '12px',
              mt: '12px', 
            }}>
              <Box sx={{
                fontSize: '2rem',
                color: '#ef4565',
              }}>
                ❌
              </Box>
            </Box>
            
            <Typography sx={{
              color: '#e2e8f0',
              fontFamily: "'Roboto', sans-serif",
              fontWeight: 500,
              fontSize: '1rem',
              mb: '8px',
            }}>
              The current race has been voided by the system.
            </Typography>
            
            <Typography sx={{
              color: '#94a3b8',
              fontFamily: "'Roboto', sans-serif",
              fontSize: '0.85rem',
            }}>
              All bets will be refunded to players' accounts.
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{
          padding: '12px 16px',
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          borderTop: '1px solid rgba(239, 69, 101, 0.3)',
          justifyContent: 'center',
        }}>
          <Button
            onClick={() => setShowVoidDialog(false)}
            sx={{
              color: '#e2e8f0',
              fontFamily: "'Roboto Condensed', sans-serif",
              fontWeight: 700,
              backgroundColor: '#ef4565',
              padding: '8px 24px',
              '&:hover': {
                backgroundColor: '#dc2626',
              }
            }}
          >
            UNDERSTOOD
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderWinnerDialog = () => {
    const hasWinners = topPlayers && topPlayers.length > 0;
    const isWinner = hasWinners && topPlayers.some(player => player.userId === userInfo.userData.data.user.id);
    
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          zIndex: 1300,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'auto',
          p: 0,
        }}
      >
        {/* Minimal Header */}
        <Typography
          sx={{
            fontWeight: 'bold',
            fontSize: '1.5rem',
            mb: 1,
            textAlign: 'center',
          }}
        >
          {winningBall?.horseRace ? (
            <>
              <Box component="span" sx={{ color: horseColor[winningBall.horseRace] }}>
                {winningBall.horseRace.toUpperCase()}
              </Box>{' '}
              <Box component="span" sx={{ color: '#FFD700' }}>
                WINS!
              </Box>
            </>
          ) : (
            'RACE FINISHED'
          )}
        </Typography>

        {/* Winner Status - Centered */}
        {isWinner && (
          <Box sx={{ 
            textAlign: 'center',
            mb: 2,
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.05)' },
              '100%': { transform: 'scale(1)' },
            }
          }}>
            <Typography sx={{ 
              color: '#FFD700', 
              fontSize: '1.3rem',
              fontWeight: 'bold',
              mb: 0.5,
            }}>
              🎉 YOU WON! 🎉
            </Typography>
            <Typography sx={{ 
              color: '#4CAF50',
              fontSize: '1.8rem',
              fontWeight: 'bold',
            }}>
              ₱{topPlayers.find(p => p.userId === userInfo.userData.data.user.id)?.prize.toLocaleString()}
            </Typography>
          </Box>
        )}

        {/* Top Players List - Clean Layout */}
        <Box sx={{ 
          width: '100%',
          maxWidth: '400px',
          maxHeight: '60vh',
          overflowY: 'auto',
          px: 1,
        }}>
          <Typography sx={{ 
            color: '#FFF',
            fontWeight: 'bold',
            textAlign: 'center',
            mb: 1,
            fontSize: '1.1rem',
          }}>
            TOP PLAYERS
          </Typography>

          {hasWinners ? (
            topPlayers.map((player, index) => (
              <Box
                key={player.uuid}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1,
                  p: 1,
                  borderRadius: '6px',
                  background: player.userId === userInfo.userData.data.user.id 
                    ? 'rgba(255, 215, 0, 0.15)' 
                    : index < 3 
                      ? 'rgba(255,255,255,0.05)' 
                      : 'transparent',
                  border: player.userId === userInfo.userData.data.user.id
                    ? '1px solid rgba(255, 215, 0, 0.5)'
                    : 'none',
                }}
              >
                <Box sx={{ 
                  width: '30px',
                  textAlign: 'center',
                  color: index === 0 
                    ? '#FFD700' 
                    : index === 1 
                      ? '#C0C0C0' 
                      : index === 2 
                        ? '#CD7F32' 
                        : '#FFF',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                }}>
                  {index + 1}.
                </Box>
                
                <Typography sx={{ 
                  flex: 1,
                  color: player.userId === userInfo.userData.data.user.id 
                    ? '#FFD700' 
                    : '#FFF',
                  fontWeight: player.userId === userInfo.userData.data.user.id 
                    ? 'bold' 
                    : 'normal',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {player.name}
                </Typography>
                
                <Typography sx={{ 
                  color: '#4CAF50',
                  fontWeight: 'bold',
                  minWidth: 'fit-content',
                  ml: 1,
                  fontSize: '0.95rem',
                }}>
                  ₱{player.prize.toLocaleString()}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography sx={{ 
              color: 'rgba(255,255,255,0.7)',
              textAlign: 'center',
              mt: 2,
            }}>
              No winners this round
            </Typography>
          )}
        </Box>

        {/* Simple Footer */}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography sx={{ 
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.8rem',
          }}>
            {new Date().toLocaleDateString()}
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderHelpDialog = () => {
    return (
      <Dialog
        open={helpDialogOpen}
        onClose={() => setHelpDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#0f172a',
            backgroundImage: 'linear-gradient(to bottom, #0f172a, #1e293b)',
            borderRadius: '12px',
            border: '2px solid #3b82f6',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)',
          }
        }}
      >
        <DialogTitle sx={{
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Typography sx={{
            color: '#e2e8f0',
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: '1.1rem',
            letterSpacing: '0.5px',
          }}>
            HORSE RACE GUIDE
          </Typography>
          <IconButton 
            onClick={() => setHelpDialogOpen(false)}
            sx={{ 
              color: '#94a3b8',
              '&:hover': {
                color: '#e2e8f0',
                backgroundColor: 'rgba(59, 130, 246, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ padding: '16px' }}>
          <Box sx={{ mb: '16px' }}>
            <Typography sx={{
              color: '#3b82f6',
              fontFamily: "'Roboto Condensed', sans-serif",
              fontWeight: 700,
              fontSize: '0.9rem',
              mb: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              GAME MECHANICS
            </Typography>
            
            <Box component="ul" sx={{
              paddingLeft: '20px',
              '& li': {
                color: '#e2e8f0',
                fontFamily: "'Roboto', sans-serif",
                fontSize: '0.85rem',
                marginBottom: '8px',
                lineHeight: '1.5',
              }
            }}>
              <li>Bet on which horse you think will win the race</li>
              <li>Each horse has different odds (multiplier) based on its total bets</li>
              <li>You can bet on multiple horse in a single race</li>
              <li>Betting closes when the countdown timer reaches zero</li>
              <li>Watch the exciting race animation after betting closes</li>
              <li>If your horse wins, you get your bet multiplied by the odds</li>
            </Box>
          </Box>
          
          <Box sx={{ mb: '16px' }}>
            <Typography sx={{
              color: '#3b82f6',
              fontFamily: "'Roboto Condensed', sans-serif",
              fontWeight: 700,
              fontSize: '0.9rem',
              mb: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              BETTING TIMER
            </Typography>
            
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mb: '8px',
              padding: '8px',
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              borderRadius: '6px',
            }}>
              <Box sx={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#06d6a0',
                marginRight: '8px',
              }} />
              <Typography sx={{
                color: '#e2e8f0',
                fontFamily: "'Roboto', sans-serif",
                fontSize: '0.85rem',
                flex: 1,
              }}>
                <strong>OPEN:</strong> Betting is active, place your bets
              </Typography>
            </Box>
            
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mb: '8px',
              padding: '8px',
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              borderRadius: '6px',
            }}>
              <Box sx={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#ff9a3c',
                marginRight: '8px',
              }} />
              <Typography sx={{
                color: '#e2e8f0',
                fontFamily: "'Roboto', sans-serif",
                fontSize: '0.85rem',
                flex: 1,
              }}>
                <strong>LAST CALL:</strong> Final 30 seconds to place bets
              </Typography>
            </Box>
            
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px',
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              borderRadius: '6px',
            }}>
              <Box sx={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#ef4565',
                marginRight: '8px',
              }} />
              <Typography sx={{
                color: '#e2e8f0',
                fontFamily: "'Roboto', sans-serif",
                fontSize: '0.85rem',
                flex: 1,
              }}>
                <strong>CLOSED:</strong> Betting is closed, race in progress
              </Typography>
            </Box>
          </Box>
          
          <Box>
            <Typography sx={{
              color: '#3b82f6',
              fontFamily: "'Roboto Condensed', sans-serif",
              fontWeight: 700,
              fontSize: '0.9rem',
              mb: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              WINNERS ANNOUNCEMENT
            </Typography>
            
            <Typography sx={{
              color: '#e2e8f0',
              fontFamily: "'Roboto', sans-serif",
              fontSize: '0.85rem',
              mb: '8px',
              lineHeight: '1.5',
            }}>
              After the race finishes, the winning horse will be announced and the top 3 players with the highest payouts will be displayed.
            </Typography>
            
            <Typography sx={{
              color: '#e2e8f0',
              fontFamily: "'Roboto', sans-serif",
              fontSize: '0.85rem',
              lineHeight: '1.5',
            }}>
              If you're one of the top winners, your name and prize will be highlighted in the winners list.
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{
          padding: '12px 16px',
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          borderTop: '1px solid rgba(59, 130, 246, 0.3)',
        }}>
          <Button
            onClick={() => setHelpDialogOpen(false)}
            sx={{
              color: '#e2e8f0',
              fontFamily: "'Roboto Condensed', sans-serif",
              fontWeight: 700,
              backgroundColor: '#3b82f6',
              '&:hover': {
                backgroundColor: '#2563eb',
              }
            }}
          >
            GOT IT!
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderHistoryPanel = () => {
    const calculateHorseStats = () => {
      const stats = {
        storm: { wins: 0, percentage: 0 },
        thunder: { wins: 0, percentage: 0 },
        lightning: { wins: 0, percentage: 0 },
        blaze: { wins: 0, percentage: 0 },
        total: gameHistory.length
      };
      
      gameHistory.forEach(game => {
        stats[game.zodiac].wins++;
      });
      
      Object.keys(stats).forEach(horse => {
        if (horse !== 'total') {
          stats[horse].percentage = Math.round((stats[horse].wins / stats.total) * 100);
        }
      });
      
      return stats;
    };
    
    const horsesStats = calculateHorseStats();
  
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: historyDialogOpen ? 0 : '-100%',
          left: 0,
          right: 0,
          height: '100vh',
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(to bottom, #0f172a, #1e293b)',
          borderTop: '3px solid #3b82f6',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.8)',
          transition: 'bottom 0.3s ease-out',
          zIndex: 1200,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: 'repeating-linear-gradient(90deg, #3b82f6, #3b82f6 6px, transparent 6px, transparent 12px)',
          }
        }}
      >
        {/* Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
        }}>
          <Typography sx={{
            color: '#e2e8f0',
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: '1.1rem',
            letterSpacing: '0.5px',
          }}>
            🏆 RACE HISTORY
          </Typography>
          
          <IconButton 
            onClick={() => setHistoryDialogOpen(false)}
            sx={{ 
              color: '#94a3b8',
              '&:hover': {
                color: '#e2e8f0',
                backgroundColor: 'rgba(59, 130, 246, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        
        {/* Stats Summary */}
        <Box sx={{
          padding: '12px 16px',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
        }}>
          <Typography sx={{
            color: '#94a3b8',
            fontFamily: "'Roboto Condensed', sans-serif",
            fontWeight: 700,
            fontSize: '0.8rem',
            mb: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            WIN PERCENTAGE (LAST {horsesStats.total} RACES)
          </Typography>
          
          <Grid container spacing={1}>
            {horses.map(horse => (
              <Grid item xs={3} key={horse.id}>
                <Box sx={{
                  backgroundColor: horse.color,
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.1), rgba(0,0,0,0.2))',
                  borderRadius: '6px',
                  padding: '8px',
                  textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  <Typography sx={{
                    color: '#fff',
                    fontFamily: "'Roboto Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    mb: '2px',
                  }}>
                    {horse.name.toUpperCase()}
                  </Typography>
                  <Typography sx={{
                    color: '#fff',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 800,
                    fontSize: '1rem',
                  }}>
                    {horsesStats[horse.id].percentage || 0}%
                  </Typography>
                  <Typography sx={{
                    color: 'rgba(255,255,255,0.7)',
                    fontFamily: "'Roboto Condensed', sans-serif",
                    fontWeight: 400,
                    fontSize: '0.6rem',
                  }}>
                    {horsesStats[horse.id].wins} WINS
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
        
        {/* History List */}
        <Box sx={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
        }}>
          <Typography sx={{
            color: '#94a3b8',
            fontFamily: "'Roboto Condensed', sans-serif",
            fontWeight: 700,
            fontSize: '0.8rem',
            mb: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            padding: '0 8px',
          }}>
            RECENT RACES
          </Typography>
          
          {gameHistory.map((game, index) => (
            <Box 
              key={game.id}
              sx={{
                backgroundColor: index % 2 === 0 ? 'rgba(30, 41, 59, 0.5)' : 'rgba(15, 23, 42, 0.5)',
                borderRadius: '6px',
                padding: '10px 12px',
                marginBottom: '6px',
                borderLeft: `4px solid ${horseColor[game.zodiac]}`,
              }}
            >
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: horseColor[game.zodiac],
                    marginRight: '8px',
                    border: '2px solid rgba(255,255,255,0.3)',
                  }} />
                  <Typography sx={{
                    color: '#e2e8f0',
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    textTransform: 'capitalize',
                  }}>
                    {game.zodiac} won
                  </Typography>
                </Box>
                
                <Typography sx={{
                  color: '#94a3b8',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 500,
                  fontSize: '0.7rem',
                }}>
                  {new Date(game.createdAt).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  if (!isLandscape) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          bgcolor: 'black',
          color: 'white',
          textAlign: 'center',
          p: 3
        }}
      >
        <Typography variant="h4" component="h2" gutterBottom>
          📱 Please rotate your device
        </Typography>
        <Typography variant="h6">
          Switch to landscape mode for the best racing experience
        </Typography>
      </Box>
    );
  }

  return (
    // <Box sx={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
    //   {/* Game Container */}
    //   <Box ref={gameRef} sx={{ width: '100%', height: '100%' }} />
    // </Box>
    <ThemeProvider theme={theme}>
      <Box sx={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
        {gameState === GameState.WinnerDeclared && renderWinnerDialog()}
        <Box ref={gameRef} sx={{ width: '100%', height: '100%' }} />
        {renderVoidDialog()}
        {renderHelpDialog()}
        {gameHistory && renderHistoryPanel()}
        {isLandscape && (
          <>
            {/* Top Bar */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                p: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box sx={{display: 'flex', alignItems: 'center', gap: 1, color: 'white'}}>
                <IconButton 
                  onClick={() => navigate(-1)}
                  sx={{ 
                    color: '#FFD700',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.5)' }
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    ml: 2,
                    background: 'linear-gradient(135deg, #D4AF37 0%, #F5D073 50%, #D4AF37 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textFillColor: 'transparent',
                    display: 'inline-block'
                  }}
                >
                  {userInfo?.userData?.data?.user?.firstName}
                </Typography>
              </Box>
              
              {/* Countdown/Race Time Display */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 1,
                  textAlign: 'center'
                }}
              >
                {/* Closed State - Shows Race Time */}
                {gameState === GameState.Closed && (
                  <Box
                    sx={{
                      bgcolor: 'rgba(0, 0, 0, 0.8)',
                      p: '6px 16px',
                      borderRadius: '20px',
                      border: '2px solid #FF0000',
                      boxShadow: '0 0 15px rgba(255, 0, 0, 0.7)',
                      minWidth: 120,
                      animation: 'pulse 1.5s infinite',
                      '@keyframes pulse': {
                        '0%': { boxShadow: '0 0 15px rgba(255, 0, 0, 0.7)' },
                        '50%': { boxShadow: '0 0 25px rgba(255, 0, 0, 0.9)' },
                        '100%': { boxShadow: '0 0 15px rgba(255, 0, 0, 0.7)' }
                      }
                    }}
                  >
                    <Typography variant="h6" sx={{ 
                      color: '#FFF', 
                      fontWeight: 'bold',
                      textShadow: '0 0 8px rgba(255, 0, 0, 0.9)',
                      letterSpacing: '1px'
                    }}>
                      RACE IN: {formatTime(raceTime)}
                    </Typography>
                  </Box>
                )}

                {/* Open/Last Call State - Shows Countdown */}
                {(gameState === GameState.Open || gameState === GameState.LastCall) && (
                  <Box
                    sx={{
                      bgcolor: 'rgba(0, 0, 0, 0.8)',
                      p: '6px 16px',
                      borderRadius: '20px',
                      border: `2px solid ${gameState === GameState.LastCall ? '#FFA500' : '#4CAF50'}`,
                      boxShadow: `0 0 15px ${gameState === GameState.LastCall ? 'rgba(255, 165, 0, 0.7)' : 'rgba(76, 175, 80, 0.7)'}`,
                      minWidth: 120,
                      animation: gameState === GameState.LastCall ? 'pulseWarning 1s infinite' : 'none',
                      '@keyframes pulseWarning': {
                        '0%': { boxShadow: '0 0 15px rgba(255, 165, 0, 0.7)' },
                        '50%': { boxShadow: '0 0 25px rgba(255, 165, 0, 0.9)' },
                        '100%': { boxShadow: '0 0 15px rgba(255, 165, 0, 0.7)' }
                      }
                    }}
                  >
                    <Typography variant="h6" sx={{ 
                      color: gameState === GameState.LastCall ? '#FFA500' : '#4CAF50',
                      fontWeight: 'bold',
                      textShadow: `0 0 8px ${gameState === GameState.LastCall ? 'rgba(255, 165, 0, 0.9)' : 'rgba(76, 175, 80, 0.9)'}`,
                      letterSpacing: '1px'
                    }}>
                      {gameState === GameState.LastCall ? 'LAST CALL!' : 'BETTING OPEN!'}
                    </Typography>
                    <Typography variant="h5" sx={{ 
                      color: '#FFD700',
                      fontWeight: 'bold',
                      textShadow: '0 0 10px rgba(255, 215, 0, 0.9)',
                      mt: 0.5
                    }}>
                      {formatTime(countdown)}
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 'bold',
                  mr: 2,
                  background: 'linear-gradient(135deg, #D4AF37 0%, #F5D073 50%, #B8860B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  display: 'inline-block',
                  textShadow: '0px 1px 2px rgba(0, 0, 0, 0.2)' // Optional depth
                }}
              >
                Balance: {formatTruncatedMoney(updatedBalance)}
              </Typography>
            </Box>
            
            {/* Action Buttons */}
            <>
            <Box
              onClick={toggleVisibility}
              sx={{
                position: 'absolute',
                bottom: '50px',
                left: visible ? '235px' : '0px',
                zIndex: 1200,
                color: 'white',
                bgcolor: 'rgba(0, 0, 0, 0.4)', // Semi-transparent background
                borderTopRightRadius: 12,       // Rounded right corners
                borderBottomRightRadius: 12,
                p: 0.5,                        // Padding for click area
                transition: 'all 0.3s ease',    // Smooth transitions
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.7)', // Darker on hover
                  transform: 'scale(1.05)'       // Slight zoom effect
                }
              }}
            >
              {visible ? <ArrowLeftIcon /> : <ArrowRightIcon />}
            </Box>

              <Box
                sx={{
                  position: 'absolute',
                  bottom: '20px',
                  left: leftPosition,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  transition: 'left 0.3s ease',
                }}
              >
                <Collapse in={visible} orientation="horizontal">
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={openBetDialog}
                      sx={{ 
                        bgcolor: '#4CAF50', 
                        color: '#FFF',
                        fontWeight: 'bold',
                        '&:hover': { bgcolor: '#45a049' },
                        py: 1.5
                      }}
                    >
                      Place Bet
                    </Button>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        onClick={() => setHistoryDialogOpen(true)}
                        startIcon={<HistoryIcon />}
                        sx={{ 
                          bgcolor: '#3b82f6', 
                          color: '#FFF',
                          fontWeight: 'bold',
                          '&:hover': { bgcolor: '#2563eb' },
                          flex: 1,
                          py: 1.5
                        }}
                      >
                        History
                      </Button>
                      
                      <Button
                        variant="contained"
                        onClick={() => setHelpDialogOpen(true)}
                        startIcon={<HelpIcon />}
                        sx={{ 
                          bgcolor: '#ef476f', 
                          color: '#FFF',
                          fontWeight: 'bold',
                          '&:hover': { bgcolor: '#d43d63' },
                          flex: 1,
                          py: 1.5
                        }}
                      >
                        Help
                      </Button>
                    </Box>
                  </Box>
                </Collapse>
              </Box>
            </>
            
            {/* {gameFinished && renderWinnerAnnouncement()} */}
            
            {renderBetPanel()}
          </>
        )}
        {countdown <= 5 && countdown > 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              pointerEvents: 'none'
            }}
          >
            <Box
              sx={{
                textAlign: 'center',
                animation: 'pulse 0.5s infinite alternate',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)' },
                  '100%': { transform: 'scale(1.05)' }
                }
              }}
            >
              <Typography
                variant="h1"
                sx={{
                  fontFamily: '"Keania One", cursive',
                  fontSize: '8rem',
                  color: '#FFD700',
                  textShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
                  lineHeight: 1,
                  mb: 1,
                  animation: countdown === 5 ? 'zoomIn 0.5s' : 'none',
                  '@keyframes zoomIn': {
                    '0%': { transform: 'scale(0.5)', opacity: 0 },
                    '100%': { transform: 'scale(1)', opacity: 1 }
                  }
                }}
              >
                {countdown}
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: '"Keania One", cursive',
                  color: '#FFF',
                  textShadow: '0 0 10px rgba(255, 255, 255, 0.7)',
                  letterSpacing: '2px'
                }}
              >
                RACE STARTING!
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </ThemeProvider>

  );

};

export default HorseRacingGameVersionTwo;