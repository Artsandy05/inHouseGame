import React, { useEffect, useRef, useState } from 'react';
import { 
  Button, 
  Typography, 
  Box, 
  Paper, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle, 
  Slide, 
  Fade, 
  Zoom,
  Grid,
  Chip,
  Divider,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { GameState } from '../utils/gameutils';
import batobatopikModerator from '../utils/batobatoPikModerator';
import karakrusModerator from '../utils/karakrusModerator';
import horseRaceModerator from '../utils/horseRaceModerator';
import boatRaceModerator from '../utils/boatRaceModerator';
import { useNavigate } from 'react-router-dom';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import CasinoIcon from '@mui/icons-material/Casino';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { styled, keyframes } from '@mui/system';
import { removeCookie } from '../utils/cookie';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Custom animations
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const floating = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const AnimatedButton = styled(Button)(({ theme }) => ({
  animation: `${pulse} 3s infinite ease-in-out`,
  '&:hover': {
    animation: 'none',
    transform: 'scale(1.05)'
  }
}));

const GameIcon = styled(SportsEsportsIcon)({
  fontSize: '4rem',
  animation: `${floating} 4s infinite ease-in-out`,
  color: '#d4af37'
});

const KaraKrusIcon = styled(CasinoIcon)({
  fontSize: '4rem',
  animation: `${floating} 4s infinite ease-in-out`,
  color: '#800020'
});

const HorseRaceIcon = styled(EmojiEventsIcon)({
  fontSize: '4rem',
  animation: `${floating} 4s infinite ease-in-out`,
  color: '#4CAF50'
});
const BoatRaceIcon = styled(EmojiEventsIcon)({
  fontSize: '4rem',
  animation: `${floating} 4s infinite ease-in-out`,
  color: '#4CAF50'
});

const CountdownBadge = styled(Chip)(({ theme }) => ({
  fontSize: '1.2rem',
  fontWeight: 'bold',
  padding: theme.spacing(1),
  minWidth: 60,
  '& .MuiChip-label': {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1)
  }
}));

