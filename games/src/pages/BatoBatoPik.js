import React, { useEffect, useState } from "react";
import { Button, Typography, Box, Container, TextField, Dialog, IconButton, DialogContent, DialogTitle } from "@mui/material";
import { useSpring, animated } from "@react-spring/web";
import CloseIcon from '@mui/icons-material/Close';
import { playerStore } from "../utils/playerStore";
import { getRequiredUrl } from "../services/common";
import moderatorStore from "../utils/Store";
import { formatWinnerAmount, GameState, mapToArray } from "../utils/gameutils";
import { usePlayerStore } from "../context/PlayerStoreContext";


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
          dialogBackground: "linear-gradient(45deg, #006400, #66b266)", // Softer green gradient for Juan
          buttonBackground: "#228B22", // Forest green for buttons
          titleColor: "#fff",
          placeBetColor: "#32CD32", // Lime green for place bet (more noticeable)
          clearButtonColor: '#66b266', // Lighter green for clear button
          inputLabelColor: "#FFD700", // Gold for input label
          inputBorderColor: "#228B22", // Forest green for input borders
          hoverButtonColor: "#006400", // Darker green for button hover effect
          clearHoverColor: "#32CD32", // Brighter green for clear button hover
          placeBetHoverColor: "#228B22", // Darker forest green for place bet hover
        };
      case "pedro":
        return {
          dialogBackground: "linear-gradient(45deg, #8B0000, #D2691E)", // Softer red gradient for Pedro
          buttonBackground: "#DC143C", // Crimson for buttons
          titleColor: "#fff",
          placeBetColor: "#FF4500", // Orange red for place bet (bright and noticeable)
          clearButtonColor: "#F0E68C", // Khaki for clear button (subtle but still visible)
          inputLabelColor: "#FFD700", // Gold for input label
          inputBorderColor: "#DC143C", // Crimson for input borders
          hoverButtonColor: "#8B0000", // Dark red for button hover effect
        };
      case "tie":
        return {
          dialogBackground: "linear-gradient(45deg, #4682B4, #5F9EA0)", // Softer blue gradient for Tie
          buttonBackground: "#5F9EA0", // Cadet blue for buttons
          titleColor: "#fff",
          placeBetColor: "#00BFFF", // Deep sky blue for place bet
          clearButtonColor: "#ADD8E6", // Light blue for clear button
          inputLabelColor: "#FFD700", // Gold for input label
          inputBorderColor: "#5F9EA0", // Cadet blue for input borders
          hoverButtonColor: "#4682B4", // Darker blue for button hover effect
        };
      default:
        return {
          dialogBackground: "linear-gradient(45deg, #222, #444)", // Softer dark gradient for default
          buttonBackground: "#444",
          titleColor: "#FFD700",
          placeBetColor: "#FF8C00", // Dark orange for place bet
          clearButtonColor: "#D3D3D3", // Light gray for clear button
          inputLabelColor: "#FFD700", // Gold for input label
          inputBorderColor: "#444", // Dark color for input borders
          hoverButtonColor: "#222", // Darker for hover effect
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
    placeBetHoverColor 
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
      {gameState === GameState.WinnerDeclared && <Typography 
        variant="h5" 
        sx={{ fontFamily: "'Press Start 2P', cursive", fontSize: "1.8rem", color: "#ffd700", position:'absolute', top:100 }}
      >
        {winningBall.bbp === 'juan' ? 'JUAN WINS!' : winningBall.bbp === 'pedro' ? 'PEDRO WINS!' : 'ITS A TIE!'}
      </Typography>}


      <Box sx={{ position: "absolute", top: 20, left: 20, textAlign: "left", color: "#fff" }}>
        <Typography variant="h6" sx={{ fontSize: "1.2rem" }}>
          {userData?.userData?.data?.user?.firstName} {userData?.userData?.data?.user?.lastName}
        </Typography>
        <Typography sx={{ fontSize: "1rem" }}>Balance: ₱ {userData?.userData?.data?.wallet?.balance}</Typography>
      </Box>

      {/* Game State & Countdown */}
      <Box sx={{ position: "absolute", top: 20, right: 20, textAlign: "right", color: "#fff" }}>
        <Typography variant="h6" sx={{ fontSize: "1.2rem" }}>
          BETTING: {["Open", "LastCall", "Closed"].includes(gameState) ? gameState : ""}
        </Typography>
        <Typography sx={{ fontSize: "1rem" }}>Countdown: {countdown}</Typography>
      </Box>
      <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" height={"100vh"}>
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
                padding: "10px",
                fontSize: "1rem",
                marginTop: 0.5,
                borderRadius: "12px",
                marginLeft: 4,
                transition: "transform 0.3s",
                display: "flex", // Flexbox for layout
                flexDirection: "column", // Stack text vertically
                alignItems: "center", // Center text inside button
                justifyContent: "center", // Center text inside button
                background: "linear-gradient(45deg, #006400, #66b266)", // Gradient for Juan button
                "&:hover": {
                  background: "linear-gradient(45deg, #228B22, #32CD32)", // Darker gradient on hover
                  transform: "scale(1.1)"
                },
                // Styles for the disabled state
                ...(countdown === 0 && {
                  background: "#d3d3d3", // Disabled background color
                  color: "#a9a9a9", // Disabled text color
                  cursor: "not-allowed", // Change cursor to indicate it's disabled
                  "&:hover": {
                    background: "#d3d3d3", // Keep background the same when hovering over a disabled button
                    transform: "none", // No scale effect for disabled button
                  },
                }),
              }}
            >
              <Typography sx={{ fontSize: "0.8rem", marginTop: "4px", color: "#00ff9a" }}>
                My bet: ₱ {slots.get('juan') ? `${slots.get('juan')}` : 0}
              </Typography>
              <Typography sx={{ fontSize: "0.8rem", marginTop: "4px", color: "cyan" }}>
                Bets: ₱ {allBets?.has('juan') ? `${formatWinnerAmount(allBets.get('juan'))}` : 0}
              </Typography>
              <Typography sx={{ fontSize: "0.8rem", marginTop: "4px", color: "yellow" }}>
                Odds: {getOdds('juan') ? `x${parseFloat(getOdds('juan')).toFixed(2)}` : 'x0'}
              </Typography>
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
            <Typography variant="h6" sx={{ fontFamily: "rock salt", fontSize: "1.5rem", color: "lightcoral" }}>
              Pedro
            </Typography>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleBetClick("pedro")}
              disabled={!(["Open", "LastCall"].includes(gameState))}
              sx={{
                padding: "10px",
                fontSize: "1rem",
                borderRadius: "12px",
                marginTop: 0.5,
                marginLeft: 3.5,
                transition: "transform 0.3s",
                display: "flex", // Flexbox for layout
                flexDirection: "column", // Stack text vertically
                alignItems: "center", // Center text inside button
                justifyContent: "center", // Center text inside button
                background: "linear-gradient(45deg, #8B0000, #D2691E)", // Gradient for Pedro button
                "&:hover": {
                  background: "linear-gradient(45deg, #DC143C, #FF4500)", // Darker gradient on hover
                  transform: "scale(1.1)"
                },
                // Styles for the disabled state
                ...(countdown === 0 && {
                  background: "#d3d3d3", // Disabled background color
                  color: "#a9a9a9", // Disabled text color
                  cursor: "not-allowed", // Change cursor to indicate it's disabled
                  "&:hover": {
                    background: "#d3d3d3", // Keep background the same when hovering over a disabled button
                    transform: "none", // No scale effect for disabled button
                  },
                }),
              }}
            >
              <Typography sx={{ fontSize: "0.8rem", marginTop: "4px", color: "#00ff9a" }}>
                My bet: ₱ {slots.get('pedro') ? `${slots.get('pedro')}` : 0}
              </Typography>
              <Typography sx={{ fontSize: "0.8rem", marginTop: "4px", color: "cyan" }}>
                Bets: ₱ {allBets?.has('pedro') ? `${formatWinnerAmount(allBets.get('pedro'))}` : 0}
              </Typography>
              <Typography sx={{ fontSize: "0.8rem", marginTop: "4px", color: "yellow" }}>
                Odds: {getOdds('pedro') ? `x${parseFloat(getOdds('pedro')).toFixed(2)}` : 'x0'}
              </Typography>
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
            padding: "10px",
            fontSize: "1rem",
            marginTop: "20px",
            borderRadius: "12px",
            transition: "transform 0.3s",
            display: "flex", // Flexbox for layout
            flexDirection: "column", // Stack text vertically
            alignItems: "center", // Center text inside button
            justifyContent: "center", // Center text inside button
            background: "linear-gradient(45deg, #4682B4, #5F9EA0)", // Gradient for Tie button
            "&:hover": {
              background: "linear-gradient(45deg, #00BFFF, #4682B4)", // Darker gradient on hover
              transform: "scale(1.1)"
            },
            // Styles for the disabled state
            ...(countdown === 0 && {
              background: "#d3d3d3", // Disabled background color
              color: "#a9a9a9", // Disabled text color
              cursor: "not-allowed", // Change cursor to indicate it's disabled
              "&:hover": {
                background: "#d3d3d3", // Keep background the same when hovering over a disabled button
                transform: "none", // No scale effect for disabled button
              },
            }),
          }}
        >
          <Typography sx={{ fontSize: "0.8rem", marginTop: "4px", color: "#00ff9a" }}>
            My bet: ₱ {slots.get('tie') ? `${slots.get('tie')}` : 0}
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", marginTop: "4px", color: "cyan" }}>
            Bets: ₱ {allBets?.has('tie') ? `${formatWinnerAmount(allBets.get('tie'))}` : 0}
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", marginTop: "4px", color: "yellow" }}>
            Odds: {getOdds('tie') ? `x${parseFloat(getOdds('tie')).toFixed(2)}` : 'x0'}
          </Typography>
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
            borderRadius: "12px", // Increased border radius for a smoother look
            color: "#fff",
            padding: "20px",
            width: "400px",
          },
        }}
      >
        {/* Close Button */}
        <IconButton
          edge="end"
          color="inherit"
          onClick={handleDialogClose}
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            fontSize: "1.5rem",
          }}
        >
          <CloseIcon />
        </IconButton>

        <DialogTitle
          sx={{
            fontFamily: "Arial",
            textAlign: "center",
            color: titleColor, // Apply dynamic title color
            fontWeight: "bold", // Adjusted for stronger emphasis
            fontSize: "1.5rem", // Adjusted size for readability
          }}
        >
          Place Your Bet
        </DialogTitle>

        <DialogContent>
          <TextField
            type="number"
            value={betAmount}
            onChange={handleBetAmountChange}
            fullWidth
            variant="outlined"
            sx={{
              marginBottom: 2,
              input: { color: "#fff", fontWeight: "500" },  // For input text styling
              label: { color: inputLabelColor, fontWeight: "bold" },  // For label styling
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',  // Apply border radius to the outline of the input
                '& fieldset': {
                  borderColor: inputBorderColor, // Apply dynamic border color for input
                },
                '&:hover fieldset': {
                  borderColor: placeBetColor, // Highlight border on hover
                },
              },
            }}
          />

          <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={1} sx={{ marginBottom: 2 }}>
            {[
              10, 20, 50, 500, 1000, 5000, 10000, 20000, 50000,
            ].map((value) => (
              <Button
                key={value}
                variant="outlined"
                onClick={() => handleBetValue(value)}
                sx={{
                  fontSize: "1rem",
                  padding: "10px",
                  borderRadius: "8px", // Matching the border radius
                  fontWeight: "500", // Adjusted button text weight
                  color: titleColor,
                  backgroundColor: buttonBackground,
                  "&:hover": {
                    backgroundColor: hoverButtonColor, // Hover effect with dynamic color
                  },
                }}
              >
                {value}
              </Button>
            ))}
          </Box>

          <Box display="flex" justifyContent="space-between" sx={{ marginTop: 2, gap:2 }}>
            {/* Clear Button for Juan with a different color */}
            <Button
              onClick={handleClearBet}
              sx={{
                fontWeight: "bold",
                color: betType === 'pedro' ? 'black' : "#fff", // Make text color white to stand out
                backgroundColor: clearButtonColor, // Lighter green for Clear button
                borderRadius: "12px", // Smoother rounded corners
                padding: "12px", // Added padding for better button appearance
                border: `2px solid ${clearButtonColor}`, // Border to define button edges
                "&:hover": {
                  backgroundColor: clearHoverColor, // Lighter green hover effect
                  borderColor: clearHoverColor, // Border on hover
                },
              }}
            >
              Clear
            </Button>

            {/* Place Bet Button for Juan with a different color */}
            <Button
              onClick={handlePlaceBet}
              sx={{
                fontWeight: "bold",
                color: "#fff", // Make text color white to stand out
                backgroundColor: placeBetColor, // Brighter lime green for Place Bet button
                borderRadius: "12px", // Smoother rounded corners
                padding: "12px 20px", // Added padding for better button appearance
                border: `2px solid ${placeBetColor}`, // Border to define button edges
                "&:hover": {
                  backgroundColor: placeBetHoverColor, // Darker forest green hover effect
                  borderColor: placeBetHoverColor, // Border on hover
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