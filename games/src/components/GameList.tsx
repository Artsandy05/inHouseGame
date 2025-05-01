import React, { useEffect, useState } from 'react';
import { 
  Button, Card, CardContent, Typography, Grid, Container,
  Box, Chip, Grow, Slide, Avatar, Divider,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  IconButton, Tooltip, Badge, Drawer, List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  SportsEsports, LiveTv, CheckCircle, Cancel,
  Gesture, EggAlt, DirectionsRun, EmojiEvents,
  Logout, Person, Notifications, HelpOutline,
  Menu
} from '@mui/icons-material';
import { keyframes, styled, alpha } from '@mui/system';
import { removeCookie } from '../utils/cookie';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';

// Sophisticated color palette
const theme = {
  background: '#1a2035', // Deep blue-gray
  paper: '#242b45', // Slightly lighter blue-gray
  primary: '#800020', // Maroon
  secondary: '#a03050', // Softer maroon
  accent: '#d4af37', // Gold for highlights
  textPrimary: '#f0f0f0',
  textSecondary: '#c0c0c0',
  divider: 'rgba(255, 255, 255, 0.08)'
};

// Animation keyframes
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.03); }
  100% { transform: scale(1); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0px); }
`;

// Styled components
const AnimatedCard = styled(Card)({
  transition: 'all 0.3s ease',
  background: theme.paper,
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: `0 10px 20px ${alpha(theme.primary, 0.2)}`,
    borderColor: theme.primary
  }
});

const ThumbnailOverlay = styled('div')({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)',
  display: 'flex',
  alignItems: 'flex-end',
  padding: '16px',
  boxSizing: 'border-box'
});

const GameList: React.FC = () => {
  const [games] = useState([
    {
      id: 1,
      name: 'bato_bato_pik',
      label: 'Bato Bato Pik',
      isActive: true,
      isStreaming: true,
      description: 'Classic Filipino rock-paper-scissors with modern multiplayer',
      popularity: 4,
      playersOnline: 128,
      thumbnail: '/assets/batobatopik.jpg',
    },
    {
      id: 2,
      name: 'golden_goose',
      label: 'Golden Goose',
      isActive: true,
      isStreaming: false,
      description: 'Scratch-and-win with golden eggs containing instant prizes',
      popularity: 5,
      playersOnline: 342,
      thumbnail: '/assets/goldGooseThumbnail.png',
    },
    {
      id: 3,
      name: 'karakrus',
      label: 'Kara Krus',
      isActive: true,
      isStreaming: true,
      description: 'Coin Flip Game Multiplayer',
      popularity: 3,
      playersOnline: 87,
      thumbnail: '/assets/karakrus.jpg',
    },
    {
      id: 4,
      name: 'bulag_pipi_bingi',
      label: 'Bulag Pipi Bingi',
      isActive: true,
      isStreaming: true,
      description: 'Dice game multiplayer',
      popularity: 3,
      playersOnline: 108,
      thumbnail: '/assets/bulag_pipi_bingi.jpg',
    },
    {
      id: 5,
      name: 'pigeon_race',
      label: 'Pigeon Dash',
      isActive: true,
      isStreaming: true,
      description: 'Pigeon Race Multiplayer',
      popularity: 3,
      playersOnline: 1012,
      thumbnail: '/assets/pigeondash.jpg',
    },
    {
      id: 5,
      name: 'horse_race',
      label: 'Horse Race',
      isActive: true,
      isStreaming: true,
      description: 'Horse Race',
      popularity: 3,
      playersOnline: 1012,
      thumbnail: '/assets/horse_race_thumbnail.png',
    }
  ]);

  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) {
      navigate('/');
    } else {
      setUserData(user);
    }
  }, [navigate]);

  console.log(userData)

  const handleLogout = () => {
    localStorage.removeItem('user');
    removeCookie('token');
    navigate('/');
  };

  const handleLogoutClick = () => {
    setOpenLogoutDialog(true);
    setOpenUserMenu(false);
  };

  const handleCloseLogoutDialog = () => {
    setOpenLogoutDialog(false);
  };

  const toggleUserMenu = () => {
    setOpenUserMenu(!openUserMenu);
  };

  return (
    <Box sx={{ 
      background: `linear-gradient(135deg, ${theme.background} 0%, #232a42 100%)`,
      minHeight: '100vh'
    }}>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        position: 'relative',
        top: 40,
        px: 1,
        py: 2,
        borderBottom: `1px solid ${theme.divider}`,
        width: '100%',
        maxWidth: 'lg', 
        left: '52%',
        transform: 'translateX(-50%)'
      }}>
        <Slide in={true} direction="down" timeout={500}>
          <Box sx={{ display: 'flex', alignItems: 'center', width:'100%' }}>
            <SportsEsports sx={{ 
              color: theme.secondary,
              fontSize: 48, 
              mr: 2,
              animation: `${float} 3s ease-in-out infinite`
            }} />
            <Typography 
              sx={{ 
                fontWeight: 700,
                textAlign:'center',
                fontSize:30,
                color: theme.textPrimary,
                fontFamily: '"Poppins", sans-serif',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              Filipino Fun Games
            </Typography>
            <SportsEsports sx={{ 
              color: theme.secondary,
              fontSize: 48, 
              mr: 2,
              animation: `${float} 3s ease-in-out infinite`
            }} />
          </Box>
        </Slide>

        {/* Menu Button */}
        <IconButton
          onClick={toggleUserMenu}
          sx={{ 
            color: theme.textSecondary,
            position: 'absolute',
            right:10,
            top: -25,
            '&:hover': {
              color: theme.accent,
              backgroundColor: alpha(theme.accent, 0.1)
            }
          }}
        >
          <Menu fontSize="large" />
        </IconButton>
      </Box>

      {/* User Menu Drawer */}
      <Drawer
        anchor="right"
        open={openUserMenu}
        onClose={toggleUserMenu}
        PaperProps={{
          sx: {
            width: 280,
            backgroundColor: theme.paper,
            color: theme.textPrimary,
            p: 2
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            {userData?.userData.data.user.firstName || 'Player'}
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon sx={{ color: theme.textSecondary }}>
                <Person />
              </ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItem>
            
            <ListItem>
              <ListItemIcon sx={{ color: theme.textSecondary }}>
                <Badge badgeContent={3} color="error">
                  <Notifications />
                </Badge>
              </ListItemIcon>
              <ListItemText primary="Notifications" />
            </ListItem>
            
            <ListItem>
              <ListItemIcon sx={{ color: theme.textSecondary }}>
                <HelpOutline />
              </ListItemIcon>
              <ListItemText primary="Help Center" />
            </ListItem>
            
            <ListItem onClick={handleLogoutClick}>
              <ListItemIcon sx={{ color: theme.textSecondary }}>
                <Logout />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 7 }}>
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

        {/* Welcome Message */}
        <Box sx={{ 
          textAlign: 'center', 
          mb: 6,
          background: alpha(theme.primary, 0.1),
          borderRadius: '12px',
          p: 3,
          border: `1px solid ${theme.divider}`
        }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 600,
              color: theme.textPrimary,
              mb: 1
            }}
          >
            Welcome back, {userData?.userData.data.user.firstName || 'Player'}!
          </Typography>
          <Typography 
            variant="subtitle1" 
            color={theme.textSecondary}
            sx={{ 
              fontFamily: '"Roboto", sans-serif',
              maxWidth: '600px',
              mx: 'auto'
            }}
          >
            Ready for some fun? Choose your game below and start playing!
          </Typography>
        </Box>

        {/* Games Grid */}
        <Grid container spacing={4}>
          {games.map((game, index) => (
            <Grid item xs={12} sm={6} md={4} key={game.id}>
              <Grow in={true} timeout={(index + 1) * 200}>
                <AnimatedCard
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: `1px solid ${theme.divider}`,
                    borderRadius: '12px',
                    overflow: 'hidden',
                    position: 'relative',
                    animation: `${pulse} 8s infinite ${index * 0.5}s`
                  }}
                >
                  {/* Game Thumbnail */}
                  <Box sx={{
                    position: 'relative',
                    height: '180px',
                    width: '100%',
                    overflow: 'hidden'
                  }}>
                    <Box
                      component="img"
                      src={game.thumbnail}
                      alt={game.label}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease',
                        '&:hover': {
                          transform: 'scale(1.05)'
                        }
                      }}
                    />
                    <ThumbnailOverlay>
                      <Typography 
                        variant="h5" 
                        sx={{
                          color: '#fff',
                          fontWeight: 700,
                          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                        }}
                      >
                        {game.label}
                      </Typography>
                    </ThumbnailOverlay>
                  </Box>

                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '6px',
                    background: `linear-gradient(90deg, ${theme.primary} 0%, ${theme.secondary} 100%)`
                  }} />

                  <CardContent sx={{ flexGrow: 1, pb: 0, pt: 3 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 2,
                      position: 'relative'
                    }}>
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {[...Array(5)].map((_, i) => (
                              <EmojiEvents 
                                key={i} 
                                sx={{ 
                                  fontSize: '1rem',
                                  color: i < game.popularity ? theme.accent : '#4a4e5c',
                                  mr: 0.5
                                }} 
                              />
                            ))}
                          </Box>
                          <Typography variant="caption" sx={{ 
                            color: theme.textSecondary, 
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            <Box component="span" sx={{ 
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              bgcolor: '#00c853',
                              mr: 0.5
                            }} />
                            {game.playersOnline} online
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ 
                      display: 'flex', 
                      mb: 2, 
                      flexWrap: 'wrap', 
                      gap: 1 
                    }}>
                      <Chip
                        icon={game.isActive ? <CheckCircle /> : <Cancel />}
                        label={game.isActive ? 'Available' : 'Unavailable'}
                        sx={{
                          backgroundColor: game.isActive ? 
                            alpha('#00c853', 0.1) : alpha('#ff1744', 0.1),
                          color: game.isActive ? '#00c853' : '#ff1744',
                          fontWeight: 600
                        }}
                        size="small"
                      />
                      {game.isStreaming && (
                        <Chip
                          icon={<LiveTv />}
                          label="Live Now"
                          sx={{
                            backgroundColor: alpha('#2196f3', 0.1),
                            color: '#2196f3',
                            fontWeight: 600
                          }}
                          size="small"
                        />
                      )}
                    </Box>

                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mb: 2,
                        fontFamily: '"Roboto", sans-serif',
                        fontSize: '0.9rem',
                        color: theme.textSecondary,
                        lineHeight: 1.6,
                        minHeight: '60px'
                      }}
                    >
                      {game.description}
                    </Typography>
                  </CardContent>

                  <Divider sx={{ mx: 3, borderColor: theme.divider }} />

                  <Box sx={{ p: 3 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate(`/${game.name}`)}
                      sx={{
                        py: 1.5,
                        borderRadius: '8px',
                        background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
                        fontWeight: 600,
                        fontSize: '1rem',
                        textTransform: 'none',
                        letterSpacing: '0.5px',
                        boxShadow: `0 4px 12px ${alpha(theme.primary, 0.3)}`,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 6px 16px ${alpha(theme.primary, 0.4)}`,
                          background: `linear-gradient(135deg, ${theme.secondary} 0%, ${theme.primary} 100%)`
                        }
                      }}
                      startIcon={<SportsEsports />}
                    >
                      Play Now
                    </Button>
                  </Box>
                </AnimatedCard>
              </Grow>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default GameList;