const Moderator = () => {
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
  const [isLoadingBBP, setIsLoadingBBP] = useState(false);
  const [isLoadingKK, setIsLoadingKK] = useState(false);
  const [isLoadingBoatRace, setIsLoadingBoatRace] = useState(false);
  const [isLoadingHorseRace, setIsLoadingHorseRace] = useState(false);
  
  const navigate = useNavigate();
  const localStorageUser = JSON.parse(localStorage.getItem('user') || 'null');
  const userInfo = localStorageUser.userData.data.user; 
  


  // Bato Bato Pik state
  const {
    connect: connectBatoBatoPik,
    gameState: batoBatoPikGameState,
    sendMessage: sendMessageBatoBatoPik,
    setUserInfo: setUserInfoBatoBatoPik,
    countdown: batoBatoPikCountdown,
    socket: bbpSocket
  } = batobatopikModerator();

  const {
    connect: connectBoatRace,
    gameState: boatRaceGameState,
    sendMessage: sendMessageBoatRace,
    setUserInfo: setUserInfoBoatRace,
    countdown: boatRaceCountdown,
    socket: boatRaceSocket
  } = boatRaceModerator();

  // Kara Krus state
  const {
    connect: connectKaraKrus,
    gameState: karaKrusGameState,
    sendMessage: sendMessageKaraKrus,
    setUserInfo: setUserInfoKaraKrus,
    countdown: karaKrusCountdown,
    socket: kkSocket
  } = karakrusModerator();

  // Horse Race state
  const {
    connect: connectHorseRace,
    gameState: horseRaceGameState,
    sendMessage: sendMessageHorseRace,
    setUserInfo: setUserInfoHorseRace,
    countdown: horseRaceCountdown,
    socket: horseRaceSocket
  } = horseRaceModerator();

  

  useEffect(() => {
    if(userInfo){
      setUserInfoBatoBatoPik(userInfo);
      setUserInfoKaraKrus(userInfo);
      setUserInfoHorseRace(userInfo);
      setUserInfoHorseRace(userInfo);
      setUserInfoBoatRace(userInfo);
    }
  }, []);

  useEffect(() => {
    connectBatoBatoPik();
    connectKaraKrus();
    connectHorseRace();
    connectBoatRace();

    return () => {
      if (bbpSocket) bbpSocket.close();
      if (kkSocket) kkSocket.close();
      if (boatRaceSocket) boatRaceSocket.close();
      if (horseRaceSocket) horseRaceSocket.close();
    };
  }, []);






  

 

  const startBBPGame = () => {
    setIsLoadingBBP(true);
    sendMessageBatoBatoPik(JSON.stringify({ game: "bbp", cmd: GameState.Open }));
    setTimeout(() => setIsLoadingBBP(false), 1000);
  };

  const startKKGame = () => {
    setIsLoadingKK(true);
    sendMessageKaraKrus(JSON.stringify({ game: "karakrus", cmd: GameState.Open }));
    setTimeout(() => setIsLoadingKK(false), 1000);
  };

  

  const startHorseRaceGame = () => {
    setIsLoadingHorseRace(true);
    sendMessageHorseRace(JSON.stringify({ game: "horseRace", cmd: GameState.Open }));
    setTimeout(() => setIsLoadingHorseRace(false), 1000);
  };
  const startBoatRaceGame = () => {
    setIsLoadingBoatRace(true);
    sendMessageBoatRace(JSON.stringify({ game: "boatRace", cmd: GameState.Open }));
    setTimeout(() => setIsLoadingBoatRace(false), 1000);
  };


  const handleLogout = () => {
    localStorage.removeItem('user');
    removeCookie('token');
    navigate('/');
  };

  const handleOpenLogoutDialog = () => {
    setOpenLogoutDialog(true);
  };

  const handleCloseLogoutDialog = () => {
    setOpenLogoutDialog(false);
  };

  const getGameStatusText = (gameState) => {
    switch(gameState) {
      case GameState.NewGame:
        return 'Preparing new game...';
      case 'Void':
        return 'Resetting game session...';
      case GameState.WinnerDeclared:
        return 'Congratulations to the winner!';
      case GameState.Open:
        return 'Game in progress...';
      case GameState.Closed:
        return 'Race is running...';
      default:
        return 'Ready to start the next game';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a2035 0%, #0d1220 100%)',
        p: 3,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 30%, rgba(212, 175, 55, 0.1) 0%, transparent 40%)',
          zIndex: 0
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 80% 70%, rgba(128, 0, 32, 0.1) 0%, transparent 40%)',
          zIndex: 0
        }
      }}
    >
      {/* Floating decorative elements */}
      <Fade in={true} timeout={2000}>
        <Box sx={{
          position: 'absolute',
          top: '10%',
          left: '15%',
          width: 50,
          height: 50,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.4) 0%, transparent 70%)',
          filter: 'blur(2px)'
        }} />
      </Fade>
      
      <Fade in={true} timeout={3000}>
        <Box sx={{
          position: 'absolute',
          bottom: '20%',
          right: '20%',
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(128, 0, 32, 0.3) 0%, transparent 70%)',
          filter: 'blur(3px)'
        }} />
      </Fade>

      <Zoom in={true} timeout={800}>
        <Paper
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 3,
            backgroundColor: '#242b45',
            color: '#f0f0f0',
            maxWidth: 1000,
            width: '100%',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
            border: '1px solid rgba(212, 175, 55, 0.2)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}
        >
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', gap: 4 }}>
            <GameIcon />
            <KaraKrusIcon />
            <HorseRaceIcon />
            <BoatRaceIcon />
          </Box>
          
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(45deg, #d4af37 30%, #800020 50%, #4CAF50 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2
            }}
          >
            Game Control Panel
          </Typography>
          
          <Typography 
            variant="subtitle1" 
            sx={{ 
              mb: 4,
              color: '#c0c0c0'
            }}
          >
            Manage all game sessions
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {/* Bato Bato Pik Section */}
            <Grid item xs={12} md={4}>
              <Paper 
                sx={{ 
                  p: 1, 
                  borderRadius: 2, 
                  backgroundColor: 'rgba(212, 175, 55, 0.05)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  height: '100%'
                }}
              >
                <Typography variant="h6" sx={{ color: '#d4af37', mb: 2 }}>
                  Bato Bato Pik
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
                  <AccessTimeIcon sx={{ color: '#d4af37' }} />
                  <CountdownBadge
                    label={batoBatoPikCountdown || '--'}
                    color="primary"
                    sx={{ backgroundColor: 'rgba(212, 175, 55, 0.2)', color: '#d4af37' }}
                  />
                </Box>
                
                <Typography variant="body2" sx={{ color: '#c0c0c0', mb: 3, minHeight: 24 }}>
                  {getGameStatusText(batoBatoPikGameState)}
                </Typography>
                
                <Tooltip title="Start a new Bato Bato Pik game session">
                  <AnimatedButton
                    variant="contained"
                    size="large"
                    onClick={startBBPGame}
                    disabled={isLoadingBBP}
                    sx={{
                      backgroundColor: '#d4af37',
                      color: '#1a2035',
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: '#e8c870'
                      },
                      '&:disabled': {
                        backgroundColor: '#3a3a3a'
                      }
                    }}
                  >
                    {isLoadingBBP ? (
                      <CircularProgress size={24} sx={{ color: '#1a2035' }} />
                    ) : (
                      'Start BBP'
                    )}
                  </AnimatedButton>
                </Tooltip>
              </Paper>
            </Grid>
            
            {/* Kara Krus Section */}
            <Grid item xs={12} md={4}>
              <Paper 
                sx={{ 
                  p: 1, 
                  borderRadius: 2, 
                  backgroundColor: 'rgba(128, 0, 32, 0.05)',
                  border: '1px solid rgba(128, 0, 32, 0.2)',
                  height: '100%'
                }}
              >
                <Typography variant="h6" sx={{ color: '#800020', mb: 2 }}>
                  Kara Krus
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
                  <AccessTimeIcon sx={{ color: '#800020' }} />
                  <CountdownBadge
                    label={karaKrusCountdown || '--'}
                    color="primary"
                    sx={{ backgroundColor: 'rgba(128, 0, 32, 0.2)', color: '#800020' }}
                  />
                </Box>
                
                <Typography variant="body2" sx={{ color: '#c0c0c0', mb: 3, minHeight: 24 }}>
                  {getGameStatusText(karaKrusGameState)}
                </Typography>
                
                <Tooltip title="Start a new Kara Krus game session">
                  <AnimatedButton
                    variant="contained"
                    size="large"
                    onClick={startKKGame}
                    disabled={isLoadingKK}
                    sx={{
                      backgroundColor: '#800020',
                      color: '#f0f0f0',
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: '#a03050'
                      },
                      '&:disabled': {
                        backgroundColor: '#3a3a3a'
                      }
                    }}
                  >
                    {isLoadingKK ? (
                      <CircularProgress size={24} sx={{ color: '#f0f0f0' }} />
                    ) : (
                      'Start Kara Krus'
                    )}
                  </AnimatedButton>
                </Tooltip>
              </Paper>
            </Grid>

            {/* Horse Race Section */}
            <Grid item xs={12} md={4}>
              <Paper 
                sx={{ 
                  p: 1, 
                  borderRadius: 2, 
                  backgroundColor: 'rgba(76, 175, 80, 0.05)',
                  border: '1px solid rgba(76, 175, 80, 0.2)',
                  height: '100%'
                }}
              >
                <Typography variant="h6" sx={{ color: '#4CAF50', mb: 2 }}>
                  Horse Race
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
                  <AccessTimeIcon sx={{ color: '#4CAF50' }} />
                  <CountdownBadge
                    label={horseRaceCountdown || '--'}
                    color="primary"
                    sx={{ backgroundColor: 'rgba(76, 175, 80, 0.2)', color: '#4CAF50' }}
                  />
                </Box>
                
                <Typography variant="body2" sx={{ color: '#c0c0c0', mb: 3, minHeight: 24 }}>
                  {getGameStatusText(horseRaceGameState)}
                </Typography>
                
                <Tooltip title="Start a new Horse Race game session">
                  <AnimatedButton
                    variant="contained"
                    size="large"
                    onClick={startHorseRaceGame}
                    disabled={isLoadingHorseRace}
                    sx={{
                      backgroundColor: '#4CAF50',
                      color: '#f0f0f0',
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: '#66BB6A'
                      },
                      '&:disabled': {
                        backgroundColor: '#3a3a3a'
                      }
                    }}
                  >
                    {isLoadingHorseRace ? (
                      <CircularProgress size={24} sx={{ color: '#f0f0f0' }} />
                    ) : (
                      'Start Horse Race'
                    )}
                  </AnimatedButton>
                </Tooltip>
              </Paper>
            </Grid>
            {/* Boat Race Section */}
            <Grid item xs={12} md={4}>
              <Paper 
                sx={{ 
                  p: 1, 
                  borderRadius: 2, 
                  backgroundColor: 'rgba(76, 175, 80, 0.05)',
                  border: '1px solid rgba(76, 175, 80, 0.2)',
                  height: '100%'
                }}
              >
                <Typography variant="h6" sx={{ color: '#4CAF50', mb: 2 }}>
                  Boat Race
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
                  <AccessTimeIcon sx={{ color: '#4CAF50' }} />
                  <CountdownBadge
                    label={boatRaceCountdown || '--'}
                    color="primary"
                    sx={{ backgroundColor: 'rgba(76, 175, 80, 0.2)', color: '#4CAF50' }}
                  />
                </Box>
                
                <Typography variant="body2" sx={{ color: '#c0c0c0', mb: 3, minHeight: 24 }}>
                  {getGameStatusText(boatRaceGameState)}
                </Typography>
                
                <Tooltip title="Start a new Horse Race game session">
                  <AnimatedButton
                    variant="contained"
                    size="large"
                    onClick={startBoatRaceGame}
                    disabled={isLoadingBoatRace}
                    sx={{
                      backgroundColor: '#4CAF50',
                      color: '#f0f0f0',
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: '#66BB6A'
                      },
                      '&:disabled': {
                        backgroundColor: '#3a3a3a'
                      }
                    }}
                  >
                    {isLoadingBoatRace ? (
                      <CircularProgress size={24} sx={{ color: '#f0f0f0' }} />
                    ) : (
                      'Start Boat Race'
                    )}
                  </AnimatedButton>
                </Tooltip>
              </Paper>
            </Grid>
          </Grid>
          
          <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
            <Button
              onClick={handleOpenLogoutDialog}
              startIcon={<PowerSettingsNewIcon />}
              sx={{
                color: '#c0c0c0',
                '&:hover': {
                  color: '#d4af37',
                  backgroundColor: 'rgba(212, 175, 55, 0.1)'
                }
              }}
            >
              Logout
            </Button>
          </Box>
        </Paper>
      </Zoom>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={openLogoutDialog}
        onClose={handleCloseLogoutDialog}
        TransitionComponent={Slide}
        PaperProps={{
          sx: {
            backgroundColor: '#242b45',
            color: '#f0f0f0',
            borderRadius: 3,
            border: '1px solid rgba(212, 175, 55, 0.3)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            maxWidth: '400px',
            width: '90%',
            mx: 'auto',
            overflow: 'hidden',
            backgroundImage: 'linear-gradient(to bottom, #242b45, #1a2035)'
          }
        }}
      >
        <Box
          sx={{
            background: 'rgba(212, 175, 55, 0.1)',
            borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
            padding: '16px 24px',
            textAlign: 'center'
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              padding: '12px',
              backgroundColor: 'rgba(212, 175, 55, 0.2)',
              borderRadius: '50%',
              mb: 1
            }}
          >
            <PowerSettingsNewIcon 
              sx={{ 
                fontSize: '2.5rem',
                color: '#d4af37'
              }} 
            />
          </Box>
          <DialogTitle 
            sx={{ 
              color: '#d4af37', 
              fontWeight: 700,
              fontSize: '1.5rem',
              padding: 0,
              mt: 1
            }}
          >
            Confirm Logout
          </DialogTitle>
        </Box>
        
        <DialogContent sx={{ padding: '24px' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            <DialogContentText 
              sx={{ 
                color: '#c0c0c0',
                fontSize: '1rem',
                mb: 2
              }}
            >
              Are you sure you want to logout from the moderator panel?
            </DialogContentText>
            <HelpOutlineIcon 
              sx={{ 
                color: 'rgba(212, 175, 55, 0.6)',
                fontSize: '4rem',
                opacity: 0.7,
                mt: 1
              }} 
            />
          </Box>
        </DialogContent>
        
        <DialogActions
          sx={{
            padding: '16px 24px',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.2)',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          <Button 
            onClick={handleCloseLogoutDialog}
            startIcon={<CancelIcon />}
            sx={{
              color: '#c0c0c0',
              backgroundColor: 'rgba(160, 48, 80, 0.2)',
              padding: '8px 20px',
              borderRadius: '4px',
              '&:hover': {
                color: '#f0f0f0',
                backgroundColor: 'rgba(160, 48, 80, 0.4)',
                boxShadow: '0 2px 10px rgba(160, 48, 80, 0.3)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleLogout}
            startIcon={<ExitToAppIcon />}
            sx={{
              color: '#f0f0f0',
              backgroundColor: 'rgba(212, 175, 55, 0.2)',
              padding: '8px 24px',
              borderRadius: '4px',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: 'rgba(212, 175, 55, 0.4)',
                boxShadow: '0 2px 10px rgba(212, 175, 55, 0.3)'
              }
            }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Moderator;