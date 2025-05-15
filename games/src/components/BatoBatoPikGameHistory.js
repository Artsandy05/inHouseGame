import React, { useState } from "react";
import { 
  Box, 
  IconButton, 
  Typography, 
  Divider, 
  List, 
  ListItem, 
  ListItemText,
  Pagination,
  Stack
} from "@mui/material";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HistoryIcon from '@mui/icons-material/History';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TimelineIcon from '@mui/icons-material/Timeline';
import { format } from 'date-fns';

const GameHistoryPanel = ({ gameHistory }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);
  
  const itemsPerPage = 5;
  const historyData = gameHistory || [];

  // Pagination calculations
  const count = Math.ceil(historyData.length / itemsPerPage);
  const paginatedData = historyData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Statistics calculations
  const totalGames = historyData.length;
  const juanWins = historyData.filter(game => game.zodiac === 'juan').length;
  const pedroWins = historyData.filter(game => game.zodiac === 'pedro').length;
  const ties = historyData.filter(game => game.zodiac === 'tie').length;

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const getResultColor = (result) => {
    switch(result) {
      case 'juan': return '#32CD32'; // Green
      case 'pedro': return '#FF6347'; // Red
      case 'tie': return '#00BFFF'; // Blue
      default: return '#FFD700'; // Gold
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <Box
        sx={{
          position: 'fixed',
          right: isOpen ? '320px' : 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 100,
          transition: 'right 0.3s ease',
        }}
      >
        <IconButton
          onClick={togglePanel}
          sx={{
            backgroundColor: 'rgba(0,0,0,0.7)',
            borderRadius: '8px 0 0 8px',
            padding: '16px 8px',
            color: '#FFD700',
            '&:hover': {
              backgroundColor: 'rgba(139, 0, 0, 0.7)',
            },
            boxShadow: '0 0 10px rgba(0,0,0,0.5)',
          }}
        >
          {isOpen ? <ChevronRightIcon fontSize="large" /> : <ChevronLeftIcon fontSize="large" />}
        </IconButton>
      </Box>

      {/* History Panel */}
      <Box
        sx={{
          position: 'fixed',
          right: isOpen ? 0 : '-320px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '320px',
          height: '100vh',
          maxHeight: '600px',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(5px)',
          borderLeft: '3px solid #FFD700',
          boxShadow: '-5px 0 15px rgba(0,0,0,0.5)',
          zIndex: 99,
          transition: 'right 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '8px 0 0 8px',
          overflow: 'hidden',
        }}
      >
        {/* Panel Header */}
        <Box
          sx={{
            background: 'linear-gradient(90deg, rgba(139,0,0,0.7) 0%, rgba(0,0,0,0.9) 100%)',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 215, 0, 0.3)',
          }}
        >
          <HistoryIcon sx={{ color: '#FFD700', fontSize: '1.8rem', mr: 2 }} />
          <Typography variant="h6" sx={{ 
            color: '#FFD700', 
            fontFamily: "'Bangers', cursive", 
            letterSpacing: '1px',
            fontSize: '1.3rem'
          }}>
            GAME HISTORY
          </Typography>
        </Box>

        {/* Statistics Section */}
        <Box
          sx={{
            background: 'rgba(20, 20, 20, 0.7)',
            padding: '16px',
            margin: '16px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            boxShadow: '0 0 10px rgba(0,0,0,0.3)',
          }}
        >
          <Typography variant="subtitle1" sx={{ 
            color: '#FFD700', 
            mb: 2, 
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontSize: '0.9rem'
          }}>
            <TimelineIcon /> GAME STATISTICS
          </Typography>
          
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ color: '#32CD32', fontSize: '0.8rem' }}>Juan Wins:</Typography>
              <Typography sx={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {juanWins} ({totalGames > 0 ? Math.round((juanWins/totalGames)*100) : 0}%)
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ color: '#FF6347', fontSize: '0.8rem' }}>Pedro Wins:</Typography>
              <Typography sx={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {pedroWins} ({totalGames > 0 ? Math.round((pedroWins/totalGames)*100) : 0}%)
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ color: '#00BFFF', fontSize: '0.8rem' }}>Ties:</Typography>
              <Typography sx={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {ties} ({totalGames > 0 ? Math.round((ties/totalGames)*100) : 0}%)
              </Typography>
            </Box>
            
            <Divider sx={{ my: 1, borderColor: 'rgba(255, 215, 0, 0.3)' }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ color: '#FFD700', fontSize: '0.8rem' }}>Total Games:</Typography>
              <Typography sx={{ color: '#FFD700', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {totalGames}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* History List */}
        <Box sx={{ 
          flex: 1,
          padding: '0 16px',
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#FFD700',
            borderRadius: '3px',
          },
        }}>
          <Typography variant="subtitle1" sx={{ 
            color: '#FFD700', 
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontSize: '0.9rem'
          }}>
            <EmojiEventsIcon /> RECENT RESULTS
          </Typography>
          
          <List dense sx={{ py: 0 }}>
            {paginatedData.map((game) => (
              <ListItem 
                key={game.id}
                sx={{
                  backgroundColor: 'rgba(30, 30, 30, 0.7)',
                  padding: '6px 12px',
                  marginBottom: '6px',
                  borderRadius: '4px',
                  borderLeft: `3px solid ${getResultColor(game.zodiac)}`,
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateX(3px)',
                    backgroundColor: 'rgba(255, 215, 0, 0.05)',
                  },
                  minHeight: '36px',
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%'
                    }}>
                      <Typography 
                        sx={{ 
                          color: getResultColor(game.zodiac),
                          fontWeight: 'bold',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          flex: 1
                        }}
                      >
                        {game.zodiac === 'juan' ? 'JUAN WON' : 
                         game.zodiac === 'pedro' ? 'PEDRO WON' : 'TIE'}
                      </Typography>
                      
                      <Typography 
                        sx={{ 
                          color: '#aaa', 
                          fontSize: '0.7rem',
                          textAlign: 'right'
                        }}
                      >
                        {format(new Date(game.createdAt), 'hh:mm a')}
                      </Typography>
                    </Box>
                  }
                  sx={{ 
                    my: 0,
                    py: 0
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Pagination */}
        <Box sx={{ 
          padding: '12px 16px',
          borderTop: '1px solid rgba(255, 215, 0, 0.2)',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <Pagination
            count={count}
            page={page}
            onChange={handlePageChange}
            size="small"
            sx={{
              '& .MuiPaginationItem-root': {
                color: '#FFD700',
                fontSize: '0.7rem',
                minWidth: '24px',
                height: '24px',
              },
              '& .Mui-selected': {
                backgroundColor: 'rgba(255, 215, 0, 0.2)',
              },
              '& .MuiPaginationItem-ellipsis': {
                color: '#FFD700',
              },
            }}
          />
        </Box>
      </Box>
    </>
  );
};

export default GameHistoryPanel;