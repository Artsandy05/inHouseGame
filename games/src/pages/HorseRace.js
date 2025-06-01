import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
import { playerStore } from '../utils/horseRace';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatTruncatedMoney, GameState, mapToArray } from '../utils/gameutils';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import HelpIcon from '@mui/icons-material/Help';
import CloseIcon from '@mui/icons-material/Close';
import { getGameHistory } from '../services/gameService';
import ArrowLeftIcon from '@mui/icons-material/ChevronLeft';
import ArrowRightIcon from '@mui/icons-material/ChevronRight';
import { Collapse } from '@mui/material';
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
  thunder: '/assets/blueHorse.webp',
  lightning: '/assets/greenHorse.webp',
  storm: '/assets/redHorse.webp',
  blaze: '/assets/yellowHorse.webp',
};

// Horse names and colors
const horses = [
  { id: 'thunder', name: 'Thunder', color: '#00008B', laneColor: '#A0522D' },
  { id: 'lightning', name: 'Lightning', color: '#006400', laneColor: '#dba556' },
  { id: 'storm', name: 'Storm', color: '#8B0000', laneColor: '#A0522D' },
  { id: 'blaze', name: 'Blaze', color: '#FFD700', laneColor: '#dba556' },
];
const horseColor = {
  thunder: '#00008B',
  lightning: '#006400',
  storm: '#8B0000',
  blaze: '#FFD700',
};

const sampleGameHistory = [
  { id: 1, winner: 'storm', date: '2023-05-15 14:30' },
  { id: 2, winner: 'thunder', date: '2023-05-15 14:15' },
  { id: 3, winner: 'blaze', date: '2023-05-15 14:00'},
  { id: 4, winner: 'lightning', date: '2023-05-15 13:45' },
  { id: 5, winner: 'storm', date: '2023-05-15 13:30' },
  { id: 6, winner: 'thunder', date: '2023-05-15 13:15' },
  { id: 7, winner: 'blaze', date: '2023-05-15 13:00'},
  { id: 8, winner: 'lightning', date: '2023-05-15 12:45' },
];

const encryptor = createEncryptor(process.env.REACT_APP_DECRYPTION_KEY);

