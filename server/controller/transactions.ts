import { successResponse, errorResponse } from "../utils/logic";
import Transaction from "../models/Transaction";
import { FindOptions, OrderItem, Sequelize, Op, Model } from "sequelize";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import Wallet from "../models/Wallet";
import { BET, DEPOSIT, WITHDRAW, WITHDRAWAL, WONPRIZE } from "../constants";
import User from "../models/User";
import Game from "../models/Game";
import GameList from "../models/GameList";
import Site from "../models/Site";
import WinningBets from "../models/WinningBets";
import Bet from "../models/Bet";
import Referral from "../models/Referral";
import TemporaryTransaction from "../models/TemporaryTransaction";
import MerchantTransaction from "../models/MerchantTransaction";
import LosingBets from "../models/LosingBets";
import WinningBall from "../models/WinningBall";
dayjs.extend(utc);

const getTransactions = async (request: any, reply: any) => {
  const { page, size, sort, filter } = request.query;
  let whereConditions = {};
  let whereSiteConditions = {};
  let whereGameConditions = {};
  whereConditions = {
    type: {
      [Op.ne]: "bet", // Exclude 'bet'
    },
  };

  // Merge two conditions with `Op.or`
  whereConditions[Op.or] = [
    // Case when type is either "wonprize" or "losebet"
    {
      type: {
        [Op.in]: ["wonprize", "losebet"],
      },
      odds: {
        [Op.gte]: 1, // Ensure odds are greater than or equal to 1
      },
    },
    // Case when type is any of the other specified types and odds <= 1
    {
      type: {
        [Op.in]: ['deposit', 'load', 'deduct', 'withdrawal', 'sendGift', 'promo'],
      },
      odds: {
        [Op.lte]: 1, // Ensure odds are less than or equal to 1
      },
    },
  ];

  if (filter) {
    // Split the filter string by '&' to get individual filter conditions
    const filterConditions = filter.split("&");
    filterConditions.forEach((condition) => {
      const [columnFilter, valueFilter] = condition.split("=");
      const decodedValue = decodeURIComponent(valueFilter);
      if (columnFilter === "callbackId") {
        whereConditions["callbackId"] = { [Op.like]: `%${decodedValue}%` };
      } else if (columnFilter === "createdAt") {
        const [startDateTime, endDateTime] = decodedValue.split(",");
        whereConditions["createdAt"] = {
          [Op.between]: [startDateTime, endDateTime],
        };
      } else if (columnFilter === "type") {
        whereConditions["type"] = { [Op.eq]: decodedValue };
      } else if (columnFilter === "amount") {
        whereConditions["amount"] = { [Op.like]: `%${decodedValue}%` };
      } else if (columnFilter === "status") {
        whereConditions["status"] = { [Op.eq]: decodedValue };
      } else if (columnFilter === "playerName") {
        whereConditions[Op.or] = [
          Sequelize.literal(
            `CONCAT((SELECT firstName FROM users as Users WHERE Users.id = Wallet.user_id), ' ', (SELECT lastName FROM users as Users WHERE Users.id = Wallet.user_id)) LIKE '%${decodedValue}%'`
          ),
        ];
      } else if (columnFilter === "game") {
        whereGameConditions["name"] = { [Op.eq]: decodedValue };
      } else if (columnFilter === "gameId") {
        whereConditions["game_id"] = { [Op.eq]: decodedValue };
      } else if (columnFilter === "site") {
        whereSiteConditions["name"] = { [Op.like]: `%${decodedValue}%` };
      } else if (columnFilter === "merchant") {
        whereConditions["merchantId"] = { [Op.like]: decodedValue };
      } else if(columnFilter === "playerType"){
        if(decodedValue === "1"){
          // get those user have no connection to DirectPlayer, if DirectPlayer = null
          whereConditions["$Wallet.User.DirectPlayer.id$"] = { [Op.is]: null };
        }else{
          // get those user have connection to DirectPlayer
          whereConditions["$Wallet.User.DirectPlayer.id$"] = { [Op.ne]: null };
        }
      } else if(columnFilter === "operationId"){
        whereConditions[Op.or] = [
          { "$TemporaryTransaction.MerchantTransaction.operationId$": { [Op.like]: `%${decodedValue}%` } },
          { "$ticket_number$": { [Op.like]: `%${decodedValue}%` } }
        ];
      }
    });
  }
  const offset = page * size;
  const options: FindOptions = {
    attributes: [
      ["id", "transactionId"],
      "game_id",
      "amount",
      "odds",
      "type",
      "status",
      "callbackId",
      "gameRoundCode",
      "merchantId",
      "ticket_number",
      "createdAt",
      [
        Sequelize.literal(
          `CASE
            WHEN Transaction.type IN ('bet', 'wonprize') THEN
              (SELECT zodiac FROM \`winning-balls\` WHERE \`winning-balls\`.gamesId = Transaction.game_id LIMIT 1)
            WHEN Transaction.type = 'losebet' THEN
              (SELECT zodiac FROM \`bets\` WHERE \`bets\`.game_id = Transaction.game_id LIMIT 1)
            ELSE NULL
          END`
        ),
        "ballPlaced",
      ],
      [
        Sequelize.literal(
          `CASE WHEN Transaction.type = 'bet' THEN (SELECT IF(bets.zodiac = \`WinningBalls\`.zodiac, 'win', 'lose') FROM \`bets\` LEFT JOIN \`winning-balls\` AS \`WinningBalls\` ON bets.game_id = \`WinningBalls\`.\`gamesId\` WHERE bets.transaction_id = Transaction.id LIMIT 1) ELSE NULL END`
        ),
        "winOrLose",
      ]
    ],
    include: [
      {
        model: Wallet,
        attributes: ["user_id", "balance"],
        include: [
          {
            model: User,
            attributes: [
              [
                Sequelize.fn(
                  "CONCAT",
                  Sequelize.col("Wallet.User.firstName"),
                  " ",
                  Sequelize.col("Wallet.User.lastName")
                ),
                "playerName",
              ],
              "id",
            ],
            include: [
              { 
                model: Site, 
                attributes: ["label"],
                 where: whereSiteConditions 
              },
              { 
                model: Referral,
                as: "DirectPlayer",
                attributes: ["userType"],
                include:[
                  {
                    model: User,
                    attributes: [
                      [
                        Sequelize.fn(
                          "CONCAT",
                          Sequelize.col("Wallet.User.DirectPlayer.sourceUser.firstName"),
                          " ",
                          Sequelize.col("Wallet.User.DirectPlayer.sourceUser.lastName")
                        ),
                        "operatorName",
                      ],
                      "role",
                    ],
                    as: "sourceUser"
                  },
                ]
              },
            ],
          },
        ],
      },
      {
        model: Game,
        attributes:["id","name"],
        required: false,
        include: [
          { 
            model: GameList, 
            attributes:["label"],
            where: whereGameConditions 
          }
        ],
      },
      { model: Bet },
      { model: WinningBets },
      { model: LosingBets },
      { 
        model: TemporaryTransaction,
        attributes: ["id"],
        include: [
          {
            model: MerchantTransaction,
            attributes: ["id","operationId"],
            required: false,
            where: { status: "SUCCESS" }
          },
        ]
       },
    ],
    
    where: whereConditions,
    offset,
    limit: size,
  };
  const order: OrderItem[] = [];
  if (sort) {
    // Split the filter string by '&' to get individual filter conditions
    const sortConditions = sort.split("&");
    sortConditions.forEach((condition) => {
      const [columnSort, valueFilter] = condition.split("=");
      if (columnSort === "createdAt") {
        order.push(["createdAt", valueFilter.toUpperCase()]);
      } else if (columnSort === "amount") {
        order.push(["amount", valueFilter.toUpperCase()]);
      } else if (columnSort === "playerName") {
        order.push(["playerName", valueFilter.toUpperCase()]);
      } else if (columnSort === "gameId") {
        order.push(["game_id", valueFilter.toUpperCase()]);
      }
    });
  } else {
    order.push(["createdAt", "desc"]);
  }
  options.order = order;
  const transactions = await Transaction.findAll(options);
  const totalCount = await Transaction.count(options);
  const payload = {
    content: transactions,
    totalCount,
  };
  if (transactions) {
    return successResponse(
      payload,
      "Get Transactions is successfully fetched!",
      reply
    );
  } else {
    return errorResponse("Transactions not found", reply, "custom");
  }
};


