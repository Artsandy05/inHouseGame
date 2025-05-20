import { useState } from 'react';
import { Box, Button, IconButton } from '@mui/material';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

const ActionButtonsPanel = ({ 
  openBetDialog, 
  setHistoryDialogOpen, 
  setHelpDialogOpen 
}) => {
  const [visible, setVisible] = useState(true);

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: '20px',
        left: visible ? '20px' : '-230px', // Adjust -230px based on your content width
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        transition: 'left 0.3s ease',
      }}
    >
      {/* Simple white arrow toggle positioned above buttons */}
      <IconButton
        onClick={() => setVisible(!visible)}
        sx={{
          position: 'absolute',
          top: '-32px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          padding: 0,
          '&:hover': {
            backgroundColor: 'transparent',
          }
        }}
      >
        {visible ? <ArrowLeftIcon /> : <ArrowRightIcon />}
      </IconButton>

      {/* Action Buttons */}
      <Button
        variant="contained"
        onClick={openBetDialog}
        sx={{ 
          bgcolor: '#4CAF50', 
          color: '#FFF',
          fontWeight: 'bold',
          '&:hover': { bgcolor: '#45a049' },
          py: 1.5
        }}
      >
        Place Bet
      </Button>
      
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          onClick={() => setHistoryDialogOpen(true)}
          startIcon={<HistoryIcon />}
          sx={{ 
            bgcolor: '#3b82f6', 
            color: '#FFF',
            fontWeight: 'bold',
            '&:hover': { bgcolor: '#2563eb' },
            flex: 1,
            py: 1.5
          }}
        >
          History
        </Button>
        
        <Button
          variant="contained"
          onClick={() => setHelpDialogOpen(true)}
          startIcon={<HelpIcon />}
          sx={{ 
            bgcolor: '#ef476f', 
            color: '#FFF',
            fontWeight: 'bold',
            '&:hover': { bgcolor: '#d43d63' },
            flex: 1,
            py: 1.5
          }}
        >
          Help
        </Button>
      </Box>
    </Box>
  );
};