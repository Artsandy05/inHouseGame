import React, { useEffect, useState } from 'react';
import { Button, Typography, Box, Container, Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField, IconButton } from '@mui/material';
import { useSpring, animated } from '@react-spring/web';
import CloseIcon from '@mui/icons-material/Close';
import Confetti from 'react-confetti';
import CustomTypography from './component/CustomTypography';


const App = () => {
  const [diceResult, setDiceResult] = useState(1);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [resultText, setResultText] = useState('');
  const [animationState, setAnimationState] = useState({ y: 0, rotate: 0, x: 0, z: 0, t: 0 });

  const [openBetDialog, setOpenBetDialog] = useState(false);
  const [betAmount, setBetAmount] = useState(0);
  const [selectedBet, setSelectedBet] = useState('');
  const [bets, setBets] = useState({ bulag: 0, pipi: 0, bingi: 0 });
  const [openDialog, setOpenDialog] = useState(false);

  // Define dice images
  const diceImages = {
    1: '/assets/dice1.png',
    2: '/assets/dice2.png',
    3: '/assets/dice3.png',
    4: '/assets/dice4.png',
    5: '/assets/dice5.png',
    6: '/assets/dice6.png',
  };

  // Define monkey images (bet options)
  const monkeyImages = {
    bulag: '/assets/bulag.png',
    pipi: '/assets/pipi.png',
    bingi: '/assets/bingi.png',
  };

  const diceGameBg = '/assets/dicegamebg.png';

  const X_LIMIT = 100;
  const Z_LIMIT = 50;

  const diceSpring = useSpring({
    transform: `translateY(${animationState.y}px) translateX(${animationState.x}px) translateZ(${animationState.z}px) rotate(${animationState.rotate}deg)`,
    config: { tension: 170, friction: 26 },
  });

  const getRandomDice = () => Math.floor(Math.random() * 6) + 1;

  const startGame = () => {
    setIsGameRunning(true);
    setResultText('');
    setDiceResult(1);

    let bounceCount = 0;
    const interval = setInterval(() => {
      if (bounceCount < 30) {
        setAnimationState((prev) => {
          const newTime = prev.t + 0.1;

          const randomDirectionX = Math.random() > 0.5 ? 1 : -1;
          const randomDirectionZ = Math.random() > 0.5 ? 1 : -1;

          const randomMoveX = Math.sin(newTime * 2) * 50 * randomDirectionX;
          const randomMoveZ = Math.cos(newTime * 2) * 30 * randomDirectionZ;

          const clampedX = clamp(prev.x + randomMoveX, -X_LIMIT, X_LIMIT);
          const clampedZ = clamp(prev.z + randomMoveZ, -Z_LIMIT, Z_LIMIT);

          return {
            y: prev.y === -150 ? -20 : prev.y < 0 ? prev.y + 10 : prev.y - 10,
            rotate: prev.rotate + (Math.random() * 30 - 15),
            x: clampedX,
            z: clampedZ,
            t: newTime,
          };
        });

        setDiceResult(getRandomDice());

        bounceCount++;
      } else {
        clearInterval(interval);

        const result = getRandomDice();
        setDiceResult(result);

        let text = '';
        if (result <= 2) text = 'bulag';
        else if (result <= 4) text = 'pipi';
        else text = 'bingi';
        
        setResultText(text);
      }
    }, 150);
  };

  useEffect(() => {
    if (resultText) {
      setOpenDialog(true);
      setTimeout(() => {
        setOpenDialog(false);
      }, 2000); // Close dialog after 2 seconds
    }
  }, [resultText]);

  const nextRound = () => {
    setIsGameRunning(false);
    setDiceResult(1);
    setResultText('');
    setAnimationState({ y: 0, rotate: 0, x: 0, z: 0, t: 0 });
    setBets({ bulag: 0, pipi: 0, bingi: 0 }); // Reset bets
  };

  const clamp = (value, min, max) => {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  };

  const openBetDialogHandler = (betType) => {
    setSelectedBet(betType);
    setOpenBetDialog(true);
  };

  const closeBetDialogHandler = () => {
    setOpenBetDialog(false);
    setBetAmount(0);
  };

  const setBetHandler = (amount) => {
    setBetAmount(amount);
  };

  const submitBetHandler = () => {
    setBets((prevBets) => ({
      ...prevBets,
      [selectedBet]: betAmount,
    }));
    closeBetDialogHandler();
  };

  const resetBetHandler = () => {
    setBetAmount(0);
  };

  const handleCustomBetChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^[0-9]*$/.test(value)) {
      setBetAmount(value);
    }
  };

  

  return (
    <Container sx={{padding:0}}>
      
      <Box display="flex" flexDirection="column" justifyContent="space-between" style={{
        backgroundImage: 'linear-gradient(to bottom, #2196f3, #f50057)', // Linear gradient from blue to red
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
        height: '100vh',
        padding: '20px',
      }}>
        {/* Top Section: Start Game / Next Round Button */}
        <Box display="flex" justifyContent="center" alignItems="center" marginTop="30px">
          {isGameRunning ? (
            <>
              <Dialog 
                open={openDialog} 
                onClose={() => setOpenDialog(false)}
                style={{
                  backgroundColor: 'transparent', // Set the background of the dialog to transparent
                }}
              >
                <DialogTitle
                  style={{
                    background: 'linear-gradient(to right, #6a11cb, #2575fc)',
                    color: 'white',
                    textAlign: 'center',
                    padding: '16px 24px',
                    fontSize: '1.5rem',
                  }}
                >
                  Congratulations, Winners!
                </DialogTitle>
                <DialogContent
                  style={{
                    background: 'transparent', // Make the dialog content background transparent
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    color: '#333',
                    fontSize: '1.2rem',
                  }}
                >
                  <img 
                    src={monkeyImages[resultText]} 
                    alt="Monkey" 
                    style={{ 
                      width: '100%', 
                      maxWidth: '300px', 
                      borderRadius: '8px', 
                      marginTop: '20px',
                    }} 
                  />
                </DialogContent>
                <DialogActions
                  style={{
                    justifyContent: 'center',
                    background: 'linear-gradient(to right, #6a11cb, #2575fc)',
                  }}
                >
                  {/* You can add buttons here if necessary */}
                </DialogActions>
              </Dialog>


              <Button
                variant="contained"
                color="secondary"
                onClick={nextRound}
                style={{
                  marginTop: '20px',
                  backgroundColor: '#f50057',
                  color: 'white',
                  padding: '8px 30px',
                  fontSize: '16px',
                  borderRadius: '50px',
                  textTransform: 'none',
                  width: '100%',
                }}
              >
                Next Round
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={startGame}
              style={{
                backgroundColor: '#4caf50',
                color: 'white',
                padding: '8px 30px',
                fontSize: '16px',
                borderRadius: '50px',
                textTransform: 'none',
                width: '100%',
                marginTop: '20px',
              }}
            >
              Start Game
            </Button>
          )}
        </Box>

        {/* Middle Section: Dice Image */}
        <Box display="flex" justifyContent="center" alignItems="center" marginTop="50px">
          <animated.img
            src={diceImages[diceResult] || '/assets/dice1.png'}
            alt="Dice"
            style={{
              width: '120px',
              height: '120px',
              position: 'relative',
              borderRadius: '15px',
              ...diceSpring,
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
            }}
          />
        </Box>

        {/* Bottom Section: Betting Options */}
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          marginTop="30px" 
          flexWrap="wrap"
          width="100%" 
          gap={2}
          style={{
            marginTop: 'auto', // Pushes the betting section to the bottom
          }}
        >
          {['bulag', 'pipi', 'bingi'].map((betType) => {
            let backgroundColor = '#f0f0f0';
            let textColor = '#2196f3';
            let betTextColor = '#000000';
            let buttonColor = '#2196f3';
            let buttonTextColor = 'white';

            // Color scheme based on the betType
            if (betType === 'bulag') {
              backgroundColor = '#ffeb3b'; // Yellow for Bulag
              textColor = 'white';
              betTextColor = '#000000';
              buttonColor = '#000000';
              buttonTextColor = 'white';
            } else if (betType === 'pipi') {
              backgroundColor = '#8bc34a'; // Green for Pipi
              textColor = '#ffffff';
              betTextColor = '#ffffff';
              buttonColor = '#8bc34a';
              buttonTextColor = 'white';
            } else if (betType === 'bingi') {
              backgroundColor = '#f44336'; // Red for Bingi
              textColor = '#ffffff';
              betTextColor = '#ffffff';
              buttonColor = '#f44336';
              buttonTextColor = 'white';
            }

            return (
              <Box
                key={betType}
                textAlign="center"
                style={{
                  width: '30%',
                  padding: '15px',
                  boxSizing: 'border-box',
                  backgroundColor: backgroundColor,
                  borderRadius: '15px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  marginBottom: '20px',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                }}
              >
                <img
                  src={monkeyImages[betType]}
                  alt={betType}
                  style={{
                    width: '60px',
                    height: '60px',
                    marginBottom: '10px',
                    objectFit: 'contain',
                  }}
                />
                {/* Conditional dice images below */}
                <Box style={{ marginBottom:10 }}>
                  {(betType === 'bulag' || betType === 'pipi' || betType === 'bingi') && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                      <img
                        src={diceImages[betType === 'bulag' ? 1 : betType === 'pipi' ? 3 : 5]}
                        alt="dice 1"
                        style={{ width: '40px', height: '40px', objectFit: 'contain',borderRadius:5 }}
                      />
                      <img
                        src={diceImages[betType === 'bulag' ? 2 : betType === 'pipi' ? 4 : 6]}
                        alt="dice 2"
                        style={{ width: '40px', height: '40px', objectFit: 'contain',borderRadius:5 }}
                      />
                    </div>
                  )}
                </Box>
                <Typography
                  variant="body2"
                  style={{
                    color: betType === 'bulag' ? 'black' : textColor,
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginBottom: '10px',
                  }}
                >
                  {betType.charAt(0).toUpperCase() + betType.slice(1)}
                </Typography>
                <Typography
                  variant="body2"
                  style={{
                    fontSize: '14px',
                    marginBottom: '10px',
                    color: betTextColor,
                  }}
                >
                  ₱ {bets[betType] > 0 ? bets[betType] : '0.00'}
                </Typography>
                <Box>
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    style={{
                      display: 'block',
                      color: betTextColor,
                    }}
                  >
                    Bets: ₱ 0.00
                  </Typography>
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    style={{
                      display: 'block',
                      color: betTextColor,
                    }}
                  >
                    Odds: x0
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => openBetDialogHandler(betType)}
                  style={{
                    marginTop: '15px',
                    backgroundColor: buttonColor,
                    color: buttonTextColor,
                    padding: '8px 20px',
                    fontSize: '14px',
                    borderRadius: '25px',
                    textTransform: 'none',
                  }}
                >
                  BET
                </Button>
              </Box>

            );
          })}
        </Box>

        {/* Result Text and Confetti */}
        <Box textAlign="center" marginTop="30px">
          {resultText && (
            <Confetti width={window.innerWidth} height={window.innerHeight} />
          )}
        </Box>
      </Box>



      {/* Bet Dialog */}
      <Dialog open={openBetDialog} onClose={closeBetDialogHandler} sx={{ borderRadius: '15px' }}>
        <DialogTitle sx={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          textAlign: 'center',
          backgroundColor: '#f5f5f5', 
          padding: '20px',
          color: '#333',
          position: 'relative',
        }}>
          Place Your Bet on {selectedBet.charAt(0).toUpperCase() + selectedBet.slice(1)}
          <IconButton
            edge="end"
            color="inherit"
            onClick={closeBetDialogHandler}
            aria-label="close"
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              color: '#2196f3',
              transition: '0.3s',
              '&:hover': {
                color: '#f50057',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ padding: '20px' }}>
          <Grid container spacing={2} justifyContent="center">
            {[10, 50, 100, 1000, 2000, 5000, 10000, 20000, 50000].map((amount) => (
              <Grid item xs={4} key={amount}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => setBetHandler(amount)}
                  sx={{
                    fontWeight: 'bold',
                    fontSize: '12px',
                    padding: '8px 0',
                    borderRadius: '12px',
                    textTransform: 'none',
                    transition: '0.3s',
                    backgroundColor: amount === 10 ? '#ff4081' : 
                      amount === 50 ? '#00c853' : 
                      amount === 100 ? '#2196f3' : 
                      amount === 1000 ? '#ff9800' : 
                      amount === 2000 ? '#9c27b0' : 
                      amount === 5000 ? '#00bcd4' : 
                      amount === 10000 ? '#673ab7' : 
                      amount === 20000 ? '#f44336' : 
                      '#4caf50',
                    '&:hover': {
                      backgroundColor: amount === 10 ? '#f50057' : 
                        amount === 50 ? '#00e676' : 
                        amount === 100 ? '#1976d2' : 
                        amount === 1000 ? '#ff5722' : 
                        amount === 2000 ? '#7b1fa2' : 
                        amount === 5000 ? '#0097a7' : 
                        amount === 10000 ? '#512da8' : 
                        amount === 20000 ? '#d32f2f' : 
                        '#388e3c',
                    },
                  }}
                >
                  ₱{amount}
                </Button>
              </Grid>
            ))}
          </Grid>

          <TextField
            label="Custom Bet"
            value={betAmount}
            onChange={handleCustomBetChange}
            fullWidth
            margin="normal"
            type="number"
            variant="outlined"
            InputProps={{
              startAdornment: <Typography sx={{ marginRight: 1, color: '#2196f3' }}>₱</Typography>,
            }}
            sx={{
              marginTop: '20px',
              maxWidth: '300px', // Adjust the width
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                borderColor: '#2196f3',
              },
              '& .MuiInputLabel-root': {
                fontSize: '14px',
                color: '#666',
              },
              '& .MuiInputBase-root': {
                fontSize: '16px',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#1976d2',
              },
            }}
          />
        </DialogContent>

        <DialogActions sx={{ padding: '20px', justifyContent: 'center' }}>
          <Button
            onClick={resetBetHandler}
            color="secondary"
            sx={{
              fontSize: '14px',
              padding: '10px 20px',
              backgroundColor: '#f50057',
              borderRadius: '20px',
              color: 'white',
              '&:hover': {
                backgroundColor: '#c51162',
              },
            }}
          >
            Reset
          </Button>
          <Button
            onClick={submitBetHandler}
            color="primary"
            sx={{
              fontSize: '14px',
              padding: '10px 20px',
              backgroundColor: '#2196f3',
              borderRadius: '20px',
              color: 'white',
              '&:hover': {
                backgroundColor: '#1976d2',
              },
            }}
          >
            Submit Bet
          </Button>
        </DialogActions>
      </Dialog>




    </Container>
  );
};

export default App;
