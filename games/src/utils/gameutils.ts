

export enum GameState {
  Idle = "Idle",
  NewGame = "NewGame",
  Open = "Open",
  LastCall = "LastCall",
  Closed = "Closed",  // OR Finalized
  WinnerDeclared = "WinnerDeclared",
  Rolling = "Rolling"
}

export enum ClientCommands {
  None = "None",
  Init = "Init",
  Bet = "Bet",
  SideBets = "SideBets",
}

export enum ModeratorCommands {
  Init = "Init",
  Restart = "Restart",
}

export const ZODIAC_LABELS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

export const ZODIAC_COLORS = [
  "rgba(164, 34, 39, 1)",
  "rgba(9, 83, 48, 1)",
  "rgba(255, 217, 27, 1)",
  "rgba(27, 30, 110, 1)",
  "rgba(245, 141, 28, 1)",
  "rgba(117, 81, 45, 1)",
  "rgba(208, 77, 125, 1)",
  "rgba(32, 32, 32, 1)",
  "rgba(79, 39, 135, 1)",
  "rgba(139, 139, 139, 1)",
  "rgba(37, 131, 171, 1)",
  "rgba(90, 174, 132, 1)",
];


export function hasValue(obj: any) {
  return obj !== null && obj !== undefined;
}

export const MODERATOR_MOBILE = "+639863687666";

export const MOBILE_NUMBERS = [
  "+639863686428",
  "+639715446452",
  "+639550863400",
  "+639763810435",
  "+639954401835",
  "+639981334205",
  "+639630388163",
  "+639208359082",
  "+639616543333",
  "+639266167459",
  "+639352143715",
  "+639615723457",
  "+639988380772",
];



export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


export function mapToArray(map: Map<any, any>) {
  return Array.from(map.entries());
}

export function arrayToMap(map: [any, any][]): Map<any, any> {
  const mapArray: [any, any][] = map;
  return new Map<any, any>(mapArray);
}

export function jsonToMapArray(json) {
  let map = jsonToMap(json);
  return mapToArray(map);
}


function jsonToMap(json) {
  let map = new Map();
  for (let key in json) {
    if (json.hasOwnProperty(key)) {
      map.set(key, json[key]);
    }
  }
  return map;
}

export function formatMoney(amount) {
  // Convert to number if it's a string
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Format with 2 decimal places, comma separators, and ₱ symbol
  return `₱${num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
}

export function formatWinnerAmount(amount: any) {
  if (amount >= 1_000_000_000) {
    // 1 billion
    return (amount / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "b";
  } else if (amount >= 1_000_000) {
    // 1 million
    return (amount / 1_000_000).toFixed(1).replace(/\.0$/, "") + "m";
  } else if (amount >= 100_000) {
    // 100 thousand
    return (amount / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  } else if (amount >= 1_000) {
    // 1 thousand
    return (amount / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return Math.floor(amount).toString(); // Format for less than thousand
}

export function formatTruncatedMoney(credits) {
  // Convert to string to handle decimal places
  const creditsStr = parseFloat(credits).toString();
  
  // Find the decimal point
  const decimalIndex = creditsStr.indexOf('.');
  
  let truncatedStr;
  if (decimalIndex === -1) {
    // No decimal places, just add .00
    truncatedStr = creditsStr + '.00';
  } else {
    // Truncate to exactly 2 decimal places
    truncatedStr = creditsStr.substring(0, decimalIndex + 3);
    
    // If there was only 1 decimal digit, add a 0
    if (truncatedStr.length === decimalIndex + 2) {
      truncatedStr += '0';
    }
  }
  
  return formatMoney(truncatedStr);
}