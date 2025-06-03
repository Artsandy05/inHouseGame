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
  Alert
} from '@mui/material';
import Phaser from 'phaser';
import { playerStore } from '../utils/horseRace';
import { GameState } from '../utils/gameutils';
import { useSearchParams } from 'react-router-dom';
import createEncryptor from '../utils/createEncryptor';

const encryptor = createEncryptor(process.env.REACT_APP_DECRYPTION_KEY);

const HorseRacingGameVersionTwo = () => {
  const gameRef = useRef(null);
  const phaserGameRef = useRef(null);
  const [isLandscape, setIsLandscape] = useState(false);
  const [raceStarted, setRaceStarted] = useState(false);
  const [raceFinished, setRaceFinished] = useState(false);
  const [winner, setWinner] = useState(null);
  const [leader, setLeader] = useState('-');
  const [raceStatus, setRaceStatus] = useState('Ready to Start');
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
  const [totalBets, setTotalBets] = useState(0);
  const [credits, setCredits] = useState(0);

  const { gameState, setPlayerInfo, sendMessage, countdown, slots,setSlots,odds, allBets, winningBall, setUserInfo, topPlayers, voidMessage, horseStats, latestBalance } = playerStore();
  const { connect } = playerStore.getState();
  const [searchParams] = useSearchParams();
  const userDetailsParam = searchParams.get('data');
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
    if(latestBalance){
      setCredits(latestBalance);
    }else{
      setCredits(urlUserDetails?.credits || localStorageUser?.userData?.data?.wallet?.balance);
    }
  }, [latestBalance]);

  useEffect(() => {
    connect();

    return () => {
      const { socket } = playerStore.getState();
      if (socket) {
        socket.close();
      }
    };
  }, []);

  // if(horseStats){
  //   console.log(horseStats)
  // }
  

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
      requestAnimationFrame(() => initGame()); // Delay Phaser init
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
        const treeY = Math.random() > 0.5 ? 50 : 500;
        const treeScale = 0.2 * Math.random() *1.2;
        
        const tree = this.add.image(treeX, treeY, `tree${treeType}`);
        tree.setScale(treeScale);
        tree.setDepth(treeY > 300 ? 10 : 1);
        this.trees.push(tree);
      }
      
      // Create clouds
      const cloudCount = 20;
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
    }, 50);
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

  const handleCloseWinnerDialog = () => {
    setShowWinnerDialog(false);
  };

  useEffect(() => {
    checkOrientation();
  
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
    <Box sx={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Game Container */}
      <Box ref={gameRef} sx={{ width: '100%', height: '100%' }} />
      
      {/* Race Info Panel */}
      
      {/* Winner Announcement Dialog */}
      {/* <Dialog
        open={showWinnerDialog}
        onClose={handleCloseWinnerDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            textAlign: 'center',
            bgcolor: 'linear-gradient(145deg, #FFD700, #FFA500)',
            color: '#000'
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#8B0000' }}>
            🏆 WINNER! 🏆
          </Typography>
        </DialogTitle>
        <DialogContent>
          {winner && (
            <Box sx={{ py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, color: winner.color }}>
                {winner.name}
              </Typography>
              <Typography variant="h6" sx={{ mb: 2 }}>
                🥇 First Place! 🥇
              </Typography>
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body1">
                  Congratulations! {winner.name} has won the race in spectacular fashion!
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            onClick={handleCloseWinnerDialog}
            variant="contained"
            size="large"
            sx={{
              bgcolor: '#4caf50',
              '&:hover': { bgcolor: '#45a049' },
              px: 4
            }}
          >
            Continue
          </Button>
          <Button
            onClick={() => {
              handleCloseWinnerDialog();
              resetRace();
            }}
            variant="outlined"
            size="large"
            sx={{ ml: 2, px: 4 }}
          >
            Race Again
          </Button>
        </DialogActions>
      </Dialog> */}
    </Box>
  );

};

export default HorseRacingGameVersionTwo;