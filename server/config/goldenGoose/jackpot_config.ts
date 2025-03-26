export const JACKPOT_CONFIG = {
  MINI: {
    amount: 500,
    count: 30, 
    nextLevel: 'minor'
  },
  MINOR: {
    amount: 2500, 
    count: 10, 
    nextLevel: 'major'
  },
  MAJOR: {
    amount: 10000, 
    count: 10, 
    nextLevel: 'grand'
  },
  GRAND: {
    amount: 25000, 
    count: 1, 
    nextLevel: null
  }
};