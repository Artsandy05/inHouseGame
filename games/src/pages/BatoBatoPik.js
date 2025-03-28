import React, { useEffect, useState } from "react";
import { Button, Typography, Box, Container, TextField, Dialog, IconButton, DialogContent, DialogTitle, InputAdornment } from "@mui/material";
import { useSpring, animated } from "@react-spring/web";
import CloseIcon from '@mui/icons-material/Close';
import { playerStore } from "../utils/playerStore";
import { getRequiredUrl } from "../services/common";
import moderatorStore from "../utils/Store";
import { formatWinnerAmount, GameState, mapToArray } from "../utils/gameutils";
import { usePlayerStore } from "../context/PlayerStoreContext";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TimerIcon from '@mui/icons-material/Timer';
import CasinoIcon from '@mui/icons-material/Casino';
import SavingsIcon from '@mui/icons-material/Savings';
import StackedBarChartIcon from '@mui/icons-material/StackedBarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BalanceIcon from '@mui/icons-material/Balance';


// Image assets
const images = {
  rock: {
    left: "/assets/rock-left.png",
    right: "/assets/rock-right.png",
  },
  paper: {
    left: "/assets/paper-left.png",
    right: "/assets/paper-right.png",
  },
  scissors: {
    left: "/assets/scissor-left.png",
    right: "/assets/scissor-right.png",
  },
  vs: "/assets/vs.png",
};

const getRandomChoice = () => {
  const choices = ["rock", "paper", "scissors"];
  return choices[Math.floor(Math.random() * choices.length)];
};