const getMerchantTransactions = async (request: any, reply: any) => {
  const { page, size, sort, filter } = request.query;
  let whereConditions = {};
  let whereUserConditions = {};
  if (filter) {
    const filterConditions = filter.split("&");
    filterConditions.forEach((condition) => {
      const [columnFilter, valueFilter] = condition.split("=");
      const decodedValue = decodeURIComponent(valueFilter);
      if (columnFilter === "createdAt") {
        const [startDateTime, endDateTime] = decodedValue.split(",");
        whereConditions["createdAt"] = {
          [Op.between]: [startDateTime, endDateTime],
        };
      } else if (columnFilter === "type") {
        whereConditions["$TemporaryTransaction.type$"] = { [Op.eq]: decodedValue };
      } else if (columnFilter === "transactionId") {
        whereConditions["$TemporaryTransaction.Transaction.id$"] = { [Op.eq]: decodedValue };
      } else if (columnFilter === "temporaryId") {
        whereConditions["$TemporaryTransaction.id$"] = { [Op.eq]: decodedValue };
      } else if (columnFilter === "playerName") {
         whereConditions[Op.or] = [
          { "$TemporaryTransaction.Transaction.Wallet.User.firstName$": { [Op.like]: `%${decodedValue}%` } },
          { "$TemporaryTransaction.Transaction.Wallet.User.lastName$": { [Op.like]: `%${decodedValue}%` } }
        ];
      } else if (columnFilter === "temporaryStatus") {
        whereConditions["$TemporaryTransaction.status$"] = { [Op.eq]: decodedValue };
      }  else if (columnFilter === "providerStatus") {
        whereConditions["status"] = { [Op.eq]: decodedValue };
      } else if (columnFilter === "operationStatus") {
        whereConditions["operation"] = { [Op.like]: `%${decodedValue}%`};
      }
      
    
    });
  }

  const offset = page * size;
  const options: FindOptions = {
    attributes: [
      "operationId",
      "temporaryId",
      "operation",
      "status",
      "createdAt"
    ],
    include:[{
      model: TemporaryTransaction,
      attributes: [
        "id",
        "type",
        "amount",
        "status",
      ],
      include:[{
        model: Transaction,
        attributes: [
          "id",
        ],
        include:[{
          model: Wallet,
          attributes: [
            "id",
          ],
          include:[{
            model: User,
            attributes: [
              "id",
            [
              Sequelize.fn(
                "CONCAT",
                Sequelize.col("firstName"),
                " ",
                Sequelize.col("lastName")
              ),
              "playerName",
            ],
            ],
          }],
        }],
      }],
    }],
    where: whereConditions,
    offset,
    limit: size,
  };

  const order: OrderItem[] = [];
  order.push(["createdAt", "desc"]);
  options.order = order;

  const merchantTransactions = await MerchantTransaction.findAll(options);
  const totalCount = await MerchantTransaction.count(options);
  const payload = {
    content: merchantTransactions,
    totalCount,
  };
  if (merchantTransactions) {
    return successResponse(
      payload,
      "Get Merchant Transactionsis successfully fetched!",
      reply
    );
  } else {
    return errorResponse("Merchant Transactions not found", reply, "custom");
  }
}

