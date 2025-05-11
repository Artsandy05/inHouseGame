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
import createEncryptor from '../utils/createEncryptor';
import { playerStore } from '../utils/boatRace';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GameState, mapToArray } from '../utils/gameutils';

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

// Boat sprite sheets
const boatSpriteSheets = {
  blue: '/assets/blueboat.png',
  green: '/assets/greenboat.png',
  red: '/assets/redboat.png',
  yellow: '/assets/yellowboat.png',
};

// Boat names and colors
const boats = [
  { id: 'blue', name: 'blue', color: '#00008B', laneColor: '#A0522D' },
  { id: 'green', name: 'green', color: '#006400', laneColor: '#dba556' },
  { id: 'red', name: 'red', color: '#8B0000', laneColor: '#A0522D' },
  { id: 'yellow', name: 'yellow', color: '#FFD700', laneColor: '#dba556' },
];
const boatColor = {
  blue: '#00008B',
  green: '#006400',
  red: '#8B0000',
  yellow: '#FFD700',
};

const encryptor = createEncryptor(process.env.REACT_APP_DECRYPTION_KEY);

const BoatRacingGame = () => {
  // Game states
  const [gameStarted, setGameStarted] = useState(false);
  //const [gameFinished, setGameFinished] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [balance, setBalance] = useState(1000);
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  const [selectedBoats, setSelectedBoats] = useState({});
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
  const boatsRef = useRef([]);
  const animationFrameRef = useRef(null);
  const texturesRef = useRef({});
  const spriteFramesRef = useRef({});
  const timerRef = useRef(null);
  const waterTextureRef = useRef(null);
  const rippleObjectsRef = useRef([]);
  const floatingObjectsRef = useRef([]);
  const lastTimeRef = useRef(0);

  const { gameState, setPlayerInfo, sendMessage, countdown, slots,setSlots,odds, allBets, winningBall, setUserInfo, topPlayers, voidMessage, boatStats } = playerStore();
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
  

  
  

  useEffect(() => {
    if(userInfo){
      setUserInfo(userInfo.userData.data.user);
    }
  }, []);

  

  
  useEffect(() => {
    if(gameState === GameState.WinnerDeclared){
      setTimerActive(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
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

  useEffect(() => {
    if(gameState === GameState.Closed){
      startRace();
    }
  }, [gameState, boatsRef.current]);

  useEffect(() => {
    if(gameState === GameState.Open || gameState === GameState.NewGame){
      nextRound();
    }
  }, [gameState]);

  const getOdds = (boatId) => {
    let str = "0.00";
    if (odds.has(boatId)) {
      return odds.get(boatId);
    }
    return Number(parseFloat(str).toFixed(2));
  };

  // Calculate total bet and possible win
  const totalBet = Array.from(slots.values()).reduce((sum, bet) => sum + bet, 0);
  const possibleWinBoat = slots.size > 0 ? 
    Array.from(slots.keys())[Math.floor(Math.random() * slots.size)] : 
    null;
  const possibleWin = possibleWinBoat ? slots.get(possibleWinBoat) * getOdds(possibleWinBoat) : 0;
  
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
    
    // Create race track with water animation elements
    createRaceTrack(textureLoader);
    
    // Load boat sprite sheets
    loadBoatSprites(textureLoader);
    
    // Handle window resize
    const handleResize = () => {
      const newAspectRatio = window.innerWidth / window.innerHeight;
      camera.left = -5 * newAspectRatio;
      camera.right = 5 * newAspectRatio;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Enhanced animation loop with water effects
    const animate = (time) => {
      // Calculate time delta for smooth animation regardless of frame rate
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;
      
      // If we have a water texture, animate it
      if (waterTextureRef.current) {
        waterTextureRef.current.offset.x -= 0.00009 * deltaTime;
      }
    
      
      // Animate ripples
      if (rippleObjectsRef.current && rippleObjectsRef.current.length > 0) {
        rippleObjectsRef.current.forEach(ripple => {
          // Move ripple to the right (downstream)
          ripple.position.x += ripple.userData.speed * 0.3 * (deltaTime / 16);
          
          // Fade ripple in/out for a pulsing effect
          if (ripple.userData.fadingOut) {
            ripple.material.opacity -= ripple.userData.fadeSpeed * (deltaTime / 16);
            if (ripple.material.opacity <= 0.1) {
              ripple.userData.fadingOut = false;
            }
          } else {
            ripple.material.opacity += ripple.userData.fadeSpeed * (deltaTime / 16);
            if (ripple.material.opacity >= 0.4) {
              ripple.userData.fadingOut = true;
            }
          }
          
          // Reset ripple position when it goes off-screen
          const trackLength = 20 + ((20*1.8)*3);
          if (ripple.position.x > 51 + (trackLength/2)) {
            ripple.position.x = 51 - (trackLength/2);
            ripple.position.y = (Math.random() * 5) - 3.5;
          }
        });
      }
      
      
      
      animationFrameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    
    animate(0);
    
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
  // Replace the existing river code with this animated version
const createRaceTrack = () => {
  const scene = sceneRef.current;
  if (!scene) return;
  
  // Sky background
  const skyGeometry = new THREE.PlaneGeometry(20 + ((20*1.8)*3), 12);
  const skyMaterial = new THREE.MeshBasicMaterial({ color: '#87CEEB' });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  sky.position.z = -2;
  sky.position.y = -1;
  sky.position.x = 51;
  scene.add(sky);
  
  // Create water texture for animation
  const waterCanvasSize = 512;
  const waterCanvas = document.createElement('canvas');
  waterCanvas.width = waterCanvasSize;
  waterCanvas.height = waterCanvasSize;
  const waterCtx = waterCanvas.getContext('2d');
  
  // Create gradient background for water
  const gradient = waterCtx.createLinearGradient(0, 0, waterCanvasSize, 0);
  gradient.addColorStop(0, '#1E90FF');    // Dodger Blue
  gradient.addColorStop(0.3, '#4682B4');  // Steel Blue
  gradient.addColorStop(0.7, '#1E90FF');  // Dodger Blue
  //gradient.addColorStop(1, '#4682B4');    // Steel Blue
  
  waterCtx.fillStyle = gradient;
  waterCtx.fillRect(0, 0, waterCanvasSize, waterCanvasSize);
  
  // Add some ripple patterns
  waterCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  waterCtx.lineWidth = 2;
  
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * waterCanvasSize;
    const y = Math.random() * waterCanvasSize;
    const length = 30 + Math.random() * 50;
    
    waterCtx.beginPath();
    waterCtx.moveTo(x, y);
    waterCtx.lineTo(x + length, y + (Math.random() * 10 - 5));
    waterCtx.stroke();
  }
  
  // Create texture from canvas
  const waterTexture = new THREE.CanvasTexture(waterCanvas);
  waterTexture.wrapS = THREE.RepeatWrapping;
  waterTexture.wrapT = THREE.RepeatWrapping;
  waterTexture.repeat.set(5, 1);
  
  // Save the texture to be animated later
  waterTextureRef.current = waterTexture;
  
  // River/water with animated texture
  const riverGeometry = new THREE.PlaneGeometry(20 + ((20*1.8)*3), 5.5);
  const riverMaterial = new THREE.MeshBasicMaterial({ 
    map: waterTexture,
    transparent: true,
    opacity: 0.9
  });
  const river = new THREE.Mesh(riverGeometry, riverMaterial);
  river.position.z = -0.5;
  river.position.y = -1;
  river.position.x = 51;
  scene.add(river);
  
  // Add animated ripples
  rippleObjectsRef.current = [];
  for (let i = 0; i < 40; i++) {
    const rippleSize = 0.1 + Math.random() * 0.3;
    const rippleGeometry = new THREE.PlaneGeometry(rippleSize, rippleSize * 0.6);
    const rippleMaterial = new THREE.MeshBasicMaterial({ 
      color: '#FFFFFF',
      transparent: true, 
      opacity: 0.2 + Math.random() * 0.2
    });
    const ripple = new THREE.Mesh(rippleGeometry, rippleMaterial);
    
    // Random positions within the river
    const trackLength = 20 + ((20*1.8)*3);
    ripple.position.x = (Math.random() * trackLength) + (51 - (trackLength/2));
    ripple.position.y = (Math.random() * 5) - 3.5;
    ripple.position.z = -0.4;
    
    // Add ripple data for animation
    ripple.userData = {
      speed: 0.03 + Math.random() * 0.05,
      fadeSpeed: 0.005 + Math.random() * 0.01,
      fadingOut: false
    };
    
    rippleObjectsRef.current.push(ripple);
    scene.add(ripple);
  }
  
  // River banks (grass)
  const topBankGeometry = new THREE.PlaneGeometry(20 + ((20*1.8)*3), 2);
  const topBankMaterial = new THREE.MeshBasicMaterial({ color: '#05a80c' });
  const topBank = new THREE.Mesh(topBankGeometry, topBankMaterial);
  topBank.position.z = -0.5;
  topBank.position.y = 2.75;
  topBank.position.x = 51;
  scene.add(topBank);
  
  const bottomBankGeometry = new THREE.PlaneGeometry(20 + ((20*1.8)*3), 2);
  const bottomBankMaterial = new THREE.MeshBasicMaterial({ color: '#05a80c' });
  const bottomBank = new THREE.Mesh(bottomBankGeometry, bottomBankMaterial);
  bottomBank.position.z = -0.5;
  bottomBank.position.y = -4.75;
  bottomBank.position.x = 51;
  scene.add(bottomBank);
  
  // Add river edge transitions (sand/mud)
  const topEdgeGeometry = new THREE.PlaneGeometry(20 + ((20*1.8)*3), 0.3);
  const topEdgeMaterial = new THREE.MeshBasicMaterial({ color: '#967444' });
  const topEdge = new THREE.Mesh(topEdgeGeometry, topEdgeMaterial);
  topEdge.position.z = -0.45;
  topEdge.position.y = 1.9;
  topEdge.position.x = 51;
  scene.add(topEdge);
  
  const bottomEdgeGeometry = new THREE.PlaneGeometry(20 + ((20*1.8)*3), 0.3);
  const bottomEdgeMaterial = new THREE.MeshBasicMaterial({ color: '#967444' });
  const bottomEdge = new THREE.Mesh(bottomEdgeGeometry, bottomEdgeMaterial);
  bottomEdge.position.z = -0.45;
  bottomEdge.position.y = -3.9;
  bottomEdge.position.x = 51;
  scene.add(bottomEdge);
  
  

  // Rest of existing code (clouds, trees, etc.)
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

  // Trees, clouds, rocks, and finish line code remains the same...
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
    
    // Place trees only on riverbanks (top or bottom)
    const bankChoice = Math.random() > 0.5;
    const yPos = bankChoice ? 3.8 : -5.0;
    
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

  // Add some rocks/boulders along the riverbank
  for (let i = 0; i < 15; i++) {
    const rockSize = 0.1 + Math.random() * 0.2;
    const rockGeometry = new THREE.CircleGeometry(rockSize, 5); // Simple 2D rock shape
    const rockColor = Math.random() > 0.5 ? '#808080' : '#A9A9A9'; // Different gray shades
    const rockMaterial = new THREE.MeshBasicMaterial({ color: rockColor });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    
    // Position rocks along the river edges
    const isTopBank = Math.random() > 0.5;
    rock.position.x = (Math.random() * trackLength) + (trackCenterX - trackLength/2);
    rock.position.y = isTopBank ? 2 : -3.8 - (Math.random() * 0.4);
    rock.position.z = -0.3;
    
    scene.add(rock);
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
    cloud.position.z = -1.5; // Behind trees (trees are at z = -0.2)
    
    // Optional: Slow parallax movement (if you animate later)
    cloud.userData = { speed: 0.01 + Math.random() * 0.02 };
    
    scene.add(cloud);
  }
  
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
  
  // Load boat sprites
  const loadBoatSprites = (textureLoader) => {
    boats.forEach((boat, index) => {
      // Load sprite sheet
      textureLoader.load(boatSpriteSheets[boat.id], (texture) => {
        texturesRef.current[boat.id] = texture;
        
        // Create sprite frames (11 frames in a horizontal strip)
        const frames = [];
        for (let i = 0; i < 6; i++) {
          const frame = texture.clone();
          frame.repeat.set(1/6, 1);
          frame.offset.x = i/6;
          frames.push(frame);
        }
        spriteFramesRef.current[boat.id] = frames;
        
        // Create boat sprite
        const spriteGeometry = new THREE.PlaneGeometry(2.5, 1.9);
        const spriteMaterial = new THREE.MeshBasicMaterial({
          map: frames[0],
          transparent: true
        });
        
        const sprite = new THREE.Mesh(spriteGeometry, spriteMaterial);
        sprite.position.x = -9;  // Start further left
        sprite.position.y = 1.7 - (index * 1.5);
        sprite.position.z = 0;
        
        sceneRef.current.add(sprite);
        
        // Store boat reference
        boatsRef.current[index] = {
          sprite,
          currentFrame: 0,
          frameCount: 6,
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

  if (boatStats) {
    boatsRef.current.forEach((boat, idx) => {
      if(boat){
        boat.speed = Number(boatStats[idx].speed);
        boat.finished = boatStats[idx].finished;
        boat.stamina = Number(boatStats[idx].stamina);
        boat.fatigue = (boatStats[idx].fatigue);
        boat.animationSpeed = boatStats[idx].animationSpeed;
        boat.baseSpeed = boatStats[idx].baseSpeed;
        boat.position = boatStats[idx].position;
        boat.baseAnimationSpeed = boatStats[idx].baseAnimationSpeed;
      }
    });
  }
  function truncateToTwoDecimals(num) {
      return Math.trunc(num * 100) / 100;
  }

  
  // Start the race
  const startRace = () => {
    setGameStarted(true);
    setRaceTime(0);
    setTimerActive(true);
    
    const scene = sceneRef.current;
    

    animateRace();
  };
  
  // Animate the race
  const animateRace = () => {
    const startPosition = -9;
    const finishLine = 7 + 101.9;
    let allFinished = true;
    let raceActive = true;
    let raceFinished = false; 
  
    const updateRace = () => {
      allFinished = true;
      let maxPosition = 0;
  
      // First check if any boat has finished the race
      boatsRef.current.forEach(boat => {
        if (boat && boat.position >= finishLine && !raceFinished) {
          raceFinished = true;
          // When one boat finishes, we'll stop animation updates for all boats
        }
      });
  
      boatsRef.current.forEach((boat, idx) => {
        if(boat){
          // Update position tracking for camera
          if (boat.position > maxPosition && !boat.finished) {
            maxPosition = boat.position;
          }
  
          // Check if boat reached finish line
          if (boat.position >= finishLine) {
            boat.finished = true;
            boat.sprite.position.x = finishLine;
          }
  
          // Only animate if the race is still active (no boat has finished)
          if (!raceFinished) {
            // Update animation frame based on current speed
            if(boat.animationSpeed){
              boat.currentFrame = (boat.currentFrame + boat.animationSpeed * 1) % boat.frameCount;
            }
            
            const frameIndex = Math.floor(boat.currentFrame);
            const frames = spriteFramesRef.current[boats[idx]?.id];
            if (frames && frameIndex < frames.length) {
              boat.sprite.material.map = frames[frameIndex];
            }
    
            // Move boat if not finished
            if (!boat.finished) {
              if(boat.position) {
                boat.sprite.position.x = boat.position; 
              }
            }
          }
  
          // Track if all boats have finished
          if (!boat.finished) {
            allFinished = false;
          }
        }
      });
  
      // Smooth camera follow - adjust the lerp factor (0.1) for faster/slower follow
      if (raceActive) {
        const targetX = maxPosition;
        cameraRef.current.position.x += (targetX - cameraRef.current.position.x) * 0.1;
        
        // Keep camera within reasonable bounds (optional)
        cameraRef.current.position.x = Math.max(startPosition, cameraRef.current.position.x);
        cameraRef.current.position.x = Math.min(finishLine - 5, cameraRef.current.position.x); // Keep some space at finish line
      }
  
      // End the race if all boats finished
      if (allFinished) {
        raceActive = false;
      } else {
        // Continue animation if not all boats finished
        animationFrameRef.current = requestAnimationFrame(updateRace);
      }
    };
  
    animationFrameRef.current = requestAnimationFrame(updateRace);
  };
  
 
  
  // Handle placing bets
  const openBetDialog = () => {
    setBetDialogOpen(true);
  };
  
  const closeBetDialog = () => {
    setBetDialogOpen(false);
  };
  
  

  // Create improved start gates
  
  
  const nextRound = () => {
    setGameStarted(false);
    setWinner(null);
    setPlayerWon(false);
    setRaceTime(0);

    cameraRef.current.position.x = 0
    
    if (boatsRef.current) {
      boatsRef.current.forEach((boat) => {
        if (!boat) return;
        
        boat.position = -9;
        if (boat.sprite) {
          boat.sprite.position.x = -9;
        }
        boat.finished = false;
        boat.fatigue = 0;
        boat.raceProgress = 0;
        boat.stamina = 0;
        boat.speed = 0;
        boat.animationSpeed = 0;
        boat.currentFrame = 0;
      });
    }
    
    const scene = sceneRef.current;
  };
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const placeBetOnBoat = (boatId) => {
    if (!selectedChip) return;
    
    const chipValue = chipValues[selectedChip];

    if ((userInfo.userData.data.wallet.balance - parseFloat(chipValue)) < 0) {
      alert("Insufficient Balance");
      return;
    }

    const hasSlots = slots.has(boatId);

    if (hasSlots) {
      let currentValue = slots.get(boatId);
      slots.set(boatId, currentValue += parseFloat(chipValue));
    }else{
      slots.set(boatId, parseFloat(chipValue));
    }
    setSlots(new Map(slots));

    sendMessage(
      JSON.stringify({game: 'boatRace', slots: mapToArray(slots)})
    );
  };

  
  
  // Render bet dialog
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
          {/* Left Column - Boats */}
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
            
            {/* Boats Grid */}
            <Box sx={{ 
              flex: 1,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: '1fr 1fr',
              gap: '8px',
              overflow: 'hidden'
            }}>
              {boats.slice(0, 4).map((boat) => (
                <Box
                  key={boat.id}
                  onClick={() => isBettingAllowed && selectedChip && placeBetOnBoat(boat.id)}
                  sx={{
                    backgroundColor: boat.color,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1), rgba(0,0,0,0.2))',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: slots.has(boat.id) 
                      ? '2px solid #FFD700' 
                      : '1px solid rgba(255,255,255,0.2)',
                    boxShadow: slots.has(boat.id)
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
                  {/* boat Name and Odds */}
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
                      {boat.name}
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
                      x{truncateToTwoDecimals(getOdds(boat.id))}
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
                        ₱{allBets && allBets.has(boat.id) ? allBets.get(boat.id).toLocaleString() : '0'}
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
                    border: slots.has(boat.id) ? '1px solid rgba(255,215,0,0.4)' : 'none',
                  }}>
                    <Typography sx={{ 
                      color: slots.has(boat.id) ? '#4CAF50' : '#FFD700',
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {slots.has(boat.id) ? (
                        <>
                          <span style={{ marginRight: '4px', color: '#FFD700' }}>💰</span>
                          ₱{slots.get(boat.id).toLocaleString()}
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
                    ₱{balance.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
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
          {winningBall?.boatRace ? (
            <>
              <Box component="span" sx={{ color: boatColor[winningBall.boatRace] }}>
                {winningBall.boatRace.toUpperCase()}
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
  
  
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
        {!isLandscape && renderOrientationWarning()}
        {gameState === GameState.WinnerDeclared && renderWinnerDialog()}
        
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
                p: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
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
            </Box>
            
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

export default BoatRacingGame;