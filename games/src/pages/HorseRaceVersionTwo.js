import React, { useEffect, useRef, useState } from 'react';
import { 
  Box, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Typography,
  Paper,
  Grid,
  Chip
} from '@mui/material';
import Phaser from 'phaser';

const horseSpriteSheets = {
  thunder: '/assets/blueHorse.webp',
  lightning: '/assets/greenHorse.webp',
  storm: '/assets/redHorse.webp',
  blaze: '/assets/yellowHorse.webp',
};

const horses = [
  { id: 'thunder', name: 'Thunder', color: '#00008B', laneColor: '#A0522D' },
  { id: 'lightning', name: 'Lightning', color: '#006400', laneColor: '#dba556' },
  { id: 'storm', name: 'Storm', color: '#8B0000', laneColor: '#A0522D' },
  { id: 'blaze', name: 'Blaze', color: '#FFD700', laneColor: '#dba556' },
];

class RaceScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RaceScene' });
    this.horses = [];
    this.gates = [];
    this.raceStarted = false;
    this.raceFinished = false;
    this.winner = null;
    this.finishLine = 750;
    this.onWinner = null;
  }

  preload() {
    // Load horse sprite sheets
    horses.forEach(horse => {
      this.load.spritesheet(horse.id, horseSpriteSheets[horse.id], {
        frameWidth: 91,  // 1005px ÷ 11 frames = ~91px per frame
        frameHeight: 86, // Full height of image
        endFrame:11 // 11 frames (0-10)
      });
    });

    // Create simple gate graphics (we'll draw rectangles)
    this.load.image('gate', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
  }

  create() {
    // Set world bounds
    this.physics.world.setBounds(0, 0, 800, 600);

    // Create background
    this.add.rectangle(400, 300, 800, 600, 0x87CEEB); // Sky blue

    // Create grass background
    this.add.rectangle(400, 350, 800, 300, 0x228B22);

    // Create race track lanes
    horses.forEach((horse, index) => {
      const laneY = 200 + (index * 80);
      
      // Lane background
      const laneColor = horse.laneColor === '#A0522D' ? 0xA0522D : 0xDBA556;
      this.add.rectangle(400, laneY, 800, 70, laneColor);
      
      // Lane dividers
      if (index < horses.length - 1) {
        this.add.rectangle(400, laneY + 35, 800, 2, 0xFFFFFF);
      }
    });

    // Create starting gates
    this.createStartingGates();

    // Create finish line
    this.createFinishLine();

    // Create horses
    this.createHorses();

    // Add some decorative elements
    this.createDecorations();
  }

  createStartingGates() {
    horses.forEach((horse, index) => {
      const laneY = 200 + (index * 80);
      
      // Gate posts
      const leftPost = this.add.rectangle(80, laneY - 30, 8, 60, 0x8B4513);
      const rightPost = this.add.rectangle(80, laneY + 30, 8, 60, 0x8B4513);
      
      // Gate bar (horizontal)
      const gateBar = this.add.rectangle(80, laneY, 60, 6, 0xFF4500);
      gateBar.setOrigin(0, 0.5);
      
      this.gates.push({
        bar: gateBar,
        isOpen: false,
        horse: horse.id
      });
    });
  }

  createFinishLine() {
    // Checkered finish line
    const tileSize = 20;
    const tiles = 15;
    
    for (let i = 0; i < tiles; i++) {
      const color = i % 2 === 0 ? 0xFFFFFF : 0x000000;
      this.add.rectangle(this.finishLine, 150 + (i * tileSize), 10, tileSize, color);
    }

    // Finish line poles
    this.add.rectangle(this.finishLine, 120, 6, 40, 0xC0C0C0);
    this.add.rectangle(this.finishLine, 480, 6, 40, 0xC0C0C0);
    
    // Flags
    this.add.rectangle(this.finishLine + 15, 110, 30, 20, 0xFF0000);
    this.add.rectangle(this.finishLine + 15, 490, 30, 20, 0xFF0000);
  }

  createHorses() {
    horses.forEach((horse, index) => {
      const laneY = 200 + (index * 80);
      
      // Create horse sprite
      const horseSprite = this.physics.add.sprite(50, laneY, horse.id);
      horseSprite.setScale(0.8);
      horseSprite.setCollideWorldBounds(true);
      
      // Create running animation
      this.anims.create({
        key: `${horse.id}_run`,
        frames: this.anims.generateFrameNumbers(horse.id, { 
          start: 0, 
          end: 10 // Assuming you have 11 frames (0-10)
        }),
        frameRate: 10, // Adjust this for faster/slower animation
        repeat: -1
      });

      // Horse stats for realistic racing
      const horseData = {
        sprite: horseSprite,
        id: horse.id,
        name: horse.name,
        speed: 1.2 + Math.random() * 0.8, // Base speed
        stamina: 0.7 + Math.random() * 0.3, // Stamina (affects speed over time)
        acceleration: 0.02 + Math.random() * 0.02, // How quickly they reach top speed
        currentSpeed: 0,
        fatigue: 0,
        burstChance: 0.003 + Math.random() * 0.002, // Chance for speed burst
        slowChance: 0.002 + Math.random() * 0.002, // Chance for slowdown
        finished: false,
        position: index + 1,
        lane: index,
        performance: Math.random() < 0.33 ? 'early' : Math.random() < 0.5 ? 'consistent' : 'late'
      };

      this.horses.push(horseData);
    });
  }

  createDecorations() {
    // Add some trees in background
    for (let i = 0; i < 8; i++) {
      const x = 100 + (i * 100);
      const y = Math.random() < 0.5 ? 50 : 550;
      this.add.circle(x, y, 25, 0x006400);
      this.add.rectangle(x, y + 25, 8, 30, 0x8B4513);
    }

    // Add some clouds
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * 800;
      const y = 50 + Math.random() * 50;
      this.add.ellipse(x, y, 80, 40, 0xFFFFFF, 0.8);
    }
  }

  startRace() {
    if (this.raceStarted) return;
    
    this.raceStarted = true;
    
    // Open gates with animation
    this.gates.forEach((gate, index) => {
      this.tweens.add({
        targets: gate.bar,
        scaleY: 0,
        duration: 500,
        delay: index * 100,
        ease: 'Back.easeIn'
      });
    });

    // Start horse animations and movement
    this.horses.forEach(horse => {
      horse.sprite.play(`${horse.id}_run`);
      horse.currentSpeed = 0.1; // Start slow
    });
  }

  update() {
    if (!this.raceStarted || this.raceFinished) return;

    let winnerFound = false;

    this.horses.forEach(horse => {
      if (horse.finished) return;

      // Performance-based speed adjustments
      const raceProgress = horse.sprite.x / this.finishLine;
      
      // Apply performance profile
      let speedMultiplier = 1;
      if (horse.performance === 'early' && raceProgress < 0.3) {
        speedMultiplier = 1.4;
      } else if (horse.performance === 'late' && raceProgress > 0.7) {
        speedMultiplier = 1.3;
      } else if (horse.performance === 'consistent') {
        speedMultiplier = 1.1;
      }

      // Gradual acceleration
      if (horse.currentSpeed < horse.speed) {
        horse.currentSpeed += horse.acceleration;
      }

      // Random speed bursts and slowdowns
      if (Math.random() < horse.burstChance) {
        horse.currentSpeed *= 1.2;
      }
      if (Math.random() < horse.slowChance) {
        horse.currentSpeed *= 0.9;
      }

      // Apply fatigue over time
      horse.fatigue += 0.0001;
      const fatigueEffect = Math.max(0.7, 1 - horse.fatigue * (1 - horse.stamina));

      // Calculate final speed
      const finalSpeed = horse.currentSpeed * speedMultiplier * fatigueEffect;

      // Move horse
      horse.sprite.x += finalSpeed;

      // Check if finished
      if (horse.sprite.x >= this.finishLine) {
        horse.finished = true;
        horse.sprite.stop();
        
        if (!winnerFound && !this.winner) {
          this.winner = horse;
          winnerFound = true;
          this.raceFinished = true;
          
          // Call winner callback
          if (this.onWinner) {
            this.onWinner(horse);
          }
        }
      }
    });
  }

  resetRace() {
    this.raceStarted = false;
    this.raceFinished = false;
    this.winner = null;

    // Reset horses
    this.horses.forEach((horse, index) => {
      horse.sprite.x = 50;
      horse.sprite.stop();
      horse.finished = false;
      horse.currentSpeed = 0;
      horse.fatigue = 0;
      // Randomize stats for next race
      horse.speed = 1.2 + Math.random() * 0.8;
      horse.stamina = 0.7 + Math.random() * 0.3;
      horse.acceleration = 0.02 + Math.random() * 0.02;
      horse.burstChance = 0.003 + Math.random() * 0.002;
      horse.slowChance = 0.002 + Math.random() * 0.002;
      horse.performance = Math.random() < 0.33 ? 'early' : Math.random() < 0.5 ? 'consistent' : 'late';
    });

    // Reset gates
    this.gates.forEach(gate => {
      gate.bar.scaleY = 1;
      gate.isOpen = false;
    });
  }
}

