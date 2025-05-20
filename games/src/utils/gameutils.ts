

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

export function formatMoney(amount) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) return '₱0.00';

  return `₱${num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
}

export function formatTruncatedMoney(credits) {
  const num = parseFloat(credits);

  if (isNaN(num)) return '₱0.00';

  // Truncate to 2 decimal places without rounding
  const truncated = Math.trunc(num * 100) / 100;

  return formatMoney(truncated);
}