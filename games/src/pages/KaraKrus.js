import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Button, TextField, Box, Typography, Paper, Container, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Collapse, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ArrowBack, Celebration, ChevronLeft, ChevronRight, Close, HelpOutline, KeyboardArrowDown, KeyboardArrowLeft, KeyboardArrowRight, KeyboardArrowUp, MoodBad, MoreVert } from '@mui/icons-material';
import ReactConfetti from 'react-confetti';
import { playerStore } from "../utils/karakrus";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatTruncatedMoney, GameState } from '../utils/gameutils';
import createEncryptor from '../utils/createEncryptor';
import { getGameHistory } from '../services/gameService';
const encryptor = createEncryptor(process.env.REACT_APP_DECRYPTION_KEY);
const KaraKrus = () => {
  const [gameHistory, setGameHistory] = useState([]);
  const mountRef = useRef(null);
  const [balance, setBalance] = useState(1000);
  const [openAnnouncement, setOpenAnnouncement] = useState(false);
  const [betAmount, setBetAmount] = useState(0);
  const [openBetDialog, setOpenBetDialog] = useState(false);
  const [betType, setBetType] = useState(null);
  const [selectedSide, setSelectedSide] = useState(null);
  const [result, setResult] = useState(null);
  const [isWinner, setIsWinner] = useState(false);
  const [animationId, setAnimationId] = useState(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const coinRef = useRef(null);
  const handRef = useRef(null);
  const [coinFaceImg, setCoinFaceImg] = useState(null);
  const theme = useTheme();
  const { gameState, setPlayerInfo, sendMessage, countdown, slots, setSlots, odds, allBets, winningBall, setUserInfo, topPlayers, coinResult, animationDuration, voidMessage, latestBalance } = playerStore();
  const { connect } = playerStore.getState();
  const [searchParams] = useSearchParams();
  const userDetailsParam = searchParams.get('data');
  const [showControls, setShowControls] = useState(false);
  const [totalBet, setTotalBet] = useState(0);
  const [credits, setCredits] = useState(0);
  const updatedBalance = Number(credits) - Number(totalBet);
  let decrypted;

  const [showBettingSection, setShowBettingSection] = useState(true);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [voidMessageDialogOpen, setVoidMessageDialogOpen] = useState(false);
  const [showMechanics, setShowMechanics] = useState(false);
  const navigate = useNavigate();
  const historyItemsPerPage = 5;

  const handleHistoryPage = (direction) => {
    const maxPages = Math.ceil(gameHistory.length / historyItemsPerPage);
    if (direction === 'next' && historyPage < maxPages - 1) {
      setHistoryPage(prev => prev + 1);
    } else if (direction === 'prev' && historyPage > 0) {
      setHistoryPage(prev => prev - 1);
    }
  };
  const displayedHistory = gameHistory.slice(
    historyPage * historyItemsPerPage, 
    (historyPage + 1) * historyItemsPerPage
  );

  if(userDetailsParam){
    decrypted = encryptor.decryptParams(userDetailsParam);
  }
  
  const urlUserDetails = decrypted 
    ? decrypted
    : null;
    
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
      setTotalBet(total);
    }else{
      setTotalBet(0);
    }
  }, [slots]);

  useEffect(() => {
    if (gameState === GameState.NewGame || gameState === GameState.WinnerDeclared) {
      setTotalBet(0);
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
    const fetchGameHistory = async () => {
      try {
        const response = await getGameHistory('karakrus');
        setGameHistory(response.data.winningBalls);
      } catch (error) {
        console.error('Error fetching game history:', error);
      }
    };
  
    fetchGameHistory();
  }, [gameState]);

  useEffect(() => {
    let timer;
  
    if (voidMessage?.message === "Void Game!") {
      setVoidMessageDialogOpen(true);
    } else {
      timer = setTimeout(() => {
        setVoidMessageDialogOpen(false);
      }, 3000);
    }
  
    // Cleanup timeout if gameState changes before timeout finishes
    return () => clearTimeout(timer);
  }, [voidMessage]);

  

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
    if(gameState === GameState.Closed && coinResult && animationDuration){
      tossCoin();
    }
  }, [gameState, coinResult, animationDuration]);

 

  useEffect(() => {
    if (gameState === GameState.WinnerDeclared) {
      setOpenAnnouncement(true);
    } else {
      setOpenAnnouncement(false);
    }

  }, [gameState]);
  

  
  

  useEffect(() => {
    if(gameState === GameState.Open){
      startNextRound();
    }
  }, [gameState]);

  // Initialize Three.js scene
  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a2b3c);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    // Changed to top view position
    camera.position.y = 5; // Positioned high above the scene
    camera.position.z = 0; // Centered on z-axis
    camera.position.x = 0; // Centered on x-axis
    camera.lookAt(0, 0, 0); // Looking down at the origin/table
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Enhanced Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    directionalLight.shadow.bias = -0.001;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffeedd, 1.5, 100);
    pointLight.position.set(-3, 6, 5);
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.width = 1024;
    pointLight.shadow.mapSize.height = 1024;
    scene.add(pointLight);

    // Create realistic environment
    // Floor with alternating gray and light gray tiles
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    
    // Create a canvas for the checkerboard pattern
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    // Draw the checkerboard pattern
    const tileSize = 64; // Size of each tile
    for (let x = 0; x < canvas.width; x += tileSize) {
      for (let y = 0; y < canvas.height; y += tileSize) {
        // Alternate between gray and light gray
        context.fillStyle = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0 
          ? '#808080' : '#D3D3D3';
        context.fillRect(x, y, tileSize, tileSize);
      }
    }
    
    const floorTexture = new THREE.CanvasTexture(canvas);
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(4, 4);
    
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      map: floorTexture,
      roughness: 0.7,
      metalness: 0.1
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    scene.add(floor);

    // Add a wooden table instead of checkerboard
    const tableGeometry = new THREE.BoxGeometry(6, 0.2, 6);
    
    // Create a canvas for the wood texture
    const tableCanvas = document.createElement('canvas');
    tableCanvas.width = 512;
    tableCanvas.height = 512;
    const tableContext = tableCanvas.getContext('2d');
    
    // Create a wooden texture
    // Base color
    tableContext.fillStyle = '#8B4513'; // SaddleBrown - rich wood color
    tableContext.fillRect(0, 0, tableCanvas.width, tableCanvas.height);
    
    // Add wood grain
    tableContext.strokeStyle = '#5D2906'; // Darker brown for grain
    tableContext.lineWidth = 2;
    
    // Create random wood grain lines
    for (let i = 0; i < 40; i++) {
      tableContext.beginPath();
      const y = Math.random() * tableCanvas.height;
      const variance = 10 + Math.random() * 20;
      
      let x = 0;
      tableContext.moveTo(x, y);
      
      while (x < tableCanvas.width) {
        x += 10 + Math.random() * 30;
        const newY = y + (Math.random() * variance * 2 - variance);
        tableContext.lineTo(x, newY);
      }
      
      tableContext.stroke();
    }
    
    // Add some lighter highlights
    tableContext.strokeStyle = '#A0522D'; // Sienna - lighter wood tone
    tableContext.lineWidth = 1;
    
    for (let i = 0; i < 30; i++) {
      tableContext.beginPath();
      const y = Math.random() * tableCanvas.height;
      const variance = 5 + Math.random() * 10;
      
      let x = 0;
      tableContext.moveTo(x, y);
      
      while (x < tableCanvas.width) {
        x += 20 + Math.random() * 40;
        const newY = y + (Math.random() * variance * 2 - variance);
        tableContext.lineTo(x, newY);
      }
      
      tableContext.stroke();
    }
    
    const tableTexture = new THREE.CanvasTexture(tableCanvas);
    tableTexture.wrapS = tableTexture.wrapT = THREE.RepeatWrapping;
    tableTexture.repeat.set(2, 2);
    
    const tableMaterial = new THREE.MeshStandardMaterial({ 
      map: tableTexture,
      roughness: 0.7, 
      metalness: 0.1
    });
    
    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.y = -0.5;
    table.receiveShadow = true;
    scene.add(table);

    // Add table legs
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.8, 8);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x5D2906, // Match the darker wood grain
      roughness: 0.8
    });
    
    const positions = [
      [2.8, -0.9, 2.8],
      [-2.8, -0.9, 2.8],
      [2.8, -0.9, -2.8],
      [-2.8, -0.9, -2.8]
    ];
    
    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.castShadow = true;
      scene.add(leg);
    });

    // Removed stools/chairs as requested

    // Add backdrop with brick texture
    const backdropGeometry = new THREE.PlaneGeometry(20, 10);
    const backdropMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      roughness: 0.9
    });
    const backdrop = new THREE.Mesh(backdropGeometry, backdropMaterial);
    backdrop.position.z = -7;
    backdrop.position.y = 3;
    scene.add(backdrop);

    const createHand = () => {
      // Create main group
      const handGroup = new THREE.Group();
      
      // Materials with more realistic properties
      const skinMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFD8B1, // Skin color
        roughness: 0.8,
        metalness: 0.1,
        flatShading: false
      });
      
      // Forearm
      const armGeometry = new THREE.CylinderGeometry(0.22, 0.25, 1.6, 12);
      const arm = new THREE.Mesh(armGeometry, skinMaterial);
      arm.position.set(-0.8, 0, 0);
      arm.rotation.z = Math.PI / 2;
      arm.castShadow = true;
      handGroup.add(arm);
      
      // Wrist joint
      const wristGeometry = new THREE.SphereGeometry(0.23, 12, 12);
      const wrist = new THREE.Mesh(wristGeometry, skinMaterial);
      wrist.position.set(-0.05, 0, 0);
      wrist.scale.set(1, 0.9, 1.2);
      wrist.castShadow = true;
      handGroup.add(wrist);
      
      // Fist - main part (slightly larger and more rounded than a flat palm)
      const fistGeometry = new THREE.BoxGeometry(0.65, 0.75, 0.6);
      const fist = new THREE.Mesh(fistGeometry, skinMaterial);
      fist.position.set(0.35, 0, 0);
      
      // Round the edges of the fist by applying a small scale transformation
      const roundedFist = new THREE.Mesh(fistGeometry, skinMaterial);
      roundedFist.position.set(0.35, 0, 0);
      roundedFist.scale.set(1, 1, 0.95);
      roundedFist.castShadow = true;
      handGroup.add(roundedFist);
      
      
      
      
      
      
      
      // Thumb (tucked inside, only slightly visible at the top)
      const thumbGeometry = new THREE.CylinderGeometry(0.1, 0.09, 0.15, 8);
      const thumb = new THREE.Mesh(thumbGeometry, skinMaterial);
      // Position thumb slightly visible at the top of the fist
      thumb.position.set(0.3, 0.35, 0.32);
      thumb.rotation.x = Math.PI / 2;
      thumb.castShadow = true;
      handGroup.add(thumb);
      
      // Position the hand properly for coin tossing
      handGroup.position.set(10, 1, 0);

      
      
      return handGroup;
    };


    const hand = createHand();
    scene.add(hand);
    handRef.current = hand;

    // Create improved coin with realistic gold color and distinct sides
    const coinRadius = 1.2; // Increased from 1 to 1.2 for slightly larger coin
    const coinThickness = 0.18; // Increased from 0.15 to 0.18
    const coinGeometry = new THREE.CylinderGeometry(
      coinRadius, coinRadius, coinThickness, 32
    );
    
    // Enhanced gold material for the coin
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFD700, // More vibrant gold color
      metalness: 0.9,
      roughness: 0.2,
    });
    
    // Edge material with slight variation
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xDAA520, // Slightly darker gold for the edge
      metalness: 0.9,
      roughness: 0.1,
    });

    const coinMaterials = [
      edgeMaterial,              // edge/rim
      goldMaterial.clone(),      // heads side
      goldMaterial.clone(),      // tails side (same gold color)
    ];
    
    const coin = new THREE.Mesh(coinGeometry, coinMaterials);
    coin.castShadow = true;
    coin.receiveShadow = true;
    
    // Function to create coin sides and return the canvas for image capture
    // This code updates only the heads side design function in the original code

    const createCoinSide = (isFront, positionY) => {
      // Create canvas for the coin face
      const canvas = document.createElement('canvas');
      canvas.width = 1024; // High resolution for better clarity
      canvas.height = 1024;
      const context = canvas.getContext('2d');
      
      // Fill background with gold gradient
      const gradient = context.createRadialGradient(
        512, 512, 0,
        512, 512, 460
      );
      gradient.addColorStop(0, '#FFD700');
      gradient.addColorStop(0.7, '#FFD700');
      gradient.addColorStop(1, '#DAA520');
      
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(512, 512, 460, 0, Math.PI * 2);
      context.fill();
      
      // Draw outer ring
      context.strokeStyle = '#B8860B';
      context.lineWidth = 24;
      context.beginPath();
      context.arc(512, 512, 420, 0, Math.PI * 2);
      context.stroke();
      
      // Add different designs for heads vs tails
      if (isFront) {
        // Black base circle
        context.fillStyle = '#000';
        context.beginPath();
        context.arc(512, 512, 240, 0, Math.PI * 2);
        context.fill();
      
        // Gold head & shoulders (like Material UI avatar)
        context.fillStyle = '#FFD700';
        context.beginPath();
        // Head (circle)
        context.arc(512, 420, 150, 0, Math.PI * 2);
        // Shoulders (rectangle with rounded bottom)
        context.moveTo(362, 570);
        context.arcTo(362, 670, 462, 670, 30);
        context.lineTo(562, 670);
        context.arcTo(662, 670, 662, 570, 30);
        context.lineTo(662, 570);
        context.closePath();
        context.fill();
      
        // Add "HEADS" text
        context.font = 'Bold 100px Arial';
        context.textAlign = 'center';
        context.fillStyle = '#000';
        context.fillText("KARA", 512, 850);
      } else {
        // TAILS side - emblem design remains the same
        // Draw central emblem
        context.fillStyle = '#000';
        context.beginPath();
        context.arc(512, 512, 220, 0, Math.PI * 2);
        context.fill();
        
        // Draw star shape
        context.fillStyle = '#FFD700';
        context.beginPath();
        const starPoints = 8;
        const outerRadius = 190;
        const innerRadius = 80;
        
        for (let i = 0; i < starPoints * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (Math.PI * i) / starPoints;
          const x = 512 + radius * Math.sin(angle);
          const y = 512 + radius * Math.cos(angle);
          
          if (i === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }
        context.closePath();
        context.fill();
        
        // Add text "TAILS"
        context.font = 'Bold 120px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = '#000';
        context.fillText("KRUS", 512, 800);
      }
      
      const texture = new THREE.CanvasTexture(canvas);
      // Improve texture sharpness
      texture.anisotropy = 16;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        metalness: 0.8,
        roughness: 0.3
      });
      
      const geometry = new THREE.CircleGeometry(coinRadius * 0.99, 64);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = positionY;
      mesh.rotation.x = positionY > 0 ? -Math.PI/2 : Math.PI/2;
      
      // Return both the mesh and a data URL of the canvas for display in the UI
      return {
        mesh,
        imageUrl: canvas.toDataURL()
      };
    };
    
    // Store coin face images for display in results
    const headsCoin = createCoinSide(true, coinThickness/2 + 0.001);
    coin.add(headsCoin.mesh);
    
    const tailsCoin = createCoinSide(false, -coinThickness/2 - 0.001);
    coin.add(tailsCoin.mesh);
    
    // Store the coin face images globally for use in UI
    window.coinImages = {
      heads: headsCoin.imageUrl,
      tails: tailsCoin.imageUrl
    };
    
    coin.position.y = 0.7; // Changed from 0.5 to 0.7 to raise it a bit
    scene.add(coin);
    coinRef.current = coin;

    // Handle window resize
    const handleResize = () => {
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      const id = requestAnimationFrame(animate);
      setAnimationId(id);
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  const resetCoin = () => {
    if (coinRef.current) {
      coinRef.current.position.set(0, 0.7, 0);
      coinRef.current.rotation.set(0, 0, 0);
    }
    if (handRef.current) {
      handRef.current.position.set(10, 0.2, 0);
    }
  };

  function truncateToTwoDecimals(num) {
    return Math.trunc(num * 100) / 100;
  }

  

  const tossCoin = () => {
    
    setBalance(prevBalance => prevBalance - betAmount);
    
    resetCoin();
    
    const rotationX = Math.random() * 10 + 10;
    const rotationY = Math.random() * 5;
    const rotationZ = Math.random() * 5;
    
    const jumpHeight = 3 + Math.random() * 2;
    
    const startTime = Date.now();
    
    // Hand animation variables
    const handApproachDuration = animationDuration * 0.3;
    const handFlipDuration = 0;
    const handRetreatDuration = animationDuration * 0.2;
    
    const animateCoinToss = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = elapsed / animationDuration;
      
      if (progress < 1) {
        // Hand animation
        if (elapsed < handApproachDuration) {
          // Hand approaches the coin
          const handProgress = elapsed / handApproachDuration;
          handRef.current.position.x = 10 - handProgress * 10;
          handRef.current.rotation.z = 0;
        } else if (elapsed < handApproachDuration + handFlipDuration) {
          // Hand flips the coin
          const flipProgress = (elapsed - handApproachDuration) / handFlipDuration;
          handRef.current.position.x = 0;
          handRef.current.rotation.z = 0;
          
          // Start coin flip animation (original)
          if (progress < 0.3) {
            const upProgress = progress / 0.3;
            coinRef.current.position.y = 0.7 + jumpHeight * upProgress;
            coinRef.current.rotation.x = rotationX * upProgress * Math.PI * 2;
            coinRef.current.rotation.y = rotationY * upProgress * Math.PI * 2;
            coinRef.current.rotation.z = rotationZ * upProgress * Math.PI;
          }
        } else if (elapsed < handApproachDuration + handFlipDuration + handRetreatDuration) {
          // Hand retreats
          const retreatProgress = (elapsed - handApproachDuration - handFlipDuration) / handRetreatDuration;
          handRef.current.position.x = retreatProgress * 10;
          handRef.current.rotation.z = 0;
          
          // Continue original coin flip animation
          if (progress < 0.6) {
            const fallProgress = (progress - 0.3) / 0.3;
            coinRef.current.position.y = 0.7 + jumpHeight * (1 - fallProgress);
            coinRef.current.rotation.x = rotationX * progress * Math.PI * 2;
            coinRef.current.rotation.y = rotationY * progress * Math.PI * 2;
            coinRef.current.rotation.z = rotationZ * progress * Math.PI;
          }
        } else {
          const landProgress = (progress - 0.6) / 0.4;
          coinRef.current.position.y = 0.1 + (0.7 - 0.1) * (1 - landProgress);
          const targetX = coinResult === 'heads' 
            ? Math.PI * 2 * Math.round(rotationX) 
            : Math.PI * (2 * Math.round(rotationX) + 1);
          const currentX = coinRef.current.rotation.x;
          coinRef.current.rotation.x = currentX + (targetX - currentX) * landProgress;
          coinRef.current.rotation.y *= (1 - landProgress);
          coinRef.current.rotation.z *= (1 - landProgress);
        }
        
        requestAnimationFrame(animateCoinToss);
      } else {
        // Animation complete
        coinRef.current.position.y = 0.1;
        
        if (coinResult === 'heads') {
          coinRef.current.rotation.set(0.05, 0, 0);
        } else {
          coinRef.current.rotation.set(Math.PI - 0.05, 0, 0);
        }
        
        setResult(coinResult);
        setCoinFaceImg(window.coinImages[coinResult]);
        
        const won = selectedSide === coinResult;
        setIsWinner(won);
        
        if (won) {
          setBalance(prevBalance => prevBalance + (betAmount * 2));
        }
      }
    };
    
    animateCoinToss();
  };

  

  const startNextRound = () => {
    setResult(null);
    setSelectedSide(null);
    setCoinFaceImg(null);
    resetCoin();
  };

  const handleBetClick = (type) => {
    setBetType(type);
    setSelectedSide(type);
    setOpenBetDialog(true);
  };

  const handlePlaceBet = () => {
    if (betAmount > 0) {
      if (parseFloat(betAmount) < 5) {
        alert("Minimum bet amount is 5");
        return;
      }
      if(!credits){
        alert("No Credits");
        return;
      }
      
      if ((updatedBalance - parseFloat(betAmount)) < 0) {
        alert("Insufficient Balance");
        return;
      }
      const hasSlots = slots.has(betType);

      if (hasSlots) {
        let currentValue = slots.get(betType);
        slots.set(betType, currentValue += parseFloat(betAmount));
      } else {
        slots.set(betType, parseFloat(betAmount));
      }

      setSlots(new Map(slots));
      sendMessage(
        JSON.stringify({game: 'karakrus', slots: Array.from(slots.entries())})
      );
    }
    setOpenBetDialog(false);
    setBetAmount(0);
  };

  

  const handleClearBet = () => {
    setBetAmount(0);
  };

  const handleDialogClose = () => {
    setOpenBetDialog(false);
  };

  

  

  useEffect(() => {
    if ((gameState !== GameState.Open || gameState !== GameState.LastCall)) {
      setOpenBetDialog(false);
    }
  }, [gameState, setOpenBetDialog]);

  const getOdds = (betType) => {
    let str = "0.00";
    if (odds.has(betType)) {
      return odds.get(betType);
    }
    return Number(parseFloat(str).toFixed(2));
  };

  const formatWinnerAmount = (amount) => {
    return parseFloat(amount).toFixed(2);
  };

  const quickBetAmounts = [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];

  const capitalize = (string) => {
    return string ? string.charAt(0).toUpperCase() + string.slice(1) : '';
  };

  return (
    <Box sx={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      minHeight: '100vh',
      py: 3,
      position: 'relative',
      '&:before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        zIndex: 0
      }
    }}>
      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
        
        {/* Game Header */}
        <Box sx={{ 
          textAlign: 'center', 
          mb: 3,
          position: 'relative',
          '&:after': {
            content: '""',
            position: 'absolute',
            bottom: -10,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100px',
            height: '3px',
            background: 'linear-gradient(90deg, transparent, #c62828, transparent)'
          }
        }}>
          <Typography variant="h4" sx={{
            fontFamily: "'Cinzel Decorative', cursive",
            color: '#ffeb3b',
            textShadow: '0 0 10px rgba(255, 235, 59, 0.5)',
            letterSpacing: '2px',
            position: 'relative',
            display: 'inline-block',
            '&:before, &:after': {
              content: '""',
              position: 'absolute',
              top: '50%',
              width: '30px',
              height: '2px',
              background: 'linear-gradient(90deg, #c62828, transparent)'
            },
            '&:before': {
              left: '-40px'
            },
            '&:after': {
              right: '-40px',
              background: 'linear-gradient(90deg, transparent, #c62828)'
            }
          }}>
            KARA-KRUS
          </Typography>
          
          <Typography variant="body2" sx={{ 
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: '1px',
            mt: 1
          }}>
            Flip the coin and win big!
          </Typography>
        </Box>

        {/* Balance and Status Bar */}
        <Paper elevation={10} sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(40,0,0,0.7) 0%, rgba(80,0,0,0.7) 100%)',
          border: '1px solid rgba(255, 235, 59, 0.2)',
          boxShadow: '0 0 20px rgba(198, 40, 40, 0.3)',
          position: 'relative',
          overflow: 'hidden',
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #c62828, #ffeb3b, #c62828)'
          }
        }}>
          {/* Toggle button for controls */}
          <Box 
            onClick={() => setShowControls(!showControls)}
            sx={{
              height: '2px',
              background: 'rgba(255, 235, 59, 0.3)',
              borderRadius: 2,
              mx: '30%',
              mb: showControls ? 1 : 1,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(255, 235, 59, 0.6)'
              }
            }}
          />

          {/* Slide-down controls section */}
          <Collapse in={showControls}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 1,
              py: 1
            }}>
              <Button 
                onClick={() => window.history.back()} 
                startIcon={<ArrowBack />}
                sx={{
                  color: '#ffeb3b',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 235, 59, 0.1)'
                  }
                }}
              >
                Back
              </Button>
              
              <Button 
                onClick={() => setShowMechanics(true)}
                variant="outlined"
                size="small"
                sx={{
                  color: '#ffeb3b',
                  borderColor: 'rgba(255, 235, 59, 0.3)',
                  '&:hover': {
                    borderColor: '#ffeb3b',
                    backgroundColor: 'rgba(255, 235, 59, 0.1)'
                  },
                  fontSize: '0.75rem',
                  py: 0.5,
                  px: 1.5,
                  borderRadius: '20px'
                }}
                startIcon={<HelpOutline fontSize="small" />}
              >
                How to Play
              </Button>
            </Box>
          </Collapse>

          {/* Balance - Centered */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center',
            mb: 2 
          }}>
            <Chip 
              label={`${userInfo.userData.data.user.firstName.toUpperCase()} - BALANCE: ${formatTruncatedMoney(updatedBalance)}`} 
              sx={{ 
                background: 'rgba(0,0,0,0.5)',
                color: '#ffeb3b',
                fontSize: '1rem',
                py: 1.5,
                px: 2.5,
                fontWeight: 'bold',
                border: '1px solid rgba(255, 235, 59, 0.3)',
                boxShadow: '0 0 10px rgba(255, 235, 59, 0.1)'
              }}
            />
          </Box>

          {/* Game State and Countdown */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: (gameState !== GameState.Open || gameState !== GameState.LastCall) ? 'center' : 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1 
          }}>
            <Chip 
              label={gameState === GameState.Open ? 'BETTING OPEN' : gameState === GameState.LastCall ? 'LAST CALL' : 'CLOSED'} 
              color={gameState === GameState.Open ? 'success' : gameState === GameState.LastCall ? 'warning' : 'error'}
              sx={{ 
                fontWeight: 'bold',
                fontSize: '0.9rem',
                px: 2,
                boxShadow: '0 0 10px rgba(0,0,0,0.3)',
              }}
            />

            {countdown > 0 && (
              <Chip 
                label={`${countdown}s`} 
                sx={{ 
                  background: 'rgba(255,0,0,0.3)',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                  minWidth: '50px',
                  ml: 'auto'
                }}
              />
            )}
          </Box>
        </Paper>


        <Paper elevation={10} sx={{ 
          mb: 3, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(25,0,0,0.7) 0%, rgba(60,0,0,0.7) 100%)',
          border: '1px solid rgba(255, 235, 59, 0.2)',
          boxShadow: '0 0 20px rgba(198, 40, 40, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Toggle Button */}
          <Box sx={{ 
            display: 'flex',
            justifyContent: 'center',
            position: 'relative',
            py: 1,
            borderBottom: showBettingSection ? '1px solid rgba(255, 235, 59, 0.2)' : 'none',
            cursor: 'pointer',
            background: 'rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease'
          }}
          onClick={() => setShowBettingSection(!showBettingSection)}
          >
            <Typography variant="body1" sx={{ 
              color: '#ffeb3b',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              BETTING OPTIONS {showBettingSection ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </Typography>
          </Box>

          {/* Animating Collapse Component */}
          <Collapse in={showBettingSection} timeout="auto">
            <Box sx={{ p: 2 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 2, 
                position: 'relative',
                zIndex: 1
              }}>
                <Button 
                  onClick={() => handleBetClick('heads')}
                  disabled={gameState !== GameState.Open && gameState !== GameState.LastCall}
                  sx={{ 
                    width: '50%', 
                    py: 2,
                    background: slots.has('heads') 
                      ? 'linear-gradient(135deg, rgba(255,235,59,0.3) 0%, rgba(255,235,59,0.5) 100%)' 
                      : 'rgba(0,0,0,0.3)',
                    border: slots.has('heads') 
                      ? '2px solid #ffeb3b' 
                      : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: slots.has('heads') 
                      ? '0 0 15px rgba(255, 235, 59, 0.5)' 
                      : 'none',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      background: slots.has('heads') 
                        ? 'linear-gradient(135deg, rgba(255,235,59,0.4) 0%, rgba(255,235,59,0.6) 100%)' 
                        : 'rgba(0,0,0,0.4)',
                    },
                    '&:before': slots.has('heads') ? {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: 'linear-gradient(90deg, #ffeb3b, #c62828, #ffeb3b)'
                    } : {}
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%'
                  }}>
                    <Typography variant="h6" sx={{
                      color: slots.has('heads') ? '#ffeb3b' : 'white',
                      fontWeight: 'bold',
                      mb: 1,
                      textShadow: slots.has('heads') ? '0 0 5px rgba(255, 235, 59, 0.8)' : 'none'
                    }}>
                      KARA
                    </Typography>
                    
                    <Box sx={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.5)',
                      borderRadius: '8px',
                      p: 1,
                      mb: 1,
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      <Typography variant="caption" sx={{ 
                        display: 'block', 
                        color: 'rgba(255,255,255,0.8)',
                        fontWeight: 'bold'
                      }}>
                        Odds: {truncateToTwoDecimals(getOdds('heads'))}x
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        display: 'block', 
                        color: slots.has('heads') ? '#ffeb3b' : 'rgba(255,255,255,0.8)',
                        fontWeight: slots.has('heads') ? 'bold' : 'normal'
                      }}>
                        My bet: ₱{slots.get('heads') || '0.00'}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        display: 'block', 
                        color: 'rgba(255,255,255,0.8)'
                      }}>
                        All Bets: ₱{allBets?.has('heads') ? formatWinnerAmount(allBets.get('heads')) : '0.00'}
                      </Typography>
                    </Box>
                    
                    {slots.has('heads') && (
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: 'auto',
                        height: '20px',
                        background: '#ffeb3b',
                        borderRadius: '20%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 5px rgba(255, 235, 59, 0.8)'
                      }}>
                        <Typography variant="caption" sx={{ 
                          color: 'black',
                          fontWeight: 'bold',
                          fontSize: '0.6rem'
                        }}>
                          {slots.get('heads')}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Button>
                
                <Button 
                  onClick={() => handleBetClick('tails')}
                  disabled={gameState !== GameState.Open && gameState !== GameState.LastCall}
                  sx={{ 
                    width: '50%', 
                    py: 2,
                    background: slots.has('tails') 
                      ? 'linear-gradient(135deg, rgba(255,235,59,0.3) 0%, rgba(255,235,59,0.5) 100%)' 
                      : 'rgba(0,0,0,0.3)',
                    border: slots.has('tails') 
                      ? '2px solid #ffeb3b' 
                      : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: slots.has('tails') 
                      ? '0 0 15px rgba(255, 235, 59, 0.5)' 
                      : 'none',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      background: slots.has('tails') 
                        ? 'linear-gradient(135deg, rgba(255,235,59,0.4) 0%, rgba(255,235,59,0.6) 100%)' 
                        : 'rgba(0,0,0,0.4)',
                    },
                    '&:before': slots.has('tails') ? {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: 'linear-gradient(90deg, #ffeb3b, #c62828, #ffeb3b)'
                    } : {}
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%'
                  }}>
                    <Typography variant="h6" sx={{
                      color: slots.has('tails') ? '#ffeb3b' : 'white',
                      fontWeight: 'bold',
                      mb: 1,
                      textShadow: slots.has('tails') ? '0 0 5px rgba(255, 235, 59, 0.8)' : 'none'
                    }}>
                      KRUS
                    </Typography>
                    
                    <Box sx={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.5)',
                      borderRadius: '8px',
                      p: 1,
                      mb: 1,
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      <Typography variant="caption" sx={{ 
                        display: 'block', 
                        color: 'rgba(255,255,255,0.8)',
                        fontWeight: 'bold'
                      }}>
                        Odds: {truncateToTwoDecimals(getOdds('tails'))}x
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        display: 'block', 
                        color: slots.has('tails') ? '#ffeb3b' : 'rgba(255,255,255,0.8)',
                        fontWeight: slots.has('tails') ? 'bold' : 'normal'
                      }}>
                        My bet: ₱{slots.get('tails') || '0.00'}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        display: 'block', 
                        color: 'rgba(255,255,255,0.8)'
                      }}>
                        All Bets: ₱{allBets?.has('tails') ? formatWinnerAmount(allBets.get('tails')) : '0.00'}
                      </Typography>
                    </Box>
                    
                    {slots.has('tails') && (
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: 'auto',
                        height: '20px',
                        background: '#ffeb3b',
                        borderRadius: '20%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 5px rgba(255, 235, 59, 0.8)'
                      }}>
                        <Typography variant="caption" sx={{ 
                          color: 'black',
                          fontWeight: 'bold',
                          fontSize: '0.6rem'
                        }}>
                          {slots.get('tails')}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Button>
              </Box>
            </Box>
          </Collapse>
        </Paper>

        {/* 3D Coin Flip Scene */}
        <Paper elevation={10} sx={{ 
          mb: 3, 
          borderRadius: 3,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(25,0,0,0.7) 0%, rgba(60,0,0,0.7) 100%)',
          border: '1px solid rgba(255, 235, 59, 0.2)',
          boxShadow: '0 0 20px rgba(198, 40, 40, 0.3)',
          position: 'relative'
        }}>
          <Box 
            ref={mountRef} 
            sx={{ 
              width: '100%', 
              height: '320px',
              position: 'relative'
            }}
          />
          
          {/* Scene Border Effects */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            border: '2px solid transparent',
            borderImage: 'linear-gradient(45deg, #ffeb3b, #c62828, #ffeb3b) 1',
            boxShadow: 'inset 0 0 20px rgba(198, 40, 40, 0.5)'
          }} />
        </Paper>

        {/* History Panel Toggle Button - Always visible on the right edge */}
        {gameState !== 'Closed' && <Box
          sx={{
            position: 'fixed',
            right: historyPanelOpen ? '280px' : 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 100,
            transition: 'right 0.4s ease',
          }}
        >
          <Button
            onClick={() => setHistoryPanelOpen(!historyPanelOpen)}
            sx={{
              minWidth: '36px',
              height: '80px',
              borderRadius: historyPanelOpen ? '8px 0 0 8px' : '4px 0 0 4px',
              background: 'linear-gradient(135deg, #c62828 0%, #8e0000 100%)',
              color: '#ffeb3b',
              boxShadow: '-2px 0 15px rgba(0,0,0,0.5)',
              '&:hover': {
                background: 'linear-gradient(135deg, #d32f2f 0%, #9a0007 100%)',
              },
              border: '1px solid rgba(255, 235, 59, 0.3)',
              borderRight: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            {historyPanelOpen ? <ChevronRight /> : <ChevronLeft />}
          </Button>
        </Box>}
        
        {/* Sliding History Panel */}
        {gameState !== 'Closed' && <Box
          sx={{
            position: 'fixed',
            right: historyPanelOpen ? 0 : '-300px',
            top: 0,
            bottom: 0,
            width: '280px',
            background: 'linear-gradient(135deg, rgba(25,0,0,0.95) 0%, rgba(60,0,0,0.95) 100%)',
            zIndex: 99,
            transition: 'right 0.4s ease',
            boxShadow: '-5px 0 20px rgba(0,0,0,0.7)',
            borderLeft: '2px solid rgba(255, 235, 59, 0.3)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#c62828',
              borderRadius: '10px',
            }
          }}
        >
          {/* History Panel Header */}
          <Box sx={{
            p: 1.5,
            borderBottom: '1px solid rgba(255, 235, 59, 0.3)',
            background: 'rgba(0,0,0,0.7)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backdropFilter: 'blur(5px)'
          }}>
            <Typography variant="subtitle1" sx={{ 
              color: '#ffeb3b',
              fontFamily: "'Cinzel Decorative', cursive",
              textShadow: '0 0 5px rgba(255, 235, 59, 0.5)',
              letterSpacing: '0.5px',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}>
              GAME HISTORY
            </Typography>
            
            <IconButton
              onClick={() => setHistoryPanelOpen(false)}
              sx={{
                color: 'rgba(255,255,255,0.7)',
                '&:hover': {
                  color: '#ffeb3b',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                },
                padding: '4px',
                fontSize: '1rem'
              }}
            >
              <ChevronRight fontSize="inherit" />
            </IconButton>
          </Box>
          
          {/* History Content */}
          <Box sx={{ p: 1.5, flexGrow: 1 }}>
            {/* Pagination Controls */}
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1.5
            }}>
              <IconButton 
                onClick={() => handleHistoryPage('prev')} 
                disabled={historyPage === 0}
                sx={{ 
                  color: historyPage === 0 ? 'rgba(255,255,255,0.3)' : '#ffeb3b',
                  '&:hover': {
                    backgroundColor: 'rgba(255,235,59,0.1)'
                  },
                  padding: '4px',
                  fontSize: '1rem'
                }}
              >
                <KeyboardArrowLeft fontSize="inherit" />
              </IconButton>
              
              <Typography variant="caption" sx={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.75rem'
              }}>
                Page {historyPage + 1} of {Math.ceil(gameHistory.length / historyItemsPerPage)}
              </Typography>
              
              <IconButton 
                onClick={() => handleHistoryPage('next')} 
                disabled={historyPage >= Math.ceil(gameHistory.length / historyItemsPerPage) - 1}
                sx={{ 
                  color: historyPage >= Math.ceil(gameHistory.length / historyItemsPerPage) - 1 ? 'rgba(255,255,255,0.3)' : '#ffeb3b',
                  '&:hover': {
                    backgroundColor: 'rgba(255,235,59,0.1)'
                  },
                  padding: '4px',
                  fontSize: '1rem'
                }}
              >
                <KeyboardArrowRight fontSize="inherit" />
              </IconButton>
            </Box>
            
            {/* Game History List */}
            <Box sx={{ mb: 1.5 }}>
              {displayedHistory.map((item, index) => (
                <Box key={index} sx={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '6px',
                  p: 1,
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid rgba(255,255,255,0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    background: 'rgba(0,0,0,0.4)',
                    boxShadow: '0 0 8px rgba(198, 40, 40, 0.3)'
                  },
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: '2px',
                    background: item.zodiac === 'heads' ? '#ffeb3b' : '#c62828'
                  }
                }}>
                  {/* Result Circle */}
                  <Box sx={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: item.zodiac === 'heads'
                      ? 'linear-gradient(135deg, #ffeb3b, #c62828)' 
                      : 'linear-gradient(135deg, #c62828, #ffeb3b)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'black',
                    fontWeight: 'bold',
                    boxShadow: '0 0 8px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    marginRight: 1.5
                  }}>
                    {item.zodiac === 'heads' ? 'H' : 'T'}
                  </Box>
                  
                  {/* Result Details */}
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="caption" sx={{
                      color: '#ffeb3b',
                      fontWeight: 'bold',
                      display: 'block',
                      lineHeight: 1.2
                    }}>
                      {item.zodiac === 'heads' ? 'KARA' : 'KRUS'} WINS
                    </Typography>
                    
                    <Typography variant="caption" sx={{ 
                      color: 'rgba(255,255,255,0.7)',
                      display: 'block',
                      fontSize: '0.65rem',
                      lineHeight: 1.2
                    }}>
                      {new Date(item.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            
            {/* Statistics Section */}
            <Box sx={{ 
              mt: 2,
              pt: 1.5,
              borderTop: '1px solid rgba(255,255,255,0.1)'
            }}>
              <Typography variant="caption" sx={{
                color: '#ffeb3b',
                mb: 1,
                fontWeight: 'bold',
                letterSpacing: '0.5px',
                display: 'block',
                fontSize: '0.75rem'
              }}>
                GAME STATS
              </Typography>
              
              <Box sx={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '6px',
                p: 1,
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                {/* Calculate statistics from gameHistory */}
                {gameHistory.length > 0 && (
                  <>
                    <Box sx={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 0.5
                    }}>
                      <Typography variant="caption" sx={{ 
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '0.7rem'
                      }}>
                        KARA (Heads):
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#ffeb3b',
                        fontWeight: 'bold',
                        fontSize: '0.7rem'
                      }}>
                        {Math.round((gameHistory.filter(item => item.zodiac === 'heads').length / gameHistory.length) * 100)}%
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 0.5
                    }}>
                      <Typography variant="caption" sx={{ 
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '0.7rem'
                      }}>
                        KRUS (Tails):
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#ffeb3b',
                        fontWeight: 'bold',
                        fontSize: '0.7rem'
                      }}>
                        {Math.round((gameHistory.filter(item => item.zodiac === 'tails').length / gameHistory.length) * 100)}%
                      </Typography>
                    </Box>
                  </>
                )}
                
                <Box sx={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.5
                }}>
                  <Typography variant="caption" sx={{ 
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.7rem'
                  }}>
                    Total Games:
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: '#ffeb3b',
                    fontWeight: 'bold',
                    fontSize: '0.7rem'
                  }}>
                    {gameHistory.length}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
          
          {/* Footer */}
          <Box sx={{
            p: 1.5,
            borderTop: '1px solid rgba(255, 235, 59, 0.3)',
            background: 'rgba(0,0,0,0.7)',
            position: 'sticky',
            bottom: 0,
            backdropFilter: 'blur(5px)'
          }}>
            <Button 
              fullWidth
              variant="outlined"
              size="small"
              sx={{ 
                color: '#ffeb3b',
                borderColor: 'rgba(255, 235, 59, 0.3)',
                '&:hover': {
                  borderColor: '#ffeb3b',
                  background: 'rgba(255, 235, 59, 0.1)'
                },
                fontWeight: 'bold',
                fontSize: '0.75rem',
                py: 0.5,
                minHeight: '32px'
              }}
            >
              MY GAME HISTORY
            </Button>
          </Box>
        </Box>}


        {/* Announcement Dialog (keep existing) */}
        {openAnnouncement && (
          <Box
            sx={{
              position: 'absolute',
              top: 60,
              left: 0,
              right: 0,
              textAlign: 'center',
              zIndex: 10,
              padding: '0 16px',
            }}
          >
            {/* Main Winner Banner - Kara Krus Style */}
            <Box sx={{
              background: 'linear-gradient(135deg, rgba(25,0,0,0.95) 0%, rgba(60,0,0,0.95) 100%)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px',
              border: '3px solid #c62828',
              boxShadow: `
                0 0 15px rgba(198, 40, 40, 0.7),
                0 0 25px rgba(198, 40, 40, 0.4),
                inset 0 0 10px rgba(255, 255, 255, 0.1)`,
              position: 'relative',
              overflow: 'hidden',
              '&:before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #c62828, #ef5350, #c62828)',
              },
              '&:after': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '150px',
                height: '150px',
                backgroundImage: coinFaceImg ? `url(${coinFaceImg})` : (winningBall.karakrus === 'heads' ? 'url(/heads-icon.png)' : 'url(/tails-icon.png)'),
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                opacity: 0.1,
                zIndex: 0
              }
            }}>
              {/* Cross decoration */}
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                  linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
                zIndex: 0
              }} />
              
              <Typography
                variant="h3"
                sx={{
                  fontFamily: "'Cinzel Decorative', cursive",
                  fontSize: !winningBall.karakrus ? 20 : { xs: "2.5rem", sm: "3.5rem" },
                  color: "#ffeb3b",
                  textShadow: `
                    2px 2px 0 #c62828,
                    4px 4px 0 rgba(0, 0, 0, 0.5)`,
                  letterSpacing: '2px',
                  lineHeight: 1.2,
                  padding: '12px 24px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '8px',
                  display: 'inline-block',
                  position: 'relative',
                  zIndex: 1,
                  border: '2px solid rgba(255, 235, 59, 0.3)',
                  boxShadow: 'inset 0 0 10px rgba(255, 235, 59, 0.2)'
                }}
              >
                {winningBall.karakrus === 'heads' && 'KARA WINS!'}
                {winningBall.karakrus === 'tails' && 'KRUS WINS!'}
                {!winningBall.karakrus && 'CONGRATULATIONS WINNERS!'}
                <Box sx={{
                  position: 'absolute',
                  top: -15,
                  right: -15,
                  width: '50px',
                  height: '50px',
                  backgroundImage: coinFaceImg ? `url(${coinFaceImg})` : (winningBall.karakrus === 'heads' ? 'url(/heads-coin.png)' : 'url(/tails-coin.png)'),
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  filter: 'drop-shadow(0 0 5px gold)',
                  animation: 'float 3s ease-in-out infinite',
                  '@keyframes float': {
                    '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
                    '50%': { transform: 'translateY(-10px) rotate(10deg)' },
                  }
                }} />
              </Typography>
              
              {/* Coin flip animation */}
              <Box sx={{
                position: 'absolute',
                bottom: -20,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100px',
                height: '100px',
                backgroundImage: 'url(/spinning-coin.gif)',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                opacity: 0.6,
                zIndex: 0
              }} />
            </Box>

            {/* Top Players Section */}
            {topPlayers?.length > 0 && (
              <Box sx={{
                background: 'linear-gradient(135deg, rgba(40,0,0,0.9) 0%, rgba(80,0,0,0.9) 100%)',
                borderRadius: '12px',
                padding: '16px',
                border: '2px solid rgba(255, 235, 59, 0.3)',
                boxShadow: '0 0 15px rgba(198, 40, 40, 0.5)',
                maxWidth: '400px',
                margin: '0 auto',
                backdropFilter: 'blur(5px)',
                position: 'relative',
                overflow: 'hidden',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, #c62828, #ffeb3b, #c62828)'
                }
              }}>
                <Typography variant="h5" sx={{ 
                  color: '#ffeb3b', 
                  fontFamily: "'Cinzel', serif",
                  fontSize: { xs: "1.5rem", sm: "1.8rem" },
                  marginBottom: '12px',
                  letterSpacing: '1px',
                  textShadow: '2px 2px 3px rgba(0,0,0,0.8)',
                  position: 'relative',
                  display: 'inline-block',
                  padding: '0 10px',
                  '&:before, &:after': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    width: '30px',
                    height: '2px',
                    background: 'linear-gradient(90deg, #c62828, transparent)'
                  },
                  '&:before': {
                    left: '-30px'
                  },
                  '&:after': {
                    right: '-30px',
                    background: 'linear-gradient(90deg, transparent, #c62828)'
                  }
                }}>
                  TOP WINNERS
                </Typography>
                
                <Box sx={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '5px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#c62828',
                    borderRadius: '10px',
                  }
                }}>
                  {topPlayers.map((player, index) => {
                    const isCurrentUser = player.uuid === userInfo.userData.data.user.uuid;
                    return (
                      <Box key={player.uuid} sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 8px',
                        marginBottom: '8px',
                        borderRadius: '8px',
                        background: isCurrentUser 
                          ? 'linear-gradient(90deg, rgba(255,235,59,0.2) 0%, rgba(255,235,59,0.3) 100%)' 
                          : 'rgba(0,0,0,0.3)',
                        border: isCurrentUser ? '1px solid #ffeb3b' : '1px solid rgba(255,255,255,0.1)',
                        boxShadow: isCurrentUser ? '0 0 10px rgba(255,235,59,0.3)' : 'none',
                        position: 'relative'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{
                            width: '24px',
                            height: '24px',
                            background: isCurrentUser ? '#ffeb3b' : '#c62828',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '10px',
                            color: isCurrentUser ? '#000' : '#fff',
                            fontWeight: 'bold',
                            fontSize: '0.8rem',
                            boxShadow: '0 0 5px rgba(0,0,0,0.3)',
                            transform: 'rotate(45deg)',
                            '& > span': {
                              transform: 'rotate(-45deg)',
                              display: 'inline-block'
                            }
                          }}>
                            <span>{index + 1}</span>
                          </Box>
                          <Typography sx={{ 
                            color: isCurrentUser ? '#ffeb3b' : '#fff',
                            fontWeight: isCurrentUser ? 'bold' : 'normal',
                            fontFamily: "'Roboto Condensed', sans-serif",
                            fontSize: { xs: "1.1rem", sm: "1.3rem" },
                            letterSpacing: '0.5px',
                          }}>
                            {player.name} {isCurrentUser && <span style={{ color: '#c62828', fontSize: '0.8rem' }}>(YOU)</span>}
                          </Typography>
                        </Box>
                        
                        <Box sx={{
                          background: 'rgba(0,0,0,0.5)',
                          borderRadius: '12px',
                          padding: '4px 10px',
                          border: `1px solid ${isCurrentUser ? '#ffeb3b' : '#c62828'}`,
                          boxShadow: '0 0 5px rgba(0,0,0,0.3)',
                          minWidth: '80px',
                          textAlign: 'center'
                        }}>
                          <Typography sx={{ 
                            color: isCurrentUser ? '#ffeb3b' : '#fff',
                            fontWeight: 'bold',
                            fontFamily: "'Roboto Condensed', sans-serif",
                            fontSize: { xs: "1.1rem", sm: "1.3rem" },
                          }}>
                            +{player.prize.toFixed(2)}
                          </Typography>
                        </Box>
                        {
                          <ReactConfetti
                            width={window.innerWidth}
                            height={window.innerHeight}
                            recycle={false}
                            numberOfPieces={300}
                          />
                        }
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}
            {topPlayers?.some(player => player.uuid === userInfo.userData.data.user.uuid) && (
              <ReactConfetti
                width={window.innerWidth}
                height={window.innerHeight}
                recycle={false}
                numberOfPieces={500}
                gravity={0.2}
                initialVelocityY={15}
                style={{ position: 'fixed', top: 0, left: 0, zIndex: 1000 }}
              />
            )}
          </Box>
        )}

        {/* Bet Amount Dialog (keep existing but style it) */}
        {gameState !== 'Closed' && <Dialog 
          open={openBetDialog} 
          onClose={handleDialogClose}
          PaperProps={{
            sx: {
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              border: '1px solid rgba(255, 235, 59, 0.2)',
              boxShadow: '0 0 30px rgba(198, 40, 40, 0.5)',
              borderRadius: '12px',
              overflow: 'hidden',
              '&:before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #c62828, #ffeb3b, #c62828)'
              }
            }
          }}
        >
          <DialogTitle sx={{ 
            color: '#ffeb3b',
            background: 'rgba(0,0,0,0.3)',
            borderBottom: '1px solid rgba(255, 235, 59, 0.2)',
            textAlign: 'center',
            fontWeight: 'bold',
            letterSpacing: '1px'
          }}>
            PLACE BET FOR {betType === 'heads' ? 'KARA' : 'KRUS'}
          </DialogTitle>
          
          <DialogContent sx={{ py: 3 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Bet Amount"
              type="number"
              fullWidth
              variant="outlined"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255, 235, 59, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 235, 59, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#ffeb3b',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 235, 59, 0.7)',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#ffeb3b',
                },
              }}
            />
            
            <Typography variant="subtitle1" sx={{ 
              color: '#ffeb3b',
              mb: 2,
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              QUICK BET AMOUNTS
            </Typography>
            
            <Grid container spacing={1}>
              {quickBetAmounts.map((amount) => (
                <Grid item xs={4} key={amount}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => setBetAmount(amount)}
                    sx={{ 
                      py: 1,
                      color: '#ffeb3b',
                      borderColor: 'rgba(255, 235, 59, 0.3)',
                      '&:hover': {
                        borderColor: '#ffeb3b',
                        background: 'rgba(255, 235, 59, 0.1)'
                      }
                    }}
                  >
                    ₱{amount}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          
          <DialogActions sx={{
            background: 'rgba(0,0,0,0.3)',
            borderTop: '1px solid rgba(255, 235, 59, 0.2)',
            padding: '16px'
          }}>
            <Button 
              onClick={handleClearBet}
              sx={{
                color: 'rgba(255,255,255,0.7)',
                '&:hover': {
                  color: '#ffeb3b'
                }
              }}
            >
              Clear
            </Button>
            <Button 
              onClick={handleDialogClose}
              sx={{
                color: 'rgba(255,255,255,0.7)',
                '&:hover': {
                  color: '#ffeb3b'
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePlaceBet} 
              variant="contained" 
              disabled={!betAmount || betAmount < 5}
              sx={{
                background: 'linear-gradient(135deg, rgba(255,235,59,0.8) 0%, rgba(255,235,59,0.6) 100%)',
                color: 'black',
                fontWeight: 'bold',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(255,235,59,0.9) 0%, rgba(255,235,59,0.7) 100%)',
                },
                '&:disabled': {
                  background: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.3)'
                }
              }}
            >
              Place Bet
            </Button>
          </DialogActions>
        </Dialog>}
        {/* Void Game Dialog */}
        {gameState !== 'Closed' && <Dialog
          open={voidMessageDialogOpen}
          onClose={() => setVoidMessageDialogOpen(false)}
          PaperProps={{
            sx: {
              background: 'linear-gradient(135deg, rgba(40,0,0,0.95) 0%, rgba(80,0,0,0.95) 100%)',
              border: '2px solid #c62828',
              borderRadius: '12px',
              boxShadow: '0 0 30px rgba(198, 40, 40, 0.7)',
              overflow: 'hidden',
              maxWidth: '400px',
              width: '90%',
              position: 'relative',
              '&:before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #c62828, #ef5350, #c62828)',
              },
              '&:after': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '150px',
                height: '150px',
                backgroundImage: 'radial-gradient(circle, rgba(255,0,0,0.2) 0%, transparent 70%)',
                zIndex: 0
              }
            }
          }}
        >
          {/* Cross decoration */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              linear-gradient(to right, rgba(255,0,0,0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
            zIndex: 0
          }} />
          
          <DialogTitle sx={{ 
            position: 'relative',
            zIndex: 1,
            textAlign: 'center',
            color: '#ffeb3b',
            fontFamily: "'Cinzel Decorative', cursive",
            fontSize: '1.8rem',
            letterSpacing: '2px',
            textShadow: '0 0 10px rgba(255, 235, 59, 0.5)',
            padding: '20px',
            borderBottom: '1px solid rgba(255, 235, 59, 0.2)',
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Box sx={{
              width: '60px',
              height: '60px',
              background: '#c62828',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '15px',
              boxShadow: '0 0 20px rgba(198, 40, 40, 0.8)',
              border: '2px solid #ffeb3b',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.1)' },
                '100%': { transform: 'scale(1)' }
              }
            }}>
              <Close sx={{ 
                fontSize: '2.5rem',
                color: '#ffeb3b'
              }} />
            </Box>
            GAME VOIDED
          </DialogTitle>
          
          <DialogContent sx={{
            position: 'relative',
            zIndex: 1,
            padding: '20px',
            textAlign: 'center'
          }}>
            <Typography variant="h6" sx={{
              color: 'rgba(255,255,255,0.9)',
              marginBottom: '15px',
              fontWeight: 'bold'
            }}>
              This round has been declared void
            </Typography>
            
            <Typography variant="body1" sx={{
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '20px'
            }}>
              All bets will be refunded to players. Please wait for the next round to place new bets.
            </Typography>
            
            {/* <Box sx={{
              background: 'rgba(0,0,0,0.5)',
              borderRadius: '8px',
              padding: '15px',
              border: '1px solid rgba(255, 235, 59, 0.2)',
              marginTop: '20px'
            }}>
              <Typography variant="caption" sx={{
                display: 'block',
                color: '#ffeb3b',
                fontWeight: 'bold',
                marginBottom: '5px'
              }}>
                Game:
              </Typography>
              <Typography variant="body2" sx={{
                color: 'white',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                {voidMessage?.game || 'KARA-KRUS'}
              </Typography>
            </Box> */}
          </DialogContent>
          
          <DialogActions sx={{
            position: 'relative',
            zIndex: 1,
            padding: '15px 20px',
            background: 'rgba(0,0,0,0.3)',
            borderTop: '1px solid rgba(255, 235, 59, 0.2)',
            justifyContent: 'center'
          }}>
            <Button 
              onClick={() => setVoidMessageDialogOpen(false)}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #c62828 0%, #8e0000 100%)',
                color: '#ffeb3b',
                fontWeight: 'bold',
                padding: '10px 30px',
                borderRadius: '30px',
                boxShadow: '0 0 15px rgba(198, 40, 40, 0.5)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #d32f2f 0%, #9a0007 100%)',
                }
              }}
            >
              UNDERSTOOD
            </Button>
          </DialogActions>
        </Dialog>}

        {gameState !== 'Closed' && <Dialog
          open={showMechanics}
          onClose={() => setShowMechanics(false)}
          PaperProps={{
            sx: {
              background: 'linear-gradient(135deg, rgba(25,0,0,0.95) 0%, rgba(60,0,0,0.95) 100%)',
              border: '2px solid rgba(255, 235, 59, 0.3)',
              borderRadius: '12px',
              boxShadow: '0 0 30px rgba(198, 40, 40, 0.7)',
              maxWidth: '500px',
              width: '90%',
              '&:before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #c62828, #ffeb3b, #c62828)'
              }
            }
          }}
        >
          <DialogTitle sx={{ 
            color: '#ffeb3b',
            textAlign: 'center',
            fontFamily: "'Cinzel Decorative', cursive",
            letterSpacing: '1px',
            borderBottom: '1px solid rgba(255, 235, 59, 0.2)',
            background: 'rgba(0,0,0,0.3)',
            py: 2
          }}>
            GAME MECHANICS
          </DialogTitle>
          
          <DialogContent sx={{ py: 2, px: 3 }}>
            <Box sx={{ 
              color: 'rgba(255,255,255,0.9)',
              '& > div': {
                display: 'flex',
                mb: 2,
                alignItems: 'flex-start',
                '&:before': {
                  content: '"•"',
                  color: '#ffeb3b',
                  fontSize: '1.8rem',
                  lineHeight: '0.8',
                  mr: 1.5,
                  mt: -0.5
                }
              }
            }}>
              <div>
                <Box>
                  <Typography component="span" sx={{ fontWeight: 'bold', color: '#ffeb3b' }}>Coin Flip Game:</Typography> 
                  <span> Bet on either KARA (heads) or KRUS (tails)</span>
                </Box>
              </div>
              
              <div>
                <Box>
                  <Typography component="span" sx={{ fontWeight: 'bold', color: '#ffeb3b' }}>Betting Rules:</Typography> 
                  <span> Minimum bet is ₱5.00. Winner takes all.</span>
                </Box>
              </div>
              
              <div>
                <Box>
                  <Typography component="span" sx={{ fontWeight: 'bold', color: '#ffeb3b' }}>Game Phases:</Typography> 
                  <Box component="ul" sx={{ pl: 2, mt: 0.5, listStyleType: 'none' }}>
                    <li>- <Box component="span" sx={{ color: '#4caf50' }}>OPEN (30s):</Box> Place your bets</li>
                    <li>- <Box component="span" sx={{ color: '#ff9800' }}>LAST CALL (10s):</Box> Final betting period</li>
                    <li>- <Box component="span" sx={{ color: '#f44336' }}>CLOSED:</Box> No more bets accepted</li>
                  </Box>
                </Box>
              </div>
              
              <div>
                <Box>
                  <Typography component="span" sx={{ fontWeight: 'bold', color: '#ffeb3b' }}>Payouts:</Typography> 
                  <span> Your winnings = (bet amount) × (current odds)</span>
                </Box>
              </div>
              
              <div>
                <Box>
                  <Typography component="span" sx={{ fontWeight: 'bold', color: '#ffeb3b' }}>Odds Calculation:</Typography> 
                  <span> Changes based on total bets on each side</span>
                </Box>
              </div>
              
              <div>
                <Box>
                  <Typography component="span" sx={{ fontWeight: 'bold', color: '#ffeb3b' }}>Void Game:</Typography> 
                  <span> If odds go below 1x, game will be <strong style={{color: '#f44336',fontWeight:'bold'}}>VOIDED</strong></span>
                </Box>
              </div>
              
              <div>
                <Box>
                  <Typography component="span" sx={{ fontWeight: 'bold', color: '#ffeb3b' }}>Results:</Typography> 
                  <span> Check History tab for past game outcomes</span>
                </Box>
              </div>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ 
            borderTop: '1px solid rgba(255, 235, 59, 0.2)',
            background: 'rgba(0,0,0,0.3)',
            justifyContent: 'center',
            py: 1.5
          }}>
            <Button 
              onClick={() => setShowMechanics(false)}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, rgba(255,235,59,0.8) 0%, rgba(255,235,59,0.6) 100%)',
                color: 'black',
                fontWeight: 'bold',
                px: 4,
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(255,235,59,0.9) 0%, rgba(255,235,59,0.7) 100%)'
                }
              }}
            >
              GOT IT!
            </Button>
          </DialogActions>
        </Dialog>}
      </Container>
    </Box>
  );
};

export default KaraKrus;