const HorseRacingGameVersionTwo = () => {
  const gameRef = useRef(null);
  const phaserGameRef = useRef(null);
  const sceneRef = useRef(null);
  const [raceStarted, setRaceStarted] = useState(false);
  const [winner, setWinner] = useState(null);
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
  const [raceNumber, setRaceNumber] = useState(1);

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameRef.current,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: RaceScene
    };

    phaserGameRef.current = new Phaser.Game(config);
    
    // Get scene reference and set winner callback
    phaserGameRef.current.events.once('ready', () => {
      sceneRef.current = phaserGameRef.current.scene.getScene('RaceScene');
      sceneRef.current.onWinner = handleWinner;
    });

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
      }
    };
  }, []);

  const handleWinner = (winningHorse) => {
    setWinner(winningHorse);
    setShowWinnerDialog(true);
    setRaceStarted(false);
  };

  const startRace = () => {
    if (sceneRef.current && !raceStarted) {
      sceneRef.current.startRace();
      setRaceStarted(true);
    }
  };

  const nextRound = () => {
    if (sceneRef.current) {
      sceneRef.current.resetRace();
      setRaceStarted(false);
      setWinner(null);
      setShowWinnerDialog(false);
      setRaceNumber(prev => prev + 1);
    }
  };

  const closeWinnerDialog = () => {
    setShowWinnerDialog(false);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: 2,
      bgcolor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ color: '#2E7D32', fontWeight: 'bold' }}>
        🏇 Horse Racing Championship 🏇
      </Typography>
      
      <Paper elevation={4} sx={{ p: 2, mb: 2, bgcolor: '#e8f5e8' }}>
        <Typography variant="h5" component="h2" align="center" sx={{ mb: 1 }}>
          Race #{raceNumber}
        </Typography>
        <Grid container spacing={1} justifyContent="center">
          {horses.map((horse, index) => (
            <Grid item key={horse.id}>
              <Chip
                label={horse.name}
                sx={{
                  bgcolor: horse.color,
                  color: 'white',
                  fontWeight: 'bold',
                  '& .MuiChip-label': { px: 2 }
                }}
              />
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          size="large"
          onClick={startRace}
          disabled={raceStarted}
          sx={{
            bgcolor: '#4CAF50',
            '&:hover': { bgcolor: '#45a049' },
            px: 4,
            py: 1.5,
            fontSize: '1.2rem',
            fontWeight: 'bold'
          }}
        >
          {raceStarted ? 'Race in Progress...' : 'START RACE!'}
        </Button>
      </Box>

      <Box 
        ref={gameRef} 
        sx={{ 
          border: '4px solid #8B4513',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 8px 16px rgba(0,0,0,0.3)'
        }} 
      />

      <Dialog
        open={showWinnerDialog}
        onClose={closeWinnerDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#fff3e0',
            border: '3px solid #ff9800'
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          bgcolor: '#ff9800', 
          color: 'white', 
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>
          🏆 WINNER! 🏆
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          {winner && (
            <>
              <Typography variant="h4" component="h3" gutterBottom sx={{ 
                color: winner.id === 'thunder' ? '#00008B' : 
                       winner.id === 'lightning' ? '#006400' :
                       winner.id === 'storm' ? '#8B0000' : '#FFD700',
                fontWeight: 'bold'
              }}>
                {winner.name}
              </Typography>
              <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
                wins Race #{raceNumber}!
              </Typography>
              <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                🎉 Congratulations! What an amazing race! 🎉
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button
            onClick={nextRound}
            variant="contained"
            size="large"
            sx={{
              bgcolor: '#4CAF50',
              '&:hover': { bgcolor: '#45a049' },
              px: 4,
              py: 1,
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}
          >
            Next Round
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HorseRacingGameVersionTwo;