const getAllTransactions = async (request: any, reply: any) => {
  const { sort, filter } = request.query;

  let whereConditions = {};
  let whereSiteConditions = {};
  let whereGameConditions = {};
  whereConditions = {
    type: {
      [Op.ne]: "bet", // Only exclude 'losebet' from the main query
    },
  };

  // Merge two conditions with `Op.or`
  whereConditions[Op.or] = [
    // Case when type is either "wonprize" or "losebet"
    {
      type: {
        [Op.in]: ["wonprize", "losebet"],
      },
      odds: {
        [Op.gte]: 1, // Ensure odds are greater than or equal to 1
      },
    },
    // Case when type is any of the other specified types and odds <= 1
    {
      type: {
        [Op.in]: ['deposit', 'load', 'deduct', 'withdrawal', 'sendGift', 'promo'],
      },
      odds: {
        [Op.lte]: 1, // Ensure odds are less than or equal to 1
      },
    },
  ];


  if (filter) {
    // Split the filter string by '&' to get individual filter conditions
    const filterConditions = filter.split("&");

    filterConditions.forEach((condition) => {
      const [columnFilter, valueFilter] = condition.split("=");
      const decodedValue = decodeURIComponent(valueFilter);

      if (columnFilter === "callbackId") {
        whereConditions["callbackId"] = { [Op.like]: `%${decodedValue}%` };
      } else if (columnFilter === "createdAt") {
        const [startDateTime, endDateTime] = decodedValue.split(",");
        whereConditions["createdAt"] = {
          [Op.between]: [startDateTime, endDateTime],
        };
      } else if (columnFilter === "type") {
        whereConditions["type"] = { [Op.eq]: decodedValue };
      } else if (columnFilter === "amount") {
        whereConditions["amount"] = { [Op.like]: `%${decodedValue}%` };
      } else if (columnFilter === "status") {
        whereConditions["status"] = { [Op.eq]: decodedValue };
      } else if (columnFilter === "playerName") {
        whereConditions[Op.or] = [
          Sequelize.literal(
            `CONCAT((SELECT firstName FROM users as Users WHERE Users.id = Wallet.user_id), ' ', (SELECT lastName FROM users as Users WHERE Users.id = Wallet.user_id)) LIKE '%${decodedValue}%'`
          ),
        ];
      } else if (columnFilter === "gameId") {
        whereConditions["game_id"] = { [Op.like]: decodedValue };
      } else if (columnFilter === "merchant") {
        whereConditions["merchantId"] = { [Op.like]: decodedValue };
      } else if (columnFilter === "game") {
        whereGameConditions["name"] = { [Op.eq]: decodedValue };
      } else if (columnFilter === "site") {
        whereSiteConditions["name"] = { [Op.like]: `%${decodedValue}%`};
      } else if(columnFilter === "playerType"){
        if(decodedValue === "1"){
          // get those user have no connection to DirectPlayer, if DirectPlayer = null
          whereConditions["$Wallet.User.DirectPlayer.id$"] = { [Op.is]: null };
        }else{
          // get those user have connection to DirectPlayer
          whereConditions["$Wallet.User.DirectPlayer.id$"] = { [Op.ne]: null };
        }
      } else if(columnFilter === "operationId"){
        whereConditions[Op.or] = [
          { "$TemporaryTransaction.MerchantTransaction.operationId$": { [Op.like]: `%${decodedValue}%` } },
          { "$ticket_number$": { [Op.like]: `%${decodedValue}%` } }
        ];
      }
      
    });
  }

  const options: FindOptions = {
    attributes: [
      ["id","transactionId"],
      "game_id",
      "amount",
      "odds",
      "type",
      "status",
      "gameRoundCode",
      "callbackId",
      "merchantId",
      "ticket_number",
      "createdAt",
      [
        Sequelize.literal(
          `CASE
            WHEN Transaction.type IN ('bet', 'wonprize') THEN
              (SELECT zodiac FROM \`winning-balls\` WHERE \`winning-balls\`.gamesId = Transaction.game_id LIMIT 1)
            WHEN Transaction.type = 'losebet' THEN
              (SELECT zodiac FROM \`bets\` WHERE \`bets\`.game_id = Transaction.game_id LIMIT 1)
            ELSE NULL
          END`
        ),
        "ballPlaced",
      ],
      [
        Sequelize.literal(
          `CASE WHEN Transaction.type = 'bet' THEN (SELECT IF(bets.zodiac = \`WinningBalls\`.zodiac, 'win', 'lose') FROM \`bets\` LEFT JOIN \`winning-balls\` AS \`WinningBalls\` ON bets.game_id = \`WinningBalls\`.\`gamesId\` WHERE bets.transaction_id = Transaction.id LIMIT 1) ELSE NULL END`
        ),
        "winOrLose",
      ],
      [
        Sequelize.literal(
          "CONCAT((SELECT firstName FROM users as Users WHERE Users.id = Wallet.user_id), ' ', (SELECT lastName FROM users as Users WHERE Users.id = Wallet.user_id))"
        ),
        "playerName",
      ],
    ],
    include: [
      {
        model: Wallet,
        attributes: ["user_id", "balance"],
        include: [
          {
          model: User,
          attributes:[
            [
              Sequelize.fn(
                "CONCAT",
                Sequelize.col("Wallet.User.firstName"),
                " ",
                Sequelize.col("Wallet.User.lastName")
              ),
              "playerName",
            ],
            "id",
          ],
          include: [
            {
              model: Site,
              attributes:["label"],
              where: whereSiteConditions
            },
            { 
              model: Referral,
              as: "DirectPlayer",
              attributes: ["userType"],
              include:[
                {
                  model: User,
                  attributes: [
                    [
                      Sequelize.fn(
                        "CONCAT",
                        Sequelize.col("Wallet.User.DirectPlayer.sourceUser.firstName"),
                        " ",
                        Sequelize.col("Wallet.User.DirectPlayer.sourceUser.lastName")
                      ),
                      "operatorName",
                    ],
                    "role",
                  ],
                  as: "sourceUser"
                },
              ]
            },
          ]
        }]
      },{
        model:Game,
        attributes:["id","name"],
        required:false,
        include: [{
          model: GameList,
          attributes:["label"],
          where: whereGameConditions
        }]
      },
      { model:Bet },
      { model: WinningBets },
      { model: LosingBets },
      { 
        model: TemporaryTransaction,
        attributes: ["id"],
        include: [
          {
            model: MerchantTransaction,
            attributes: ["id","operationId"],
            required: false,
            where: { status: "SUCCESS" }
          },
        ]
       },
    ],
    where: whereConditions,
  };

  const order: OrderItem[] = [];

  if (sort) {
    // Split the filter string by '&' to get individual filter conditions
    const sortConditions = sort.split("&");

    sortConditions.forEach((condition) => {
      const [columnSort, valueFilter] = condition.split("=");
      if (columnSort === "createdAt") {
        order.push(["createdAt", valueFilter.toUpperCase()]);
      } else if (columnSort === "amount") {
        order.push(["amount", valueFilter.toUpperCase()]);
      } else if (columnSort === "playerName") {
        order.push(["playerName", valueFilter.toUpperCase()]);
      } else if (columnSort === "gameId") {
        order.push(["game_id", valueFilter.toUpperCase()]);
      }
    });
  }else{
    order.push(["createdAt", "desc"]);
  }

  options.order = order;

  const transactions = await Transaction.findAll(options);
  
  const payload = {
    content: transactions,
  };

  if (transactions) {
    return successResponse(
      payload,
      "Get All Transactions is successfully fetched!",
      reply
    );
  } else {
    return errorResponse("Transactions not found", reply, "custom");
  }
};

