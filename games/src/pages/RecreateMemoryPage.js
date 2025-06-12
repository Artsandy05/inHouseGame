import React, { useState, useEffect } from 'react';
import { Button, Box, Typography, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Paper, Avatar, IconButton, keyframes, Chip, CircularProgress } from '@mui/material';
import { CloudUpload, Palette, AutoAwesome, Psychology, Description, Stars, Favorite, TravelExplore, Close, Image, Download, Replay } from '@mui/icons-material';
import { styled } from '@mui/system';
import { generateVideo } from '../services/gameService';

// Floating orb animation
const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

const pulse = keyframes`
  0% { opacity: 0.6; transform: scale(0.95); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0.6; transform: scale(0.95); }
`;

const twinkle = keyframes`
  0% { opacity: 0.2; }
  50% { opacity: 1; }
  100% { opacity: 0.2; }
`;

const FloatingOrb = styled(Box)(({ color, size, left, top, blur, delay, duration }) => ({
  position: 'absolute',
  width: size,
  height: size,
  borderRadius: '50%',
  background: `radial-gradient(circle at 30% 30%, white, ${color})`,
  left: left,
  top: top,
  filter: `blur(${blur})`,
  opacity: 0.7,
  zIndex: 0,
  animation: `${float} ${duration || '15s'} infinite ${delay || '0s'} ease-in-out`,
}));

const TwinkleStar = styled(Box)(({ left, top, size, delay }) => ({
  position: 'absolute',
  width: size,
  height: size,
  background: 'white',
  borderRadius: '50%',
  left: left,
  top: top,
  filter: 'blur(0.5px)',
  animation: `${twinkle} ${Math.random() * 3 + 2}s infinite ${delay || '0s'}`,
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #6a11cb 0%, #2575fc 100%)',
  color: 'white',
  fontWeight: 'bold',
  padding: '12px 24px',
  borderRadius: '50px',
  boxShadow: '0 4px 15px rgba(106, 17, 203, 0.3)',
  transition: 'all 0.3s',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    background: 'linear-gradient(45deg, #6a11cb 0%, #2575fc 80%)',
    boxShadow: '0 6px 20px rgba(106, 17, 203, 0.4)',
    transform: 'translateY(-3px)',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background: 'linear-gradient(transparent, rgba(255,255,255,0.1), transparent)',
    transform: 'rotate(30deg)',
    transition: 'all 0.5s',
  },
  '&:hover::after': {
    left: '100%',
  },
}));

const UploadBox = styled(Paper)(({ theme }) => ({
  border: '2px dashed',
  borderColor: theme.palette?.primary?.main || '#6a11cb',
  borderRadius: '24px',
  padding: '40px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(10px)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: 'translateY(-5px)',
    boxShadow: '0 15px 30px rgba(106, 17, 203, 0.2)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #6a11cb, #2575fc, #6a11cb)',
    backgroundSize: '200% 200%',
    animation: `${pulse} 3s infinite linear`,
  },
}));

const FeatureCard = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '24px',
  padding: '30px 20px',
  textAlign: 'center',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-10px)',
    boxShadow: '0 15px 30px rgba(0, 0, 0, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at center, transparent, rgba(255,255,255,0.03))',
    pointerEvents: 'none',
  },
}));

const OrbParticle = styled(Box)(({ color, size, left, top }) => ({
  position: 'absolute',
  width: size,
  height: size,
  borderRadius: '50%',
  background: color,
  left: left,
  top: top,
  filter: 'blur(1px)',
  opacity: 0.8,
  zIndex: -1,
}));

const PreviewImage = styled(Box)({
  position: 'relative',
  width: '100%',
  height: '100%',
  borderRadius: '12px',
  overflow: 'hidden',
  '&:hover .remove-btn': {
    opacity: 1,
  },
});

