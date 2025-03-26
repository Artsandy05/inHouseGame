import React from 'react';
import { useSpring, animated } from '@react-spring/web';

const CloudAnimation = ({ cloud, gameStarted }) => {
  const { transform } = useSpring({
    from: { transform: 'translateY(-100vh)' },
    to: { transform: gameStarted ? 'translateY(100vh)' : 'translateY(-100vh)' },
    delay: cloud.delay,
    config: { duration: Math.random() * 8000 + 2000 },
    reset: gameStarted,
  });

  return (
    <animated.div
      className="cloud"
      style={{
        transform,
        width: cloud.size,
        height: cloud.size,
        left: cloud.left,
      }}
    />
  );
};

export default CloudAnimation;
