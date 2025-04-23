import React, { useEffect, useState } from "react";
import { Button, Typography, Box, Container, TextField, Dialog, IconButton, DialogContent, DialogTitle, InputAdornment } from "@mui/material";
import { useSpring, animated } from "@react-spring/web";
import CloseIcon from '@mui/icons-material/Close';
import { playerStore } from "../utils/batobatoPik";
import { getRequiredUrl } from "../services/common";
import moderatorStore from "../utils/batobatoPikModerator";
import { formatTruncatedMoney, formatWinnerAmount, GameState, mapToArray } from "../utils/gameutils";
import { usePlayerStore } from "../context/PlayerStoreContext";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TimerIcon from '@mui/icons-material/Timer';
import CasinoIcon from '@mui/icons-material/Casino';
import SavingsIcon from '@mui/icons-material/Savings';
import StackedBarChartIcon from '@mui/icons-material/StackedBarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BalanceIcon from '@mui/icons-material/Balance';
import createEncryptor from "../utils/createEncryptor";
import { useSearchParams } from "react-router-dom";
import GameHistoryPanel from "../components/BatoBatoPikGameHistory";


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

const encryptor = createEncryptor(process.env.REACT_APP_DECRYPTION_KEY);
const BatoBatoPik = () => {
  const [roundResult, setRoundResult] = useState("");
  const [juanChoiceFinal, setJuanChoiceFinal] = useState(null);
  const [pedroChoiceFinal, setPedroChoiceFinal] = useState(null);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [juanBet, setJuanBet] = useState(0);
  const [pedroBet, setPedroBet] = useState(0);
  const [tieBet, setTieBet] = useState(0);
  const [openBetDialog, setOpenBetDialog] = useState(false);
  const [betType, setBetType] = useState("");
  const [betAmount, setBetAmount] = useState(0);
  const [isAnimationEnd, setIsAnimationEnd] = useState(false);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [voidMessageDialogOpen, setVoidMessageDialogOpen] = useState(false);
  
  const { gameState, setPlayerInfo, sendMessage, countdown, slots,setSlots,odds, allBets, winningBall, setUserInfo, topPlayers, juanChoice, pedroChoice, voidMessage } = playerStore();
  const { connect } = playerStore.getState();
  const [searchParams] = useSearchParams();
  const userDetailsParam = searchParams.get('data');
  let decrypted;

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
    if(userInfo){
      setUserInfo(userInfo.userData.data.user);
    }
  }, []);

  useEffect(() => {
    let timer;
  
    if (gameState === GameState.WinnerDeclared) {
      setAnnouncementDialogOpen(true);
    } else {
      timer = setTimeout(() => {
        setAnnouncementDialogOpen(false);
      }, 2000);
    }
  
    return () => clearTimeout(timer);
  }, [gameState]);
  

  // Spring animation for tilting Juan's and Pedro's images
  const [juanTilt, setJuanTilt] = useState(0);
  const [pedroTilt, setPedroTilt] = useState(0);

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
    if(winningBall){
      console.log(winningBall)
    }
  }, [winningBall]);

  useEffect(() => {
    if(voidMessage){
      console.log(voidMessage);
    }
  }, [voidMessage]);

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
    console.log(juanChoice)
    console.log(pedroChoice)
  }, [juanChoice, pedroChoice]);

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
  

  useEffect(() => {
    if(juanChoice && pedroChoice && isAnimationEnd){
      setJuanChoiceFinal(juanChoice);
      setPedroChoiceFinal(pedroChoice);
      setIsAnimationEnd(false);
    }
  }, [juanChoice, pedroChoice, isAnimationEnd]);

  useEffect(() => {
    if(juanChoiceFinal && pedroChoiceFinal){
      sendMessage(
        JSON.stringify({
          cmd: GameState.WinnerDeclared,
          game: "bbp",
          winnerOrders: determineWinner(juanChoiceFinal, pedroChoiceFinal),
          uuid: userInfo.userData.data.user.uuid,
        })
      );
    }
  }, [juanChoiceFinal, pedroChoiceFinal]);
  
  
  const startGame = () => {
    setIsGameRunning(true);
    setJuanChoiceFinal(null);
    setPedroChoiceFinal(null);

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
        setIsAnimationEnd(true);
      }
    }, 250);
  };

  const nextRound = () => {
    setIsGameRunning(false);
    setJuanChoiceFinal(null);
    setPedroChoiceFinal(null);
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
      if ((userInfo.userData.data.wallet.balance - parseFloat(betAmount)) < 0) {
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
      {announcementDialogOpen && (
        <Box
          sx={{
            position: 'absolute',
            top: '40%',
            left: 0,
            right: 0,
            textAlign: 'center',
            zIndex: 10,
            padding: '0 16px',
            animation: 'pulse 1.5s infinite',
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.05)' },
              '100%': { transform: 'scale(1)' },
            }
          }}
        >
          {/* Main Winner Banner */}
          <Box sx={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(50,50,50,0.9) 100%)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '16px',
            border: '3px solid #ffd700',
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.7), 0 0 30px rgba(255, 215, 0, 0.4)',
            transform: 'rotate(-2deg)',
            position: 'relative',
            overflow: 'hidden',
            '&:before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #ffd700, #ff8c00, #ffd700)',
            }
          }}>
            <Typography
              variant="h3"
              sx={{
                fontFamily: "'Bangers', cursive",
                fontSize: { xs: "2.5rem", sm: "3.5rem" },
                color: "#ffd700",
                textShadow: `
                  3px 3px 0 #000,
                  -1px -1px 0 #000,  
                  1px -1px 0 #000,
                  -1px 1px 0 #000,
                  1px 1px 0 #000`,
                letterSpacing: '3px',
                lineHeight: 1.2,
                padding: '8px 16px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '8px',
                display: 'inline-block',
                transform: 'rotate(1deg)',
                position: 'relative',
                zIndex: 1
              }}
            >
              {winningBall.bbp === 'juan' ? 'JUAN WINS!' : 
              winningBall.bbp === 'pedro' ? 'PEDRO WINS!' : 
              'ITS A TIE!'}
              <Box sx={{
                position: 'absolute',
                top: -10,
                right: -10,
                width: '40px',
                height: '40px',
                backgroundImage: 'url(/sparkle.png)',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                filter: 'drop-shadow(0 0 4px gold)',
                animation: 'spin 2s linear infinite',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                }
              }} />
            </Typography>
            
            {/* Confetti Effect */}
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'url(/confetti.png)',
              backgroundSize: 'contain',
              opacity: 0.3,
              pointerEvents: 'none',
              zIndex: 0
            }} />
          </Box>

          {/* Top Players Section - Only shows if there are top players */}
          {topPlayers?.length > 0 && (
            <Box sx={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(30,30,30,0.9) 100%)',
              borderRadius: '16px',
              padding: '16px',
              border: '2px solid rgba(255, 215, 0, 0.5)',
              boxShadow: '0 0 15px rgba(255, 215, 0, 0.3)',
              maxWidth: '400px',
              margin: '0 auto',
              backdropFilter: 'blur(5px)'
            }}>
              <Typography variant="h5" sx={{ 
                color: '#ffd700', 
                fontFamily: "'Bangers', cursive",
                fontSize: { xs: "1.5rem", sm: "1.8rem" },
                marginBottom: '12px',
                letterSpacing: '1px',
                textShadow: '2px 2px 3px rgba(0,0,0,0.8)',
                position: 'relative',
                display: 'inline-block',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -5,
                  left: '10%',
                  right: '10%',
                  height: '3px',
                  background: 'linear-gradient(90deg, transparent, #ffd700, transparent)'
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
                  background: '#ffd700',
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
                        ? 'linear-gradient(90deg, rgba(255,215,0,0.2) 0%, rgba(255,215,0,0.4) 100%)' 
                        : 'rgba(255,255,255,0.05)',
                      border: isCurrentUser ? '1px solid #ffd700' : '1px solid rgba(255,255,255,0.1)',
                      boxShadow: isCurrentUser ? '0 0 10px rgba(255,215,0,0.3)' : 'none',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:before': isCurrentUser ? {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '3px',
                        height: '100%',
                        background: '#ffd700'
                      } : {}
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{
                          width: '24px',
                          height: '24px',
                          background: isCurrentUser ? '#ffd700' : '#fff',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '10px',
                          color: isCurrentUser ? '#000' : '#333',
                          fontWeight: 'bold',
                          fontSize: '0.8rem',
                          boxShadow: '0 0 5px rgba(0,0,0,0.3)'
                        }}>
                          {index + 1}
                        </Box>
                        <Typography sx={{ 
                          color: isCurrentUser ? '#ffd700' : '#fff',
                          fontWeight: isCurrentUser ? 'bold' : 'normal',
                          fontFamily: "'Bangers', cursive",
                          fontSize: { xs: "1.1rem", sm: "1.3rem" },
                          letterSpacing: '1px',
                          textShadow: isCurrentUser ? '0 0 5px rgba(255,215,0,0.7)' : 'none'
                        }}>
                          {player.name} {isCurrentUser && <span style={{ fontSize: '0.8rem' }}>(YOU)</span>}
                        </Typography>
                      </Box>
                      
                      <Box sx={{
                        background: 'rgba(0,0,0,0.4)',
                        borderRadius: '12px',
                        padding: '4px 10px',
                        border: `1px solid ${isCurrentUser ? '#ffd700' : '#444'}`,
                        boxShadow: '0 0 5px rgba(0,0,0,0.3)'
                      }}>
                        <Typography sx={{ 
                          color: isCurrentUser ? '#ffd700' : '#fff',
                          fontWeight: 'bold',
                          fontFamily: "'Bangers', cursive",
                          fontSize: { xs: "1.1rem", sm: "1.3rem" },
                        }}>
                          +{player.prize.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Mobile-optimized User Info Panel */}
      <Box sx={{
        position: "fixed",
        top: 10,
        left: 10,
        right: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.85)',
        padding: '8px 12px',
        borderRadius: '12px',
        border: '1px solid #4CAF50',
        boxShadow: '0 2px 10px rgba(76, 175, 80, 0.3)',
        backdropFilter: 'blur(5px)',
        zIndex: 98,
        maxWidth: 'calc(100% - 20px)'
      }}>
        {/* User Info - Left Side */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          flex: 1,
          mr: 1
        }}>
          <AccountBalanceWalletIcon sx={{ 
            color: '#4CAF50', 
            fontSize: '1rem',
            minWidth: '20px',
            mr: 1
          }} />
          <Typography 
            variant="body2"
            sx={{
              fontWeight: 'bold',
              color: "#fff",
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '0.8rem'
            }}
          >
            {userInfo?.userData?.data?.user?.firstName}
          </Typography>
        </Box>

        {/* Balance - Right Side */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.4)',
          borderRadius: '8px',
          padding: '2px 8px',
          border: '1px solid rgba(255,215,0,0.3)',
          minWidth: 'fit-content'
        }}>
          <Typography sx={{ 
            fontSize: "0.75rem",
            color: "#FFD700",
            fontWeight: '700',
            fontFamily: "'Roboto', sans-serif",
            whiteSpace: 'nowrap'
          }}>
            {formatTruncatedMoney(userInfo?.userData?.data?.wallet?.balance)}
          </Typography>
        </Box>
      </Box>

      {/* Mobile-optimized Game Status Panel with Progress Bar */}
      <Box sx={{
        position: "fixed",
        top: 60, // Below user info
        left: 10,
        right: 10,
        background: 'rgba(0,0,0,0.85)',
        padding: '8px 10px',
        borderRadius: '8px',
        border: '1px solid',
        borderColor: gameState === 'Open' ? '#4CAF50' : 
                    gameState === 'LastCall' ? '#FFC107' : 
                    gameState === 'Closed' ? '#F44336' : '#9E9E9E',
        boxShadow: theme => `0 2px 8px ${gameState === 'Open' ? 'rgba(76, 175, 80, 0.3)' : 
                              gameState === 'LastCall' ? 'rgba(255, 193, 7, 0.3)' : 
                              gameState === 'Closed' ? 'rgba(244, 67, 54, 0.3)' : 'rgba(158, 158, 158, 0.3)'}`,
        backdropFilter: 'blur(5px)',
        zIndex: 99,
        maxWidth: 'calc(100% - 20px)'
      }}>
        {/* Top Row - Status and Timer */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: '4px'
        }}>
          {/* Status Indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: gameState === 'Open' ? '#4CAF50' : 
                          gameState === 'LastCall' ? '#FFC107' : 
                          gameState === 'Closed' ? '#F44336' : '#9E9E9E',
              mr: 1,
              animation: 'pulse 1.5s infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 }
              }
            }} />
            <Typography sx={{ 
              fontSize: "0.75rem",
              fontWeight: 'bold',
              color: gameState === 'Open' ? '#4CAF50' : 
                    gameState === 'LastCall' ? '#FFC107' : 
                    gameState === 'Closed' ? '#F44336' : '#9E9E9E',
              textTransform: 'uppercase'
            }}>
              {gameState || 'Waiting'}
            </Typography>
          </Box>
          
          {/* Countdown Timer */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccessTimeIcon sx={{ 
              color: '#03A9F4', 
              fontSize: '0.8rem',
              mr: '4px'
            }} />
            <Typography sx={{ 
              fontSize: "0.75rem",
              color: "#fff",
              fontWeight: '700',
              fontFamily: "'Roboto', sans-serif"
            }}>
              {countdown}s
            </Typography>
          </Box>
        </Box>

        {/* Progress Bar - Mobile Optimized */}
        <Box sx={{
          width: '100%',
          height: '4px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <Box sx={{
            width: `${(countdown/30)*100}%`,
            height: '100%',
            background: gameState === 'Open' ? 'linear-gradient(90deg, #4CAF50, #8BC34A)' : 
                        gameState === 'LastCall' ? 'linear-gradient(90deg, #FFC107, #FF9800)' : 
                        gameState === 'Closed' ? 'linear-gradient(90deg, #F44336, #E91E63)' : 'linear-gradient(90deg, #9E9E9E, #607D8B)',
            transition: 'width 1s linear',
            boxShadow: `0 0 4px ${gameState === 'Open' ? 'rgba(76, 175, 80, 0.7)' : 
                        gameState === 'LastCall' ? 'rgba(255, 193, 7, 0.7)' : 
                        gameState === 'Closed' ? 'rgba(244, 67, 54, 0.7)' : 'rgba(158, 158, 158, 0.7)'}`
          }} />
        </Box>
      </Box>

      <Box 
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          position:'relative',
          top:50,
          padding: 2,
          boxSizing: "border-box",
          width: "100%",
          maxWidth: "100vw",
          overflowX: "hidden"
        }}
      >
        {/* Main VS Battle Area */}
        <Box 
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            marginBottom: 2
          }}
        >
          {/* Character Battle Row */}
          <Box 
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              maxWidth: "400px",
              position: "relative",
              marginBottom: 1
            }}
          >
            {/* Juan Section */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <animated.img
                src={juanChoiceFinal ? images[juanChoiceFinal].left : images.rock.left}
                alt="Juan"
                style={{
                  ...juanSpring,
                  width: "100px",
                  height: "100px",
                  maxWidth: "100%",
                  objectFit: "contain"
                }}
              />
              <Typography 
                sx={{ 
                  fontFamily: "rock salt", 
                  fontSize: "1.2rem", 
                  color: "lightgreen",
                  marginTop: 1,
                  textAlign: "center"
                }}
              >
                JUAN
              </Typography>
            </Box>

            {/* VS Badge */}
            <Box 
              sx={{ 
                position: "absolute", 
                left: "50%", 
                top: "50%", 
                transform: "translate(-50%, -50%)",
                zIndex: 2
              }}
            >
              <img 
                src={images.vs} 
                alt="vs" 
                style={{ 
                  width: "40px", 
                  height: "40px",
                  filter: "drop-shadow(0 0 4px rgba(0,0,0,0.5))"
                }} 
              />
            </Box>

            {/* Pedro Section */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <animated.img
                src={pedroChoiceFinal ? images[pedroChoiceFinal].right : images.rock.right}
                alt="Pedro"
                style={{
                  ...pedroSpring,
                  width: "100px",
                  height: "100px",
                  maxWidth: "100%",
                  objectFit: "contain"
                }}
              />
              <Typography 
                sx={{ 
                  fontFamily: "rock salt", 
                  fontSize: "1.2rem", 
                  color: "lightcoral",
                  marginTop: 1,
                  textAlign: "center"
                }}
              >
                PEDRO
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Betting Buttons */}
        <Box 
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            maxWidth: "400px",
            gap: 2
          }}
        >
          {/* Juan Bet Button */}
          <BetButton
            team="juan"
            disabled={!(["Open", "LastCall"].includes(gameState))}
            onClick={() => handleBetClick("juan")}
            myBet={slots.get('juan') || 0}
            totalBets={allBets?.has('juan') ? formatWinnerAmount(allBets.get('juan')) : 0}
            odds={getOdds('juan') ? parseFloat(getOdds('juan')).toFixed(2) : 0}
            color="success"
          />

          {/* Pedro Bet Button */}
          <BetButton
            team="pedro"
            disabled={!(["Open", "LastCall"].includes(gameState))}
            onClick={() => handleBetClick("pedro")}
            myBet={slots.get('pedro') || 0}
            totalBets={allBets?.has('pedro') ? formatWinnerAmount(allBets.get('pedro')) : 0}
            odds={getOdds('pedro') ? parseFloat(getOdds('pedro')).toFixed(2) : 0}
            color="error"
          />

          {/* Tie Bet Button */}
          <BetButton
            team="tie"
            disabled={!(["Open", "LastCall"].includes(gameState))}
            onClick={() => handleBetClick("tie")}
            myBet={slots.get('tie') || 0}
            totalBets={allBets?.has('tie') ? formatWinnerAmount(allBets.get('tie')) : 0}
            odds={getOdds('tie') ? parseFloat(getOdds('tie')).toFixed(2) : 0}
            color="info"
          />
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

      {/* Void Game Dialog - Pure inline styles */}
      <Dialog
        open={voidMessageDialogOpen}
        onClose={() => setVoidMessageDialogOpen(false)}
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #8B0000 0%, #B22222 50%, #8B0000 100%)',
            borderRadius: "16px",
            color: "#fff",
            width: "400px",
            maxWidth: "90vw",
            boxShadow: "0 10px 30px rgba(139, 0, 0, 0.7)",
            border: "3px solid #FFD700",
            overflow: "hidden",
            position: "relative",
            textAlign: "center",
          },
        }}
      >
        {/* Close Button */}
        <IconButton
          onClick={() => setVoidMessageDialogOpen(false)}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: "#FFD700",
            backgroundColor: "rgba(0,0,0,0.3)",
            '&:hover': {
              backgroundColor: "rgba(0,0,0,0.5)"
            }
          }}
        >
          <CloseIcon />
        </IconButton>

        <DialogContent sx={{ 
          padding: "40px 24px 24px",
          position: "relative",
        }}>
          {/* Warning Icon - Pure CSS */}
          <Box sx={{
            width: 80,
            height: 80,
            margin: "0 auto 20px",
            background: "rgba(255, 215, 0, 0.2)",
            borderRadius: "50%",
            border: "3px solid #FFD700",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -5,
              left: -5,
              right: -5,
              bottom: -5,
              borderRadius: '50%',
              border: '2px dashed #FFD700',
              animation: 'spin 10s linear infinite',
            },
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            }
          }}>
            <Typography variant="h2" sx={{ 
              color: "#FFD700", 
              fontSize: "3rem",
              lineHeight: 1,
              marginTop: "8px",
              fontWeight: "bold"
            }}>!</Typography>
          </Box>

          {/* Main Message */}
          <Typography variant="h4" sx={{ 
            fontFamily: "'Roboto', sans-serif",
            fontSize: "2rem",
            color: "#FFD700",
            textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
            letterSpacing: "1px",
            marginBottom: "16px",
            fontWeight: "bold",
            textTransform: "uppercase"
          }}>
            GAME VOIDED!
          </Typography>

          <Typography variant="body1" sx={{ 
            fontSize: "1rem",
            marginBottom: "24px",
            color: "rgba(255,255,255,0.9)",
            lineHeight: 1.5
          }}>
            The current round has been declared void. All bets will be automatically returned to your account.
          </Typography>

          {/* Animated Dots for visual interest */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '24px',
            '& span': {
              display: 'inline-block',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#FFD700',
              animation: 'bounce 1.4s infinite ease-in-out',
            },
            '& span:nth-of-type(1)': { animationDelay: '0s' },
            '& span:nth-of-type(2)': { animationDelay: '0.2s' },
            '& span:nth-of-type(3)': { animationDelay: '0.4s' },
            '@keyframes bounce': {
              '0%, 80%, 100%': { transform: 'scale(0)' },
              '40%': { transform: 'scale(1)' },
            }
          }}>
            <span></span>
            <span></span>
            <span></span>
          </Box>

          {/* Confirmation Button */}
          <Button
            variant="contained"
            onClick={() => setVoidMessageDialogOpen(false)}
            sx={{
              background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
              color: "#8B0000",
              padding: "12px 32px",
              borderRadius: "50px",
              fontWeight: "bold",
              fontSize: "1rem",
              textTransform: "uppercase",
              letterSpacing: "1px",
              boxShadow: "0 4px 15px rgba(255, 215, 0, 0.5)",
              transition: "all 0.3s ease",
              '&:hover': {
                transform: "translateY(-3px)",
                boxShadow: "0 7px 20px rgba(255, 215, 0, 0.7)",
                background: "linear-gradient(135deg, #FFA500 0%, #FFD700 100%)"
              }
            }}
          >
            Understood
          </Button>
        </DialogContent>
      </Dialog>

      {/* Fixed Position Buttons at Bottom */}
      <GameHistoryPanel />
    </Container>
  );
};

