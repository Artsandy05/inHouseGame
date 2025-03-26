import React, { useState, useEffect } from 'react';
import { Button, Typography, Box, Container, Dialog, DialogTitle, DialogContent, DialogActions, Grid, IconButton } from '@mui/material';
import { useSpring, animated } from '@react-spring/web';
import CloseIcon from '@mui/icons-material/Close';
import Confetti from 'react-confetti';

const App = () => {
  const [eggs, setEggs] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [scratchCount, setScratchCount] = useState(0);
  const [clickedEgg, setClickedEgg] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const items = ['/assets/500.png', '/assets/2,500.png', '/assets/10,000.png', '/assets/25,000.png', '/assets/20k.png', '/assets/1000.png',];

  const goldEgg = '/assets/goldEgg.png';
  const gameTitle = '/assets/gameTitle.png';
  const crackedEgg = '/assets/crackedGoldEgg.png';

  // Initialize game
  useEffect(() => {
    startNewGame();
    
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startNewGame = () => {
    // Create random item distribution
    let itemDistribution = [];
    const itemCounts = {};
    items.forEach(item => itemCounts[item] = 0);
    
    const makeWinner = Math.random() < 0.3; 
    
    if (makeWinner) {
      const winningItem = items[Math.floor(Math.random() * items.length)];
      itemDistribution = Array(3).fill(winningItem);
      
      while (itemDistribution.length < 12) {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        if (itemDistribution.filter(p => p === randomItem).length < 2) {
          itemDistribution.push(randomItem);
        } else {
          const otherItems = items.filter(p => p !== randomItem);
          itemDistribution.push(otherItems[Math.floor(Math.random() * otherItems.length)]);
        }
      }
    } else {
      while (itemDistribution.length < 12) {
        // Get items that haven't reached their limit yet
        const availableItems = items.filter(item => itemCounts[item] < 2);
        
        // If all items have reached their limit, this would be a problem
        // But with 4 items and a max of 2 each, we can always distribute 8 items
        // Since we need 12, we need to ensure we don't hit this condition
        if (availableItems.length === 0) {
          console.error("Cannot distribute items without exceeding the limit");
          break;
        }
        
        // Pick a random item from available items
        const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
        
        // Add it to our distribution and update its count
        itemDistribution.push(randomItem);
        itemCounts[randomItem]++;
      }
    }

    itemDistribution.sort(() => Math.random() - 0.5);
    
    const newEggs = itemDistribution.map((item, index) => ({
      id: index,
      item: item,
      scratched: false,
      cracked: false, 
      showCracked: false, 
    }));
    
    setEggs(newEggs);
    setGameOver(false);
    setIsWinner(false);
    setScratchCount(0);
  };
  
  const scratchEgg = (id) => {
    if (gameOver) return;

    setClickedEgg(id);
    
    const updatedEggs = eggs.map(egg => 
      egg.id === id ? { ...egg, scratched: true, cracked: true, showCracked: true} : egg
    );
    
    setEggs(updatedEggs);
    
    const newScratchCount = scratchCount + 1;
    setScratchCount(newScratchCount);
    
    const itemCount = {};
    updatedEggs.forEach(egg => {
      if (egg.scratched) {
        itemCount[egg.item] = (itemCount[egg.item] || 0) + 1;
      }
    });
    
    const hasWinningCombo = Object.values(itemCount).some(count => count >= 3);
    
    if (hasWinningCombo) {
      setIsWinner(true);
      setGameOver(true);
      setTimeout(() => {
        setOpenDialog(true);
      }, 1500);
    } else if (newScratchCount >= 12) {
      setGameOver(true);
      setTimeout(() => {
        setOpenDialog(true);
      }, 1500);
    }
  };

  const EggItem = ({ egg }) => {
    const [showItem, setShowItem] = useState(false);

    useEffect(() => {
      if (egg.showCracked) {
        const timer = setTimeout(() => {
          setShowItem(true);
        }, 500); // 0.5 seconds delay

        return () => clearTimeout(timer);
      }
    }, [egg.showCracked]);

    const isEggAnimated = egg.id === clickedEgg;

    const scaleSpring = useSpring({
      from: { scale: 1 },
      scale: egg.scratched && isEggAnimated ? 1.2 : 1,
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
      to: { 
        transform: isEggAnimated ? 'scale(1) rotate(360deg)' : 'scale(1)',  // Conditional rotation
      },
      from: {
        transform: isEggAnimated ? 'scale(0.5) rotate(0deg)' : 'scale(1)', // Initial state without rotation if not animated
      },
      config: { tension: 200, friction: 15 },
      delay: 0,
    });

    return (
      <animated.div
        style={{
          width: '102%',
          height: '102%',
          display: 'flex',
          justifyContent: 'center',
          border: '1px solid rgba(155, 120, 9, 1)',
          alignItems: 'center',
          cursor: egg.scratched ? 'default' : 'pointer',
          background: 'rgba(57, 42, 54, 1)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          padding: '6px',
          transition: 'background 0.3s',
          position: 'relative',
          left:-8,
          overflow: 'hidden',
          margin: 'auto',
        }}
        onClick={handleClick}
      >
        {egg.scratched ? (
          <>
            {egg.showCracked && !showItem && egg.id === clickedEgg ? (
              <animated.div style={{scale: scaleSpring.scale,rotate: rotateSpring.rotate,}}><img src={crackedEgg} style={{ width: 50 }} /></animated.div>
            ) : (
              <Box style={{ fontSize: '14px', position: 'relative', width: 50, height: 50 }}>
                <animated.div style={{scale: scaleSpring.scale,rotate: rotateSpring.rotate,}}><img 
                  src={crackedEgg} 
                  style={{ 
                    width: 50, 
                    position: 'absolute', 
                    top: 0, 
                    left: 0 
                  }} 
                /> </animated.div>
                <animated.img
                  src={egg.item}
                  style={{
                    width: egg.item === '/assets/1000.png' ? '100px' : '50px',
                    position: 'absolute',
                    top: egg.item === '/assets/20k.png' ? '10px' : egg.item === '/assets/1000.png' ? '-15px' : '20px',
                    left: egg.item === '/assets/1000.png' ? '-25px' : '0px',
                    ...scaleAndRotate // Spread the animated styles here
                  }}
                />
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

  return (
    <Container maxWidth="sm" style={{ padding: '20px', textAlign: 'center', background:'rgba(69, 32, 37, 1)', height:'100vh'  }}>
      <Box textAlign={'center'}>
        <img src={gameTitle} style={{ width: '65%',position:'relative',top:38,zIndex:1 }} />
      </Box>
      
      <Box sx={{ mb: 4, mt: 2 }}>
        <Grid container spacing={2}>
          {eggs.map((egg) => (
            <Grid item xs={4} key={egg.id} sx={{ height: '70px',  }}>
              <EggItem egg={egg} />
            </Grid>
          ))}
        </Grid>
      </Box>
      
      <Typography variant="body2" color="gold" sx={{ mb: 2 }}>
        Eggs Cracked: {scratchCount} / 12
      </Typography>
      <Box
        sx={{
          position: 'absolute',
          bottom:0,
          width: '100%',
          height: 100,
          left:0,
          backgroundImage: 'url(/assets/coinPile.png)', // Add the background image
          backgroundSize: 'cover', // Ensure the image covers the entire box
          backgroundPosition: 'center', // Center the background image
          backgroundRepeat: 'no-repeat', // Prevent the image from repeating
        }}
      ></Box>
      
      
      
      {isWinner && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} />}
      
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle sx={{ m: 0, p: 2, bgcolor: isWinner ? '#4CAF50' : '#B12B24', color: 'white' }}>
          {isWinner ? '🎉 Congratulations! 🎉' : '😞 Better Luck Next Time 😞'}
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{background:'#FBDC6A'}}>
          <Typography gutterBottom>
            {isWinner 
              ? `You matched 3 ${winningItem?.[0]}! You win ${winningItem?.[0]}!` 
              : 'No matching items found. You lose! Try again!'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{background:'#FBDC6A'}}>
          <Button onClick={handlePlayAgain} autoFocus sx={{ color: isWinner ? 'darkgreen' : '#760504' }}>
            Play Again
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default App;