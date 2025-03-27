import React, { useState, useEffect, useRef } from 'react';
import { Button, Typography, Box, Container, Dialog, DialogTitle, DialogContent, DialogActions, Grid, IconButton } from '@mui/material';
import { useSpring, animated } from '@react-spring/web';
import CloseIcon from '@mui/icons-material/Close';
import ReactConfetti from 'react-confetti';
import { getRequiredUrl } from '../services/common';
import WebSocketManager from '../utils/WebSocketManager';
import { formatMoney } from '../utils/gameutils';

const useBackgroundAudio = (audioSrc) => {
  useEffect(() => {
    const audio = new Audio(audioSrc);
    audio.loop = true;
    
    const unlockAudio = () => {
      audio.play().catch(e => console.log("Audio play error:", e));
      document.removeEventListener('click', unlockAudio);
    };

    document.addEventListener('click', unlockAudio);
    
    return () => {
      document.removeEventListener('click', unlockAudio);
      audio.pause();
    };
  }, [audioSrc]);
};

const GoldenGoose = () => {
  const [eggs, setEggs] = useState([]);
  const [gameOver, setGameOver] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [items, setItems] = useState(['/assets/500.png', 1, 1, 1, 1, 1]);
  const [isWinner, setIsWinner] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [jackpotPrize, setJackpotPrize] = useState(0);
  const [jackpotType, setJackpotType] = useState('');
  const [scratchCount, setScratchCount] = useState(0);
  const [clickedEgg, setClickedEgg] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [currentPrizePool, setCurrentPrizePool] = useState(5);
  const userInfo = JSON.parse(localStorage.getItem('user') || 'null');
  const url = getRequiredUrl(true);
  if (!url) {
    throw new Error(`No valid url: ${url}`);
  }
  const wss = useRef(new WebSocketManager(url)).current;
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const audioRef = useRef(null);

  const goldEgg = '/assets/goldEgg.png';
  const startGameSound = '/assets/sounds/8-bit-achievement-epic-stock-media-1-00-00.mp3';
  const crackEggSound = '/assets/sounds/crackingEgg.mp3';
  const winSound = '/assets/sounds/you-win-sequence-3-183950.mp3';
  const loseSound = '/assets/sounds/no-luck-too-bad-disappointing-sound-effect-112943.mp3';
  const bgSound = '/assets/sounds/cottagecore-17463.mp3';
  const gameTitle = '/assets/gameTitle.png';
  const crackedEgg = '/assets/crackedGoldEgg.png';

  const playStartGameSound = () => {
    const audio = new Audio(startGameSound);
    audio.play();
  };
  const playcrackEggSound = () => {
    const audio = new Audio(crackEggSound);
    audio.play();
  };
  const playWinningAnnouncementSound = () => {
    const audio = new Audio(winSound);
    audio.play();
  };
  const playLoseAnnouncementSound = () => {
    const audio = new Audio(loseSound);
    audio.play();
  };

  

  const generateUniqueRandomItems = (currentPrizePool) => {
    const uniqueValues = new Set();
    const modifiedItems = [];
    const playerBet = 10; // Assuming player bet is 10
    
    while (modifiedItems.length < items.length) {
      // Calculate maximum possible percentage that won't make prize pool negative
      const maxSafePercentage = ((currentPrizePool ?? 5) / playerBet) * 100;
      
      const maxPercentage = Math.min(200, maxSafePercentage);
      const percentage = 1 + Math.random() * (maxPercentage - 1); 
      
      const value = (playerBet * (percentage / 100)).toFixed(2);
      
      if (!uniqueValues.has(value)) {
        uniqueValues.add(value);
        modifiedItems.push(value);
      }
    }
    
    return modifiedItems;
  };
 
  

  useEffect(() => {
    if(items[0] === '/assets/500.png') {
      if(currentPrizePool){
        setItems(generateUniqueRandomItems(Number(currentPrizePool)));
      }
    }
  }, [items, currentPrizePool]);

  const generateRandomPrize = (currentPrizePool) => {
    setItems(generateUniqueRandomItems(Number(currentPrizePool)));
  };

  useEffect(() => {
    wss.connect();
    return () => {
      wss.close();
    };
  }, [wss]);


  useEffect(() => {
    
    const handleMessage = async (event) => {
      const { event: eventType, data, id, jackpotPrize, jackpotType, luckyPlayer } = JSON.parse(event.data);

      if(luckyPlayer && jackpotPrize && jackpotType){
        if(luckyPlayer === userInfo.userData.data.user.id){
          setJackpotPrize(jackpotPrize);
          setJackpotType(jackpotType);
        }
      }

      if (eventType === "websocketPinging") {
        const message = data.message;
        console.log(message);
      }

      if (eventType === "receiveCurrentInstantPrize") {
        setCurrentPrizePool(data.currentPrizePool)
      }
      
      if (eventType === "receiveAllPlayerData") {
        const allPlayerData = data.find(player => player.userId === userInfo.userData.data.user.id);
        if(allPlayerData && userInfo.userData.data.user.id === id){
          setGameOver(allPlayerData.gameOver);
          setGameStarted(allPlayerData.gameStarted);
          setIsWinner(allPlayerData.isWinner);
          setEggs(allPlayerData.eggs);
          setClickedEgg(allPlayerData.clickedEgg);
        }
      }
    };

    wss.setOnMessage(handleMessage);
  }, [wss]);

  
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  

  const updatePlayerGameStarted = async (gameStarted) => {
    const updatedPlayerData = {
      event: "updatePlayerGameStarted",
      data: {userId: userInfo.userData.data.user.id, gameStarted},
    };

    await wss.send(JSON.stringify(updatedPlayerData));
  };

  const updatePlayerGameOver = async (gameOver) => {
    const updatedPlayerData = {
      event: "updatePlayerGameOver",
      data: {userId: userInfo.userData.data.user.id, gameOver},
    };

    await wss.send(JSON.stringify(updatedPlayerData));
  };

  const updatePlayerClickedEgg = async (clickedEgg) => {
    const updatedPlayerData = {
      event: "updatePlayerClickedEgg",
      data: {userId: userInfo.userData.data.user.id, clickedEgg},
    };

    await wss.send(JSON.stringify(updatedPlayerData));
  };

  const updatePlayerIsWinner = async (isWinner) => {
    const updatedPlayerData = {
      event: "updatePlayerIsWinner",
      data: {userId: userInfo.userData.data.user.id, isWinner},
    };

    await wss.send(JSON.stringify(updatedPlayerData));
  };

  const updatePlayerEggs = async (eggs) => {
    const updatedPlayerData = {
      event: "updatePlayerEggs",
      data: {userId: userInfo.userData.data.user.id, eggs},
    };

    await wss.send(JSON.stringify(updatedPlayerData));
  };

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 3; i++) {
      let channel = '';
      
      for (let j = 0; j < 2; j++) {
        channel += letters[Math.floor(Math.random() * 8)]; 
      }
      color += channel;
    }
  
    return color;
  };
  
  const startNewGame = async () => {
    playStartGameSound();
    // Create a working copy of items that may be modified
    let workingItems = [...items];
    // Check if jackpotPrize is not 0 and modify the items array
    if (jackpotPrize !== 0) {
        // Replace the last element with jackpotPrize
        workingItems = [...items.slice(0, -1), jackpotPrize];
    }
    
    // Ensure we have unique items in the working set
    if (new Set(workingItems).size !== workingItems.length) {
        console.warn("Duplicate items detected, regenerating...");
        await generateRandomPrize(Number(currentPrizePool));
        return;
    }
  
    let itemDistribution = [];
    const itemCounts = {};
    const itemColors = {};
    
    workingItems.forEach(item => {
        itemCounts[item] = 0;
        itemColors[item] = {
            color: getRandomColor(),
            textShadow: `0 0 3.5px white, 0 0 3.5px white`
        };
    });

    // Check if workingItems includes jackpotPrize (when jackpotPrize is not 0)
    const hasJackpotPrize = jackpotPrize !== 0 && workingItems.includes(jackpotPrize);
    
    // Set makeWinner to true if hasJackpotPrize, otherwise random 30% chance
    const makeWinner = hasJackpotPrize || Math.random() < 0.3;
    console.log(workingItems)
    console.log(makeWinner)
    if (makeWinner) {
        // Use jackpotPrize as winning item if available, otherwise random item
        const winningItem = hasJackpotPrize ? jackpotPrize : workingItems[Math.floor(Math.random() * workingItems.length)];

        itemDistribution = Array(3).fill(winningItem);
        
        while (itemDistribution.length < 12) {
            const availableItems = workingItems.filter(item => 
                itemDistribution.filter(p => p === item).length < 2
            );
            
            if (availableItems.length === 0) break; 
            
            const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
            itemDistribution.push(randomItem);
        }
    } else {
        const itemPool = [...workingItems, ...workingItems]; 

        for (let i = itemPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [itemPool[i], itemPool[j]] = [itemPool[j], itemPool[i]];
        }
        
        itemDistribution = itemPool.slice(0, 12);
    }
  
    // Final shuffle
    itemDistribution.sort(() => Math.random() - 0.5);
    
    const newEggs = itemDistribution.map((item, index) => ({
        id: index,
        item: item,
        scratched: false,
        cracked: false, 
        showCracked: false, 
        color: itemColors[item].color,
        textShadow: itemColors[item].textShadow,
    }));
    
    const messageData = {
        event: "startGame",
        data: {
            userId: userInfo.userData.data.user.id, 
            bet: 10, 
            gameStarted: true, 
            gameOver: false, 
            clickedEgg, 
            isWinner: false, 
            eggs: newEggs,
            jackpotPrize: jackpotPrize !== 0 ? jackpotPrize : 0,
            jackpotType: jackpotType !== '' ? jackpotType : ''
        },
    };
  
    await wss.send(JSON.stringify(messageData));

    if(jackpotPrize !== 0 && jackpotType !== ''){
      setJackpotPrize(0);
      setJackpotType('')
    }
  };

  useEffect(() => {
    const itemCount = {};
    eggs.forEach(egg => {
      if (egg.scratched) {
        itemCount[egg.item] = (itemCount[egg.item] || 0) + 1;
      }
    });
    
    const hasWinningCombo = Object.values(itemCount).some(count => count >= 3);

    const scratchedEggsCount = eggs.filter(egg => egg.scratched === true).length;
    setScratchCount(scratchedEggsCount);

    if (hasWinningCombo) {
      playWinningAnnouncementSound();
      updatePlayerIsWinner(true);
      updatePlayerGameOver(true);
      generateRandomPrize(Number(currentPrizePool));
      updatePlayerGameStarted(false);
      setTimeout(() => {
        setOpenDialog(true);
      }, 500);
    } else if (scratchedEggsCount >= 12) {
      playLoseAnnouncementSound();
      updatePlayerIsWinner(false);
      updatePlayerGameOver(true);
      generateRandomPrize(Number(currentPrizePool));
      updatePlayerGameStarted(false);
      setTimeout(() => {
        setOpenDialog(true);
      }, 500);
    }
  }, [eggs]);

  
  
  const scratchEgg = async (id) => {
    if (gameOver) return;
    playcrackEggSound();
    
    updatePlayerClickedEgg(id);
    
    const updatedEggs = eggs.map(egg => 
      egg.id === id ? { ...egg, scratched: true, cracked: true, showCracked: true} : egg
    );
    
    updatePlayerEggs(updatedEggs);
    
  };

  const EggItem = ({ egg }) => {
    const [showItem, setShowItem] = useState(false);

    useEffect(() => {
      if (egg.showCracked) {
        const timer = setTimeout(() => {
          setShowItem(true);
        }, 500); 

        return () => clearTimeout(timer);
      }
    }, [egg.showCracked]);

    const isEggAnimated = egg.id === clickedEgg;

    const scaleSpring = useSpring({
      from: { scale: 1 },
      scale: egg.scratched && isEggAnimated ? 1.4 : 1,
      config: { tension: 300, friction: 10 }
    });
    
    const rotateSpring = useSpring({
      from: { rotate: 0 },
      rotate: egg.scratched && isEggAnimated ? 10 : 0,
      config: { tension: 300, friction: 10 }
    });

    const handleClick = () => {
      if (!egg.scratched && !gameOver) {
        scratchEgg(egg.id);
      }
    };

    const scaleAndRotate = useSpring({
      to: async (next) => {
        
        await next({
          transform: isEggAnimated ? 'scale(1) rotate(360deg)' : 'scale(1) rotate(0deg)',
        });
    
        if (isEggAnimated) {
          await next({ transform: 'scale(1.2) rotate(360deg)' }); // Scale up quickly
          await next({ transform: 'scale(0.9) rotate(360deg)' }); // Scale down quickly
          await next({ transform: 'scale(1.1) rotate(360deg)' }); // Scale up slightly
          await next({ transform: 'scale(1) rotate(360deg)' });  // Return to normal scale
        }
      },
      from: {
        transform: isEggAnimated ? 'scale(0.1) rotate(0deg)' : 'scale(1) rotate(0deg)',
      },
      config: {
        tension: 300, 
        friction: 10, 
        duration: 300, 
      },
      delay: 500, 
    });

    return (
      <animated.div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          border: `${winningItem && (egg.item === winningItem[0] && egg.scratched) ? '3px solid lightgreen' : '1px solid rgba(155, 120, 9, 1)'}`,
          alignItems: 'center',
          cursor: egg.scratched ? 'default' : 'pointer',
          background: 'rgba(57, 42, 54, 1)',
          boxShadow: winningItem && (egg.item === winningItem[0] && egg.scratched) 
            ? '0 0 15px lightgreen' // Shadow sa lahat ng sides
            : '0 4px 8px rgba(0,0,0,0.1)', // Default shadow
          padding: '7px',
          transition: 'background 0.3s',
          position: 'relative',
          left:-8,
          overflow: 'hidden',
          margin: 'auto',
          zIndex:winningItem && (egg.item === winningItem[0] && egg.scratched) && 999
        }}
        onClick={() => {handleClick(); }}
      >
        {egg.scratched ? (
          <>
            {egg.showCracked && !showItem && egg.id === clickedEgg ? (
              <animated.div style={{scale: scaleSpring.scale,rotate: rotateSpring.rotate,}}><img src={crackedEgg} style={{ width: 50 }} /></animated.div>
            ) : (
              <Box style={{ fontSize: '14px', position: 'relative', width: 50, height: 50 }}>
                <img 
                  src={crackedEgg} 
                  style={{ 
                    width: '140%', 
                    position: 'absolute', 
                    top: -14, 
                    left: -10,
                    transform: 'rotate(10deg)', // Mag-rotate ng 10 degrees pakanan
                  }} 
                />
                <animated.div
                  style={{
                    fontSize: '35px', 
                    position: 'absolute',
                    fontFamily: 'Paytone One',
                    fontWeight: '700',
                    color: egg.color, // text color
                    left: -12,
                    ...scaleAndRotate,
                    textShadow: egg.textShadow,
                  }}
                >
                  {egg.item}
                </animated.div>
              </Box>
            )}
          </>
        ) : (
          <img src={goldEgg} style={{ width: 50 }} />
        )}
      </animated.div>
    );
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handlePlayAgain = () => {
    setOpenDialog(false);
    startNewGame();
  };

  const itemOccurrences = eggs.reduce((acc, egg) => {
    if (egg.scratched) {
      acc[egg.item] = (acc[egg.item] || 0) + 1;
    }
    return acc;
  }, {});

  const winningItem = Object.entries(itemOccurrences).find(([item, count]) => count >= 3);

  useBackgroundAudio(bgSound);

  return (
    <Container maxWidth="sm" style={{ padding: '20px', textAlign: 'center', background:'rgba(69, 32, 37, 1)', height:'100vh', position: 'relative' }}>
      {/* Bet Display Box - Top Left */}
      
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 20, 
          left: 20, 
          textAlign: 'left',
          zIndex: 10
        }}
      >
        <Box 
          sx={{ 
            background: 'rgba(247, 188, 0, 1)', 
            padding: '8px 16px', 
            borderRadius: '8px',
            display: 'inline-block',
            marginBottom: '8px'
          }}
        >
          <Typography 
            variant="body1" 
            sx={{ 
              fontWeight: 'bold', 
              color: 'black',
              fontSize: '16px',
              fontFamily: "'Poppins', sans-serif",
              textAlign: 'center', // Para centered yung text
              lineHeight: '1', // Para adjust yung line height
            }}
          >
            BET ₱ 10.00
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'black',
              fontSize: '12px', // Smaller font size
              fontFamily: "'Arial', sans-serif",
              textAlign: 'center', // Para centered yung text
              marginTop: '4px', // Spacing between the two texts
            }}
          >
            For 12 Golden Eggs
          </Typography>
        </Box>
        
        <Box sx={{ display: 'block', background:'rgba(9, 10, 14, 0.25)', marginTop:-2, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'white',
              fontSize: '14px',
              position:'relative',
              top:6,
              marginTop:0.7,
              marginBottom: '2px',
              fontFamily: "'Quicksand', sans-serif",
              textAlign:'center'
            }}
          >
            My Balance
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'white',
              fontWeight: 'bold',
              fontFamily: "'Quicksand', cursive",
              textAlign:'center',
            }}
          >
            {`${formatMoney(parseFloat(userInfo.userData.data.wallet.balance).toFixed(2))}`}
          </Typography>
        </Box>
      </Box>

      {/* Jackpot Prize Banner */}
      <Box 
        sx={{ 
          position: 'absolute',
          top: 20,
          right: 20,
          background: 'linear-gradient(to right, #FFD700, #FFA500)',
          padding: '6px 12px',  // Reduced padding
          borderRadius: '8px',  // Smaller border radius
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          zIndex: 10,
          animation: 'pulse 2s infinite',
          '@keyframes pulse': {
            '0%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.05)' },
            '100%': { transform: 'scale(1)' },
          }
        }}
      >
        <Typography 
          variant="body1"
          sx={{ 
            color: '#8B0000',
            fontFamily: "'Bangers', cursive",
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
            fontSize: '20px'
          }}
        >
          PLAY & WIN
        </Typography>
        <Typography 
          variant="body1"  // Changed from h5 to body1
          sx={{ 
            color: '#8B0000',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
            fontFamily: "'Bangers', cursive",
            fontSize: '20px'  // Reduced font size
          }}
        >
          ₱25000 JACKPOT!
        </Typography>
      </Box>

      <Box textAlign={'center'} sx={{ marginTop: '90px' }}>
        <img src={gameTitle} style={{ width: '65%', position:'relative', top:38, zIndex:1 }} />
      </Box>
      
      <Box sx={{ mb: 4, mt: 2 }}>
        <Grid container spacing={2}>
          {eggs.map((egg) => (
            <Grid item xs={4} key={egg.id} sx={{ height: '70px', }}>
              <EggItem egg={egg} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {eggs.length === 0 && <Box 
        variant="body2" 
        color="gold" 
        sx={{ 
          mb: 2, 
          fontFamily: "'Permanent Marker', cursive", 
          fontWeight: 'bold', 
          position: 'absolute',
          left:0,
          margin:'0 auto', 
          width:'100%',
          bottom: '45%',  // Adjusted the position
        }}
      >
        Click "PLAY GAME to Start"
      </Box>}

      <Box sx={{ position: 'absolute', bottom: 120, left: '0%',margin: '0 auto', zIndex: 10, width:'100%' }}>
        <Typography variant="body2" color="gold" sx={{ fontFamily:'helvetica' }}>
          Eggs Cracked: {scratchCount} / 12
        </Typography>
      </Box>
      

      {!openDialog && gameOver && !gameStarted && (
        <Box sx={{ position: 'absolute', bottom: 50, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <Button 
            onClick={() => {handlePlayAgain(); updatePlayerGameStarted(false);}} 
            variant="contained" 
            sx={{ 
              bgcolor: '#FFD700', 
              color: '#8B0000', 
              fontWeight: 'bold', 
              fontSize: '1rem', 
              borderRadius: '8px', 
              padding: '8px 24px',
              '&:hover': {
                bgcolor: '#FFA500',
              }
            }}
          >
            PLAY GAME
          </Button>
        </Box>
      )}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          height: 100,
          left: 0,
          backgroundImage: 'url(/assets/coinPile.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      ></Box>
      
      {isWinner && <ReactConfetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} />}
      
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        PaperProps={{
          sx: {
            borderRadius: '16px', // Border radius for the dialog
            overflow: 'hidden', // Ensure the border radius is applied correctly
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            m: 0, 
            p: 2, 
            bgcolor: isWinner ? '#4CAF50' : '#B12B24', 
            color: 'white',
            fontFamily: 'Poppins, sans-serif', // Modern font family
            fontSize: '1.2rem', // Larger font size for the title
            textAlign: 'center', // Center align the text
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          {isWinner ? '🎉 Congratulations! 🎉' : '😞 Better Luck Next Time 😞'}
          {/* <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 0,
              top: -8,
              color: 'white',
            }}
          >
            <CloseIcon />
          </IconButton> */}
        </DialogTitle>
        <DialogContent 
          dividers 
          sx={{
            background: '#FBDC6A',
            textAlign: 'center', // Center align the content
            fontFamily: 'Roboto, sans-serif', // Modern font family
            padding: '10px',
          }}
        >
          {isWinner ? (
            <>
              <Typography sx={{fontWeight:'bold', color:'#760504', fontSize:'1.2rem', mb:2,fontFamily: 'Poppins, sans-serif'}}>
                YOU MATCHED 3
              </Typography>
              <Typography sx={{fontWeight:'bold', color:'#760504', fontSize:'4.2rem', mb:2,fontFamily: 'Paytone One', textAlign:'center', textShadow:`0 0 5px white, 0 0 5px white`}}>
                {winningItem[0]}
              </Typography>
              
            </>
            
          ) : (
            <>
              <Typography 
                gutterBottom 
                sx={{ 
                  color: '#760504', 
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                }}
              >
                No 3 matching prizes found.
              </Typography>
              <Typography 
                gutterBottom 
                sx={{ 
                  color: '#760504', 
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                }}
              >
                Try again!
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions 
          sx={{
            background: '#FBDC6A',
            justifyContent: 'center', // Center align the button
            padding: '16px',
          }}
        >
          <Button 
            onClick={handlePlayAgain} 
            autoFocus 
            sx={{ 
              color: isWinner ? 'darkgreen' : '#760504',
              fontFamily: 'Montserrat, sans-serif', // Modern font family
              fontWeight: 'bold',
              fontSize: '1rem',
              borderRadius: '8px', // Rounded corners for the button
              padding: '8px 24px',
              '&:hover': {
                backgroundColor: isWinner ? 'rgba(0, 100, 0, 0.1)' : 'rgba(118, 5, 4, 0.1)',
              }
            }}
          >
            Play Again
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GoldenGoose;