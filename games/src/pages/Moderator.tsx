import React, { useEffect, useState } from 'react';
import { Button, Typography, Box, Paper, Avatar, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Slide, Fade, Zoom } from '@mui/material';
import { GameState } from '../utils/gameutils';
import moderatorStore from '../utils/Store';
import { useNavigate } from 'react-router-dom';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { styled, keyframes } from '@mui/system';
import { removeCookie } from '../utils/cookie';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';


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

const AnimatedButton = styled(Button)({
  animation: `${pulse} 3s infinite ease-in-out`,
  '&:hover': {
    animation: 'none',
    transform: 'scale(1.05)'
  }
});

const GameIcon = styled(SportsEsportsIcon)({
  fontSize: '4rem',
  animation: `${floating} 4s infinite ease-in-out`,
  color: '#d4af37'
});

const Moderator = () => {
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const {
    connect,
    gameState
  } = moderatorStore.getState();
  const {
    sendMessage,
  } = moderatorStore();

  useEffect(() => {
    connect();

    return () => {
      const { socket } = moderatorStore.getState();
      if (socket) {
        socket.close();
      }
    };
  }, []);
  
  useEffect(() => {
    if(gameState === GameState.NewGame){
      setTimeout(() => {
        startGame();
      }, 2000);
    }
    if(gameState === 'Void'){
      setTimeout(() => {
        newGame();
      }, 1500);
    }
    if(gameState === GameState.WinnerDeclared){
      setTimeout(() => {
        newGame();
      }, 2000);
    }
  }, [gameState]);

  const startGame = () => {
    setIsLoading(true);
    sendMessage(JSON.stringify({ game: "bbp", cmd: GameState.Open }));
    setTimeout(() => setIsLoading(false), 1000);
  };

  const newGame = () => {
    sendMessage(JSON.stringify({ game: "bbp", cmd: GameState.NewGame }));
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
            maxWidth: 500,
            width: '100%',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
            border: '1px solid rgba(212, 175, 55, 0.2)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}
        >
          <Box sx={{ mb: 3 }}>
            <GameIcon />
          </Box>
          
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(45deg, #d4af37 30%, #f0f0f0 90%)',
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
            {gameState === GameState.NewGame ? 'Preparing new game...' : 
             gameState === 'Void' ? 'Resetting game session...' : 
             gameState === GameState.WinnerDeclared ? 'Congratulations to the winner!' : 
             'Ready to start the next game'}
          </Typography>
          
          <Box sx={{ mt: 4, mb: 4 }}>
            <AnimatedButton
              variant="contained"
              size="large"
              onClick={startGame}
              disabled={isLoading}
              sx={{
                backgroundColor: '#800020',
                color: '#f0f0f0',
                px: 5,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#a03050'
                },
                '&:disabled': {
                  backgroundColor: '#3a3a3a'
                }
              }}
            >
              {isLoading ? 'Starting...' : 'Start Game'}
            </AnimatedButton>
          </Box>
          
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