const BetButton = ({ team, disabled, onClick, myBet, totalBets, odds, color }) => {
  const teamConfig = {
    juan: {
      name: "JUAN",
      icon: <CasinoIcon sx={{ fontSize: "1.2rem" }} />,
      gradient: "linear-gradient(135deg, #006400 0%, #228B22 50%, #32CD32 100%)",
      hoverGradient: "linear-gradient(135deg, #228B22 0%, #32CD32 50%, #66b266 100%)"
    },
    pedro: {
      name: "PEDRO",
      icon: <CasinoIcon sx={{ fontSize: "1.2rem" }} />,
      gradient: "linear-gradient(135deg, #8B0000 0%, #A52A2A 50%, #D2691E 100%)",
      hoverGradient: "linear-gradient(135deg, #A52A2A 0%, #DC143C 50%, #FF4500 100%)"
    },
    tie: {
      name: "TIE",
      icon: <BalanceIcon sx={{ fontSize: "1.2rem" }} />,
      gradient: "linear-gradient(135deg, #4682B4 0%, #5F9EA0 50%, #00BFFF 100%)",
      hoverGradient: "linear-gradient(135deg, #5F9EA0 0%, #00BFFF 50%, #4682B4 100%)"
    }
  };

  const config = teamConfig[team] || teamConfig.tie;

  return (
    <Button
      variant="contained"
      disabled={disabled}
      onClick={onClick}
      sx={{
        padding: "12px 16px",
        borderRadius: "12px",
        transition: "all 0.3s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: config.gradient,
        boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
        fontFamily: "'Paytone One', sans-serif",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        width: "100%",
        "&:hover": {
          background: config.hoverGradient,
          transform: "translateY(-3px)",
          boxShadow: "0 6px 12px rgba(0,0,0,0.3)"
        },
        "&:disabled": {
          background: "#333",
          color: "#666",
          cursor: "not-allowed",
          "&:hover": {
            background: "#333",
            transform: "none",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)"
          },
        },
      }}
    >
      {/* Main button label */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {config.icon}
        <Typography sx={{ 
          fontFamily: "'Bangers', cursive",
          fontSize: "1.2rem",
          letterSpacing: "1px",
          textShadow: "1px 1px 2px rgba(0,0,0,0.3)"
        }}>
          {config.name}
        </Typography>
      </Box>

      {/* Bet information grid */}
      <Box 
        sx={{ 
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          width: "100%",
          marginTop: 1,
          gap: 1
        }}
      >
        <InfoItem 
          icon={<SavingsIcon sx={{ fontSize: "0.9rem", color: "#00ff9a" }} />}
          label="My bet"
          value={`₱${myBet}`}
          color="#00ff9a"
        />
        
        <InfoItem 
          icon={<StackedBarChartIcon sx={{ fontSize: "0.9rem", color: "cyan" }} />}
          label="Total"
          value={`₱${totalBets}`}
          color="cyan"
        />
        
        <InfoItem 
          icon={<ShowChartIcon sx={{ fontSize: "0.9rem", color: "yellow" }} />}
          label="Odds"
          value={`x${odds}`}
          color="yellow"
        />
      </Box>
    </Button>
  );
};

// Reusable InfoItem Component
const InfoItem = ({ icon, label, value, color }) => (
  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      {icon}
      <Typography sx={{ 
        fontSize: "0.7rem", 
        color,
        fontFamily: "'Orbitron', sans-serif",
      }}>
        {label}
      </Typography>
    </Box>
    <Typography sx={{ 
      fontSize: "0.9rem", 
      color,
      fontFamily: "'Orbitron', sans-serif",
      fontWeight: "bold",
      textShadow: color === "yellow" ? "0 0 4px rgba(255,255,0,0.5)" : "none"
    }}>
      {value}
    </Typography>
  </Box>
);


export function VoidMessageDialog() {
  return (
    <div>
      <p>VOID GAME</p>
    </div>
  );
}

export default BatoBatoPik;