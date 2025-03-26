import ExcelJS, { Worksheet } from 'exceljs';
import { hasValue } from '../../../common/gameutils';

export class TestUtils {
  static async getWorksheet(file, index): Promise<Worksheet> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(`${file}`);
    return workbook.getWorksheet(index);
  }
}

export function getTestData(worksheet) {
  const users = getUsers(worksheet);
  return {
    'input': getInputData(worksheet, users),
    'input_array': getInputDataArray(worksheet, users),
    'output': getOutputData(users, worksheet),
    'winners': getWinners(worksheet),
  }
}


function getInputData(worksheet, users) {
  let map = new Map<String, Bet>();
  users.forEach((user) => {
    map.set(user.uuid, new Bet(user.orders, user.amounts));
  });

  return {
    'fee': getFee(worksheet),
    'bets': map,
  }
}

function getInputDataArray(worksheet, users) {
  let arr = [];
  users.forEach((user) => {
    arr.push( {
      uuid: user.uuid, 
      orders: user.orders, 
      amounts: user.amounts,
    });
  });

  return {
    'fee': getFee(worksheet),
    'bets': arr,
  }
}

function getOutputData(users, worksheet) {
  let data = [];
  users.forEach((user) => {
    data.push({
      'uuid': user.uuid,
      'odds': user.odds,
      'prizes': user.prizes,
      
    })
  });
  return data;
}

export function getUsers(worksheet: Worksheet) {
  return [];
}

export function getTestData1(worksheet: Worksheet) {
  const startRow = 13; // Starting row number
  const endRow = 102; // Ending row number
  const column = 'A'; // Column letter

  const SLOT_START = 3; // C
  const SLOT_LEN = 11; // To N
  const RATIO_START = 17; // P
  const PRIZE_START = 31; // AE

  let players = [];
  let odds = new Map<string, number>();
  let data = {
    commission: worksheet.getCell(4, 2).value as number, // OR B4
    gross: getGross(worksheet),
    odds: odds,
    players: players,
  }

  for (let idx = 0; idx <= SLOT_LEN; idx++) {
    const letter_idx = SLOT_START + idx;
    const b = worksheet.getCell(10, letter_idx);
    if (hasValue(b.value) && hasValue(b.value['result'])) {
      odds.set(`${idx}`, b.value['result']);
    } else {
      odds.set(`${idx}`, 0);
    }
  }
  
  for (let i = startRow; i <= endRow; i++) {
    const cell = worksheet.getCell(`${column}${i}`);
    if (!hasValue(cell.value)) {
      break;
    }

    let data = {
      'uuid': '',
      'slots': new Map<string, number>(),
      'ratio': new Map<string, number>(),
      'prizes': new Map<string, number>(),
    };

    data.uuid = worksheet.getCell(`A${i}`).value.toString();
    
    for (let idx = 0; idx <= SLOT_LEN; idx++) {
      const letter_idx = SLOT_START + idx;
      const b = worksheet.getCell(i, letter_idx);
      if (hasValue(b.value)) {
        data.slots.set(`${idx}`, b.value as number);
      }
    }

    for (let idx = 0; idx <= SLOT_LEN; idx++) {
      const letter_idx = RATIO_START + idx;
      const b = worksheet.getCell(i, letter_idx);
      const res = b.value['result'];
      if (hasValue(res)) {
        data.ratio.set(`${idx}`, res);
      }
    }

    for (let idx = 0; idx <= SLOT_LEN; idx++) {
      const letter_idx = PRIZE_START + idx;
      const b = worksheet.getCell(i, letter_idx);
      const res = b.value['result'];
      if (hasValue(res)) {
        data.prizes.set(`${idx}`, res);
      }
    }

    players.push(data);
  }
  return data;
}

const SLOT_LEN = 11;

function getGross(worksheet: Worksheet) {
  let result = [];
  const start = 3;
  for (let idx = 0; idx <= SLOT_LEN; idx++) {
    const letter_idx = start + idx;
    const b = worksheet.getCell(2, letter_idx);
    const res = b.value['result'];
    if (hasValue(res)) {
      result.push(res)
    } else {
      result.push(0)
    }
  }
  return result;
}

function getWinners(worksheet) {
  const winners: number[] = JSON.parse(worksheet.getCell(`B2`).value);
  return winners;
}

function getFee(worksheet) {
  const fee: number = JSON.parse(worksheet.getCell(`B14`).value) / 100;
  return fee;
}

export function getStringKey(num: number[]) {
  if (num.length === 0) {
    return undefined;
  }
  return num.join(',');
}


// Temporary, will remove later
export class Bet {
  orders: [][]
  amounts: number[];
  constructor(orders, amounts) {
    this.orders = orders;
    this.amounts = amounts;
  }
}