const BatoBatoPik = () => {
  const [juanChoice, setJuanChoice] = useState('');
  const [pedroChoice, setPedroChoice] = useState('');
  const [roundResult, setRoundResult] = useState("");
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [juanBet, setJuanBet] = useState(0);
  const [pedroBet, setPedroBet] = useState(0);
  const [tieBet, setTieBet] = useState(0);
  const [openBetDialog, setOpenBetDialog] = useState(false);
  const [betType, setBetType] = useState("");
  const [betAmount, setBetAmount] = useState(0);
  const url = getRequiredUrl();
  const { gameState, setPlayerInfo, sendMessage, countdown, slots,setSlots,odds, allBets,winningBall } = playerStore();
  const { connect } = playerStore.getState();

  


  if (!url) {
    throw new Error(`No valid url: ${url}`);
  }

  // Spring animation for tilting Juan's and Pedro's images
  const [juanTilt, setJuanTilt] = useState(0);
  const [pedroTilt, setPedroTilt] = useState(0);
  const userData = JSON.parse(localStorage.getItem('user') || 'null');

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
      startGame();
    }
  }, [gameState]);

  useEffect(() => {
    if(gameState === GameState.Open){
      nextRound();
    }
  }, [gameState]);
  

  useEffect(() => {
    // Check if gameState is not "Open"
    if (countdown === 0 ) {
      setOpenBetDialog(false);
    }
  }, [countdown]);

  // Logic for determining the winner
  const determineWinner = (juan, pedro) => {
    if (juan === pedro) return "tie";
    if (
      (juan === "rock" && pedro === "scissors") ||
      (juan === "scissors" && pedro === "paper") ||
      (juan === "paper" && pedro === "rock")
    ) {
      return "juan";
    }
    return "pedro";
  };
  
  
  const startGame = () => {
    setIsGameRunning(true);
    const juanChoice = getRandomChoice();
    const pedroChoice = getRandomChoice();
    setJuanChoice(null);
    setPedroChoice(null);

    setJuanTilt(0);
    setPedroTilt(0);

    let tiltCount = 0;
    const interval = setInterval(() => {
      if (tiltCount < 6) {
        setJuanTilt((prev) => (prev === 0 ? -30 : 0));
        setPedroTilt((prev) => (prev === 0 ? 30 : 0));
        tiltCount++;
      } else {
        clearInterval(interval);
        setJuanChoice(juanChoice);
        setPedroChoice(pedroChoice);
        //setRoundResult(determineWinner(juanChoice, pedroChoice));
        sendMessage(
          JSON.stringify({
            cmd: GameState.WinnerDeclared,
            game: "bbp",
            winnerOrders: determineWinner(juanChoice, pedroChoice),
            uuid: userData.userData.data.user.uuid,
          })
        );
      }
    }, 250);
  };

  const nextRound = () => {
    setIsGameRunning(false);
    setJuanChoice(null);
    setPedroChoice(null);
    setRoundResult("");
    setJuanBet(0);
    setPedroBet(0);
    setTieBet(0);
  };


  const handleBetClick = (type) => {
    setBetType(type);
    setOpenBetDialog(true);
  };
  
  // handleBetAmountChange: e is a ChangeEvent from the input element
  const handleBetAmountChange = (e) => {
    setBetAmount(Number(e.target.value));
  };
  
  // handleBetValue: value is a number (bet amount)
  const handleBetValue = (value) => {
    setBetAmount(value);
  };

  const handlePlaceBet = () => {
    if (betAmount > 0) {
      if (parseFloat(betAmount) < 5) {
        alert("Minimum bet amount is 5");
        return;
      }
      if ((userData.userData.data.wallet.balance - parseFloat(betAmount)) < 0) {
        alert("Insufficient Balance");
        return;
      }
      const hasSlots = slots.has(betType);

      if (hasSlots) {
        let currentValue = slots.get(betType);
        slots.set(betType, currentValue += parseFloat(betAmount));
      }else{
        slots.set(betType, parseFloat(betAmount));
      }

      setSlots(new Map(slots));
      sendMessage(
        JSON.stringify({game: 'bbp', slots: mapToArray(slots)})
      );
      if (betType === "juan") setJuanBet(betAmount);
      if (betType === "pedro") setPedroBet(betAmount);
      if (betType === "tie") setTieBet(betAmount);
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

  // Animation for tilting
  const juanSpring = useSpring({
    transform: `rotate(${juanTilt}deg)`,
    config: { tension: 180, friction: 12 },
  });

  const pedroSpring = useSpring({
    transform: `rotate(${pedroTilt}deg)`,
    config: { tension: 180, friction: 12 },
  });

  const getOdds = (betType) => {
    let str = "0.00";
    if (odds.has(betType)) {
      return odds.get(betType);
    }
    return Number(parseFloat(str).toFixed(2));
  };

  // Dynamically set the dialog colors based on the bet type
  const getDialogTheme = (type) => {
    switch (type) {
      case "juan":
        return {
          dialogBackground: "linear-gradient(135deg, #006400 0%, #2E8B57 50%, #66b266 100%)",
          buttonBackground: "#228B22",
          titleColor: "#fff",
          placeBetColor: "#32CD32",
          clearButtonColor: '#3CB371',
          inputLabelColor: "#FFD700",
          inputBorderColor: "#228B22",
          hoverButtonColor: "#006400",
          clearHoverColor: "#32CD32",
          placeBetHoverColor: "#228B22",
          buttonShadow: "0 4px 6px rgba(0, 100, 0, 0.3)",
          textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)", // Darker shadow for better contrast
          titleFont: "'Paytone One', sans-serif", // Bold and impactful
          buttonFont: "'Montserrat', sans-serif", // Clean and readable
          valueFont: "'Orbitron', sans-serif", // Digital look for amounts
          inputFont: "'Quicksand', sans-serif" // Clean and modern
        };
      case "pedro":
        return {
          dialogBackground: "linear-gradient(135deg, #8B0000 0%, #B22222 50%, #D2691E 100%)",
          buttonBackground: "#DC143C",
          titleColor: "#fff",
          placeBetColor: "#FF4500",
          clearButtonColor: "#F0E68C",
          inputLabelColor: "#FFD700",
          inputBorderColor: "#DC143C",
          hoverButtonColor: "#8B0000",
          buttonShadow: "0 4px 6px rgba(139, 0, 0, 0.3)",
          textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
          titleFont: "'Bangers', cursive", // Bold and aggressive
          buttonFont: "'Montserrat', sans-serif",
          valueFont: "'Orbitron', sans-serif",
          inputFont: "'Quicksand', sans-serif"
        };
      case "tie":
        return {
          dialogBackground: "linear-gradient(135deg, #4682B4 0%, #5F9EA0 50%, #87CEEB 100%)",
          buttonBackground: "#5F9EA0",
          titleColor: "#fff",
          placeBetColor: "#00BFFF",
          clearButtonColor: "#ADD8E6",
          inputLabelColor: "#FFD700",
          inputBorderColor: "#5F9EA0",
          hoverButtonColor: "#4682B4",
          buttonShadow: "0 4px 6px rgba(70, 130, 180, 0.3)",
          textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
          titleFont: "'Orbitron', sans-serif", // Futuristic for tie
          buttonFont: "'Montserrat', sans-serif",
          valueFont: "'Orbitron', sans-serif",
          inputFont: "'Quicksand', sans-serif"
        };
      default:
        return {
          dialogBackground: "linear-gradient(135deg, #222 0%, #444 50%, #666 100%)",
          buttonBackground: "#444",
          titleColor: "#FFD700",
          placeBetColor: "#FF8C00",
          clearButtonColor: "#D3D3D3",
          inputLabelColor: "#FFD700",
          inputBorderColor: "#444",
          hoverButtonColor: "#222",
          buttonShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
          textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
          titleFont: "'Permanent Marker', cursive", // Handwritten style
          buttonFont: "'Montserrat', sans-serif",
          valueFont: "'Orbitron', sans-serif",
          inputFont: "'Quicksand', sans-serif"
        };
    }
  };
  
  const { 
    dialogBackground, 
    buttonBackground, 
    titleColor, 
    clearButtonColor, 
    placeBetColor, 
    inputLabelColor, 
    inputBorderColor, 
    hoverButtonColor, 
    clearHoverColor,
    placeBetHoverColor,
    buttonShadow,
    textShadow,
    titleFont,
    buttonFont,
    valueFont,
    inputFont
  } = getDialogTheme(betType);

  return (
    <Container
      sx={{
        backgroundImage: "url('/assets/rps_background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "#fff",
        textAlign: "center",
        flexDirection: "column", // Changed to column for proper layout
        position: "absolute", // Ensure positioning of buttons at the bottom
      }}
    >
      <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.2)', // Adjust opacity (0.7) to control darkness
        backgroundImage: `
          linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.3) 0%,
            rgba(0, 0, 0, 0.3) 50%,
            rgba(0, 0, 0, 0.3) 100%
          )`, // Gradient for depth
        zIndex: 0, // Ensure it stays behind content
        pointerEvents: 'none', // Allows clicks to pass through
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.5) 100%)', // Radial gradient for vignette effect
          mixBlendMode: 'multiply'
        }
      }}
    />
      {/* Winner Announcement - Enhanced with animation and better styling */}
      {gameState === GameState.WinnerDeclared && (
        <Box
          sx={{
            position: 'absolute',
            top: 100,
            left: 0,
            right: 0,
            textAlign: 'center',
            zIndex: 10,
            animation: 'pulse 1.5s infinite',
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.1)' },
              '100%': { transform: 'scale(1)' },
            }
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontFamily: "'Bangers', cursive",
              fontSize: "3.5rem",
              color: "#ffd700",
              textShadow: `
                3px 3px 0 #000,
                -1px -1px 0 #000,  
                1px -1px 0 #000,
                -1px 1px 0 #000,
                1px 1px 0 #000`,
              letterSpacing: '2px',
              lineHeight: 1.2,
              padding: '10px 20px',
              background: 'rgba(0,0,0,0.7)',
              borderRadius: '10px',
              display: 'inline-block',
              boxShadow: '0 0 20px rgba(255,215,0,0.5)'
            }}
          >
            {winningBall.bbp === 'juan' ? 'JUAN WINS!' : 
            winningBall.bbp === 'pedro' ? 'PEDRO WINS!' : 
            'ITS A TIE!'}
          </Typography>
        </Box>
      )}

      {/* User Info Panel - Enhanced with card-like design */}
      <Box sx={{ 
        position: "absolute", 
        top: 20, 
        left: 20,
        background: 'rgba(0,0,0,0.7)',
        padding: '10px 10px',
        borderRadius: '12px',
        borderLeft: '4px solid #4CAF50',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(5px)',
        zIndex: 1,
        height: 60
      }}>
        <Typography variant="h6" sx={{ 
          fontSize: "1.2rem",
          fontWeight: 'bold',
          color: "#4CAF50",
          marginBottom: '4px'
        }}>
          {userData?.userData?.data?.user?.firstName} {userData?.userData?.data?.user?.lastName}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AccountBalanceWalletIcon sx={{ color: '#FFD700', marginRight: '8px' }} />
          <Typography sx={{ 
            fontSize: "1rem",
            color: "#fff",
            fontWeight: '500'
          }}>
            ₱ {userData?.userData?.data?.wallet?.balance.toLocaleString()}
          </Typography>
        </Box>
      </Box>

      {/* Game Status Panel - Enhanced with dynamic color based on state */}
      <Box sx={{ 
        position: "absolute", 
        top: 20, 
        right: 20,
        background: 'rgba(0,0,0,0.7)',
        padding: '12px 20px',
        borderRadius: '12px',
        borderLeft: '4px solid',
        borderLeftColor: gameState === 'Open' ? '#4CAF50' : 
                        gameState === 'LastCall' ? '#FFC107' : 
                        gameState === 'Closed' ? '#F44336' : '#9E9E9E',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(5px)',
        zIndex: 1,
        height: 60
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          <AccessTimeIcon sx={{ 
            color: gameState === 'Open' ? '#4CAF50' : 
                  gameState === 'LastCall' ? '#FFC107' : 
                  gameState === 'Closed' ? '#F44336' : '#9E9E9E',
            marginRight: '8px' 
          }} />
          <Typography variant="h6" sx={{ 
            fontSize: "1.2rem",
            fontWeight: 'bold',
            color: gameState === 'Open' ? '#4CAF50' : 
                  gameState === 'LastCall' ? '#FFC107' : 
                  gameState === 'Closed' ? '#F44336' : '#9E9E9E'
          }}>
            {["Open", "LastCall", "Closed"].includes(gameState) ? gameState.toUpperCase() : ""}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TimerIcon sx={{ color: '#03A9F4', marginRight: '8px' }} />
          <Typography sx={{ 
            fontSize: "1rem",
            color: "#fff",
            fontWeight: '500'
          }}>
            {countdown} SECONDS
          </Typography>
        </Box>
      </Box>
      <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" height={"100vh"} zIndex={1}>
        <Box display="flex" justifyContent="space-around" alignItems="center" marginTop="50px">
          {/* Juan's Image */}
          <Box>
            <animated.img
              src={juanChoice ? images[juanChoice].left : images.rock.left}
              alt="Juan"
              style={{
                ...juanSpring,
                width: "150px",
                height: "150px",
                position: "relative",
                bottom: "0",
              }}
            />
            <Typography variant="h6" sx={{ fontFamily: "rock salt", fontSize: "1.5rem", color: "lightgreen" }}>
              Juan
            </Typography>
            <Button
              variant="contained"
              color="success"
              onClick={() => handleBetClick("juan")}
              disabled={!(["Open", "LastCall"].includes(gameState))}
              sx={{
                padding: "12px 16px",
                fontSize: "1rem",
                marginTop: 0.5,
                borderRadius: "14px",
                marginLeft: 4,
                transition: "all 0.3s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #006400 0%, #228B22 50%, #32CD32 100%)",
                boxShadow: "0 4px 8px rgba(0, 100, 0, 0.3)",
                fontFamily: "'Paytone One', sans-serif",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                minWidth: "140px",
                "&:hover": {
                  background: "linear-gradient(135deg, #228B22 0%, #32CD32 50%, #66b266 100%)",
                  transform: "translateY(-3px)",
                  boxShadow: "0 6px 12px rgba(0, 100, 0, 0.4)"
                },
                ...(countdown === 0 && {
                  background: "#333",
                  color: "#666",
                  cursor: "not-allowed",
                  "&:hover": {
                    background: "#333",
                    transform: "none",
                    boxShadow: "0 4px 8px rgba(0, 100, 0, 0.3)"
                  },
                }),
              }}
            >
              {/* Main button label with icon */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CasinoIcon sx={{ fontSize: "1.2rem" }} /> {/* Changed to Casino icon for betting feel */}
                <Typography sx={{ 
                  fontFamily: "'Bangers', cursive",
                  fontSize: "1.2rem",
                  letterSpacing: "1px",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.3)"
                }}>
                  JUAN
                </Typography>
              </Box>

              {/* Bet information sections */}
              <Box sx={{ width: "100%", mt: 1, textAlign: "center" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <SavingsIcon sx={{ fontSize: "0.9rem", color: "#00ff9a" }} /> {/* Single coin icon */}
                  <Typography sx={{ 
                    fontSize: "0.8rem", 
                    color: "#00ff9a",
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: "bold"
                  }}>
                    My bet: <span style={{fontSize:15}}>₱</span>{slots.get('juan') ? `${slots.get('juan')}` : 0}
                  </Typography>
                </Box>
                
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
                  <StackedBarChartIcon sx={{ fontSize: "0.9rem", color: "cyan", transform: "rotate(90deg)" }} /> {/* Pile of coins representation */}
                  <Typography sx={{ 
                    fontSize: "0.8rem", 
                    color: "cyan",
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: "bold"
                  }}>
                    Bets: <span style={{fontSize:15}}>₱</span>{allBets?.has('juan') ? `${formatWinnerAmount(allBets.get('juan'))}` : 0}
                  </Typography>
                </Box>
                
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
                  <ShowChartIcon sx={{ fontSize: "0.9rem", color: "yellow" }} /> {/* Trending icon for odds */}
                  <Typography sx={{ 
                    fontSize: "0.8rem", 
                    color: "yellow",
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: "bold",
                    textShadow: "0 0 4px rgba(255,255,0,0.5)"
                  }}>
                    Odds: {getOdds('juan') ? `x${parseFloat(getOdds('juan')).toFixed(2)}` : 'x0'}
                  </Typography>
                </Box>
              </Box>
            </Button>

          </Box>

          {/* VS Image */}
          <img src={images.vs} alt="vs" style={{ width: "60px", height: "60px", position:'relative', top: -50 }} />

          {/* Pedro's Image */}
          <Box>
            <animated.img
              src={pedroChoice ? images[pedroChoice].right : images.rock.right}
              alt="Pedro"
              style={{
                width: "150px",
                height: "150px",
                position: "relative",
                bottom: "0",
                ...pedroSpring,
              }}
            />
            <Typography variant="h6" sx={{ fontFamily: "rock salt", fontSize: "1.5rem", color: "lightcoral", position: "relative", left:-15 }}>
              Pedro
            </Typography>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleBetClick("pedro")}
              disabled={!(["Open", "LastCall"].includes(gameState))}
              sx={{
                padding: "12px 16px",
                fontSize: "1rem",
                borderRadius: "14px",
                marginTop: 0.5,
                marginLeft: -1,
                transition: "all 0.3s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #8B0000 0%, #A52A2A 50%, #D2691E 100%)",
                boxShadow: "0 4px 8px rgba(139, 0, 0, 0.3)",
                fontFamily: "'Paytone One', sans-serif",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                minWidth: "140px",
                "&:hover": {
                  background: "linear-gradient(135deg, #A52A2A 0%, #DC143C 50%, #FF4500 100%)",
                  transform: "translateY(-3px)",
                  boxShadow: "0 6px 12px rgba(139, 0, 0, 0.4)"
                },
                ...(countdown === 0 && {
                  background: "#333",
                  color: "#666",
                  cursor: "not-allowed",
                  "&:hover": {
                    background: "#333",
                    transform: "none",
                    boxShadow: "0 4px 8px rgba(139, 0, 0, 0.3)"
                  },
                }),
              }}
            >
              {/* Main button label with icon */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CasinoIcon sx={{ fontSize: "1.2rem" }} />
                <Typography sx={{ 
                  fontFamily: "'Bangers', cursive",
                  fontSize: "1.2rem",
                  letterSpacing: "1px",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.3)"
                }}>
                  PEDRO
                </Typography>
              </Box>

              {/* Bet information sections */}
              <Box sx={{ width: "100%", mt: 1, textAlign: "center" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <SavingsIcon sx={{ fontSize: "0.9rem", color: "#00ff9a" }} />
                  <Typography sx={{ 
                    fontSize: "0.8rem", 
                    color: "#00ff9a",
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: "bold"
                  }}>
                    My bet: <span style={{fontSize:15}}>₱</span>{slots.get('pedro') ? `${slots.get('pedro')}` : 0}
                  </Typography>
                </Box>
                
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
                  <StackedBarChartIcon sx={{ fontSize: "0.9rem", color: "cyan", transform: "rotate(90deg)" }} />
                  <Typography sx={{ 
                    fontSize: "0.8rem", 
                    color: "cyan",
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: "bold"
                  }}>
                    Bets: <span style={{fontSize:15}}>₱</span>{allBets?.has('pedro') ? `${formatWinnerAmount(allBets.get('pedro'))}` : 0}
                  </Typography>
                </Box>
                
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
                  <ShowChartIcon sx={{ fontSize: "0.9rem", color: "yellow" }} />
                  <Typography sx={{ 
                    fontSize: "0.8rem", 
                    color: "yellow",
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: "bold",
                    textShadow: "0 0 4px rgba(255,255,0,0.5)"
                  }}>
                    Odds: {getOdds('pedro') ? `x${parseFloat(getOdds('pedro')).toFixed(2)}` : 'x0'}
                  </Typography>
                </Box>
              </Box>
            </Button>

          </Box>
        </Box>

        {/* Centered Tie Bet */}
        <Typography variant="h6" sx={{ fontFamily: "rock salt", fontSize: "1.5rem", color: "lightblue" }}>
              Tie
            </Typography>
        <Box marginTop={-2} textAlign="center">
        <Button
          variant="contained"
          color="info"
          onClick={() => handleBetClick("tie")}
          disabled={!(["Open", "LastCall"].includes(gameState))}
          sx={{
            padding: "12px 16px",
            fontSize: "1rem",
            marginTop: "20px",
            borderRadius: "14px",
            transition: "all 0.3s ease",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #4682B4 0%, #5F9EA0 50%, #00BFFF 100%)",
            boxShadow: "0 4px 8px rgba(70, 130, 180, 0.3)",
            fontFamily: "'Paytone One', sans-serif",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            minWidth: "140px",
            "&:hover": {
              background: "linear-gradient(135deg, #5F9EA0 0%, #00BFFF 50%, #4682B4 100%)",
              transform: "translateY(-3px)",
              boxShadow: "0 6px 12px rgba(70, 130, 180, 0.4)"
            },
            ...(countdown === 0 && {
              background: "#333",
              color: "#666",
              cursor: "not-allowed",
              "&:hover": {
                background: "#333",
                transform: "none",
                boxShadow: "0 4px 8px rgba(70, 130, 180, 0.3)"
              },
            }),
          }}
        >
          {/* Main button label with icon */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BalanceIcon sx={{ fontSize: "1.2rem" }} /> {/* Changed to Balance icon for tie */}
            <Typography sx={{ 
              fontFamily: "'Bangers', cursive",
              fontSize: "1.2rem",
              letterSpacing: "1px",
              textShadow: "1px 1px 2px rgba(0,0,0,0.3)"
            }}>
              TIE
            </Typography>
          </Box>

          {/* Bet information sections */}
          <Box sx={{ width: "100%", mt: 1, textAlign: "center" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <SavingsIcon sx={{ fontSize: "0.9rem", color: "#00ff9a" }} />
              <Typography sx={{ 
                fontSize: "0.8rem", 
                color: "#00ff9a",
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: "bold"
              }}>
                My bet: <span style={{fontSize:15}}>₱</span>{slots.get('tie') ? `${slots.get('tie')}` : 0}
              </Typography>
            </Box>
            
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
              <StackedBarChartIcon sx={{ fontSize: "0.9rem", color: "cyan", transform: "rotate(90deg)" }} />
              <Typography sx={{ 
                fontSize: "0.8rem", 
                color: "cyan",
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: "bold"
              }}>
                Bets: <span style={{fontSize:15}}>₱</span>{allBets?.has('tie') ? `${formatWinnerAmount(allBets.get('tie'))}` : 0}
              </Typography>
            </Box>
            
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
              <ShowChartIcon sx={{ fontSize: "0.9rem", color: "yellow" }} />
              <Typography sx={{ 
                fontSize: "0.8rem", 
                color: "yellow",
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: "bold",
                textShadow: "0 0 4px rgba(255,255,0,0.5)"
              }}>
                Odds: {getOdds('tie') ? `x${parseFloat(getOdds('tie')).toFixed(2)}` : 'x0'}
              </Typography>
            </Box>
          </Box>
        </Button>
        </Box>
      </Box>

      {/* Bet Dialog */}
      <Dialog
        open={openBetDialog}
        onClose={handleDialogClose}
        PaperProps={{
          sx: {
            background: dialogBackground,
            borderRadius: "16px",
            color: "#fff",
            padding:'10px 0px',
            width: "420px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(5px)",
            overflow: "hidden",
            position: "relative",
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'rgba(255, 255, 255, 0.2)',
            }
          },
        }}
      >
        <IconButton
          edge="end"
          color="inherit"
          onClick={handleDialogClose}
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            fontSize: "1.5rem",
            transition: "all 0.3s ease",
            '&:hover': {
              transform: "rotate(90deg)",
              color: placeBetColor
            }
          }}
        >
          <CloseIcon />
        </IconButton>

        <DialogTitle
          sx={{
            fontFamily: titleFont,
            textAlign: "center",
            color: titleColor,
            fontWeight: "700",
            fontSize: "1.8rem",
            marginBottom: "8px",
            textShadow: textShadow,
            letterSpacing: betType === 'pedro' ? '2px' : '0.5px',
            pt: 0,
            textTransform: betType === 'pedro' ? 'uppercase' : 'none'
          }}
        >
          Place Your Bet
        </DialogTitle>

        <DialogContent sx={{ pt: 0 }}>
          <TextField
            type="number"
            value={betAmount}
            onChange={handleBetAmountChange}
            fullWidth
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ color: inputLabelColor }}>
                  $
                </InputAdornment>
              ),
            }}
            sx={{
              marginBottom: 2,
              input: { 
                color: "#fff", 
                fontWeight: "500",
                fontFamily: inputFont,
                fontSize: "1.1rem"
              },
              label: { 
                color: inputLabelColor, 
                fontWeight: "700",
                fontFamily: titleFont,
                transform: "translate(14px, 14px) scale(1)",
                textShadow: textShadow
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '& fieldset': {
                  borderColor: inputBorderColor,
                  borderWidth: "2px"
                },
                '&:hover fieldset': {
                  borderColor: placeBetColor,
                },
                '&.Mui-focused fieldset': {
                  borderColor: placeBetColor,
                  boxShadow: `0 0 0 2px ${placeBetColor}33`
                },
              },
              '& .MuiInputAdornment-root': {
                marginRight: "8px"
              }
            }}
          />

          <Box 
            display="grid" 
            gridTemplateColumns="repeat(3, 1fr)" 
            gap={1.5} 
            sx={{ 
              marginBottom: 2,
              '& button': {
                transition: 'all 0.2s ease'
              }
            }}
          >
            {[10, 20, 50, 500, 1000, 5000, 10000, 20000, 50000].map((value) => (
              <Button
                key={value}
                variant="outlined"
                onClick={() => handleBetValue(value)}
                sx={{
                  fontSize: "0.7rem",
                  padding: "12px 8px",
                  borderRadius: "10px",
                  fontWeight: "700",
                  color: titleColor,
                  backgroundColor: `${buttonBackground}cc`,
                  border: "none",
                  boxShadow: buttonShadow,
                  fontFamily: valueFont, // Digital-looking font for amounts
                  letterSpacing: "1px",
                  "&:hover": {
                    backgroundColor: hoverButtonColor,
                    transform: "translateY(-2px)",
                    boxShadow: `0 6px 8px ${buttonShadow.split(' ')[3].replace('0.3', '0.4')}`
                  },
                  "&:active": {
                    transform: "translateY(0)"
                  }
                }}
              >
                ${value.toLocaleString()}
              </Button>
            ))}
          </Box>

          <Box 
            display="flex" 
            justifyContent="space-between" 
            sx={{ 
              marginTop: 3, 
              gap: 2,
              '& button': {
                flex: 1,
                height: '48px',
                fontSize: '1rem',
                fontFamily: buttonFont,
                fontWeight: '700',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                transition: 'all 0.3s ease',
                boxShadow: buttonShadow,
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: `0 7px 14px ${buttonShadow.split(' ')[3].replace('0.3', '0.5')}`
                },
                '&:active': {
                  transform: 'translateY(0)'
                }
              }
            }}
          >
            <Button
              onClick={handleClearBet}
              sx={{
                color: betType === 'pedro' ? '#333' : "#fff",
                backgroundColor: clearButtonColor,
                borderRadius: "12px",
                border: "none",
                "&:hover": {
                  backgroundColor: clearHoverColor,
                  boxShadow: `0 7px 14px rgba(0, 0, 0, 0.2)`
                },
              }}
            >
              Clear
            </Button>

            <Button
              onClick={handlePlaceBet}
              sx={{
                color: "#fff",
                backgroundColor: placeBetColor,
                borderRadius: "12px",
                border: "none",
                "&:hover": {
                  backgroundColor: placeBetHoverColor,
                },
              }}
            >
              Place Bet
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Fixed Position Buttons at Bottom */}
      
    </Container>
  );
};

export function VoidMessageDialog() {
  return (
    <div>
      <p>VOID GAME</p>
    </div>
  );
}

export default BatoBatoPik;