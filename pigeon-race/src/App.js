import React, { useState, useEffect } from 'react';
import { Button, Box, Typography, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useSprings, animated, useSpring } from 'react-spring';
import AnimatedBackground from './components/AnimatedBackground';

const birds = ['🐦', '🦅', '🦜', '🦉']; // The birds for the race
const birdHomes = ['🏚️', '🏡', '🏘', '🏠︎'];

const App = () => {
  const [raceStarted, setRaceStarted] = useState(false); // To trigger the race
  const [finishedBirds, setFinishedBirds] = useState([]); // List of finished birds
  const [raceWinner, setRaceWinner] = useState(null); // To store the winning bird
  const [openDialog, setOpenDialog] = useState(false); // Dialog state for displaying results
  const [clouds, setClouds] = useState([]); // To store cloud data
  const raceBg = '/assets/racebg.png';
  const pigeonImages = ['/assets/pigeon1.png','/assets/pigeon2.png','/assets/pigeon3.png','/assets/pigeon4.png'];
  const [houses, setHouses] = useState([]);
  const [homeSpringsFinished, setHomeSpringsFinished] = useState(false);

  const [durations, setDurations] = useState(
    birds.map(() => Math.random() * 2000 + 3000)
  );
  const [animating, setAnimating] = useState(false); // To track if animations are in progress
  const [resetKey, setResetKey] = useState(0); // Key for resetting the springs

  useEffect(() => {
    if (raceStarted) {
      const houseInterval = setInterval(() => {
        const newHouse = {
          id: Math.random(), // Unique id for each house
          landSize: { width: Math.random() * 300 + 200, height: Math.random() * 200 + 150 }, // Random size
          numCorners: Math.floor(Math.random() * 5) + 5, // Random number of corners between 5 and 9
          houseColor: `#${Math.floor(Math.random()*16777215).toString(16)}`, // Random house color
        };
        setHouses((prevHouses) => [...prevHouses, newHouse]);
      }, 2000); // Every 2 seconds

      return () => clearInterval(houseInterval); // Clean up interval on unmount
    }
  }, [raceStarted]);

  useEffect(() => {
    let randSec = Math.floor(Math.random() * (1000 - 50 + 1)) + 500;

    // Function to trigger at each interval
    const triggerInterval = () => {
      setDurations(
        birds.map(() => Math.random() * 50000 + 10000)
      );
      
      // After the callback runs, set a new random interval for the next cycle
      randSec = Math.floor(Math.random() * (1000 - 500 + 1)) + 500;
    };

    // Initial interval setup
    let interval = setInterval(triggerInterval, randSec);

    return () => clearInterval(interval); // Clean up the interval on unmount
  }, [birds]);

  useEffect(() => {
    if(finishedBirds.length === 4)
      setAnimating(false);
  }, [finishedBirds]);

  useEffect(() => {
    // Create clouds every 500ms if the race is started
    if (raceStarted) {
      const cloudInterval = setInterval(() => {
        const newClouds = [...clouds];
        newClouds.push({
          id: Math.random(), // Unique identifier for each cloud
          x: Math.random() * 100, // Random x position
          size: Math.random() * 50 + 20, // Random cloud size
          speed: Math.random() * 3 + 1, // Random cloud speed
        });
        setClouds(newClouds);
      }, 500);

      // Clean up on race reset
      return () => clearInterval(cloudInterval);
    }
  }, [raceStarted, clouds]);
  

  // Generate random speed for each bird
  const getRandomSpeed = () => Math.random() * 2 + 1; // Random speed between 1 and 3

  // Use react-spring's useSprings hook for animating birds
  const springs = useSprings(
    pigeonImages.length,
    pigeonImages.map((pigeon, index) => ({
      from: { y: '-15vh' }, // Birds start from the bottom
      to: raceStarted ? { y: '70vh' } : { y: '-15vh' }, // Birds only race if the race has started
      config: { duration: !raceStarted ? 0 : durations[index], friction: 30 }, // Use the updated random duration
      onRest: () => handlePigeonFinish(index, pigeon), // Handle bird finishing the race
    }))
  );

  const homeSprings = useSprings(
    birdHomes.length,
    birdHomes.map((bird, index) => ({
      from: { y: '-70vh' },
      to: raceStarted ? { y: '0vh' } : { y: '-70vh' },
      config: { duration: finishedBirds.length === 4 ? 0 : 15000, friction: 30 },
      onRest: () => {
        // Check if all home animations have finished
        if (index === birdHomes.length - 1) {
          setHomeSpringsFinished(true); // All animations are finished
        }
      },
    }))
  );

  

  // Handle bird finishing the race
  const handlePigeonFinish = (index, pigeon) => {
    if (!finishedBirds.some(f => f.pigeon === pigeon)) {
      setFinishedBirds(prev => {
        const updatedPigeons = [...prev, { pigeon, position: finishedBirds.length + 1 }];
        
        // If this is the last pigeon, set the race winner to the pigeon in the first position
        if (updatedPigeons.length === pigeonImages.length) {
          const pigeonNames = {
            '/assets/pigeon1.png': 'Pigeon 1',
            '/assets/pigeon2.png': 'Pigeon 2',
            '/assets/pigeon3.png': 'Pigeon 3',
            '/assets/pigeon4.png': 'Pigeon 4',
          };
          
          setRaceWinner(pigeonNames[updatedPigeons[0].pigeon]); // Set the race winner as the first pigeon
          setAnimating(false); // End the animation once all pigeons have finished
          setOpenDialog(true); // Open the winner dialog when all pigeons are finished
        }
  
        return updatedPigeons;
      });
    }
  };
  

  // Start the race
  const startRace = () => {
    setRaceStarted(true);
    setAnimating(true); // Begin animation
  };

  // Reset the game for the next round
  const resetRace = () => {
    setRaceStarted(false);
    setFinishedBirds([]);
    setHomeSpringsFinished(false);
    setRaceWinner(null);
    setAnimating(false); // Reset animation state
    setResetKey(prevKey => prevKey + 1); // Increment key to force re-render of springs
    setOpenDialog(false); // Close dialog
    setClouds([]); // Clear clouds on reset
  };

  // Animation for the background scrolling effect
  const bgSpring = useSpring({
    to: {
      y: raceStarted ? '100vh' : '0vh', // Move the background element
    },
    from: {
      y: '0vh',
    },
    loop: raceStarted, // Loops infinitely when the race starts
    config: { duration: 10000, friction: 30 },
  });

  // Animation for clouds
  const cloudSprings = useSprings(
    clouds.length,
    clouds.map((cloud) => ({
      from: { y: '-20vh' }, // Clouds start below the screen
      to: raceStarted ? { y: '110vh' } : { y: '110vh' }, // Clouds move upward during the race
      config: { duration: cloud.speed * !raceWinner ? 20000 : 9000000, friction: 50 }, // Random speed effect
    }))
  );

  const houseSprings = useSprings(
    houses.length,
    houses.map((house) => ({
      from: { y: '-50vh', x: `${Math.random() * 100 - 50}vw` }, // Random starting x position
      to: { y: '110vh', x: `${Math.random() * 100 - 50}vw` }, // Random end x position
      config: { duration: 10000, friction: 30 }, // Random speed for each house
    }))
  );

  return (
    <Box sx={{
      textAlign: 'center',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      backgroundImage: 'url(/assets/racebg.jpg)',
      backgroundRepeat: 'repeat-y',
      backgroundSize: '350%', // Keeps it at double size, but you can adjust as needed
      backgroundPosition: '20% 46%', // Aligns the image to the left
      animation: raceStarted && !homeSpringsFinished ? 'moveBackground 28s linear infinite' : 'none',  // Makes the background scroll
    }} >

      
      
      {/* Display the race */}
      <Box sx={{ position: 'relative', height: '80vh', width: '100%',zIndex:1 }}>
        {springs.map((spring, index) => (
          // Only show the bird if it has not finished and animation is triggered
          animating && !finishedBirds.some(f => f.pigeon === pigeonImages[index]) && (
            <animated.div
              key={index}
              style={{
                position: 'absolute',
                left: `${(100 / birds.length) * index + 5}%`,
                bottom: spring.y.to(y => `${y}`), // Animate bird's vertical position
                fontSize: '2rem',
                transition: 'transform 0.5s ease',
                zIndex:0
              }}
            >
              <img
                src={pigeonImages[index]}
                alt={`pigeon-${index + 1}`}
                style={{
                  width: '50px',
                  height: '50px',
                  transform: index === 2 || index === 3 ? 'scaleY(-1)' : 'none', // Reverses the image vertically for pigeon 3 (index 2)
                }}
              />
            </animated.div>
          )
        ))}
        {homeSprings.map((spring, index) => (
          <animated.div
            key={index}
            style={{
              position: 'absolute',
              left: `${(100 / birdHomes.length) * index + 5}%`,
              top: spring.y.to(y => `${y}`), // Animate the home icons vertically
              fontSize: '2rem',
            }}
          >
            {birdHomes[index]}
          </animated.div>
        ))}
        {cloudSprings.map((spring, index) => (
          <animated.div
            key={clouds[index].id}
            style={{
              position: 'absolute',
              left: `${clouds[index].x-15}%`,
              top: spring.y.to(y => `${y}`), // Animate cloud's vertical position
              fontSize: `${clouds[index].size}px`,
              opacity: 0.7,
              zIndex: 1,
            }}
          >
            ☁️
          </animated.div>
        ))}
        {/* {houseSprings.map((spring, index) => (
          <animated.div
            key={houses[index].id}
            style={{
              position: 'absolute', // Random horizontal position
              top: spring.y.to(y => `${y}`),
              fontSize: `${houses[index].landSize.height / 10}px`, // Scale based on size
            }}
          >
            <HouseOnLand
              landSize={houses[index].landSize}
              numCorners={houses[index].numCorners}
              houseColor={houses[index].houseColor}
            />
          </animated.div>
        ))} */}
        
      </Box>

      {/* Show start button */}
      {finishedBirds.length === 0 && !raceStarted && (
        <Button variant="contained" color="primary" onClick={startRace} sx={{marginTop:'auto'}}>
          Start Race
        </Button>
      )}

      {/* Winner Dialog */}
      <Dialog open={openDialog} onClose={resetRace}>
        <DialogTitle sx={{ textAlign: 'center', fontSize: '1.5rem' }}>
          🎉 Congratulations! 🎉
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            🏆 <span style={{ fontSize: '1.5rem' }}>{raceWinner}</span> is the winner! 🎉
          </Typography>
          <Box sx={{ marginTop: 2 }}>
            <Typography variant="h6">Rankings</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              {finishedBirds.map((entry, index) => {
                // Map pigeon image paths to pigeon names
                const pigeonNames = {
                  '/assets/pigeon1.png': 'Pigeon 1',
                  '/assets/pigeon2.png': 'Pigeon 2',
                  '/assets/pigeon3.png': 'Pigeon 3',
                  '/assets/pigeon4.png': 'Pigeon 4',
                };

                const position = `${index + 1}${['st', 'nd', 'rd', 'th'][index] || 'th'}`;
                return (
                  <Box key={index} sx={{ marginBottom: 1, marginRight: 2 }}>
                    <Typography variant="body1" sx={{ fontSize: '1rem' }}>
                      {position} {pigeonNames[entry.pigeon] || 'Unknown Pigeon'}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <Button onClick={resetRace} variant="contained" color="secondary">
            Next Round
          </Button>
        </DialogActions>
      </Dialog>


      <style>
        {`
          @keyframes moveBackground {
            0% {
              background-position: 20% 100%;
            }
            100% {
              background-position: 20% 0;
            }
          }
        `}
      </style>
    </Box>
    
  );
};

const generateClipPath = (numCorners) => {
  const step = 360 / numCorners;
  let points = [];

  for (let i = 0; i < numCorners; i++) {
    const angle = i * step;
    const x = 50 + 40 * Math.cos((angle * Math.PI) / 180);
    const y = 50 + 40 * Math.sin((angle * Math.PI) / 180);
    points.push(`${x}% ${y}%`);
  }

  return `polygon(${points.join(', ')})`;
};

const HouseOnLand = ({ landSize = { width: 400, height: 250 }, numCorners = 6, houseColor = '#ffcc00' }) => {
  const landClipPath = generateClipPath(numCorners);

  return (
    <div
      style={{
        width: `${landSize.width}px`,
        height: `${landSize.height}px`,
        backgroundColor: '#98fb98',
        position: 'relative',
        margin: '50px auto',
        clipPath: landClipPath,
        borderRadius: '25px',
      }}
    >
      {/* House Body - Square (Smaller) */}
      <div
        style={{
          width: '70px', // Reduced size
          height: '70px', // Reduced size
          backgroundColor: houseColor,
          position: 'absolute',
          bottom: '60px',
          left: '165px', // Adjust position to center the house
        }}
      />
      {/* Roof - Triangle (Smaller) */}
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: '35px solid transparent', // Reduced size
          borderRight: '35px solid transparent', // Reduced size
          borderBottom: '35px solid #ff6347', // Red
          position: 'absolute',
          bottom: '135px', // Adjusted to align with smaller house
          left: '150px', // Adjusted position to align roof above house
        }}
      />
    </div>
  );
};


export default App;
