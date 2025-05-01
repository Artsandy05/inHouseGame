import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Box,
  Typography,
  Grid,
  IconButton,
  Divider
} from '@mui/material';
import Confetti from 'react-confetti';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Custom theme with Keania One font
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

// Casino chip assets
const casinoChips = {
  black: '/assets/black.png',
  purple: '/assets/purple.png',
  blue: '/assets/blue.png', 
  green: '/assets/green.png',
  yellow: '/assets/yellow.png',
  red: '/assets/red.png',
};

// Chip values
const chipValues = {
  black: 100,
  purple: 50,
  blue: 25, 
  green: 10,
  yellow: 5,
  red: 1
};

// Horse sprite sheets
const horseSpriteSheets = {
  horse1: '/assets/blueHorse.png',
  horse2: '/assets/greenHorse.png',
  horse3: '/assets/redHorse.png',
  horse4: '/assets/yellowHorse.png',
};

// Horse names and colors
const horses = [
  { id: 'horse1', name: 'Thunder', color: '#00008B', laneColor: '#A0522D' },
  { id: 'horse2', name: 'Lightning', color: '#006400', laneColor: '#dba556' },
  { id: 'horse3', name: 'Storm', color: '#8B0000', laneColor: '#A0522D' },
  { id: 'horse4', name: 'Blaze', color: '#FFD700', laneColor: '#dba556' },
];

