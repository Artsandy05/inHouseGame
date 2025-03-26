import { useSpring } from 'react-spring';
import { useState } from 'react';

const AnimatedBackground = ({ raceStarted }) => {
  const [bgPosition, setBgPosition] = useState('0vh');

  const bgSpring = useSpring({
    to: { y: bgPosition }, // Animate to the current position
    from: { y: '0vh' },
    loop: raceStarted, // Infinite loop based on raceStarted
    onRest: () => {
      // When the animation is done (when bg reaches 100vh), reset to 0vh
      if (bgPosition === '100vh') {
        setBgPosition('0vh');
      }
    },
    config: { duration: 10000, friction: 30 },
  });

  return (
    <div style={{ position: 'relative', overflow: 'hidden', height: '100vh' }}>
      <div
        style={{
          position: 'absolute',
          top: bgSpring.y,
          width: '100%',
          height: '100vh',
          background: 'url(/assets/racebg.png) no-repeat center center/cover',
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