const getAllMerchantTransactions = async (request: any, reply: any) => {
  const { filter } = request.query;
  let whereConditions = {};
  if (filter) {
    const filterConditions = filter.split("&");
    filterConditions.forEach((condition) => {
      const [columnFilter, valueFilter] = condition.split("=");
      const decodedValue = decodeURIComponent(valueFilter);
      if (columnFilter === "createdAt") {
        const [startDateTime, endDateTime] = decodedValue.split(",");
        whereConditions["createdAt"] = {
          [Op.between]: [startDateTime, endDateTime],
        };
      } else if (columnFilter === "type") {
        whereConditions["$TemporaryTransaction.type$"] = { [Op.eq]: decodedValue };
      } else if (columnFilter === "transactionId") {
        whereConditions["$TemporaryTransaction.Transaction.id$"] = { [Op.eq]: decodedValue };
      } else if (columnFilter === "temporaryId") {
        whereConditions["$TemporaryTransaction.id$"] = { [Op.eq]: decodedValue };
      } else if (columnFilter === "playerName") {
         whereConditions[Op.or] = [
          { "$TemporaryTransaction.Transaction.Wallet.User.firstName$": { [Op.like]: `%${decodedValue}%` } },
          { "$TemporaryTransaction.Transaction.Wallet.User.lastName$": { [Op.like]: `%${decodedValue}%` } }
        ];
      } else if (columnFilter === "temporaryStatus") {
        whereConditions["$TemporaryTransaction.status$"] = { [Op.eq]: decodedValue };
      }  else if (columnFilter === "providerStatus") {
        whereConditions["status"] = { [Op.eq]: decodedValue };
      } else if (columnFilter === "operationStatus") {
        whereConditions["operation"] = { [Op.like]: `%${decodedValue}%`};
      }
    });
  }

  const options: FindOptions = {
    attributes: [
      "operationId",
      "temporaryId",
      "operation",
      "status",
      "createdAt"
    ],
    include:[{
      model: TemporaryTransaction,
      attributes: [
        "id",
        "type",
        "amount",
        "status",
      ],
      include:[{
        model: Transaction,
        attributes: [
          "id",
        ],
        include:[{
          model: Wallet,
          attributes: [
            "id",
          ],
          include:[{
            model: User,
            attributes: [
              "id",
            [
              Sequelize.fn(
                "CONCAT",
                Sequelize.col("firstName"),
                " ",
                Sequelize.col("lastName")
              ),
              "playerName",
            ],
            ],
          }],
        }],
      }],
    }],
    where: whereConditions,
  };

  const order: OrderItem[] = [];
  order.push(["createdAt", "desc"]);
  options.order = order;

  const merchantTransactions = await MerchantTransaction.findAll(options);
  const payload = {
    content: merchantTransactions,
  };

  if (merchantTransactions) {
    return successResponse(
      payload,
      "Get All Merchant Transactions is successfully fetched!",
      reply
    );
  } else {
    return errorResponse("Get All Merchant Transactions not found", reply, "custom");
  }
}

