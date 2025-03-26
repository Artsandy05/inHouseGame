import React, { useEffect, useState } from 'react';

const diceImages = {
  1: '/assets/dice1.png',
  2: '/assets/dice2.png',
  3: '/assets/dice3.png',
  4: '/assets/dice4.png',
  5: '/assets/dice5.png',
  6: '/assets/dice6.png',
};

const DiceCube = ({ diceResult, isRolling }) => {
  const [rotation, setRotation] = useState({
    x: 0,
    y: 0,
    z: 0,
  });

  const [faceOpacity, setFaceOpacity] = useState({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
  });

  const diceStyle = {
    width: '100px',
    height: '100px',
    position: 'relative',
    transformStyle: 'preserve-3d',
    transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`,
    transition: isRolling ? 'none' : 'transform 0.8s ease-out',  // Smooth rotation on stop
  };

  const faceStyle = (side, rotateX, rotateY) => ({
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundImage: `url(${diceImages[side]})`,
    backgroundSize: 'cover',
    transform: `rotateX(${rotateX}) rotateY(${rotateY}) translateZ(50px)`,
    opacity: faceOpacity[side], // Apply opacity based on the result
    transition: 'opacity 0.5s ease', // Smooth transition for opacity
  });

  useEffect(() => {
    if (!isRolling) {
      // When rolling stops, set the opacity of the correct face to 1 and others to 0
      const newOpacity = { 1: 0.5, 2: 0.5, 3: 0.5, 4: 0.5, 5: 0.5, 6: 0.5 };
      newOpacity[diceResult] = 1; // Set the rolled number's opacity to 1

      setFaceOpacity(newOpacity);

      // Set the final rotation to ensure the dice ends in 2D with the correct face at the front
      let xRotation = 0;
      let yRotation = 0;

      // Adjust the final rotation based on the dice result
      switch (diceResult) {
        case 1:
          xRotation = 0;
          yRotation = 0;
          break;
        case 2:
          xRotation = 0;
          yRotation = 90;
          break;
        case 3:
          xRotation = 0;
          yRotation = -90;
          break;
        case 4:
          xRotation = 90;
          yRotation = 0;
          break;
        case 5:
          xRotation = -90;
          yRotation = 0;
          break;
        case 6:
          xRotation = 180;
          yRotation = 0;
          break;
        default:
          break;
      }

      setRotation({ x: xRotation, y: yRotation, z: 0 });
    } else {
      // During rolling, apply random rotations
      const randomX = Math.floor(Math.random() * 360);
      const randomY = Math.floor(Math.random() * 360);
      const randomZ = Math.floor(Math.random() * 360);
      setRotation({ x: randomX, y: randomY, z: randomZ });

      // Reset opacity for rolling (show all faces at the start)
      setFaceOpacity({
        1: 1,
        2: 1,
        3: 1,
        4: 1,
        5: 1,
        6: 1,
      });
    }
  }, [diceResult, isRolling]);

  return (
    <div style={diceStyle}>
      <div style={faceStyle(1, '0deg', '0deg')} />
      <div style={faceStyle(2, '90deg', '0deg')} />
      <div style={faceStyle(3, '-90deg', '0deg')} />
      <div style={faceStyle(4, '0deg', '90deg')} />
      <div style={faceStyle(5, '0deg', '-90deg')} />
      <div style={faceStyle(6, '0deg', '180deg')} />
    </div>
  );
};

export default DiceCube;
