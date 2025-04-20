import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Button, TextField, Box, Typography, Paper, Container, Chip, Dialog } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Celebration, MoodBad } from '@mui/icons-material';
import ReactConfetti from 'react-confetti';

const KaraKrus = () => {
  const mountRef = useRef(null);
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(100);
  const [selectedSide, setSelectedSide] = useState(null);
  const [gameState, setGameState] = useState('idle');
  const [result, setResult] = useState(null);
  const [isWinner, setIsWinner] = useState(false);
  const [animationId, setAnimationId] = useState(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const coinRef = useRef(null);
  const [coinFaceImg, setCoinFaceImg] = useState(null);
  const theme = useTheme();

  // Initialize Three.js scene
  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a2b3c);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    // Adjusted camera position for better view on mobile
    camera.position.z = 4; // Changed from 6 to 4
    camera.position.y = 1.5; // Changed from 2.5 to 1.5
    camera.lookAt(0, 0, 0);
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

  // Reset coin position
  const resetCoin = () => {
    if (coinRef.current) {
      coinRef.current.position.set(0, 0.7, 0); // Changed from 0.5 to 0.7
      coinRef.current.rotation.set(0, 0, 0);
    }
  };

  // Toss coin animation
  const tossCoin = () => {
    if (gameState !== 'idle' || !coinRef.current) return;
    
    // Deduct bet from balance
    setBalance(prevBalance => prevBalance - bet);
    
    // Change game state
    setGameState('tossing');
    
    // Reset coin position
    resetCoin();
    
    // Random values for rotation and movement
    const rotationX = Math.random() * 10 + 10;
    const rotationY = Math.random() * 5;
    const rotationZ = Math.random() * 5;
    
    const jumpHeight = 3 + Math.random() * 2; // Reduced max height slightly
    const animationDuration = 3000 + Math.random() * 1000;
    
    // Determine result
    const newResult = Math.random() > 0.5 ? 'heads' : 'tails';
    
    // Animation start time
    const startTime = Date.now();
    
    // Animation function
    const animateCoinToss = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = elapsed / animationDuration;
      
      if (progress < 1) {
        if (progress < 0.3) {
          const upProgress = progress / 0.3;
          coinRef.current.position.y = 0.7 + jumpHeight * upProgress; // Updated from 0.5 to 0.7
          coinRef.current.rotation.x = rotationX * upProgress * Math.PI * 2;
          coinRef.current.rotation.y = rotationY * upProgress * Math.PI * 2;
          coinRef.current.rotation.z = rotationZ * upProgress * Math.PI;
          
        } else if (progress < 0.6) {
          const fallProgress = (progress - 0.3) / 0.3;
          coinRef.current.position.y = 0.7 + jumpHeight * (1 - fallProgress); // Updated from 0.5 to 0.7
          coinRef.current.rotation.x = rotationX * progress * Math.PI * 2;
          coinRef.current.rotation.y = rotationY * progress * Math.PI * 2;
          coinRef.current.rotation.z = rotationZ * progress * Math.PI;
          
        } else {
          const landProgress = (progress - 0.6) / 0.4;
          coinRef.current.position.y = 0.1 + (0.7 - 0.1) * (1 - landProgress); // Updated from 0.5 to 0.7
          const targetX = newResult === 'heads' 
            ? Math.PI * 2 * Math.round(rotationX) 
            : Math.PI * (2 * Math.round(rotationX) + 1);
          const currentX = coinRef.current.rotation.x;
          coinRef.current.rotation.x = currentX + (targetX - currentX) * landProgress;
          coinRef.current.rotation.y *= (1 - landProgress);
          coinRef.current.rotation.z *= (1 - landProgress);
        }
        
        requestAnimationFrame(animateCoinToss);
      } else {
        coinRef.current.position.y = 0.1;
        
        if (newResult === 'heads') {
          coinRef.current.rotation.set(0.05, 0, 0);
        } else {
          coinRef.current.rotation.set(Math.PI - 0.05, 0, 0);
        }
        
        setResult(newResult);
        setGameState('result');
        
        // Set the coin face image from our stored global images
        setCoinFaceImg(window.coinImages[newResult]);
        
        const won = selectedSide === newResult;
        setIsWinner(won);
        
        if (won) {
          setBalance(prevBalance => prevBalance + (bet * 2));
        }
      }
    };
    
    animateCoinToss();
  };

  // Start next round
  const startNextRound = () => {
    setGameState('idle');
    setResult(null);
    setSelectedSide(null);
    setCoinFaceImg(null);
    resetCoin();
  };

  // Handle bet change
  const handleBetChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0 && value <= balance) {
      setBet(value);
    }
  };

  // Helper function to capitalize first letter
  const capitalize = (string) => {
    return string ? string.charAt(0).toUpperCase() + string.slice(1) : '';
  };

  return (
    <Container maxWidth="xs"> {/* Changed to xs for mobile optimization */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        py: 2, // Reduced vertical padding for mobile
        gap: 2  // Reduced gap for mobile
      }}>
        
        
        <Paper elevation={5} sx={{ p: 2, width: '100%', mb: 2, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexDirection: 'column', gap: 2 }}>
            <Chip 
              label={`Balance: ₱${balance}`} 
              color="primary" 
              sx={{ fontSize: '1.2rem', py: 1.5, px: 1, alignSelf: 'center' }}
            />
            <TextField 
              label="Bet Amount"
              type="number"
              value={bet}
              onChange={handleBetChange}
              inputProps={{ min: 1, max: balance }}
              variant="outlined"
              size="small"
              sx={{ width: '100%' }}
              disabled={gameState !== 'idle'}
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
            <Button 
              variant={selectedSide === 'heads' ? "contained" : "outlined"} 
              onClick={() => gameState === 'idle' && setSelectedSide('heads')}
              disabled={gameState !== 'idle'}
              sx={{ width: '50%', py: 1 }}
            >
              Heads
            </Button>
            <Button 
              variant={selectedSide === 'tails' ? "contained" : "outlined"} 
              onClick={() => gameState === 'idle' && setSelectedSide('tails')}
              disabled={gameState !== 'idle'}
              sx={{ width: '50%', py: 1 }}
            >
              Tails
            </Button>
          </Box>
        </Paper>
        
        <Box 
          ref={mountRef} 
          sx={{ 
            width: '100%', 
            height: '320px', // Adjusted height for mobile
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: 4
          }}
        />
        
        
          <Dialog 
            open={gameState === 'result'}
            fullWidth
            maxWidth="sm"
            PaperProps={{
              sx: {
                borderRadius: 3,
                overflow: 'hidden',
                background: isWinner 
                  ? 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)' 
                  : 'linear-gradient(135deg, #F44336 0%, #C62828 100%)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                transform: 'scale(0.95)',
                animation: 'scaleIn 0.3s ease-out forwards'
              }
            }}
          >
            <Box sx={{ p: 4, textAlign: 'center', color: 'white' }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'bold',
                  mb: 3,
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                {isWinner ? (
                  <>
                    <Celebration fontSize="large" />
                    You Won!
                    <Celebration fontSize="large" />
                  </>
                ) : (
                  <>
                    <Celebration fontSize="large" />
                    Your next round will be your luck!
                    <Celebration fontSize="large" />
                  </>
                )}
              </Typography>
              
              {/* Coin display */}
              <Box sx={{
                position: 'relative',
                width: 180,
                height: 180,
                margin: '0 auto 20px',
                perspective: '1000px'
              }}>
                <Box sx={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  transformStyle: 'preserve-3d',
                  animation: 'flipIn 1s ease-out forwards',
                  borderRadius: '50%',
                  boxShadow: '0 0 20px rgba(255,215,0,0.8)',
                  border: '4px solid gold'
                }}>
                  <Box sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    backgroundImage: `url(${coinFaceImg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '50%'
                  }} />
                </Box>
              </Box>
              
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'medium' }}>
                Result: <strong>{result?.toUpperCase() === 'HEADS' ? 'KARA' : 'KRUS'}</strong>
              </Typography>
              
              <Typography variant="body2" sx={{ 
                fontStyle: 'italic',
                opacity: 0.8,
                mb: 3
              }}>
                You chose: <strong>{capitalize(selectedSide) === "Heads" ? "KARA" : "KRUS"}</strong>
              </Typography>
              
              <Button
                variant="contained"
                color={isWinner ? 'success' : 'error'}
                size="large"
                onClick={startNextRound}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 'bold',
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 12px rgba(0,0,0,0.3)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {isWinner ? 'Play Again' : 'Try Again'}
              </Button>
            </Box>
            
            {/* Add confetti for winner */}
            {isWinner && (
              <ReactConfetti
                width={window.innerWidth}
                height={window.innerHeight}
                recycle={false}
                numberOfPieces={300}
              />
            )}
          </Dialog>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, width: '100%' }}>
          {gameState === 'idle' && (
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={tossCoin}
              disabled={!selectedSide || bet <= 0 || bet > balance}
              sx={{ 
                width: '100%',
                py: 1.5,
                fontSize: '1.1rem',
                boxShadow: 3
              }}
            >
              Toss Coin
            </Button>
          )}
          
          {gameState === 'result' && (
            <Button 
              variant="contained" 
              color="secondary" 
              size="large"
              onClick={startNextRound}
              sx={{ 
                width: '100%',
                py: 1.5,
                fontSize: '1.1rem',
                boxShadow: 3
              }}
            >
              Next Round
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default KaraKrus;