const getGrossGamingRevenues = async (request: any, reply: any) => {
  const { page, size, sort, filter } = request.query;
  let whereConditions = {};
 
  whereConditions[Op.or] = [
    // Case when type is either "wonprize" or "losebet"
    {
      type: {
        [Op.in]: ["bet", "wonprize", "losebet"],
      },
    },
  ];
  // Condition for createdAt not greater than January 29, 2025
  whereConditions["$game.createdAt$"] = {
    [Op.or]: [
      {
        [Op.gte]: new Date("2025-01-30T00:00:00Z"), // createdAt not greater than January 29, 2025
      },
    ],
  };
  
  if (filter) {
    // Split the filter string by '&' to get individual filter conditions
    const filterConditions = filter.split("&");
    filterConditions.forEach((condition) => {
      const [columnFilter, valueFilter] = condition.split("=");
      const decodedValue = decodeURIComponent(valueFilter);
    
      if (columnFilter === "createdAt") {
        const [startDateTime, endDateTime] = decodedValue.split(",");
        const minDate = new Date("2025-01-30T00:00:00Z");

        // Ensure startDateTime and endDateTime are not greater than maxDate
        const startDate = new Date(startDateTime);
        const endDate = new Date(endDateTime);

       // Ensure startDateTime and endDateTime are not less than minDate (January 30, 2025)
        if (startDate < minDate) {
          startDate.setTime(minDate.getTime()); // Set to minDate if less
        }
        if (endDate < minDate) {
          endDate.setTime(minDate.getTime()); // Set to minDate if less
        }

        whereConditions["$game.createdAt$"] = whereConditions["createdAt"] = {
          [Op.between]: [startDate.toISOString(), endDate.toISOString()],
        };
      }else if (columnFilter === "gameRoundCode") {
        whereConditions["gameRoundCode"] = { [Op.like]: `%${decodedValue}%` };
      }
    });
  }
  
  const offset = page * size;
  const options: FindOptions = {
    attributes: [
      [Sequelize.col('game.id'),"id"],
      "gameRoundCode",
      [Sequelize.col('game.GameList.label'),"gameName"],
      [Sequelize.fn('SUM', Sequelize.col('bet.overAllCommission')), 'totalGGR'],
      [Sequelize.fn('SUM', Sequelize.col('WinningBet.betAmount')), 'totalWinningBets'],
      [Sequelize.fn('SUM', Sequelize.col('LosingBet.betAmount')), 'totalLosingBets'],
      [Sequelize.fn('SUM', Sequelize.col('WinningBet.prize')), 'totalWinningPrize'],
      [
        Sequelize.fn(
          'SUM',
          Sequelize.literal("CASE WHEN Transaction.type = 'losebet' THEN Transaction.amount ELSE 0 END")
        ),
        'totalLoseBets'
      ],
      [Sequelize.col('game.createdAt'),"createdAt"],
    ],
    include: [
      {
        model: Bet,
        attributes:[],
      },
      {
        model: WinningBets,
        attributes: [],
      },
   
      {
        model: LosingBets,
          attributes: [],
      },
      {
        model: Game,
        attributes:[],
        include: [
          {
            model: GameList,
            attributes:[],
          },
        ],
      },
    ],
    where: whereConditions,
    offset,
    limit: size,
    group: ['Transaction.game_id'],
  };

  const order: OrderItem[] = [];
  order.push([Sequelize.col('game.createdAt'), 'desc']);
  options.order = order;

   // First, count the total records without pagination
   const totalCountOptions = {
    include: [
      {
        model: Bet,
        attributes:[],
      },
      {
        model: WinningBets,
        attributes: [],
      },
      {
        model: LosingBets,
          attributes: [],
      },
      {
        model: Game,
        attributes:[],
        include: [
          {
            model: GameList,
            attributes:[],
          },
        ],
      },
    ],
    where: whereConditions,
    group: ['Transaction.game_id'],
  };
  
  const gamesModel = await Transaction.findAll(options);
  const gamesModelCount = await Transaction.count(totalCountOptions);
  const games = {
    content: gamesModel.map((item: any) => ({
      gameId: item.get('id'),
      gameName: item.get('gameName'),
      gameRoundCode: item.get('gameRoundCode'),
      totalGGR: item.get('totalGGR') || 0,
      totalWinningBets: item.get('totalWinningPrize') || 0,
      totalLosingBets: item.get('totalLoseBets') || 0,
      totalBets: `${(Number(item.get('totalWinningBets')) + Number(item.get('totalLosingBets')))}`,
      createdAt: item.get('createdAt'),
    }))
  };

  const payload = {
    ...games,
    totalCount: gamesModelCount.length,
  };
  if (games) {
    return successResponse(
      payload,
      "Get Games is successfully fetched!",
      reply
    );
  } else {
    return errorResponse("Games not found", reply, "custom");
  }
};

