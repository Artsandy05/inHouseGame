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
  Divider,
} from '@mui/material';
import Confetti from 'react-confetti';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import createEncryptor from '../utils/createEncryptor';
import { playerStore } from '../utils/boatRace';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatTruncatedMoney, GameState, mapToArray } from '../utils/gameutils';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import HelpIcon from '@mui/icons-material/Help';
import CloseIcon from '@mui/icons-material/Close';
import { getAllGameHistory, getGameHistory } from '../services/gameService';
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
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [gameHistory, setGameHistory] = useState(null);
  const [totalBets, setTotalBets] = useState(0);
  const [credits, setCredits] = useState(0);
  const [visible, setVisible] = useState(true);
  const [leftPosition, setLeftPosition] = useState('20px');
  const updatedBalance = Number(credits) - Number(totalBets);
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

  const { gameState, setPlayerInfo, sendMessage, countdown, slots,setSlots,odds, allBets, winningBall, setUserInfo, topPlayers, voidMessage, boatStats, latestBalance } = playerStore();
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
    const fetchGameHistory = async () => {
      try {
        const response = await getGameHistory('boatRace');
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

  useEffect(() => {
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
  }, [boatStats]);
  

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

    if(cameraRef.current){
      cameraRef.current.position.x = 0;
    }
    
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
    if(!credits){
      alert("No Credits");
      return;
    }
    
    const chipValue = chipValues[selectedChip];
    if ((updatedBalance - Number(chipValue)) < 0) {
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
        backgroundColor: '#1a1a2e',
        backgroundImage: 'linear-gradient(to bottom, #16213e, #0f3460)',
        borderTop: '3px solid yellow',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
        boxShadow: '0 -4px 15px rgba(0, 0, 0, 0.7)',
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
          background: 'repeating-linear-gradient(90deg, yellow, yellow 6px, transparent 6px, transparent 12px)',
        }
      }}
    >
      {/* Close Button */}
      <Box 
        onClick={closeBetDialog}
        sx={{
          height: '28px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          backgroundColor: 'rgba(233, 69, 96, 0.15)',
          borderBottom: '1px solid rgba(233, 69, 96, 0.3)',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(233, 69, 96, 0.25)',
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
            color: 'yellow',
            fontSize: '16px',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          ▼
          <Typography sx={{
            color: 'inherit',
            fontSize: '0.6rem',
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            mt: '-4px'
          }}>
            CLOSE
          </Typography>
        </Box>
      </Box>
      
      {/* Main content area - two columns */}
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
          borderRight: '1px solid rgba(233, 69, 96, 0.2)',
          padding: '6px'
        }}>
          {/* Game Status */}
          <Box sx={{
            padding: '4px 10px',
            backgroundColor: '#0f3460',
            borderBottom: '1px solid yellow',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: '6px',
            borderRadius: '4px'
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <Box sx={{
                backgroundColor: gameState === GameState.LastCall ? '#ff9a3c' : 
                                gameState === GameState.Open ? '#06d6a0' : '#ef4565',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                boxShadow: '0 0 5px currentColor',
                flexShrink: 0
              }} />
              
              <Typography sx={{
                color: '#fff',
                fontFamily: "'Roboto Condensed', sans-serif",
                fontWeight: 700,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                STATUS: <span style={{ color: 'yellow' }}>{gameState}</span>
              </Typography>
            </Box>
            
            <Box sx={{
              backgroundColor: '#0a1929',
              border: '1px solid yellow',
              borderRadius: '4px',
              padding: '2px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              <Box component="span" sx={{
                color: countdown <= 10 ? '#ef4565' : countdown <= 30 ? '#ff9a3c' : '#06d6a0',
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
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
                fontSize: '0.8rem',
                color: countdown <= 10 ? '#ef4565' : countdown <= 30 ? '#ff9a3c' : '#06d6a0',
              }}>
                {formatTime(countdown)}
              </Typography>
            </Box>
          </Box>

          {/* Title Area */}
          <Box sx={{
            padding: '5px',
            borderBottom: '1px solid yellow',
            backgroundColor: '#0a1929',
            textAlign: 'center',
            mb: '6px',
            borderRadius: '4px'
          }}>
            <Typography sx={{ 
              color: 'yellow',
              fontSize: '0.9rem',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)',
              textTransform: 'uppercase',
              letterSpacing: '1px'
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
            gap: '6px',
            overflow: 'hidden'
          }}>
            {boats.slice(0, 4).map((boat) => (
              <Box
                key={boat.id}
                onClick={() => isBettingAllowed && selectedChip && placeBetOnBoat(boat.id)}
                sx={{
                  backgroundColor: boat.color,
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.1), rgba(0,0,0,0.2))',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: slots.has(boat.id) 
                    ? '2px solid yellow' 
                    : '1px solid rgba(255,255,255,0.15)',
                  boxShadow: slots.has(boat.id)
                    ? '0 0 8px rgba(233, 69, 96, 0.5)'
                    : '0 2px 3px rgba(0, 0, 0, 0.2)',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: isBettingAllowed && selectedChip ? 'pointer' : 'default',
                  opacity: isBettingAllowed ? 1 : 0.7,
                  p: '4px',
                  transition: 'all 0.2s ease',
                  '&:hover': isBettingAllowed && selectedChip ? {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 3px 6px rgba(0,0,0,0.3)'
                  } : {}
                }}
              >
                {/* Boat Name and Odds */}
                <Box sx={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  mb: 0.1
                }}>
                  <Typography sx={{ 
                    color: '#FFF',
                    fontFamily: "'Roboto Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: '0.85em',
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)',
                    maxWidth: '70%'
                  }}>
                    {boat.name.toUpperCase() + ' BOAT'}
                  </Typography>
                  
                  <Box sx={{
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    color: 'yellow',
                    fontWeight: 600,
                    fontSize: '0.65rem',
                    borderRadius: '3px',
                    padding: '1px 3px',
                    border: '1px solid yellow',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    x{truncateToTwoDecimals(getOdds(boat.id))}
                  </Box>
                </Box>
                
                {/* Total bets */}
                <Box sx={{
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  borderRadius: '3px',
                  padding: '2px 3px',
                  border: '1px dashed rgba(233,69,96,0.2)',
                  mb: 0.3
                }}>
                  <Typography sx={{
                    color: '#FFF',
                    fontSize: '0.65rem',
                    fontFamily: "'Roboto Condensed', sans-serif",
                    fontWeight: 700,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span>TOTAL:</span>
                    <span style={{ 
                      color: 'yellow', 
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      padding: '1px 2px',
                      borderRadius: '2px',
                      fontSize: '0.65rem',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      ₱{allBets && allBets.has(boat.id) ? allBets.get(boat.id).toLocaleString() : '0'}
                    </span>
                  </Typography>
                </Box>
                
                {/* Current Bet */}
                <Box sx={{
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  padding: '2px',
                  borderRadius: '3px',
                  textAlign: 'center',
                  marginTop: 'auto',
                  border: slots.has(boat.id) ? '1px solid rgba(233,69,96,0.4)' : 'none',
                }}>
                  <Typography sx={{ 
                    color: slots.has(boat.id) ? '#06d6a0' : 'yellow',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {slots.has(boat.id) ? (
                      <>
                        <span style={{ marginRight: '3px', color: 'yellow' }}>💰</span>
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
                    borderRadius: '5px',
                  }}>
                    <Typography sx={{
                      color: 'yellow',
                      fontFamily: "'Roboto Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      padding: '1px 5px',
                      borderRadius: '2px',
                      border: '1px solid rgba(233,69,96,0.3)'
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
          width: '38%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: '6px',
          gap: '6px'
        }}>
          {/* Chips panel - 3x3 GRID */}
          <Grid container sx={{
            backgroundColor: '#0f3460',
            borderRadius: '6px',
            padding: '6px',
            border: '1px solid rgba(233,69,96,0.3)',
          }}>
            <Grid item xs={12}>
              <Typography sx={{
                color: 'yellow',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                textAlign: 'center',
                fontSize: '0.8rem',
                letterSpacing: '0.5px',
                mb: '3px'
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
                      transform: selectedChip === color && isBettingAllowed ? 'scale(1.08)' : 'scale(1)',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      pointerEvents: isBettingAllowed ? 'auto' : 'none',
                      borderRadius: '50%',
                      padding: '2px',
                      backgroundColor: selectedChip === color && isBettingAllowed ? 'rgba(233,69,96,0.15)' : 'transparent',
                      border: selectedChip === color && isBettingAllowed ? '1px solid rgba(233,69,96,0.5)' : 'none',
                      
                      '&:hover': isBettingAllowed ? {
                        transform: 'scale(1.08)',
                        boxShadow: '0 0 6px rgba(233,69,96,0.5)'
                      } : {}
                    }}
                    onClick={() => isBettingAllowed && setSelectedChip(color)}
                  >
                    <Box 
                      component="img" 
                      src={src} 
                      alt={`${color} chip`}
                      sx={{ 
                        width: '90%',
                        objectFit: 'contain',
                        filter: selectedChip === color && isBettingAllowed ? 
                          'drop-shadow(0 0 5px rgba(233,69,96,0.7))' : 'none',
                      }}
                    />
                    <Typography 
                      sx={{ 
                        color: '#FFF', 
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        padding: '1px 2px',
                        borderRadius: '4px',
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
            backgroundColor: '#0a1929',
            borderRadius: '6px',
            padding: '6px',
            border: '1px solid rgba(233,69,96,0.4)',
          }}>
            <Typography sx={{
              color: 'yellow',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              fontSize: '0.8rem',
              textAlign: 'center',
              mb: '4px',
              borderBottom: '1px solid rgba(233,69,96,0.2)',
              pb: '3px',
              letterSpacing: '0.5px'
            }}>
              BET SUMMARY
            </Typography>
            
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '3px'
            }}>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography sx={{ 
                  color: '#FFF', 
                  fontFamily: "'Roboto Condensed', sans-serif",
                  fontWeight: 700, 
                  fontSize: '0.65rem' 
                }}>
                  TOTAL BET
                </Typography>
                <Typography sx={{ 
                  color: 'yellow', 
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}>
                  ₱{totalBet.toLocaleString()}
                </Typography>
              </Box>
              
              <Box sx={{ 
                width: '1px',
                height: '20px',
                backgroundColor: 'rgba(233,69,96,0.3)'
              }} />
              
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography sx={{ 
                  color: '#FFF', 
                  fontFamily: "'Roboto Condensed', sans-serif",
                  fontWeight: 700, 
                  fontSize: '0.65rem' 
                }}>
                  POSSIBLE WIN
                </Typography>
                <Typography sx={{ 
                  color: '#06d6a0', 
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}>
                  ₱{possibleWin.toLocaleString()}
                </Typography>
              </Box>
              
              <Box sx={{ 
                width: '1px',
                height: '20px',
                backgroundColor: 'rgba(233,69,96,0.3)'
              }} />
              
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography sx={{ 
                  color: '#FFF', 
                  fontFamily: "'Roboto Condensed', sans-serif",
                  fontWeight: 700, 
                  fontSize: '0.65rem' 
                }}>
                  BALANCE
                </Typography>
                <Typography sx={{ 
                  color: 'yellow', 
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                  fontSize: '0.85rem',
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
            🚤 BOAT RACE GUIDE
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
              <li>Bet on which boat you think will win the race</li>
              <li>Each boat has different odds (multiplier) based on its total bets</li>
              <li>You can bet on multiple boats in a single race</li>
              <li>Betting closes when the countdown timer reaches zero</li>
              <li>Watch the exciting race animation after betting closes</li>
              <li>If your boat wins, you get your bet multiplied by the odds</li>
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
              After the race finishes, the winning boat will be announced and the top 3 players with the highest payouts will be displayed.
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
    // Calculate boat statistics from history
    const calculateBoatStats = () => {
      const stats = {
        red: { wins: 0, percentage: 0 },
        blue: { wins: 0, percentage: 0 },
        green: { wins: 0, percentage: 0 },
        yellow: { wins: 0, percentage: 0 },
        total: gameHistory.length
      };
      
      gameHistory.forEach(game => {
        stats[game.zodiac].wins++;
      });
      
      Object.keys(stats).forEach(color => {
        if (color !== 'total') {
          stats[color].percentage = Math.round((stats[color].wins / stats.total) * 100);
        }
      });
      
      return stats;
    };
    
    const boatStats = calculateBoatStats();
  
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
            WIN PERCENTAGE (LAST {boatStats.total} RACES)
          </Typography>
          
          <Grid container spacing={1}>
            {boats.map(boat => (
              <Grid item xs={3} key={boat.id}>
                <Box sx={{
                  backgroundColor: boat.color,
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
                    {boat.name.toUpperCase()}
                  </Typography>
                  <Typography sx={{
                    color: '#fff',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 800,
                    fontSize: '1rem',
                  }}>
                    {boatStats[boat.id].percentage}%
                  </Typography>
                  <Typography sx={{
                    color: 'rgba(255,255,255,0.7)',
                    fontFamily: "'Roboto Condensed', sans-serif",
                    fontWeight: 400,
                    fontSize: '0.6rem',
                  }}>
                    {boatStats[boat.id].wins} WINS
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
                borderLeft: `4px solid ${boatColor[game.zodiac]}`,
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
                    backgroundColor: boatColor[game.zodiac],
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
                    {game.zodiac} boat won
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
  
  // Winner announcement
  
  
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
                    color: 'white',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.5)' }
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: '#FFFFFF',  // White for better contrast
                    fontWeight: 'bold',
                    ml: 2,
                    fontFamily: '"Roboto Condensed", sans-serif',  // More compact font
                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',  // Adds depth
                    letterSpacing: '1px'  // More elegant spacing
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
                      bgcolor: '#0a1929',
                      p: '4px 12px',
                      borderRadius: '12px',
                      border: '2px solid #ef4565',
                      boxShadow: '0 0 10px rgba(239, 69, 101, 0.6)',
                      minWidth: 110,
                      animation: 'pulseClosed 1.5s infinite',
                      '@keyframes pulseClosed': {
                        '0%': { boxShadow: '0 0 10px rgba(239, 69, 101, 0.5)' },
                        '50%': { boxShadow: '0 0 18px rgba(239, 69, 101, 0.8)' },
                        '100%': { boxShadow: '0 0 10px rgba(239, 69, 101, 0.5)' }
                      }
                    }}
                  >
                    <Typography sx={{ 
                      color: '#FFF', 
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: '1.1rem',
                      textShadow: '0 0 6px rgba(239, 69, 101, 0.7)',
                      letterSpacing: '1px',
                      lineHeight: 1.1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}>
                      <span style={{ color: '#ef4565' }}>RACE IN:</span> 
                      <span style={{ 
                        fontFamily: "'JetBrains Mono', monospace", 
                        fontWeight: 600,
                        color: 'yellow'
                      }}>
                        {formatTime(raceTime)}
                      </span>
                    </Typography>
                  </Box>
                )}

                {/* Open/Last Call State - Shows Countdown */}
                {(gameState === GameState.Open || gameState === GameState.LastCall) && (
                  <Box
                    sx={{
                      bgcolor: '#0a1929',
                      p: '4px 12px',
                      borderRadius: '12px',
                      border: `2px solid ${gameState === GameState.LastCall ? '#ff9a3c' : '#06d6a0'}`,
                      boxShadow: `0 0 10px ${gameState === GameState.LastCall ? 'rgba(255, 154, 60, 0.6)' : 'rgba(6, 214, 160, 0.6)'}`,
                      minWidth: 110,
                      animation: gameState === GameState.LastCall ? 'pulseWarning 1.2s infinite' : 'none',
                      '@keyframes pulseWarning': {
                        '0%': { boxShadow: '0 0 10px rgba(255, 154, 60, 0.5)' },
                        '50%': { boxShadow: '0 0 18px rgba(255, 154, 60, 0.8)' },
                        '100%': { boxShadow: '0 0 10px rgba(255, 154, 60, 0.5)' }
                      }
                    }}
                  >
                    <Typography sx={{ 
                      color: gameState === GameState.LastCall ? '#ff9a3c' : '#06d6a0',
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: '1.1rem',
                      textShadow: `0 0 6px ${gameState === GameState.LastCall ? 'rgba(255, 154, 60, 0.7)' : 'rgba(6, 214, 160, 0.7)'}`,
                      letterSpacing: '1px',
                      lineHeight: 1.1
                    }}>
                      {gameState === GameState.LastCall ? 'LAST CALL!' : 'BETTING OPEN!'}
                    </Typography>
                    <Typography sx={{ 
                      color: 'yellow',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 600,
                      fontSize: '1rem',
                      textShadow: '0 0 8px rgba(233, 69, 96, 0.7)',
                      mt: 0.3,
                      lineHeight: 1
                    }}>
                      {formatTime(countdown)}
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#FFA500',  // Orange instead of gold
                  fontWeight: 'bold',
                  mr: 2,
                  fontFamily: '"Oswald", sans-serif',  // Bold, impactful font
                  backgroundColor: 'rgba(0,100,0,0.2)',  // Light green backdrop
                  px: 1.5,  // Horizontal padding
                  borderRadius: '4px',  // Rounded corners
                  borderLeft: '3px solid skyblue'  // Accent border
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

export default BoatRacingGame;