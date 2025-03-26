import React, { useState, useEffect } from 'react';
import { useSpring, animated } from 'react-spring';

const birdIcons = ['🐦', '🦅', '🦜', '🦉'];

const Bird = ({ index, startRace, setWinner }) => {
  const [position, setPosition] = useState(0);
  const [moving, setMoving] = useState(false);

  const birdAnimation = useSpring({
    transform: `translateY(${position}px)`,
    config: { tension: 200, friction: 20 },
  });

  useEffect(() => {
    if (startRace && !moving) {
      setMoving(true);
      let raceInterval = setInterval(() => {
        setPosition((prevPosition) => {
          const randomMovement = Math.random() * 5 - 2.5; // Vertical random movement
          if (prevPosition >= 250) { // Race ends after the bird reaches its finish line
            clearInterval(raceInterval);
            setWinner(index);
          }
          return prevPosition + randomMovement;
        });
      }, 50); // Updates every 50ms for smooth animation
    }
  }, [startRace, moving, setWinner, index]);

  return (
    <animated.div className="bird" style={birdAnimation}>
      <span>{birdIcons[index]}</span>
    </animated.div>
  );
};

export default Bird;