const getGrossGamingRevenuesV1 = async (request: any, reply: any) => {
  const { page, size, sort, filter } = request.query;
  let whereConditions = {};
 
  whereConditions[Op.or] = [
    // Case when type is either "wonprize" or "losebet"
    {
      type: {
        [Op.in]: ["bet", "wonprize", "losebet"],
      },
    },
  ];
  // Condition for createdAt not greater than January 29, 2025
  whereConditions["$game.createdAt$"] = {
    [Op.or]: [
      {
        [Op.lte]: new Date("2025-01-29T23:59:59Z"), // createdAt not greater than January 29, 2025
      },
    ],
  };
  

  if (filter) {
    // Split the filter string by '&' to get individual filter conditions
    const filterConditions = filter.split("&");
    filterConditions.forEach((condition) => {
      const [columnFilter, valueFilter] = condition.split("=");
      const decodedValue = decodeURIComponent(valueFilter);
    
      if (columnFilter === "createdAt") {
        const [startDateTime, endDateTime] = decodedValue.split(",");
        const maxDate = new Date("2025-01-29T23:59:59Z");

        // Ensure startDateTime and endDateTime are not greater than maxDate
        const startDate = new Date(startDateTime);
        const endDate = new Date(endDateTime);

        // If either start or end date exceeds maxDate, set them to maxDate
        if (startDate > maxDate) {
          startDate.setTime(maxDate.getTime()); // Set to maxDate if greater
        }
        if (endDate > maxDate) {
          endDate.setTime(maxDate.getTime()); // Set to maxDate if greater
        }

        whereConditions["$game.createdAt$"] = whereConditions["createdAt"] = {
          [Op.between]: [startDate.toISOString(), endDate.toISOString()],
        };
      }else if (columnFilter === "gameRoundCode") {
        whereConditions["gameRoundCode"] = { [Op.like]: `%${decodedValue}%` };
      }
    });
  }
  const offset = page * size;
  const options: FindOptions = {
    attributes: [
      [Sequelize.col('game.id'),"id"],
      "gameRoundCode",
      [Sequelize.col('game.GameList.label'),"gameName"],
      [Sequelize.fn('SUM', Sequelize.col('bet.overAllCommission')), 'totalGGR'],
      [
        Sequelize.fn(
          'SUM',
          Sequelize.literal("CASE WHEN Transaction.type = 'bet' THEN Transaction.amount ELSE 0 END")
        ),
        'totalBets'
      ],
      [
        Sequelize.fn(
          'SUM',
          Sequelize.literal("CASE WHEN Transaction.type = 'wonprize' THEN Transaction.amount ELSE 0 END")
        ),
        'totalWonPrize'
      ],
      [
        Sequelize.fn(
          'SUM',
          Sequelize.literal("CASE WHEN Transaction.type = 'losebet' THEN Transaction.amount ELSE 0 END")
        ),
        'totalLoseBets'
      ],
      [Sequelize.col('game.createdAt'),"createdAt"],
    ],
    include: [
      {
        model: Bet,
        attributes:[],
      },
      {
        model: Game,
        attributes:[],
        include: [
          {
            model: GameList,
            attributes:[],
          },
        ],
      },
    ],
    where: whereConditions,
    offset,
    limit: size,
    group: ['Transaction.game_id'],
  };

  const order: OrderItem[] = [];
  order.push([Sequelize.col('game.createdAt'), 'desc']);
  options.order = order;

   // First, count the total records without pagination
   const totalCountOptions = {
    include: [
      {
        model: Bet,
        attributes:[],
      },
      {
        model: Game,
        attributes:[],
        include: [
          {
            model: GameList,
            attributes:[],
          },
        ],
      },
    ],
    where: whereConditions,
    group: ['Transaction.game_id'],
  };

  
  const gamesModel = await Transaction.findAll(options);
  const gamesModelCount = await Transaction.count(totalCountOptions);
  const games = {
    content: gamesModel.map((item: any) => ({
      gameId: item.get('id'),
      gameName: item.get('gameName'),
      gameRoundCode: item.get('gameRoundCode'),
      totalGGR: item.get('totalGGR') || 0,
      totalWinningBets: item.get('totalWonPrize') || 0,
      totalLosingBets: item.get('totalLoseBets') || 0,
      totalBets: `${item.get('totalBets')}`,
      createdAt: item.get('createdAt'),
    }))
  };


  const payload = {
    ...games,
    totalCount:gamesModelCount.length
  };
  if (games) {
    return successResponse(
      payload,
      "Get Games is successfully fetched!",
      reply
    );
  } else {
    return errorResponse("Games not found", reply, "custom");
  }
};

export default { 
  getAllTransactions, 
  getTransactions, 
  getMerchantTransactions, 
  getAllMerchantTransactions,
  getGrossGamingRevenues,
  getGrossGamingRevenuesV1
};