const RemoveButton = styled(IconButton)({
  position: 'absolute',
  top: 5,
  right: 5,
  backgroundColor: 'rgba(0,0,0,0.5)',
  color: 'white',
  padding: '4px',
  opacity: 0,
  transition: 'opacity 0.3s',
  '&:hover': {
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
});

const VideoPreviewContainer = styled(Box)({
  position: 'relative',
  width: '100%',
  paddingBottom: '56.25%', // 16:9 aspect ratio
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  marginBottom: '24px',
  '& video': {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
});

const ActionButton = styled(Button)({
  borderRadius: '50px',
  padding: '12px 24px',
  fontWeight: 'bold',
  textTransform: 'none',
  fontSize: '1rem',
  transition: 'all 0.3s',
  '&:hover': {
    transform: 'translateY(-3px)',
  },
});

const videoFolder = process.env.REACT_APP_GENERATED_VIDEOS_URL;

const RecreateMemoryPage = () => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [stars, setStars] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  useEffect(() => {
    // Generate twinkling stars
    const generatedStars = [];
    for (let i = 0; i < 30; i++) {
      generatedStars.push({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: `${Math.random() * 3 + 1}px`,
        delay: `${Math.random() * 2}s`,
      });
    }
    setStars(generatedStars);
  }, []);

  const handleClickOpen = () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one memory fragment to create your orb');
      return;
    }
    setOpen(true);
    handleGenerateVideo();
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Convert files to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Handle video generation
  const handleGenerateVideo = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one image');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      // Simulate progress (in a real app, you'd get progress from your backend)
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 1000);

      // Convert selected files to base64
      const base64Images = await Promise.all(
        selectedFiles.map(file => fileToBase64(file))
      );

      // Call your generateVideo service
      const result = await generateVideo(base64Images, prompt);
      
      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (result) {
        // Assuming your backend returns the video file name
        // You might need to construct the full URL based on your setup
        
        const videoUrl = `${videoFolder}${result.data.videoFile}`;
        setGeneratedVideoUrl(videoUrl);
        setShowSuccessDialog(true);
      } else {
        throw new Error(result.message || 'Failed to generate video');
      }
    } catch (error) {
      console.error('Error generating video:', error);
      alert(`Error generating video: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setOpen(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedVideoUrl) {
      console.error('No video URL available for download');
      return;
    }
    
    try {
      console.log('Attempting to download video from:', generatedVideoUrl);
      
      // For cross-origin URLs or when direct download doesn't work,
      // fetch the video first, then create a blob URL
      const response = await fetch(generatedVideoUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `memory-orb-${new Date().toISOString().slice(0, 10)}.mp4`;
      
      // Ensure the link is added to the DOM for some browsers
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      
      console.log('Download initiated successfully');
    } catch (error) {
      console.error('Download error:', error);
      
      // Fallback: try direct download
      try {
        const link = document.createElement('a');
        link.href = generatedVideoUrl;
        link.download = `memory-orb-${new Date().toISOString().slice(0, 10)}.mp4`;
        link.target = '_blank'; // Open in new tab if download fails
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('Fallback download attempted');
      } catch (fallbackError) {
        console.error('Fallback download also failed:', fallbackError);
        alert('Download failed. Please try right-clicking the video and selecting "Save video as..."');
      }
    }
  };

  const handleCreateAnother = () => {
    setSelectedFiles([]);
    setPrompt('');
    setGeneratedVideoUrl(null);
    setShowSuccessDialog(false);
  };

  // Generate random orb particles
  const orbParticles = [];
  for (let i = 0; i < 15; i++) {
    orbParticles.push({
      id: i,
      color: i % 5 === 0 ? '#6a11cb' : 
             i % 5 === 1 ? '#2575fc' : 
             i % 5 === 2 ? '#00b09b' : 
             i % 5 === 3 ? '#ff8a00' : '#e94057',
      size: `${Math.random() * 10 + 5}px`,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
    });
  }

  return (
    <Box sx={{
      position: 'relative',
      minHeight: '100vh',
      overflow: 'hidden',
      padding: { xs: '20px', md: '40px' },
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      color: 'white',
    }}>
      {/* Twinkling Stars Background */}
      {stars.map(star => (
        <TwinkleStar key={star.id} left={star.left} top={star.top} size={star.size} delay={star.delay} />
      ))}
      
      {/* Floating Orbs Background */}
      <FloatingOrb color="#6a11cb" size="200px" left="10%" top="20%" blur="30px" duration="20s" delay="0s" />
      <FloatingOrb color="#2575fc" size="300px" left="70%" top="30%" blur="40px" duration="25s" delay="2s" />
      <FloatingOrb color="#00b09b" size="150px" left="30%" top="60%" blur="25px" duration="18s" delay="1s" />
      <FloatingOrb color="#ff8a00" size="250px" left="60%" top="70%" blur="35px" duration="22s" delay="3s" />
      <FloatingOrb color="#e94057" size="180px" left="20%" top="80%" blur="28px" duration="17s" delay="1.5s" />
      
      {/* Orb Particles */}
      {orbParticles.map(particle => (
        <OrbParticle 
          key={particle.id} 
          color={particle.color} 
          size={particle.size} 
          left={particle.left} 
          top={particle.top} 
        />
      ))}

      <Box sx={{
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
      }}>
        {generatedVideoUrl ? (
          <Box sx={{ 
            textAlign: 'center',
            mt: 4,
            mb: 6,
          }}>
            <Typography variant="h3" sx={{
              fontWeight: 'bold',
              mb: 4,
              background: 'linear-gradient(45deg, #fff, #aaa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '2rem', md: '3rem' },
            }}>
              Your Memory Orb is Ready!
            </Typography>
            
            <VideoPreviewContainer>
              <video controls autoPlay loop>
                <source src={generatedVideoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </VideoPreviewContainer>
            
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              flexWrap: 'wrap',
              mt: 4,
            }}>
              <ActionButton
                variant="contained"
                color="primary"
                startIcon={<Download />}
                onClick={handleDownload}
                sx={{
                  background: 'linear-gradient(45deg, #6a11cb 0%, #2575fc 100%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #6a11cb 0%, #2575fc 80%)',
                  },
                }}
              >
                Download Memory
              </ActionButton>
              
              <ActionButton
                variant="outlined"
                color="secondary"
                startIcon={<Replay />}
                onClick={handleCreateAnother}
                sx={{
                  borderWidth: '2px',
                  '&:hover': {
                    borderWidth: '2px',
                    background: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                Create Another Memory
              </ActionButton>
            </Box>
            
            <Typography sx={{
              mt: 10,
              color: 'rgba(255,255,255,0.7)',
              maxWidth: '600px',
              margin: '0 auto',
            }}>
              Your memory orb has been successfully created. You can download it to keep forever or create another magical memory.
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ 
              textAlign: 'center', 
              mb: 6,
              position: 'relative',
            }}>
              <Typography variant="h2" sx={{
                fontWeight: 'bold',
                mb: 2,
                background: 'linear-gradient(45deg, #fff, #aaa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '2.5rem', md: '4rem' },
                position: 'relative',
                display: 'inline-block',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -10,
                  left: '25%',
                  width: '50%',
                  height: '4px',
                  background: 'linear-gradient(90deg, transparent, #6a11cb, #2575fc, transparent)',
                  borderRadius: '2px',
                },
              }}>
                Recreate Your Memory
              </Typography>
              
              <Typography variant="h5" sx={{
                maxWidth: '800px',
                margin: '0 auto',
                fontSize: { xs: '1.1rem', md: '1.3rem' },
                color: 'rgba(255, 255, 255, 0.8)',
                position: 'relative',
                '&::before': {
                  content: '"✧"',
                  position: 'absolute',
                  left: -30,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '1.5rem',
                },
                '&::after': {
                  content: '"✧"',
                  position: 'absolute',
                  right: -30,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '1.5rem',
                },
              }}>
                Transform your cherished moments into magical memory orbs that glow with your emotions
              </Typography>
              
              <Box sx={{
                position: 'absolute',
                top: -50,
                right: { xs: 0, md: 100 },
                animation: `${pulse} 4s infinite ease-in-out`,
              }}>
                <TravelExplore sx={{ fontSize: '80px', color: 'rgba(255,255,255,0.2)' }} />
              </Box>
            </Box>

            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: '30px',
              mb: 6,
            }}>
              <Box sx={{ flex: 1, position: 'relative' }}>
                <UploadBox 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  sx={isDragging ? { 
                    backgroundColor: 'rgba(106, 17, 203, 0.2)',
                    transform: 'scale(1.02)',
                  } : {}}
                >
                  <Box sx={{
                    position: 'relative',
                    display: 'inline-block',
                    mb: 3,
                  }}>
                    <CloudUpload sx={{ 
                      fontSize: '60px', 
                      color: 'primary.main',
                      animation: `${float} 5s infinite ease-in-out`,
                    }} />
                    <Favorite sx={{
                      position: 'absolute',
                      top: -10,
                      right: -10,
                      fontSize: '24px',
                      color: '#e94057',
                      animation: `${pulse} 2s infinite`,
                    }} />
                  </Box>
                  
                  <Typography
                    variant="h5"
                    sx={{
                      mb: 1,
                      fontWeight: 'bold',
                      background: 'linear-gradient(90deg, #6a11cb, #2575fc, #6a11cb)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      color: 'transparent', // Fallback
                    }}
                  >
                    {selectedFiles.length > 0 ? 
                      `${selectedFiles.length} memory fragments selected` : 
                      'Drop your memory fragments here'}
                  </Typography>

                  <Typography sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    mb: 3,
                    fontStyle: 'italic',
                  }}>
                    {selectedFiles.length > 0 ? 
                      'These moments will shine in your orb' : 
                      'Photos of your memorable moments'}
                  </Typography>
                  
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '10px',
                    flexWrap: 'wrap',
                    mb: 3,
                    minHeight: '80px',
                  }}>
                    {selectedFiles.length > 0 ? (
                      selectedFiles.map((file, index) => (
                        <Box key={index} sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '12px',
                          background: 'rgba(255,255,255,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          position: 'relative',
                        }}>
                          <PreviewImage>
                            {file.type.startsWith('image/') ? (
                              <>
                                <img 
                                  src={URL.createObjectURL(file)} 
                                  alt={file.name} 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <RemoveButton 
                                  className="remove-btn" 
                                  size="small" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(index);
                                  }}
                                >
                                  <Close fontSize="small" />
                                </RemoveButton>
                              </>
                            ) : (
                              <>
                                <Description sx={{ color: 'rgba(255,255,255,0.7)' }} />
                                <Typography variant="caption" sx={{
                                  position: 'absolute',
                                  bottom: 5,
                                  left: 0,
                                  right: 0,
                                  textAlign: 'center',
                                  fontSize: '0.6rem',
                                  color: 'white',
                                  background: 'rgba(0,0,0,0.5)',
                                  padding: '2px',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}>
                                  {file.name}
                                </Typography>
                              </>
                            )}
                          </PreviewImage>
                        </Box>
                      ))
                    ) : (
                      <Image sx={{ 
                        fontSize: '40px', 
                        color: 'rgba(255,255,255,0.3)',
                        width: '100%',
                        textAlign: 'center',
                      }} />
                    )}
                  </Box>
                  
                  <input
                    type="file"
                    id="memory-upload"
                    hidden
                    multiple
                    onChange={handleFileChange}
                    accept="image/*,video/*"
                  />
                  <label htmlFor="memory-upload">
                    <Button 
                      variant="outlined" 
                      component="span"
                      startIcon={<Stars />}
                      sx={{
                        borderRadius: '20px',
                        px: 3,
                        borderWidth: '2px',
                        '&:hover': {
                          borderWidth: '2px',
                        },
                      }}
                    >
                      {selectedFiles.length > 0 ? 'Add More Memories' : 'Select Memories'}
                    </Button>
                  </label>
                </UploadBox>
              </Box>

              <Box sx={{ flex: 1, position: 'relative' }}>
                <Paper sx={{
                  borderRadius: '24px',
                  padding: '30px',
                  height: '85%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #00b09b, #96c93d, #00b09b)',
                    backgroundSize: '200% 200%',
                    animation: `${pulse} 4s infinite linear`,
                  },
                }}>
                  <Typography
                    variant="h6"
                    sx={{ 
                      mb: 2, 
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'linear-gradient(90deg, #00b09b, #96c93d, #00b09b)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      color: 'transparent', // Fallback
                    }}
                  >
                    <Psychology sx={{ color: 'secondary.main' }} />
                    Describe Your Memory Essence
                  </Typography>

                  
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    variant="outlined"
                    placeholder="Whisper to the orb what you remember... (e.g. 'A summer vacation at the beach with golden sunset, joyful moments with family, the sound of waves and children laughing')"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                          borderRadius: '12px',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.4)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'secondary.main',
                        },
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '1rem',
                        '&::placeholder': {
                          color: 'rgba(255,255,255,0.5)',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                  
                  <Box sx={{ 
                    mt: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    flexWrap: 'wrap',
                  }}>
                    <Chip label="Joyful" size="small" sx={{ borderRadius: '12px', color:'#D1B3FF' }} />
                    <Chip label="Romantic" size="small" sx={{ borderRadius: '12px', color:'#D1B3FF' }} />
                    <Chip label="Adventure" size="small" sx={{ borderRadius: '12px', color:'#D1B3FF' }} />
                    <Chip label="Family" size="small" sx={{ borderRadius: '12px', color:'#D1B3FF' }} />
                    <Chip label="Tranquil" size="small" sx={{ borderRadius: '12px', color:'#D1B3FF' }} />
                  </Box>
                </Paper>
              </Box>
            </Box>

            <Box sx={{ 
              textAlign: 'center', 
              mb: 5,
              position: 'relative',
              mt: 10,
            }}>
              <GradientButton
                startIcon={<AutoAwesome sx={{ 
                  animation: `${pulse} 2s infinite`,
                }} />}
                size="large"
                onClick={handleClickOpen}
                sx={{
                  fontSize: '1.2rem',
                  px: 6,
                }}
                disabled={selectedFiles.length === 0}
              >
                Weave Memory Orb
              </GradientButton>
              
              <Typography sx={{
                mt: 2,
                color: 'rgba(255,255,255,0.6)',
                fontStyle: 'italic',
              }}>
                {selectedFiles.length === 0 ? 'Add memory fragments to begin weaving' : 'The orb will glow with the emotions you\'ve described'}
              </Typography>
              
              <Box sx={{
                position: 'absolute',
                bottom: -40,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '200px',
                height: '20px',
                background: 'radial-gradient(ellipse at center, rgba(106,17,203,0.4) 0%, transparent 70%)',
                filter: 'blur(5px)',
              }} />
            </Box>

            <Typography variant="h4" sx={{
              textAlign: 'center',
              mb: 6,
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #fff, #aaa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              position: 'relative',
              '&::before, &::after': {
                content: '"✧"',
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.3)',
                fontSize: '1.5rem',
              },
              '&::before': {
                left: { xs: 10, md: 50 },
              },
              '&::after': {
                right: { xs: 10, md: 50 },
              },
            }}>
              The Memory Weaving Process
            </Typography>

            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
              gap: '30px',
              mb: 8,
            }}>
              <FeatureCard>
                <Box sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 30% 30%, white, #6a11cb)',
                  margin: '0 auto 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px #6a11cb',
                  animation: `${pulse} 3s infinite`,
                }}>
                  <CloudUpload sx={{ fontSize: '40px', color: 'white' }} />
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>Memory Fragments</Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Each photo or memento becomes a glowing fragment within your orb, preserving its unique energy.
                </Typography>
              </FeatureCard>

              <FeatureCard>
                <Box sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 30% 30%, white, #2575fc)',
                  margin: '0 auto 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px #2575fc',
                  animation: `${pulse} 3s infinite 1s`,
                }}>
                  <Description sx={{ fontSize: '40px', color: 'white' }} />
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>Emotional Resonance</Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Your words and emotions weave these fragments together, creating harmonious connections between them.
                </Typography>
              </FeatureCard>

              <FeatureCard>
                <Box sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 30% 30%, white, #00b09b)',
                  margin: '0 auto 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px #00b09b',
                  animation: `${pulse} 3s infinite 2s`,
                }}>
                  <AutoAwesome sx={{ fontSize: '40px', color: 'white' }} />
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>Orb Manifestation</Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  The fragments coalesce into a radiant memory orb, pulsing with the emotions you've infused it with.
                </Typography>
              </FeatureCard>
            </Box>

            <Box sx={{
              backgroundColor: 'rgba(106, 17, 203, 0.15)',
              borderRadius: '24px',
              padding: { xs: '30px 20px', md: '40px' },
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'relative',
              overflow: 'hidden',
              mb: 8,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 20% 30%, rgba(106,17,203,0.3), transparent 60%)',
                pointerEvents: 'none',
              },
            }}>
              <Typography variant="h4" sx={{ 
                mb: 3, 
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #fff, #aaa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                "Memories are the treasures that time cannot steal"
              </Typography>
              
              <Typography sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                maxWidth: '800px',
                margin: '0 auto',
                fontSize: '1.1rem',
                mb: 3,
              }}>
                In Memoraverse, your most precious moments become eternal orbs of light, 
                waiting to be revisited whenever you need their warmth and joy.
              </Typography>
              
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: '20px',
                flexWrap: 'wrap',
              }}>
                {['#6a11cb', '#2575fc', '#00b09b', '#ff8a00', '#e94057'].map((color, index) => (
                  <Box key={index} sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: `radial-gradient(circle at 30% 30%, white, ${color})`,
                    boxShadow: `0 0 15px ${color}`,
                    animation: `${pulse} ${3 + index}s infinite ${index * 0.5}s`,
                  }} />
                ))}
              </Box>
            </Box>
          </>
        )}
      </Box>

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 100%)',
            borderRadius: '24px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
          }
        }}
      >
        <DialogTitle sx={{
          background: 'linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)',
          color: 'white',
          fontWeight: 'bold',
          textAlign: 'center',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, white, transparent)',
          },
        }}>
          Weaving Your Memory Orb
        </DialogTitle>
        
        <DialogContent sx={{ 
          padding: '40px',
          textAlign: 'center',
        }}>
          <Box sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, white, #6a11cb, #2575fc)',
            margin: '0 auto 30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 30px #6a11cb',
            animation: `${pulse} 2s infinite ease-in-out`,
            position: 'relative',
            top:40,
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: -10,
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.3)',
              animation: `${pulse} 3s infinite 0.5s`,
            },
          }}>
            {isGenerating ? (
              <CircularProgress 
                size={50} 
                thickness={4} 
                sx={{ color: 'white' }} 
              />
            ) : (
              <AutoAwesome sx={{ 
                fontSize: '50px', 
                color: 'white',
                animation: `${float} 3s infinite ease-in-out`,
              }} />
            )}
          </Box>
          
          <Typography variant="h6" sx={{ 
            mb: 2,
            mt: 10,
            fontWeight: 'bold',
            color:'#D1B3FF'
          }}>
            {isGenerating ? 'Your memory orb is taking shape...' : 'Memory Orb Complete!'}
          </Typography>
          
          <Typography sx={{ 
            color: 'rgba(255,255,255,0.7)',
            mb: 4,
          }}>
            {isGenerating ? (
              `The Memoraverse is weaving ${selectedFiles.length} fragments together with the threads of your emotions.`
            ) : (
              'Your memory orb has been successfully created! You can now download it or create another.'
            )}
          </Typography>
          
          <Box sx={{
            height: '4px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
            mb: 4,
          }}>
            <Box sx={{
              height: '100%',
              width: `${generationProgress}%`,
              background: 'linear-gradient(90deg, #6a11cb, #2575fc)',
              borderRadius: '2px',
              transition: 'width 0.5s ease',
            }} />
          </Box>

          {isGenerating && (
            <Box sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              justifyContent: 'center',
              maxHeight: '150px',
              overflowY: 'auto',
              p: 1,
            }}>
              {selectedFiles.map((file, index) => (
                <Box key={index} sx={{
                  width: 50,
                  height: 50,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  {file.type.startsWith('image/') ? (
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={file.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Box sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(255,255,255,0.1)',
                    }}>
                      <Description sx={{ fontSize: '20px', color: 'rgba(255,255,255,0.7)' }} />
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ 
          padding: '20px',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.2)',
        }}>
          {!isGenerating && (
            <Button 
              onClick={handleClose} 
              sx={{
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '20px',
                px: 4,
                '&:hover': {
                  background: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              View Orb
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecreateMemoryPage;