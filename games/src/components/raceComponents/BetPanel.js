import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Grid } from '@mui/material';
import { GameState } from '../../utils/gameutils';

// Enums or constants should be imported or defined as needed
// Example: GameState.Open, GameState.LastCall, etc.

const BetPanel = ({
  gameState,
  betDialogOpen,
  closeBetDialog,
  countdown,
  horses,
  selectedChip,
  setSelectedChip,
  casinoChips,
  chipValues,
  placeBetOnHorse,
  slots,
  allBets,
  getOdds,
  totalBet,
  possibleWin,
  updatedBalance,
  formatTruncatedMoney,
  truncateToTwoDecimals
}) => {
  const isBettingAllowed = gameState === 'Open' || gameState === 'LastCall';

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: betDialogOpen ? 0 : '-100%',
        left: 0,
        right: 0,
        height: '100vh',
        backgroundColor: 'rgba(30, 10, 5, 0.98)',
        backgroundImage: 'linear-gradient(to bottom, rgba(80, 20, 10, 1), rgba(30, 10, 5, 1))',
        borderTop: '4px solid #FFD700',
        borderTopLeftRadius: '16px',
        borderTopRightRadius: '16px',
        boxShadow: '0 -5px 20px rgba(0, 0, 0, 0.6)',
        transition: 'bottom 0.3s ease-out',
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '12px',
          background: 'repeating-linear-gradient(90deg, #FFD700, #FFD700 8px, transparent 8px, transparent 16px)',
        }
      }}
    >
      {/* Close Button */}
      <Box
        onClick={closeBetDialog}
        sx={{
          height: '36px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          backgroundColor: 'rgba(255, 215, 0, 0.1)',
          borderBottom: '1px solid rgba(255, 215, 0, 0.3)',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 215, 0, 0.2)',
            '& .close-icon': {
              transform: 'translateY(2px)',
              color: '#FFF'
            }
          }
        }}
      >
        <Box
          className="close-icon"
          sx={{
            color: '#FFD700',
            fontSize: '20px',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          ▼
          <Typography sx={{
            color: 'inherit',
            fontSize: '0.65rem',
            fontWeight: 'bold',
            mt: '-4px'
          }}>
            CLOSE
          </Typography>
        </Box>
      </Box>

      {/* Main content area - now with two columns */}
      <Box sx={{ 
          flex: 1,
          display: 'flex',
          overflow: 'hidden'
        }}>
          {/* Left Column - Horses */}
          <Box sx={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRight: '1px solid rgba(255,215,0,0.2)',
            padding: '8px'
          }}>
            {/* Game Status moved to first column */}
            <Box sx={{
              padding: '6px 12px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              borderBottom: '1px solid #FFD700',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: '8px'
            }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Box sx={{
                  backgroundColor: gameState === GameState.LastCall ? '#FF5722' : 
                                  gameState === GameState.Open ? '#4CAF50' : '#F44336',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  boxShadow: '0 0 6px currentColor',
                  flexShrink: 0
                }} />
                
                <Typography sx={{
                  color: '#FFF',
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                }}>
                  STATUS: <span style={{ color: '#FFD700' }}>{gameState}</span>
                </Typography>
              </Box>
              
              <Box sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid #FFD700',
                borderRadius: '6px',
                padding: '3px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Box component="span" sx={{
                  color: countdown <= 10 ? '#F44336' : countdown <= 30 ? '#FF9800' : '#4CAF50',
                  animation: countdown <= 10 ? 'pulse 1s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                    '100%': { opacity: 1 },
                  }
                }}>
                  ⏱️
                </Box>
                <Typography sx={{
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  color: countdown <= 10 ? '#F44336' : countdown <= 30 ? '#FF9800' : '#4CAF50',
                }}>
                  {formatTime(countdown)}
                </Typography>
              </Box>
            </Box>

            {/* Title Area */}
            <Box sx={{
              padding: '8px',
              borderBottom: '1px solid #FFD700',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              textAlign: 'center',
              mb: '8px'
            }}>
              <Typography sx={{ 
                color: '#FFD700',
                fontSize: '1rem',
                fontWeight: 'bold',
                textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)',
                textTransform: 'uppercase'
              }}>
                {isBettingAllowed ? 'Place Your Bets' : 'Betting Closed'}
              </Typography>
            </Box>
            
            {/* Horses Grid */}
            <Box sx={{ 
              flex: 1,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: '1fr 1fr',
              gap: '8px',
              overflow: 'hidden'
            }}>
              {horses.slice(0, 4).map((horse) => (
                <Box
                  key={horse.id}
                  onClick={() => isBettingAllowed && selectedChip && placeBetOnHorse(horse.id)}
                  sx={{
                    backgroundColor: horse.color,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1), rgba(0,0,0,0.2))',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: slots.has(horse.id) 
                      ? '2px solid #FFD700' 
                      : '1px solid rgba(255,255,255,0.2)',
                    boxShadow: slots.has(horse.id)
                      ? '0 0 10px rgba(255, 215, 0, 0.4)'
                      : '0 2px 4px rgba(0, 0, 0, 0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: isBettingAllowed && selectedChip ? 'pointer' : 'default',
                    opacity: isBettingAllowed ? 1 : 0.7,
                    p: '5px',
                    transition: 'all 0.2s ease',
                    '&:hover': isBettingAllowed && selectedChip ? {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                    } : {}
                  }}
                >
                  {/* Horse Name and Odds */}
                  <Box sx={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 0.2
                  }}>
                    <Typography sx={{ 
                      color: '#FFF',
                      fontWeight: 'bold',
                      fontSize: '0.9em',
                      textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
                      maxWidth: '70%'
                    }}>
                      {horse.name}
                    </Typography>
                    
                    <Box sx={{
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      color: '#FFD700',
                      fontWeight: 'bold',
                      fontSize: '0.7rem',
                      borderRadius: '4px',
                      padding: '2px 4px',
                      border: '1px solid #FFD700',
                    }}>
                      x{truncateToTwoDecimals(getOdds(horse.id))}
                    </Box>
                  </Box>
                  
                  {/* Total bets */}
                  <Box sx={{
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    borderRadius: '4px',
                    padding: '2px 3.5px',
                    border: '1px dashed rgba(255,215,0,0.2)',
                    mb:0.5
                  }}>
                    <Typography sx={{
                      color: '#FFF',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span>TOTAL:</span>
                      <span style={{ 
                        color: '#FFD700', 
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        padding: '1px 2px',
                        borderRadius: '3px',
                        fontSize: '0.7rem',
                      }}>
                        ₱{allBets && allBets.has(horse.id) ? allBets.get(horse.id).toLocaleString() : '0'}
                      </span>
                    </Typography>
                  </Box>
                  
                  {/* Current Bet */}
                  <Box sx={{
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    padding: '2px',
                    borderRadius: '4px',
                    textAlign: 'center',
                    marginTop: 'auto',
                    border: slots.has(horse.id) ? '1px solid rgba(255,215,0,0.4)' : 'none',
                  }}>
                    <Typography sx={{ 
                      color: slots.has(horse.id) ? '#4CAF50' : '#FFD700',
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {slots.has(horse.id) ? (
                        <>
                          <span style={{ marginRight: '4px', color: '#FFD700' }}>💰</span>
                          ₱{slots.get(horse.id).toLocaleString()}
                        </>
                      ) : 'No bet'}
                    </Typography>
                  </Box>
  
                  {!isBettingAllowed && (
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                    }}>
                      <Typography sx={{
                        color: '#FFD700',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        border: '1px solid rgba(255,215,0,0.3)'
                      }}>
                        BETTING CLOSED
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
          
          {/* Right Column - Chips and Bet Summary */}
          <Box sx={{ 
            width: '40%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            padding: '8px',
            gap: '8px'
          }}>
            {/* Chips panel - MODIFIED FOR 3x3 GRID */}
            <Grid container sx={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: '8px',
              padding: '8px',
              border: '1px solid rgba(255,215,0,0.3)',
            }}>
              <Grid item xs={12}>
                <Typography sx={{
                  color: '#FFD700',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  fontSize: '0.85rem',
                }}>
                  SELECT CHIP
                </Typography>
              </Grid>
              
              {/* 3x3 Grid for chips */}
              <Grid container spacing={0} sx={{
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
              }}>
                {Object.entries(casinoChips).map(([color, src]) => (
                  <Grid item xs={4} key={color} sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center', 
                  }}>
                    <Box 
                      sx={{ 
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isBettingAllowed ? 'pointer' : 'default',
                        transform: selectedChip === color && isBettingAllowed ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        pointerEvents: isBettingAllowed ? 'auto' : 'none',
                        borderRadius: '50%',
                        padding: '2px',
                        backgroundColor: selectedChip === color && isBettingAllowed ? 'rgba(255,215,0,0.15)' : 'transparent',
                        border: selectedChip === color && isBettingAllowed ? '1px solid rgba(255,215,0,0.5)' : 'none',
                        
                        '&:hover': isBettingAllowed ? {
                          transform: 'scale(1.1)',
                          boxShadow: '0 0 8px rgba(255,215,0,0.5)'
                        } : {}
                      }}
                      onClick={() => isBettingAllowed && setSelectedChip(color)}
                    >
                      <Box 
                        component="img" 
                        src={src} 
                        alt={`${color} chip`}
                        sx={{ 
                          width: '100%',
                          objectFit: 'contain',
                          filter: selectedChip === color && isBettingAllowed ? 
                            'drop-shadow(0 0 6px rgba(255,215,0,0.7))' : 'none',
                        }}
                      />
                      <Typography 
                        sx={{ 
                          color: '#FFF', 
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          padding: '1px 3px',
                          borderRadius: '6px',
                        }}
                      >
                        ₱{chipValues[color].toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            
            {/* Bet Summary Section - Now in a single row */}
            <Box sx={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              borderRadius: '8px',
              padding: '8px',
              border: '1px solid rgba(255,215,0,0.4)',
            }}>
              <Typography sx={{
                color: '#FFD700',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                textAlign: 'center',
                mb: '6px',
                borderBottom: '1px solid rgba(255,215,0,0.2)',
                pb: '4px',
              }}>
                BET SUMMARY
              </Typography>
              
              <Box sx={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography sx={{ color: '#FFF', fontWeight: 'bold', fontSize: '0.7rem' }}>
                    TOTAL BET
                  </Typography>
                  <Typography sx={{ 
                    color: '#FFD700', 
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                  }}>
                    ₱{totalBet.toLocaleString()}
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  width: '1px',
                  height: '24px',
                  backgroundColor: 'rgba(255,215,0,0.3)'
                }} />
                
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography sx={{ color: '#FFF', fontWeight: 'bold', fontSize: '0.7rem' }}>
                    POSSIBLE WIN
                  </Typography>
                  <Typography sx={{ 
                    color: '#4CAF50', 
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                  }}>
                    ₱{possibleWin.toLocaleString()}
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  width: '1px',
                  height: '24px',
                  backgroundColor: 'rgba(255,215,0,0.3)'
                }} />
                
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography sx={{ color: '#FFF', fontWeight: 'bold', fontSize: '0.7rem' }}>
                    BALANCE
                  </Typography>
                  <Typography sx={{ 
                    color: '#FFD700', 
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                  }}>
                    {formatTruncatedMoney(updatedBalance)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
    </Box>
  );
};

BetPanel.propTypes = {
  gameState: PropTypes.string,
  betDialogOpen: PropTypes.bool.isRequired,
  closeBetDialog: PropTypes.func.isRequired,
  countdown: PropTypes.number.isRequired,
  horses: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedChip: PropTypes.string,
  setSelectedChip: PropTypes.func.isRequired,
  casinoChips: PropTypes.object.isRequired,
  chipValues: PropTypes.object.isRequired,
  placeBetOnHorse: PropTypes.func.isRequired,
  slots: PropTypes.instanceOf(Map).isRequired,
  allBets: PropTypes.instanceOf(Map),
  getOdds: PropTypes.func.isRequired,
  totalBet: PropTypes.number.isRequired,
  possibleWin: PropTypes.number.isRequired,
  updatedBalance: PropTypes.number.isRequired,
  formatTruncatedMoney: PropTypes.func.isRequired,
};

export default BetPanel;
