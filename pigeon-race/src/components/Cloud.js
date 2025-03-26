import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import { useSprings, animated } from 'react-spring';
import { v4 as uuidv4 } from 'uuid';

const generateClouds = (count) => {
  return new Array(count).fill(0).map(() => ({
    id: uuidv4(),
    x: Math.random() * 20, // Random horizontal position within the box
    size: Math.random() * 3 + 1, // Random size
    speed: Math.random() * 5000 + 2000 // Random speed for animation duration
  }));
};

const Cloud = () => {
  const [startAnimation, setStartAnimation] = useState(false);
  const [paused, setPaused] = useState(false); // New state to track pause
  const clouds = generateClouds(20); // Generate 20 clouds

  const springs = useSprings(
    clouds.length,
    clouds.map((cloud) => ({
      from: {
        transform: `translate(${cloud.x}vw, -50vh) scale(${cloud.size})`, // Start above the screen
      },
      to: {
        transform: `translate(${cloud.x}vw, 200vh) scale(${cloud.size})`, // Move to the bottom
      },
      reset: false, // Prevent reset when paused or resumed
      reverse: false,
      loop: true, // If paused, animation will not loop
      config: { duration: cloud.speed },
      pause: paused, // Pause animation if `paused` is true
    }))
  );

  const handleStart = () => {
    setPaused(false); // Start the animation by setting paused to false
    setStartAnimation(true); // Set startAnimation to true
  };

  const handleStop = () => {
    setPaused(true); // Pause the animation
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'row' }}>
      {/* Left side div with 70% width, red background */}
      <Box
        sx={{
          width: '70%',
          background: 'linear-gradient(to bottom, #87CEEB, #B0E0E6)',
          height: '200%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {springs.map((props, index) => (
          <animated.div key={clouds[index].id} style={{ ...props, position: 'absolute' }}>
            ☁️
          </animated.div>
        ))}
      </Box>

      {/* Main content area with sky background */}
      <Box
        sx={{
          width: '70%',
          background: 'linear-gradient(to bottom, #87CEEB, #B0E0E6)', // Sky-like background
          height: '200%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={handleStart} // Start the animation when clicked
          sx={{ marginBottom: '10px' }}
        >
          Start Animation
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleStop} // Stop (pause) the animation when clicked
        >
          Stop Animation
        </Button>
      </Box>

      {/* Right side div with 15% width, blue background */}
      <Box
        sx={{
          width: '70%',
          background: 'linear-gradient(to bottom, #87CEEB, #B0E0E6)',
          height: '200%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {springs.map((props, index) => (
          <animated.div key={clouds[index].id} style={{ ...props, position: 'absolute', marginLeft: 20 }}>
            ☁️
          </animated.div>
        ))}
      </Box>
    </Box>
  );
};

export default Cloud;
