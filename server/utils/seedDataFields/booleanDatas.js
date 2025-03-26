const generateRandomBoolean = () => {
    const boolean = ["1", "2"];
    const randomBoolean = boolean[Math.floor(Math.random() * boolean.length)];
    return `${randomBoolean}`;
  };
  
  module.exports = generateRandomBoolean;