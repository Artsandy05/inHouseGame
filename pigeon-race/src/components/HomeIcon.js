import React from 'react';
import { useSpring, animated } from 'react-spring';

const HomeIcon = ({ index, startRace }) => {
  const homeIconAnimation = useSpring({
    transform: startRace ? 'translateY(50%)' : 'translateY(0%)',
    config: { tension: 200, friction: 30 },
    reverse: !startRace,
  });

  return (
    <animated.div className="home-icon" style={homeIconAnimation}>
      🏡
    </animated.div>
  );
};

export default HomeIcon;
