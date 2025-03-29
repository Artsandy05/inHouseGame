import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Slide,
  Box,
  SlideProps,
  useTheme,
  keyframes
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import confetti from 'canvas-confetti';

// Confetti effect for winners
const launchConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 60,
    origin: { y: 0.6 },
    colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
  });
};

// Custom animations
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.03); }
  100% { transform: scale(1); }
`;

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0px); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const Transition = React.forwardRef<HTMLDivElement, SlideProps>(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface ResultDialogProps {
  open: boolean;
  onClose: () => void;
  isWinner: boolean;
  winningItem: string;
  onPlayAgain: () => void;
}

const ResultDialog: React.FC<ResultDialogProps> = ({
  open,
  onClose,
  isWinner,
  winningItem,
  onPlayAgain
}) => {
  const theme = useTheme();
  
  React.useEffect(() => {
    if (open && isWinner) {
      launchConfetti();
    }
  }, [open, isWinner]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          borderRadius: '16px',
          overflow: 'hidden',
          touchAction: 'manipulation',
          minWidth: '0',
          width: '90vw',
          maxWidth: '380px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          border: isWinner ? '3px solid #4CAF50' : '3px solid #B12B24',
          background: isWinner 
            ? 'linear-gradient(145deg, #FBDC6A 0%, #FFEB3B 100%)'
            : 'linear-gradient(145deg, #FBDC6A 0%, #FF9800 100%)',
          position: 'relative',
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: isWinner 
              ? 'linear-gradient(90deg, #4CAF50, #81C784, #4CAF50)'
              : 'linear-gradient(90deg, #B12B24, #E57373, #B12B24)',
            backgroundSize: '200% 100%',
            animation: `${shimmer} 3s linear infinite`,
            zIndex: 1
          }
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          m: 0, 
          p: 2,
          background: isWinner 
            ? 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)' 
            : 'linear-gradient(135deg, #B12B24 0%, #E57373 100%)',
          color: 'white',
          fontFamily: '"Luckiest Guy", cursive, sans-serif',
          fontSize: { xs: '1.2rem', sm: '1.4rem' },
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textShadow: '1px 1px 3px rgba(0,0,0,0.3)',
          letterSpacing: '0.5px',
          position: 'relative',
          overflow: 'hidden',
          '&:before': {
            content: '""',
            position: 'absolute',
            top: '-8px',
            left: 0,
            right: 0,
            height: '15px',
            background: 'rgba(255,255,255,0.2)',
            transform: 'rotate(-2deg)',
            filter: 'blur(4px)'
          },
          '&:after': {
            content: '""',
            position: 'absolute',
            bottom: '-8px',
            left: 0,
            right: 0,
            height: '15px',
            background: 'rgba(255,255,255,0.2)',
            transform: 'rotate(2deg)',
            filter: 'blur(4px)'
          }
        }}
      >
        <Box sx={{ 
          animation: `${pulse} 1.5s infinite`,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          {isWinner ? (
            <>
              <Box sx={{ animation: `${float} 3s ease-in-out infinite` }}>🎉</Box>
              CONGRATULATIONS!
              <Box sx={{ animation: `${float} 3s ease-in-out infinite`, animationDelay: '0.5s' }}>🎉</Box>
            </>
          ) : (
            <>
              <Box sx={{ animation: `${float} 3s ease-in-out infinite` }}>😞</Box>
              <Typography sx={{fontSize:'1rem', fontWeight:'bold', fontFamily:'Poppins'}}>BETTER LUCK NEXT TIME!</Typography>
              <Box sx={{ animation: `${float} 3s ease-in-out infinite`, animationDelay: '0.5s' }}>😞</Box>
            </>
          )}
        </Box>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          background: 'rgba(255,255,255,0.7)',
          textAlign: 'center',
          fontFamily: '"Poppins", sans-serif',
          padding: { xs: '20px 10px', sm: '25px 15px' },
          position: 'relative',
          overflow: 'hidden',
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isWinner 
              ? 'radial-gradient(circle, rgba(76,175,80,0.1) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(177,43,36,0.1) 0%, transparent 70%)',
            zIndex: 0
          }
        }}
      >
        {isWinner ? (
          <>
            <Typography sx={{
              fontWeight: 'bold',
              color: 'rgba(87, 34, 41, 1)',
              fontSize: { xs: '1.3rem', sm: '1.5rem' },
              mb: 2,
              fontFamily: '"Bangers", cursive, sans-serif',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              position: 'relative',
              zIndex: 1,
              textShadow: '1px 1px 1px rgba(0,0,0,0.1)'
            }}>
              YOU MATCHED 3 Prizes!
            </Typography>
            <Box sx={{
              background: 'rgba(255,255,255,0.5)',
              borderRadius: '12px',
              padding: '15px',
              margin: '0 auto 15px',
              maxWidth: '85%',
              boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
              border: '1px dashed rgba(0,0,0,0.1)',
              position: 'relative',
              zIndex: 1,
              '&:before': {
                content: '""',
                position: 'absolute',
                top: '-3px',
                left: '-3px',
                right: '-3px',
                bottom: '-3px',
                borderRadius: '15px',
                border: '1px solid rgba(255,255,255,0.8)',
                zIndex: -1,
                pointerEvents: 'none'
              }
            }}>
              <Typography sx={{
                animation: `${bounce} 1s ease infinite`,
                fontWeight: 'bold',
                color: 'rgba(87, 34, 41, 1)',
                fontSize: { xs: '3rem', sm: '4rem' },
                fontFamily: '"Paytone One", sans-serif',
                textShadow: `
                  -1px -1px 0 gold,
                  1px -1px 0 gold,
                  -1px 1px 0 gold,
                  1px 1px 0 gold
                `,
                lineHeight: 1,
                position: 'relative',
                display: 'inline-block',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, transparent 45%, rgba(255,255,255,0.8) 50%, transparent 55%)',
                  backgroundSize: '200% 200%',
                  animation: `${shimmer} 2s linear infinite`,
                  mixBlendMode: 'overlay',
                  borderRadius: '50%'
                }
              }}>
                {parseFloat(winningItem).toFixed(2)}
              </Typography>
            </Box>
            <Typography sx={{
              color: theme.palette.getContrastText('#FBDC6A'),
              fontSize: { xs: '0.9rem', sm: '1rem' },
              fontWeight: 600,
              mt: 1,
              position: 'relative',
              zIndex: 1,
              fontStyle: 'italic'
            }}>
              This prize is credited to your wallet.
            </Typography>
          </>
        ) : (
          <Box sx={{ 
            position: 'relative',
            zIndex: 1
          }}>
            <Box sx={{
              width: 80,
              height: 80,
              margin: '0 auto 15px',
              background: 'rgba(255,255,255,0.7)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
              border: '2px solid rgba(177,43,36,0.3)'
            }}>
              <Typography sx={{ 
                fontSize: '2.5rem',
                animation: `${float} 2s ease-in-out infinite`
              }}>
                ❌
              </Typography>
            </Box>
            <Typography 
              sx={{ 
                color: 'rgba(87, 34, 41, 1)',
                fontSize: { xs: '1.1rem', sm: '1.3rem' },
                fontWeight: 'bold',
                mb: 1,
                fontFamily: '"Paytone One", cursive, sans-serif',
                letterSpacing: '0.5px'
              }}
            >
              NO 3 MATCHING PRIZES
            </Typography>
            <Typography 
              sx={{ 
                color: '#4a4949',
                fontSize: { xs: '0.9rem', sm: '1.1rem' },
                fontFamily: '"Paytone One", cursive, sans-serif',
              }}
            >
              Don't worry, you can try again!
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions 
        sx={{
          background: 'rgba(255,255,255,0.7)',
          justifyContent: 'center',
          padding: { xs: '15px', sm: '20px' },
          pt: 0,
          position: 'relative',
          overflow: 'hidden',
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent)'
          }
        }}
      >
        <Button 
          onClick={onPlayAgain}
          variant="contained"
          sx={{
            background: isWinner 
              ? 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)' 
              : 'linear-gradient(135deg, #B12B24 0%, #7B1C1C 100%)',
            color: 'white',
            fontFamily: '"Montserrat", sans-serif',
            fontWeight: 'bold',
            fontSize: { xs: '0.9rem', sm: '1rem' },
            borderRadius: '50px',
            padding: '10px 30px',
            minWidth: '150px',
            boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            zIndex: 1,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
              '&:before': {
                opacity: 1
              }
            },
            '&:active': {
              transform: 'translateY(1px)'
            },
            '&:before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent)',
              opacity: 0,
              transition: 'opacity 0.3s ease',
              zIndex: -1
            }
          }}
        >
          PLAY AGAIN
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResultDialog;