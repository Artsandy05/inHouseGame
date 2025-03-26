import { calculateSHA256Hash, successResponse } from "../utils/logic";
import config from "../config/config";
import { Op } from "sequelize";
const environment = process.env.NODE_ENV;
const MEGAXCESS_API_KEY = config[environment].megaxcess_api_id;
const MEGAXCESS_SECRET_KEY = config[environment].megaxcess_secret_key;


import Wallet from "../models/Wallet";
import Transaction from "../models/Transaction";
import Game from "../models/Game";
import WinningBall from "../models/WinningBall";
import Bet from "../models/Bet";
import User from "../models/User";
import { BET, BRAND, OGP, SPECIALTY, WONPRIZE } from "../constants";
import Site from "../models/Site";
import WinningBets from "../models/WinningBets";
const moment = require('moment-timezone');

Bet.belongsTo(Transaction, { foreignKey: 'transaction_id' });
Transaction.hasOne(Bet, { foreignKey: 'transaction_id' });

const getAuditLogsController = async (request, reply) => {
  const {
      api_id,
      from_date: encodedFromDate,
      to_date: encodedToDate,
      page_number: page,
      page_size: size,
      hash_code,
  } = request.query;


  // Validate that all required parameters are present
  if (!api_id || !encodedFromDate || !encodedToDate || !page || !size || !hash_code) {
    return reply.code(201).send({
        response_code: 201,
        message: 'Invalid or missing parameter'
    });
  }

  if (api_id !== MEGAXCESS_API_KEY) {
    return reply.code(207).send({
      response_code: 207,
      message: 'Failed: error should be mismatch ID',
    });
  }

  const from_date = decodeURIComponent(encodedFromDate);
  const to_date = decodeURIComponent(encodedToDate);
  const dateFormatRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  if (!dateFormatRegex.test(from_date) || !dateFormatRegex.test(to_date)) {
      return reply.code(205).send({
          response_code: 205,
          message: 'Invalid date format'
      });
  }

  const fromDateUTC = moment.tz(from_date, 'Asia/Singapore').utc();
  const toDateUTC = moment.tz(to_date, 'Asia/Singapore').utc();
  if (fromDateUTC.isAfter(toDateUTC)) {
       return reply.code(203).send({
           response_code: 203,
           message: 'Invalid date range',
       });
  }


  const oneHourInMillis = 60 * 60 * 1000;
  const dateRangeInMillis = toDateUTC.diff(fromDateUTC);
  if (dateRangeInMillis > oneHourInMillis) {
      return reply.code(206).send({
          response_code: 206,
          message: 'Date range exceeds 1 hour limit'
      });
  }

  const secretKey = MEGAXCESS_SECRET_KEY;
  const concatenatedString = `${api_id}${from_date}${to_date}${size}${secretKey}`;

  const calculatedHash = calculateSHA256Hash(concatenatedString);
  if (calculatedHash !== hash_code) {
    return reply.code(202).send({
      response_code: 202,
      message: 'Failed: Signature mismatch',
      secret_code:calculatedHash
    });
  }


  const newPage = page === 1 ? 0 : page > 1 ? page - 1 : page;
  const offset = newPage * size;

  let whereConditions = {
    type: {
        [Op.in]: ["bet", "wonprize"]
    },
    createdAt: {
       [Op.between]: [fromDateUTC.toDate(), toDateUTC.toDate()]
    }
  };

  const options = {
      attributes: ["id", "amount", "type", "status", "createdAt"],
      include: [
        {
          model: Wallet,
          attributes: ["id"],
          include: [
            {
              model: User,
              attributes: [],
              required:false,
              include: [
                {
                  model: Site,
                  required:false
                }
              ],
            }
          ],
          required:false,
        },
        {
          model: Bet,
          attributes: ["id", "createdAt"],
        },
        {
          model: WinningBets,
          attributes: ["prize","betAmount"],
        },
        {
          model: Game,
          attributes: ["id", "name"],
          as: 'game',
          include: [
            {
              model: WinningBall,
              attributes: ["gamesId","zodiac"],
            }
          ],
        },
      ],
      where: whereConditions,
      offset,
      limit: size,
    };

    const transactions = await Transaction.findAll(options);
    const totalCount = await Transaction.count(options);

    // return successResponse(transactions, "Game  updated successfully!", reply);


  const transformedTransactions = transactions.map(transaction => {
  const { id, amount, type, status, Wallet, game, createdAt, WinningBet } = transaction.dataValues;

    const num:number = 0;
    let betStatus = ""
    
    const siteId = Wallet ? Wallet?.User?.Site?.id : null;
    const createdAtSG = moment.utc(createdAt).tz('Asia/Singapore').format('YYYY-MM-DD HH:mm:ss');
    const createdAtWB = moment.utc(WinningBet?.createdAt).tz('Asia/Singapore').format('YYYY-MM-DD HH:mm:ss');

    if(status === "FAILED"){
      betStatus = 'X'
    }else if(status === "SUCCESS"){
      betStatus = 'D'
    }else{
      betStatus = ''
    }

    return {
      bet_id: id,
      player_id: Wallet ? Wallet.id : null,
      channel_type: OGP,
      outlet_id: siteId,
      kiosk_terminal_id: '',
      total_bet_amount: type === BET ? parseFloat(amount).toFixed(2) : `${parseFloat(WinningBet.betAmount).toFixed(2)}`,
      total_payout_amount: type === WONPRIZE ? `${parseFloat(WinningBet.prize).toFixed(2)}` : num.toFixed(2),
      sidebet_amount: num.toFixed(2),
      refund_amount: num.toFixed(2),
      bet_date_time: createdAtSG,
      settlement_date_time: createdAtWB,
      platform_code: SPECIALTY,
      bet_status: betStatus,
      casino_bet_details: {
        game_name: game ? game.name : null,
        game_id: game ? game.id : null,
        game_brand: BRAND,
      },
    };
  })

  const responseData = {
      response_code: 200,
      from_date,
      to_date,
      page_number: parseInt(page, 10),
      page_size: parseInt(size, 10),
      total_transactions: totalCount,
      data: transformedTransactions
  };

  reply.code(200).send(responseData);
}


export default {
  getAuditLogsController
};


// data: [
    // {
    //     bet_id: '1234567890',
    //     player_id: 'player001',
    //     channel_type: 'OGP',
    //     outlet_id: 'outlet01',
    //     kiosk_terminal_id: 'kiosk01',
    //     total_bet_amount: '1257.25',
    //     total_payout_amount: '1000.00',
    //     bet_date_time: '2023-08-25T21:53:08Z',
    //     settlement_date_time: '2023-08-25T22:00:00Z',
    //     platform_code: 'SPORTSBOOK',
    //     bet_status: 'D',
    //     casino_bet_details: {
        //     game_name: 'Poker',
        //     game_id: 'game001',
        //     game_brand: 'BrandA',
        //     live_game_round: 'round001',
        //     table_room_id: 'table001',
        //     jackpot_contribution: '5.00',
        //     jackpot_type: 'Type1',
        //     jackpot_payout: '100.00',
        //     seed_money: '50.00',
        //     seed_money_over: '10.00',
        //     seed_contribution: '2.00',
        //     house_rake: '10.00',
        //     rake_ceiling: '20.00',
        //     blinds: '500/1000',
        //     net_win: '500.00',
        //     game_type: 'Tournament'
    //     },
    //     sports_bet_dtls: {
        //     sports_name: 'Basketball',
        //     sports_game_type: 'VRT',
        //     league_name: 'NBA',
        //     event_name: 'Lakers vs. Celtics',
        //     event_details: 'Game 1 of the Finals',
        //     bet_type: 'PRE'
    //     }
    // }
// ]