const HorseRacingGame = () => {
  // Game states
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [balance, setBalance] = useState(1000);
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  const [selectedHorses, setSelectedHorses] = useState({});
  const [winner, setWinner] = useState(null);
  const [playerWon, setPlayerWon] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [raceTime, setRaceTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [selectedChip, setSelectedChip] = useState(null);
  // Refs
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const horsesRef = useRef([]);
  const animationFrameRef = useRef(null);
  const texturesRef = useRef({});
  const spriteFramesRef = useRef({});
  const timerRef = useRef(null);
  
  // Calculate total bet and possible win
  const totalBet = Object.values(selectedHorses).reduce((sum, bet) => sum + bet, 0);
  const possibleWinHorse = Object.keys(selectedHorses).length > 0 ? 
    Object.keys(selectedHorses)[Math.floor(Math.random() * Object.keys(selectedHorses).length)] : 
    null;
  const possibleWin = possibleWinHorse ? selectedHorses[possibleWinHorse] * 2 : 0;
  console.log(possibleWin)
  
  // Check orientation
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
    };
  }, []);
  
  // Timer effect
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setRaceTime(prevTime => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    
    return () => clearInterval(timerRef.current);
  }, [timerActive]);
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!isLandscape || !canvasRef.current) return;
    
    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#87CEEB'); // Sky blue background
    sceneRef.current = scene;
    
    // Setup camera
    const aspectRatio = window.innerWidth / window.innerHeight;
    const camera = new THREE.OrthographicCamera(
      -5 * aspectRatio, 5 * aspectRatio, 
      5, -5, 
      0.1, 1000
    );
    camera.position.z = 10;
    cameraRef.current = camera;
    
    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Set the correct color space for accurate color reproduction
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    canvasRef.current.innerHTML = '';
    canvasRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Add lighting - essential for materials that react to light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    
    // Optional: add directional light for more definition
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 5);
    scene.add(directionalLight);
    
    // Load textures
    const textureLoader = new THREE.TextureLoader();
    
    // Create race track
    createRaceTrack(textureLoader);
    
    // Load horse sprite sheets
    loadHorseSprites(textureLoader);
    
    // Handle window resize
    const handleResize = () => {
      const newAspectRatio = window.innerWidth / window.innerHeight;
      camera.left = -5 * newAspectRatio;
      camera.right = 5 * newAspectRatio;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
      if (renderer && renderer.domElement && canvasRef.current) {
        canvasRef.current.removeChild(renderer.domElement);
      }
      scene.clear();
    };
  }, [isLandscape]);
  
  // Create race track elements
  const createRaceTrack = () => {
    const scene = sceneRef.current;
    if (!scene) return;
    
    // Ground/grass
    const groundGeometry = new THREE.PlaneGeometry(20 + ((20*1.8)*3), 9);
    const groundMaterial = new THREE.MeshBasicMaterial({ color: '#05a80c' });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.z = -1;
    ground.position.y = -1;
    ground.position.x = 51;
    scene.add(ground);
    
    // Race track
    horses.forEach((horse, index) => {
      // Create lane
      const laneGeometry = new THREE.PlaneGeometry(20 + ((20*1.8)*3), 1.5);
      const laneMaterial = new THREE.MeshBasicMaterial({ color: horse.laneColor });
      const lane = new THREE.Mesh(laneGeometry, laneMaterial);
      lane.position.y = 1.2 - (index * 1.5);
      lane.position.z = -0.5;
      lane.position.x = 51;
      scene.add(lane);
      
      // Create lane dividers (white lines)
      if (index < horses.length - 1) {
        const dividerGeometry = new THREE.PlaneGeometry(20 + ((20*1.8)*3), 0.05);
        const dividerMaterial = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
        const divider = new THREE.Mesh(dividerGeometry, dividerMaterial);
        divider.position.y = 0.4 - (index * 1.5);
        divider.position.z = -0.4;
        divider.position.x = 51;
        scene.add(divider);
      }
    });

    const cloudImages = [
      '/assets/cloud1.png',
      '/assets/cloud2.png',
      '/assets/cloud3.png'
    ];
    
    // Create trees (simple 2D trees)
    const trackLength = 20 + ((20*1.8)*3); // 34 units
    const trackCenterX = 51;
    const treeCount = 70; // Increased from 15 to cover longer track
    const cloudCount = 30;

    let previousYPos = null;
    let previousZPos = -1; // Initial z position
    const minDistanceX = 1.0; // Minimum horizontal spacing between trees
    const placedTreePositions = []; // To track x positions of placed trees

    for (let i = 0; i < treeCount; i++) {
      // Try to find a valid x position that's not too close to others
      let xPos, attempts = 0, validPosition = false;
      
      while (!validPosition && attempts < 100) { // Limit attempts to prevent infinite loops
          attempts++;
          xPos = (Math.random() * trackLength) + (trackCenterX - trackLength/2);
          
          // Check if this xPos is far enough from all existing trees
          validPosition = placedTreePositions.every(pos => Math.abs(pos - xPos) >= minDistanceX);
      }
      
      // If we couldn't find a valid position after many attempts, skip this tree
      if (!validPosition) continue;
      
      placedTreePositions.push(xPos); // Remember this position
      
      const yPos = (Math.random() > 0.5) ? 3.8 : -5.0;
      
      // Choose a random tree image from the available assets
      const treeImages = [
          '/assets/trees1.png',
          '/assets/trees2.png',
          '/assets/trees3.png',
          '/assets/trees4.png',
          '/assets/trees5.png',
          '/assets/trees6.png'
      ];
      
      const randomTreeIndex = Math.floor(Math.random() * treeImages.length);
      const treeTexture = new THREE.TextureLoader().load(treeImages[randomTreeIndex]);
      treeTexture.colorSpace = THREE.SRGBColorSpace;
      
      // Randomize tree size
      const treeWidth = 2.5 + Math.random() * 0.4;
      const treeHeight = 2.6 + Math.random() * 0.5;
      
      const treeGeometry = new THREE.PlaneGeometry(treeWidth, treeHeight);
      const treeMaterial = new THREE.MeshBasicMaterial({ 
          map: treeTexture,
          transparent: true,
          alphaTest: 0.5,
          side: THREE.DoubleSide // Optional: makes trees visible from both sides
      });
      
      const tree = new THREE.Mesh(treeGeometry, treeMaterial);
      
      // Position the tree
      tree.position.x = xPos + 5.5;
      tree.position.y = yPos;
      
      // Adjust z position based on previous tree's y position
      if (previousYPos !== null) {
          if (yPos < previousYPos) {
              // Current tree is lower, so it should be behind
              tree.position.z = previousZPos + 0.5; // Smaller increment for smoother depth
          } else {
              // Current tree is higher or equal, keep same z position
              tree.position.z = previousZPos;
          }
      } else {
          // First tree
          tree.position.z = -1;
      }
      
      // Small random z-offset to prevent z-fighting for trees on same y-level
      tree.position.z += (Math.random() * 0.2 - 0.1);
      
      // Update previous positions for next iteration
      previousYPos = yPos;
      previousZPos = tree.position.z;
      
      scene.add(tree);
    }

    for (let i = 0; i < cloudCount; i++) {
      // Select a random cloud image
      const randomCloudIndex = Math.floor(Math.random() * cloudImages.length);
      const cloudTexture = new THREE.TextureLoader().load(cloudImages[randomCloudIndex]);
      
      // Make clouds much wider (5-10 units wide)
      const cloudWidth = 5 + Math.random() * 1; // Width between 5-10 units
      const cloudHeight = cloudWidth * 0.4; // Keep clouds flat (40% of width)
      
      const cloudGeometry = new THREE.PlaneGeometry(cloudWidth, cloudHeight);
      const cloudMaterial = new THREE.MeshBasicMaterial({ 
          map: cloudTexture,
          transparent: true,
          alphaTest: 0.5
      });
      
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      
      // Position cloud at y = 5, random x along track, and BEHIND trees (z < -0.5)
      cloud.position.x = (Math.random() * trackLength) + (trackCenterX - trackLength / 2);
      cloud.position.y = 4.8;
      cloud.position.z = -1; // Behind trees (trees are at z = -0.2)
      
      // Optional: Slow parallax movement (if you animate later)
      cloud.userData = { speed: 0.01 + Math.random() * 0.02 };
      
      scene.add(cloud);
    }
    
    // Fence top
    for (let i = 0; i < 2; i++) {
      const fenceGeometry = new THREE.PlaneGeometry(20 + ((20*1.8)*3), 0.1);
      const fenceMaterial = new THREE.MeshBasicMaterial({ color: 'gray' });
      const fence = new THREE.Mesh(fenceGeometry, fenceMaterial);
      fence.position.y = i === 0 ? 2.4 : -3.6;
      fence.position.z = i === 0 ? -0.3 : 1;
      fence.position.x = 51;
      scene.add(fence);
      
      // Fence posts
      for (let j = 0; j < 125; j++) {
        const postGeometry = new THREE.PlaneGeometry(0.1, 0.4);
        const postMaterial = new THREE.MeshBasicMaterial({ color: 'gray' });
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.x = -9.5 + (j * 1);
        post.position.y = i === 0 ? 2.2 : -3.8;
        post.position.z = -0.3;
        scene.add(post);
      }
    }
    
    // Start gate
    createStartGates();
    
    // Finish line
    const finishLineWidth = 0.5;
    const numTiles = 10;
    const tileHeight = 5.7 / numTiles;
    
    for (let i = 0; i < numTiles; i++) {
      const tileGeometry = new THREE.PlaneGeometry(finishLineWidth, tileHeight);
      const tileColor = i % 2 === 0 ? 'white' : 'black';
      const tileMaterial = new THREE.MeshBasicMaterial({ color: tileColor });
      const tile = new THREE.Mesh(tileGeometry, tileMaterial);
      tile.position.x = 7 + 103;
      tile.position.y = 1.6 - (i * tileHeight);
      tile.position.z = -0.3;
      scene.add(tile);
    }
    
    // Finish line flags
    const flagPoleGeometry = new THREE.PlaneGeometry(0.05, 1);
    const flagPoleMaterial = new THREE.MeshBasicMaterial({ color: '#C0C0C0' });
    
    const topFlagPole = new THREE.Mesh(flagPoleGeometry, flagPoleMaterial);
    topFlagPole.position.x = 7 + 103;
    topFlagPole.position.y = 2;
    topFlagPole.position.z = -0.2;
    scene.add(topFlagPole);
    
    const bottomFlagPole = new THREE.Mesh(flagPoleGeometry, flagPoleMaterial);
    bottomFlagPole.position.x = 7 + 103;
    bottomFlagPole.position.y = -3.2;
    bottomFlagPole.position.z = -0.2;
    scene.add(bottomFlagPole);
    
    const flagGeometry = new THREE.PlaneGeometry(0.4, 0.3);
    const flagMaterial = new THREE.MeshBasicMaterial({ color: '#FF0000' });
    
    const topFlag = new THREE.Mesh(flagGeometry, flagMaterial);
    topFlag.position.x = 7.2 + 103;
    topFlag.position.y = 2.3;
    topFlag.position.z = -0.1;
    scene.add(topFlag);
    
    const bottomFlag = new THREE.Mesh(flagGeometry, flagMaterial);
    bottomFlag.position.x = 7.2 + 103;
    bottomFlag.position.y = -2.9;
    bottomFlag.position.z = -0.1;
    scene.add(bottomFlag);
  };
  
  // Load horse sprites
  const loadHorseSprites = (textureLoader) => {
    horses.forEach((horse, index) => {
      // Load sprite sheet
      textureLoader.load(horseSpriteSheets[horse.id], (texture) => {
        texturesRef.current[horse.id] = texture;
        
        // Create sprite frames (11 frames in a horizontal strip)
        const frames = [];
        for (let i = 0; i < 11; i++) {
          const frame = texture.clone();
          frame.repeat.set(1/11, 1);
          frame.offset.x = i/11;
          frames.push(frame);
        }
        spriteFramesRef.current[horse.id] = frames;
        
        // Create horse sprite
        const spriteGeometry = new THREE.PlaneGeometry(2.5, 2.5);
        const spriteMaterial = new THREE.MeshBasicMaterial({
          map: frames[0],
          transparent: true
        });
        
        const sprite = new THREE.Mesh(spriteGeometry, spriteMaterial);
        sprite.position.x = -9;  // Start further left
        sprite.position.y = 1.7 - (index * 1.5);
        sprite.position.z = 0;
        
        sceneRef.current.add(sprite);
        
        // Store horse reference
        horsesRef.current[index] = {
          sprite,
          currentFrame: 0,
          frameCount: 11,
          animationSpeed: 0.2, // Base animation speed
          position: -9, // Starting X position further left
          speed: 0.008 + (Math.random() * 0.004), // Much slower base speed
          finished: false,
          fatigue: 0, // Add fatigue factor
          stamina: 0.6 + (Math.random() * 0.4), // Add stamina attribute (0.6-1.0)
          burstChance: 0.002 + (Math.random() * 0.003), // Chance for speed burst
          recoveryRate: 0.0003 + (Math.random() * 0.0002), // Recovery from fatigue
          raceProgress: 0, // Track race progress as percentage
          performanceProfile: Math.floor(Math.random() * 3) // 0: fast start, 1: consistent, 2: strong finish
        };
      });
    });
  };
  
  // Start the race
  const startRace = () => {
    if (gameStarted) return;
    
    setGameStarted(true);
    setGameFinished(false);
    setWinner(null);
    setPlayerWon(false);
    setShowConfetti(false);
    setRaceTime(0);
    setTimerActive(true);
    
    const scene = sceneRef.current;
    const gatesToOpen = [];
    
    scene.traverse((object) => {
      if (object.userData && object.userData.isGate) {
        gatesToOpen.push(object);
      }
    });
    
    const openGates = () => {
      let allGatesOpen = false;
      let openingFrames = 0;
      const maxOpeningFrames = 15; // Complete animation in 15 frames (1/4 second)
      
      const animateGateOpening = () => {
        openingFrames++;
        
        gatesToOpen.forEach(gate => {
          // Rotate gate to open position
          gate.rotation.y -= 0.15; // Each frame rotate a bit more
          
          // Also move slightly to simulate swinging open
          gate.position.x -= 0.005;
        });
        
        if (openingFrames < maxOpeningFrames) {
          requestAnimationFrame(animateGateOpening);
        } else {
          allGatesOpen = true;
          // After gates are open, remove them for cleaner scene
          setTimeout(() => {
            gatesToOpen.forEach(gate => {
              scene.remove(gate);
            });
            
            // Remove all gate parts with delay for a cleaner scene
            setTimeout(() => {
              const partsToRemove = [];
              scene.traverse((object) => {
                if (object.userData && object.userData.isGatePart) {
                  partsToRemove.push(object);
                }
              });
              partsToRemove.forEach(part => scene.remove(part));
            }, 10); // Remove parts after 2 seconds
          }, 50); // Remove gates after half second
          
          // Initialize horses after gates open
          initializeHorsesAndStartRace();
        }
      };
      
      // Start the gate opening animation
      animateGateOpening();
    };
    
    const initializeHorsesAndStartRace = () => {
      // Initialize horse attributes with balanced randomness
      const baseSpeedMin = 0.01;
      const baseSpeedMax = 0.03;
      
      horsesRef.current.forEach((horse, idx) => {
        if (!horse) return;
        
        // Reset position and stats
        horse.position = -9;
        horse.sprite.position.x = -9;
        horse.finished = false;
        horse.fatigue = 0;
        horse.raceProgress = 0;
        
        // Assign randomized attributes
        horse.speed = baseSpeedMin + (Math.random() * (baseSpeedMax - baseSpeedMin));
        horse.stamina = 5 + (Math.random() * 2); // 0.5-0.9
        horse.recoveryRate = 0.0003 + (Math.random() * 0.0003); // 0.0003-0.0006
        horse.burstChance = 0.02 + (Math.random() * 0.03); // 2%-5% chance for speed burst
        
        // Set performance profile (0: fast starter, 1: consistent, 2: strong finisher)
        horse.performanceProfile = Math.floor(Math.random() * 3);
        
        // Store base values for reference
        horse.baseSpeed = horse.speed;
        horse.baseAnimationSpeed = horse.animationSpeed;
      });
      
      // Start animation
      animateRace();
    };
    
    openGates();
  };
  
  // Animate the race
  const animateRace = () => {
    if (!horsesRef.current || horsesRef.current.length === 0) return;
  
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
          let speedVariation = (Math.random() - 0.5) * 0.8; // ±5%

          
          // Weaken variation if horse is tired
          const fatigueFactor = 1 - horse.fatigue * 2; // Lower = more fatigue = less variation
          speedVariation *= Math.max(0.2, fatigueFactor); // Cap it
      
          // Slight rubber banding for those behind
          if (distanceBehindLeader > 0.05 && horse.fatigue < 0.4) {
            speedVariation += 0.03; // small push
          }
      
          // Mid-race burst
          const inBurstZone = horse.raceProgress > 0.3 && horse.raceProgress < 0.8;
          let burstChance = 0.03 + horse.stamina * 0.001;

          if (horse.position === lastPlacePosition) {
            burstChance += 1; 
          }
      
          if (
            inBurstZone &&
            Math.random() < burstChance &&
            horse.fatigue < 0.25 // Only if not too tired
          ) {
            speedVariation += 0.2 + Math.random() * 0.05;
            horse.fatigue += 0.00005;
            console.log('Bursting!', "horse " + index, 'with speed', horse.speed);
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
          newSpeed *= (0.5 - horse.fatigue); // stronger slowdown now
      
          // Clamp speed
          horse.speed = Math.max(0.01, Math.min(0.025, newSpeed));
      
          // Animation speed sync
          horse.animationSpeed = horse.baseAnimationSpeed * (horse.speed / 0.02);
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
          const frameIndex = Math.floor(horse.currentFrame);
          const frames = spriteFramesRef.current[horses[idx]?.id];
          if (frames && frameIndex < frames.length) {
            horse.sprite.material.map = frames[frameIndex];
          }
  
          // Move horse
          if (!horse.finished) {
            horse.position += horse.speed;
            horse.sprite.position.x = horse.position;
  
            // Check if horse finished
            if (horse.position >= finishLine) {
              horse.finished = true;
              horse.sprite.position.x = finishLine;
              horse.animationSpeed = horse.baseAnimationSpeed; // Reset to normal speed
  
              if (!winnerDetermined) {
                winnerDetermined = true;
                announceWinner(horses[idx]);
                raceActive = false; // Pause entire race
              }
            }
          }
        }

        if (raceActive) {
          // Smooth camera follow - adjust the lerp factor (0.1) for faster/slower follow
          const targetX = maxPosition;
          cameraRef.current.position.x += (targetX - cameraRef.current.position.x) * 0.1;
          
          // Keep camera within reasonable bounds (optional)
          cameraRef.current.position.x = Math.max(startPosition, cameraRef.current.position.x);
          cameraRef.current.position.x = Math.min(finishLine - 5, cameraRef.current.position.x); // Keep some space at finish line
        }
  
        if (!horse.finished) {
          allFinished = false;
        }
      });
  
      // Continue animation if not all horses finished
      if (!allFinished) {
        animationFrameRef.current = requestAnimationFrame(updateRace);
      } else {
        setGameFinished(true);
      }
    };
  
    animationFrameRef.current = requestAnimationFrame(updateRace);
  };
  
  // Announce the winner
  const announceWinner = (winningHorse) => {
    setWinner(winningHorse);
    setGameFinished(true);
    
    if (selectedHorses[winningHorse.id]) {
      const winnings = selectedHorses[winningHorse.id] * 2;
      setBalance(prevBalance => prevBalance + winnings);
      setPlayerWon(true);
      setShowConfetti(true);
      
      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
    }
  };
  
  // Handle placing bets
  const openBetDialog = () => {
    if (gameStarted) return;
    setBetDialogOpen(true);
  };
  
  const closeBetDialog = () => {
    setBetDialogOpen(false);
  };
  
  

  // Create improved start gates
  const createStartGates = () => {
    const scene = sceneRef.current;
    if (!scene || !horses) return;
    
    // First remove any existing gates
    const objectsToRemove = [];
    scene.traverse((object) => {
      if (object.userData && (object.userData.isGate || object.userData.isGatePart)) {
        objectsToRemove.push(object);
      }
    });
    objectsToRemove.forEach(object => scene.remove(object));
    
    // Constants based on your track setup
    const startX = -7.9; // Same as horse starting position
    const laneWidth = 1.5; // From your lane setup
    const trackHeight = 6; // Total height of all lanes (4 lanes * 1.5 height)
    const trackTopY = 1.2; // Top lane position from your createRaceTrack()
    
    // Create the main gate structure
    // Gate base/platform
    const gatePlatformGeometry = new THREE.PlaneGeometry(0.2, trackHeight + 0.5);
    const gatePlatformMaterial = new THREE.MeshBasicMaterial({ color: '#555555' });
    const gatePlatform = new THREE.Mesh(gatePlatformGeometry, gatePlatformMaterial);
    gatePlatform.position.x = startX;
    gatePlatform.position.y = 0;
    gatePlatform.position.z = -0.4;
    scene.add(gatePlatform);
    gatePlatform.userData = { isGatePart: true };
    
    // Top beam
    const topBeamGeometry = new THREE.PlaneGeometry(0.3, 0.15);
    const topBeamMaterial = new THREE.MeshBasicMaterial({ color: '#777777' });
    const topBeam = new THREE.Mesh(topBeamGeometry, topBeamMaterial);
    topBeam.position.x = startX;
    topBeam.position.y = trackTopY + (laneWidth / 2) + 0.1; // Slightly above top lane
    topBeam.position.z = -0.3;
    scene.add(topBeam);
    topBeam.userData = { isGatePart: true };
    
    // Bottom beam
    const bottomBeam = new THREE.Mesh(topBeamGeometry.clone(), topBeamMaterial.clone());
    bottomBeam.position.x = startX;
    bottomBeam.position.y = trackTopY - (horses.length * laneWidth) + (laneWidth / 2) - 0.1; // Slightly below bottom lane
    bottomBeam.position.z = -0.3;
    scene.add(bottomBeam);
    bottomBeam.userData = { isGatePart: true };
    
    // Create individual stall gates for each horse lane
    horses.forEach((horse, i) => {
      const laneCenterY = trackTopY - (i * laneWidth);
      
      // Main gate door (slightly angled to show it's ready to open)
      const gateGeometry = new THREE.PlaneGeometry(0.3, laneWidth * 0.9); // Slightly smaller than lane width
      const gateMaterial = new THREE.MeshBasicMaterial({ color: '#C0C0C0' });
      const gate = new THREE.Mesh(gateGeometry, gateMaterial);
      
      // Position with slight rotation to show it's ready to spring open
      gate.position.x = startX;
      gate.position.y = laneCenterY;
      gate.position.z = 0;
      gate.rotation.y = -0.1; // Slight angle to simulate ready-to-open position
      scene.add(gate);
      gate.userData = { isGate: true, horseIndex: i };
      
      // Add gate frames (dividers between stalls)
      const frameGeometry = new THREE.PlaneGeometry(0.15, 0.1);
      const frameMaterial = new THREE.MeshBasicMaterial({ color: 'gray' });
      
      // Top divider for each stall (except for the top-most stall)
      if (i > 0) {
        const topDivider = new THREE.Mesh(frameGeometry, frameMaterial);
        topDivider.position.x = startX;
        topDivider.position.y = laneCenterY + (laneWidth / 2);
        topDivider.position.z = -0.1;
        scene.add(topDivider);
        topDivider.userData = { isGatePart: true };
      }
      
      // Bottom divider for each stall (except for the bottom-most stall)
      if (i < horses.length - 1) {
        const bottomDivider = new THREE.Mesh(frameGeometry, frameMaterial);
        bottomDivider.position.x = startX;
        bottomDivider.position.y = laneCenterY - (laneWidth / 2);
        bottomDivider.position.z = -0.1;
        scene.add(bottomDivider);
        bottomDivider.userData = { isGatePart: true };
      }
      
      // Add gate hinges
      const hingeGeometry = new THREE.CircleGeometry(0.04, 16);
      const hingeMaterial = new THREE.MeshBasicMaterial({ color: '#444444' });
      
      // Two hinges per gate
      const topHinge = new THREE.Mesh(hingeGeometry, hingeMaterial);
      topHinge.position.x = startX + 0.05;
      topHinge.position.y = laneCenterY + (laneWidth * 0.35);
      topHinge.position.z = 0.05;
      scene.add(topHinge);
      topHinge.userData = { isGatePart: true };
      
      const bottomHinge = new THREE.Mesh(hingeGeometry, hingeMaterial);
      bottomHinge.position.x = startX + 0.05;
      bottomHinge.position.y = laneCenterY - (laneWidth * 0.35);
      bottomHinge.position.z = 0.05;
      scene.add(bottomHinge);
      bottomHinge.userData = { isGatePart: true };
      
      // Add gate number plate
      const plateGeometry = new THREE.PlaneGeometry(0.25, 0.25);
      const plateMaterial = new THREE.MeshBasicMaterial({ color: 'gray' });
      const plate = new THREE.Mesh(plateGeometry, plateMaterial);
      plate.position.x = startX;
      plate.position.y = laneCenterY;
      plate.position.z = 0.1;
      scene.add(plate);
      plate.userData = { isGatePart: true };
      
      // Add gate number text (simulate this visually as we can't add actual text easily)
      const numberGeometry = new THREE.PlaneGeometry(0.15, 0.15);
      const numberMaterial = new THREE.MeshBasicMaterial({ color: horse.color }); // Use horse color for number
      const number = new THREE.Mesh(numberGeometry, numberMaterial);
      number.position.x = startX;
      number.position.y = laneCenterY;
      number.position.z = 0.11;
      scene.add(number);
      number.userData = { isGatePart: true };
    });
    
    // Add gate control tower
    const towerBaseGeometry = new THREE.PlaneGeometry(0.4, 0.6);
    const towerBaseMaterial = new THREE.MeshBasicMaterial({ color: '#555555' });
    const towerBase = new THREE.Mesh(towerBaseGeometry, towerBaseMaterial);
    towerBase.position.x = startX - 0.5;
    towerBase.position.y = trackTopY + (laneWidth / 2) + 0.5;
    towerBase.position.z = -0.2;
    scene.add(towerBase);
    towerBase.userData = { isGatePart: true };
    
    const towerTopGeometry = new THREE.PlaneGeometry(0.6, 0.4);
    const towerTopMaterial = new THREE.MeshBasicMaterial({ color: '#777777' });
    const towerTop = new THREE.Mesh(towerTopGeometry, towerTopMaterial);
    towerTop.position.x = startX - 0.5;
    towerTop.position.y = trackTopY + (laneWidth / 2) + 0.9;
    towerTop.position.z = -0.1;
    scene.add(towerTop);
    towerTop.userData = { isGatePart: true };
    
    // Add window to tower
    const windowGeometry = new THREE.PlaneGeometry(0.25, 0.2);
    const windowMaterial = new THREE.MeshBasicMaterial({ color: '#AADDFF' });
    const window = new THREE.Mesh(windowGeometry, windowMaterial);
    window.position.x = startX - 0.5;
    window.position.y = trackTopY + (laneWidth / 2) + 0.5;
    window.position.z = -0.1;
    scene.add(window);
    window.userData = { isGatePart: true };
  };
  
  const nextRound = () => {
    setGameStarted(false);
    setGameFinished(false);
    setWinner(null);
    setSelectedHorses({});
    setPlayerWon(false);
    setRaceTime(0);

    cameraRef.current.position.x = 0
    
    if (horsesRef.current) {
      horsesRef.current.forEach((horse) => {
        if (!horse) return;
        
        horse.position = -9;
        if (horse.sprite) {
          horse.sprite.position.x = -9;
        }
        horse.finished = false;
        horse.fatigue = 0;
        horse.raceProgress = 0;
        horse.stamina = 0;
        horse.speed = horse.baseSpeed;
        horse.animationSpeed = horse.baseAnimationSpeed;
        horse.currentFrame = 0;
      });
    }
    
    const scene = sceneRef.current;
    createStartGates();
  };
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const placeBetOnHorse = (horseId) => {
    if (!selectedChip) return;
    
    const chipValue = chipValues[selectedChip];
    
    if (balance - chipValue >= 0) {
      setSelectedHorses(prev => ({
        ...prev,
        [horseId]: (prev[horseId] || 0) + chipValue
      }));
      setBalance(prevBalance => prevBalance - chipValue);
    }
  };
  
  // Render bet dialog
  const renderBetDialog = () => {
    return (
      <Dialog 
        open={betDialogOpen} 
        onClose={closeBetDialog}
        PaperProps={{
          style: {
            backgroundColor: 'rgba(165, 19, 3, 1)',
            backgroundImage: 'linear-gradient(to bottom, rgba(180, 30, 10, 1), rgba(120, 10, 0, 0.9))',
            borderRadius: '16px',
            border: '4px solid #FFD700',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            margin: '0 auto',
            width: '70%',
            scrollbarWidth: 'none',
          }
        }}
      >
        <Box sx={{ 
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' }, 
          position: 'relative'
        }}>
          {/* Left content area */}
          <Box sx={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Title Area */}
            <Box sx={{
              padding: '10px 16px',
              borderBottom: '3px solid #FFD700',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              textAlign: 'center'
            }}>
              <Typography sx={{ 
                color: '#FFD700',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.6)',
                textTransform: 'uppercase'
              }}>
                Place Your Bets
              </Typography>
            </Box>
  
            {/* Horses Grid - now using 2 rows for better visibility */}
            <Box sx={{ 
              flex: 1,
              padding: '12px',
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, // Single column on mobile
              gap: '12px',
            }}>

              {horses.slice(0, 4).map((horse) => (
                <Box
                  key={horse.id}
                  onClick={() => selectedChip && placeBetOnHorse(horse.id)}
                  sx={{
                    backgroundColor: horse.color,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.15), rgba(0,0,0,0.3))',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: selectedHorses[horse.id] 
                      ? '3px solid #FFD700' 
                      : '2px solid rgba(255,255,255,0.3)',
                    boxShadow: selectedHorses[horse.id]
                      ? '0 0 15px rgba(255, 215, 0, 0.6)'
                      : '0 6px 12px rgba(0, 0, 0, 0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: selectedChip ? 'pointer' : 'default',
                    p: 2
                  }}
                >
                  {/* Horse Name and Odds in one row */}
                  <Box sx={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 1
                  }}>
                    <Typography sx={{ 
                      color: '#FFF',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)',
                      maxWidth: '70%'
                    }}>
                      {horse.name}
                    </Typography>
                    
                    {/* Odds Display */}
                    <Box sx={{
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: '#FFD700',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      border: '1px solid #FFD700',
                      boxShadow: '0 0 8px rgba(255,215,0,0.5)',
                    }}>
                      x2
                    </Box>
                  </Box>
                  
                  {/* Current Bet Display - always visible */}
                  <Box sx={{
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    padding: '6px',
                    borderRadius: '4px',
                    textAlign: 'center',
                    marginTop: 'auto'
                  }}>
                    <Typography sx={{ 
                      color: '#FFD700',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                    }}>
                      {selectedHorses[horse.id] > 0 ? `BET: ₱${selectedHorses[horse.id]}` : 'No bet placed'}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            
            {/* Bet Summary Section */}
            <Box sx={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              borderRadius: '10px',
              padding: '12px',
              margin: '12px',
              border: '2px solid rgba(255,215,0,0.5)'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ color: '#FFF', fontWeight: 'bold' }}>
                  TOTAL BET:
                </Typography>
                <Typography sx={{ color: '#FFD700', fontWeight: 'bold' }}>
                ₱{totalBet}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ color: '#FFF', fontWeight: 'bold' }}>
                  POSSIBLE WIN:
                </Typography>
                <Typography sx={{ color: '#4CAF50', fontWeight: 'bold' }}>
                ₱{possibleWin}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ color: '#FFF', fontWeight: 'bold' }}>
                  BALANCE:
                </Typography>
                <Typography sx={{ color: '#FFD700', fontWeight: 'bold' }}>
                ₱{balance}
                </Typography>
              </Box>
            </Box>

          </Box>
          
          {/* Chips panel - now horizontal on mobile */}
          <Box sx={{
            width: '15%',
            backgroundColor: 'rgba(0,0,0,0.45)',
            borderTop: { xs: '3px solid rgba(255,215,0,0.4)', sm: 'none' },
            borderLeft: { xs: 'none', sm: '3px solid rgba(255,215,0,0.4)' },
            display: 'flex',
            flexDirection: { xs: 'row', sm: 'column' },
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {Object.entries(casinoChips).map(([color, src]) => (
              <Box 
                key={color} 
                sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transform: selectedChip === color ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.15s ease',
                  position: 'relative', // Added for absolute positioning of text
                  mx: 1, // Added some horizontal margin
                  my: { xs: 0, sm: 1 } // Added some vertical margin
                }}
                onClick={() => setSelectedChip(color)}
              >
                <Box 
                  component="img" 
                  src={src} 
                  alt={`${color} chip`}
                  sx={{ 
                    width: 40,
                    filter: selectedChip === color ? 
                      'drop-shadow(0 0 8px rgba(255,215,0,0.9))' : 'none'
                  }}
                />
                <Typography 
                  sx={{ 
                    color: '#FFF', 
                    fontWeight: 'bold',
                    fontSize: '0.7rem',
                    textShadow: '0 0 4px rgba(0,0,0,0.9)',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none' // Makes the text non-interactive
                  }}
                >
                  ₱{chipValues[color]}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Dialog>
    );
  };
  
  // Render orientation warning
  const renderOrientationWarning = () => {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#000000',
          color: 'white',
          zIndex: 9999,
          p: 3
        }}
      >
        <Box sx={{ transform: 'rotate(90deg)', mb: 2 }}>
          <Box component="span" role="img" aria-label="phone" sx={{ fontSize: '3rem' }}>
            📱
          </Box>
        </Box>
        <Typography variant="h5" sx={{ textAlign: 'center' }}>
          Please rotate your device to landscape mode to play
        </Typography>
      </Box>
    );
  };
  
  // Winner announcement
  const renderWinnerAnnouncement = () => {
    if (!winner) return null;
    
    const didWin = selectedHorses[winner.id] !== undefined;
    
    return (
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          p: 4,
          borderRadius: 3,
          border: '4px solid #FFD700',
          textAlign: 'center',
          minWidth: 300,
          maxWidth: '80%',
          boxShadow: '0 0 30px rgba(255, 215, 0, 0.7)',
          zIndex: 1000
        }}
      >
        <Typography 
          variant="h3" 
          sx={{ 
            color: winner.color, 
            fontWeight: 'bold',
            mb: 2,
            textShadow: '0 0 10px rgba(255,255,255,0.5)'
          }}
        >
          {winner.name} WINS!
        </Typography>
        
        {didWin ? (
          <>
            <Typography variant="h5" sx={{ color: '#FFD700', mb: 2 }}>
              YOU WIN ${selectedHorses[winner.id] * 2}!
            </Typography>
            <Box 
              component="span" 
              role="img" 
              aria-label="celebration" 
              sx={{ fontSize: '3rem', display: 'block', mb: 2 }}
            >
              🎉
            </Box>
          </>
        ) : (
          <>
            <Typography variant="h5" sx={{ color: '#FFD700', mb: 2 }}>
              BETTER LUCK NEXT TIME!
            </Typography>
            <Box 
              component="span" 
              role="img" 
              aria-label="sad" 
              sx={{ fontSize: '3rem', display: 'block', mb: 2 }}
            >
              😔
            </Box>
          </>
        )}
        
        <Button
          variant="contained"
          onClick={nextRound}
          sx={{
            bgcolor: '#4CAF50',
            color: '#FFF',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            py: 1,
            px: 4,
            '&:hover': { bgcolor: '#45a049' }
          }}
        >
          NEXT ROUND
        </Button>
      </Box>
    );
  };
  
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
        {!isLandscape && renderOrientationWarning()}
        
        <Box ref={canvasRef} sx={{ width: '100%', height: '100%' }} />
        
        {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} />}
        
        {isLandscape && (
          <>
            {/* Top Bar */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bgcolor: 'rgba(0, 0, 0, 0.7)',
                p: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid #FFD700'
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#FFD700',
                  fontWeight: 'bold',
                  ml: 2
                }}
              >
                NotAVeryLongName
              </Typography>
              
              {gameStarted && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                    p: 1,
                    borderRadius: 2,
                    border: '2px solid #FFD700',
                    minWidth: 100,
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="h6" sx={{ color: '#FFF', fontWeight: 'bold' }}>
                    {formatTime(raceTime)}
                  </Typography>
                </Box>
              )}
              
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#FFD700',
                  fontWeight: 'bold',
                  mr: 2
                }}
              >
                Balance: ${balance}
              </Typography>
            </Box>
            
            {/* Action Buttons */}
            <Box
              sx={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}
            >
              <Button
                variant="contained"
                onClick={openBetDialog}
                disabled={gameStarted}
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
              
              <Button
                variant="contained"
                onClick={startRace}
                disabled={gameStarted || Object.keys(selectedHorses).length === 0}
                sx={{ 
                  bgcolor: '#2196F3', 
                  color: '#FFF',
                  fontWeight: 'bold',
                  '&:hover': { bgcolor: '#0b7dda' },
                  py: 1.5
                }}
              >
                Start Race
              </Button>
              
              <Button
                variant="contained"
                onClick={nextRound}
                disabled={!gameFinished}
                sx={{ 
                  bgcolor: '#FF9800', 
                  color: '#FFF',
                  fontWeight: 'bold',
                  '&:hover': { bgcolor: '#e68a00' },
                  py: 1.5
                }}
              >
                Next Round
              </Button>
            </Box>
            
            {gameFinished && renderWinnerAnnouncement()}
            
            {renderBetDialog()}
          </>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default HorseRacingGame;