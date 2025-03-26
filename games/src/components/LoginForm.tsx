import React, { use, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { setCookie } from '../utils/cookie';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  Fade,
  Slide,
  styled,
  keyframes
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const AnimatedButton = styled(Button)({
  animation: `${pulse} 2s infinite`,
  '&:hover': {
    animation: 'none',
    transform: 'scale(1.05)'
  }
});

const LoginForm = () => {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userData = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (userData) {
      navigate(`${userData?.userData?.data?.user?.role === 'moderator' ? '/moderator' : '/games'}`);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { mobile });
      const { token, user } = response.data.data;
      api.defaults.headers['Authorization'] = `Bearer ${token}`;
      setCookie('token', token, 1); // Set token in cookies
      const expirationTime = new Date().getTime() + 24 * 60 * 60 * 1000; 
      localStorage.setItem('user', JSON.stringify({userData:response.data, expirationTime}));
      
      if(user && token){
        navigate(`${user.role === 'moderator' ? '/moderator' : '/games'}`);
      }
    } catch (err) {
      console.log(err);
      setError('Login failed. Please check your mobile number.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Allow only numbers and +
    const sanitizedValue = input.replace(/[^0-9+]/g, '');
    
    // Auto-format to +639 if starting with 09
    let formattedValue = sanitizedValue;
    if (sanitizedValue.startsWith('09') && sanitizedValue.length === 11) {
      formattedValue = `+63${sanitizedValue.substring(1)}`;
    }
    
    setMobile(formattedValue);
  };

  return (
    <Container 
      maxWidth="xs"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#1a2035',
        padding: 2
      }}
    >
      <Slide in={true} direction="down" timeout={500}>
        <Paper
          elevation={24}
          sx={{
            width: '100%',
            padding: 4,
            borderRadius: 3,
            background: '#1a2035',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            overflow: 'hidden',
            '&:before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 8,
              background: 'linear-gradient(90deg, #800020 0%, #a00030 100%)'
            }
          }}
        >
          <Box 
            component="form" 
            onSubmit={handleLogin}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3
            }}
          >
            <Fade in={true} timeout={800}>
              <Box>
                <Typography 
                  variant="h4" 
                  component="h1" 
                  sx={{
                    textAlign: 'center',
                    fontWeight: 700,
                    color: 'white',
                    mb: 1,
                    fontFamily: '"Poppins", sans-serif',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  Welcome Back
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{
                    textAlign: 'center',
                    color: 'rgba(255,255,255,0.7)',
                    fontFamily: '"Roboto", sans-serif'
                  }}
                >
                  Please enter your mobile number to continue
                </Typography>
              </Box>
            </Fade>

            <Fade in={true} timeout={1000}>
            <TextField
                fullWidth
                label="Philippine Mobile Number"
                variant="outlined"
                value={mobile}
                onChange={handleMobileChange}
                required
                inputProps={{
                  maxLength: 13, // +639XXXXXXXXX (13 characters)
                  inputMode: 'tel'
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon sx={{ color: '#a00030' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 2,
                    fontFamily: '"Roboto", sans-serif',
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '& input': {
                      color: 'white',
                      backgroundColor: 'transparent'
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'rgba(255,255,255,0.15)'
                    },
                    '&.Mui-filled': {
                      backgroundColor: 'rgba(255,255,255,0.12)'
                    }
                  }
                }}
                InputLabelProps={{
                  sx: {
                    color: 'rgba(255,255,255,0.7)',
                    '&.Mui-focused': {
                      color: '#a00030'
                    }
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(255,255,255,0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: '#a00030',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#a00030',
                      borderWidth: 2
                    }
                  }
                }}
                helperText={!mobile ? "Format: +639XXXXXXXXX" : ""}
                FormHelperTextProps={{
                  sx: {
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.75rem',
                    marginLeft: 0
                  }
                }}
              />
            </Fade>

            {error && (
              <Fade in={true} timeout={300}>
                <Typography 
                  color="error" 
                  sx={{
                    textAlign: 'center',
                    fontFamily: '"Roboto", sans-serif',
                    fontWeight: 500
                  }}
                >
                  {error}
                </Typography>
              </Fade>
            )}

            <Fade in={true} timeout={1200}>
              <Box>
                <AnimatedButton
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    background: 'linear-gradient(90deg, #800020 0%, #a00030 100%)',
                    fontFamily: '"Poppins", sans-serif',
                    fontWeight: 600,
                    fontSize: '1rem',
                    textTransform: 'none',
                    boxShadow: '0 4px 14px rgba(128, 0, 32, 0.5)',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #700018 0%, #900028 100%)',
                      boxShadow: '0 6px 20px rgba(128, 0, 32, 0.7)'
                    },
                    '&:disabled': {
                      background: '#444444',
                      color: '#777777'
                    }
                  }}
                >
                  {isSubmitting ? 'Logging in...' : 'Login'}
                </AnimatedButton>
              </Box>
            </Fade>
          </Box>
        </Paper>
      </Slide>

      <Fade in={true} timeout={1500}>
        <Typography 
          variant="body2" 
          sx={{
            mt: 3,
            color: 'rgba(255,255,255,0.5)',
            textAlign: 'center',
            fontFamily: '"Roboto", sans-serif',
            '&:hover': {
              color: 'rgba(255,255,255,0.8)'
            }
          }}
        >
          Don't have an account? <span style={{color: '#a00030', cursor: 'pointer'}}>Contact support</span>
        </Typography>
      </Fade>
    </Container>
  );
};

export default LoginForm;