const HorseRacingGame = () => {
  // Game states
  //const [gameFinished, setGameFinished] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [raceStarted, setRaceStarted] = useState(false);
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [raceTime, setRaceTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [selectedChip, setSelectedChip] = useState(null);
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  //const [raceFinished, setRaceFinished] = useState(false);
  const [gameHistory, setGameHistory] = useState(null);
  const [credits, setCredits] = useState(0);
  const [totalBets, setTotalBets] = useState(0);
  const [visible, setVisible] = useState(true);
  const [leftPosition, setLeftPosition] = useState('20px');
  const updatedBalance = Number(credits) - Number(totalBets);
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
    if(latestBalance){
      setCredits(latestBalance);
    }else{
      setCredits(urlUserDetails?.credits || localStorageUser?.userData?.data?.wallet?.balance);
    }
  }, [latestBalance]);

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
    if(gameState === 'WinnerDeclared'){
      setTimerActive(false);
      setRaceStarted(false);
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
  

  useEffect(() => {
    if(gameState === GameState.Closed){
      startRace();
    }
  }, [gameState]);

  useEffect(() => {
    if(horseStats){
      horsesRef.current.forEach((horse, idx) => {
        const stats = horseStats[idx];
        if (horse && stats) {
          // Update horse properties from WebSocket data
          horse.speed = Number(stats.speed);
          horse.finished = stats.finished;
          horse.stamina = Number(stats.stamina);
          horse.fatigue = stats.fatigue;
          horse.animationSpeed = stats.animationSpeed;
          horse.baseSpeed = stats.baseSpeed;
          horse.position = stats.position;
          horse.baseAnimationSpeed = stats.baseAnimationSpeed;
          horse.currentFrame = stats.currentFrame;
        }
      });
    }
  }, [horseStats]);

  

  const animationIdRef = useRef(null);
  const lastFrameTimeRef = useRef(0);

  const animateRace = useCallback((currentTime) => {
    if (!raceStarted) return;
  
    // Throttle to ~60fps to avoid excessive calculations
    if (currentTime - lastFrameTimeRef.current < 16) {
      animationIdRef.current = requestAnimationFrame(animateRace);
      return;
    }
    lastFrameTimeRef.current = currentTime;
  
    const startPosition = -9;
    const finishLine = 7 + 101.9;
    let maxPosition = 0;
    let raceFinished = false;
    
    // Single loop to check everything
    horsesRef.current.forEach((horse, idx) => {
      if (!horse) return;
  
      // Check if race is finished
      if (horse.position >= finishLine) {
        raceFinished = true;
      }
  
      // Update max position for camera
      if (horse.position > maxPosition && !horse.finished) {
        maxPosition = horse.position;
      }
  
      // Only animate if race is still active
      if (!raceFinished && !horse.finished) {
        // Update sprite frame
        const frameIndex = Math.floor(horse.currentFrame);
        const frames = spriteFramesRef.current[horses[idx]?.id];
        if (frames && frameIndex < frames.length) {
          horse.sprite.material.map = frames[frameIndex];
        }
  
        // Update position
        horse.sprite.position.x = horse.position;
      }
    });
  
    // Update camera with smooth interpolation
    if (cameraRef.current && maxPosition > 0) {
      const targetX = Math.max(startPosition, Math.min(finishLine - 5, maxPosition));
      cameraRef.current.position.x += (targetX - cameraRef.current.position.x) * 0.1;
    }
  
    // Continue animation loop if race is not finished
    if (!raceFinished) {
      animationIdRef.current = requestAnimationFrame(animateRace);
    }
  }, [raceStarted, horses]);

  useEffect(() => {
    if (raceStarted) {
      animationIdRef.current = requestAnimationFrame(animateRace);
    } else {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    }
  
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [raceStarted, animateRace]);

  

  useEffect(() => {
    if(gameState === GameState.NewGame){
      // Reset camera to starting position IMMEDIATELY
      if (cameraRef.current) {
        cameraRef.current.position.x = 0;
      }
      
      // Reset all race states
      //setRaceStarted(false);
      //setRaceFinished(false);
      setTimerActive(false);
      setRaceTime(0);
      
      // Reset horses to starting positions
      if (horsesRef.current && horsesRef.current.length > 0) {
        horsesRef.current.forEach((horse, index) => {
          if (horse && horse.sprite) {
            horse.sprite.position.x = -9; // Reset to starting position
            horse.position = -9;
            horse.finished = false;
            horse.currentFrame = 0;
            horse.fatigue = 0;
          }
        });
      }

      const scene = sceneRef.current;
      createStartGates();
    }
  }, [gameState]);

  

  const getOdds = (horseId) => {
    let str = "0.00";
    if (odds.has(horseId)) {
      return odds.get(horseId);
    }
    return Number(parseFloat(str).toFixed(2));
  };

  // Calculate total bet and possible win
  const totalBet = Array.from(slots.values()).reduce((sum, bet) => sum + bet, 0);
  const possibleWinHorse = slots.size > 0 ? 
    Array.from(slots.keys())[Math.floor(Math.random() * slots.size)] : 
    null;
  const possibleWin = possibleWinHorse ? slots.get(possibleWinHorse) * getOdds(possibleWinHorse) : 0;
  
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

  
  function truncateToTwoDecimals(num) {
      return Math.trunc(num * 100) / 100;
  }

  
  
  // Start the race
  const startRace = () => {
      if (gameState === GameState.NewGame) {
        return;
      }
      setTimerActive(true);
      setRaceStarted(true);
      
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
          }
        };
        
        // Start the gate opening animation
        animateGateOpening();
      };
      
      openGates();
  };

  

  


  
  // Handle placing bets
  const openBetDialog = () => {
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
  
  // const nextRound = () => {
    
  // };
  
  // Format time as MM:SS
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
  
  
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
        {!isLandscape && renderOrientationWarning()}
        {gameState === GameState.WinnerDeclared && renderWinnerDialog()}
        
        <Box ref={canvasRef} sx={{ width: '100%', height: '100%' }} />
        
        {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} />}
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

export default HorseRacingGame;