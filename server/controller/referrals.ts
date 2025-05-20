import { successResponse, errorResponse, makeNotif, capitalizeFirstLetter, makeLog, toFixedTrunc } from "../utils/logic";

import Referral from "../models/Referral";
import User from "../models/User";
import { col, FindOptions, fn, Op, Sequelize } from "sequelize";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import Wallet from "../models/Wallet";
import Transaction from "../models/Transaction";
import { BYBETS, BYGAMES, DAILY, FOR_APPROVAL, IDLE } from "../constants";
import CommissionTransaction from "../models/CommissionTransaction";
import PlayerLog from "../models/PlayerLog";
import commission from "./commission";
import Notification from "../models/Notification";
const moment = require('moment');
dayjs.extend(utc);


interface ReferralModelAttributes {
  id: number;
  playerId: number;
  inviterId: number;
  status: string;
  commission: string;
  // Include other attributes, including "updatedAt"
  updatedAt: Date; // Assuming updatedAt is of type Date
  createdAt: Date; // Assuming createdAt is of type Date
}
type ReferralAttributes = keyof ReferralModelAttributes;

const getAllReferrals = async (request: any, reply: any) => {
  const userId = request.user.id;
  const { page, size, sort, filter } = request.query;

  const [columnName, direction] = sort.split(",");
  const order = [];

  const whereConditions = {};
  const whereConditionsUser = {};
  let pageType = "commission"
  whereConditions["inviterId"] = userId;
  whereConditionsUser["role"] = { [Op.ne]: 'cashier' };

  if (filter) {
    // Split the filter string by '&' to get individual filter conditions
    const filterConditions = filter.split("&");

    filterConditions.forEach((condition) => {
      const [columnFilter, valueFilter] = condition.split("=");
      const decodedValue = decodeURIComponent(valueFilter);

      if(columnFilter === "pageType"){
        pageType = decodedValue
      }

      if (columnFilter === "role") {
        whereConditionsUser["role"] = { [Op.eq]: decodedValue };
      } else if (columnFilter === "fullName") {
        whereConditionsUser[Op.or] = [
          Sequelize.literal(
            `CONCAT(firstName, ' ', lastName) LIKE '%${decodedValue}%'`
          ),
        ];
      } else if (columnFilter === "mobile") {
        whereConditionsUser["mobile"] = { [Op.like]: `%${decodedValue}%` };
      } else if (columnFilter === "createdAt") {
        const [startDateTime, endDateTime] = decodedValue.split(",");
        //console.log({ startDateTime, endDateTime });
        whereConditions["createdAt"] = {
          [Op.between]: [startDateTime, endDateTime],
        };
      }else if (columnFilter === "inviterId"){
        whereConditions["inviterId"] = decodedValue;
      }else{
      
      }
    });
  }

  const offset = page * size;
  const models = { User, Referral, Wallet };

  // Load associations
  // @ts-ignore
  User.associate && User.associate(models);
  // @ts-ignore
  Referral.associate && Referral.associate(models);
  // @ts-ignore
  Wallet.associate && Wallet.associate(models);
  

  let options: FindOptions = {};
  options = {
    attributes: [
      "id",
      "inviterId",
      "playerId",
      "userType",
      "suggestedCommisionStatus",
      ["suggestedCommission","suggestedCommissionMasterAgent"],
      "suggestedCommissionAgent",
      ["commission","commissionMasterAgent"],
      "commissionAgent",
      "suggestedCommissionUpdatedAt",
      // [Sequelize.literal(
      //   `COALESCE(
      //     (SELECT DISTINCT commission FROM referrals AS ReferralAgent WHERE ReferralAgent.inviterId = Referral.playerId LIMIT 1),
      //     0.00
      //   )`
      // ), "commissionAgent"],
      // [Sequelize.literal(
      //   `COALESCE(
      //     (SELECT DISTINCT suggestedCommission FROM referrals AS ReferralAgent WHERE ReferralAgent.inviterId = Referral.playerId LIMIT 1),
      //     0.00
      //   )`
      // ), "suggestedCommissionAgent"],
      [
        Sequelize.literal(
          `(SELECT commission FROM users AS Users WHERE Users.id = Referral.playerId)`
        ),
        "commission",
      ],
      [
        Sequelize.literal(`
          (SELECT SUM(amount- franchiseTax) FROM \`commission-transactions\` AS CommissionTransaction
           WHERE CommissionTransaction.playerOrAgentId = Referral.playerId AND
           CommissionTransaction.wallet_id =  Referral.inviterId)
        `), 
        'earningsPlayer'
      ],
      [
        Sequelize.literal(`
          (SELECT SUM(amount - franchiseTax)
            FROM \`commission-transactions\` AS CommissionTransaction
            WHERE CommissionTransaction.agentPlayerId = Referral.playerId
              AND CommissionTransaction.playerOrAgentId = Referral.inviterId
              AND CommissionTransaction.wallet_id = (
                SELECT MAX(inviterId) FROM referrals AS ReferralMasterAgent 
                WHERE ReferralMasterAgent.playerId = Referral.inviterId
              )
          )
        `), 
        'earningsPlayer2'
      ],
      [
        Sequelize.literal(`
          COALESCE((SELECT SUM(amount) FROM \`commission-transactions\` AS CommissionTransaction
           WHERE CommissionTransaction.wallet_id =  Referral.playerId),0.00)
        `), 
        'earningsAgent'
      ],
      [
        Sequelize.literal(
          `(SELECT role FROM users AS Users WHERE Users.id = Referral.playerId)`
        ),
        "role",
      ],
      [
        Sequelize.literal(
          `(SELECT CONCAT(firstName, ' ', lastName) FROM users AS InviterUser WHERE InviterUser.id = Referral.inviterId)`
        ),
        "inviterFullName", 
      ],
      [
        Sequelize.literal(
          `(SELECT role FROM users AS InviterUser WHERE InviterUser.id = Referral.inviterId)`
        ),
        "inviterRole", 
      ],
      [
        Sequelize.literal(
          `(SELECT commission FROM referrals AS InviterReffer WHERE InviterReffer.playerId = Referral.inviterId)`
        ),
        "inviterCommission", 
      ],
      [
        Sequelize.literal(
          `(SELECT balance FROM wallets AS InviterWallet WHERE InviterWallet.user_id = Referral.inviterId)`
        ),
        "inviterBalance", 
      ],
      [
        Sequelize.literal(`
          COALESCE(
            (
              SELECT createdAt 
              FROM \`commission-transactions\` AS CommissionTransaction
              WHERE CommissionTransaction.playerOrAgentId = Referral.playerId
                AND CommissionTransaction.wallet_id = Referral.inviterId
                AND CommissionTransaction.agentPlayerId = (
                  SELECT MAX(agentPlayerId) 
                  FROM \`commission-transactions\` AS ReferralAgentPlayer 
                  WHERE ReferralAgentPlayer.wallet_id = Referral.inviterId 
                  AND ReferralAgentPlayer.playerOrAgentId = Referral.playerId
                )
              ORDER BY createdAt DESC
              LIMIT 1
            ),
            (
              SELECT createdAt 
              FROM \`commission-transactions\` AS CommissionTransaction
              WHERE CommissionTransaction.playerOrAgentId = Referral.playerId
                AND CommissionTransaction.wallet_id = Referral.inviterId
              ORDER BY createdAt DESC
              LIMIT 1
            ),
            Referral.createdAt
          )
        `), 
        'createdAt'
      ],
      // "createdAt",
    ],
    include: [
      {
        model: User,
        as: "targetUser",
        attributes: [
          "id",
          "mobile",
          "role",
          "firstName",
          "lastName",
          [
            Sequelize.fn(
              "CONCAT",
              Sequelize.col("targetUser.firstName"),
              " ",
              Sequelize.col("targetUser.lastName")
            ),
            "fullName",
          ],
        // ],
        // include: [
        //   {
        //     model: Wallet,
        //     attributes: ["id", "balance"],
        //   },
        ],
        where: whereConditionsUser,
      },
    ],
    where: whereConditions,
    offset,
    order: [
      ['createdAt', 'desc']
    ],
    limit: size,
    having: pageType === "commission" ? Sequelize.literal("earningsPlayer > 0 OR earningsPlayer IS NOT NULL") : null, // Add HAVING clause
  };


  const referrals = await Referral.findAll(options);
  delete options?.offset;
  delete options?.limit;
  const referralCnt = await Referral.count(options);
  
  // Loop through each referral and move `targetUser.fullName` to the root object
  const modifiedReferrals = referrals.map((referral: any) => {
    // Extract the fullName from the targetUser and move it to the root object  
    const fullName = referral.targetUser?.dataValues?.fullName || "";
    const id = referral.targetUser?.dataValues?.id || "";
    const mobile = referral.targetUser?.dataValues?.mobile || "";
    const role = referral.targetUser?.dataValues?.role || "";
    const firstName = referral.targetUser?.dataValues?.firstName || "";
    const lastName = referral.targetUser?.dataValues?.lastName || "";

    // Remove the targetUser object
    const { targetUser, ...rest } = referral.toJSON();
    const User = {
      fullName,  // Add fullName to the root
      id,
      mobile,
      role,
      firstName,
      lastName,
    }

    // Return the modified object with fullName at the root level
    return {
      ...rest,
      User
    };
  });

  // const totalCount = await Referral.count(options);

  const payload = {
    content: modifiedReferrals,
    totalCount: referralCnt,
  };

  if (referrals) {
    return successResponse(
      payload,
      "Get All Referrals is successfully fetched!",
      reply
    );
  } else {
    return errorResponse("Referrals not found", reply, "custom");
  }
};

const getAllReferralsPlayerActivity = async (request: any, reply: any) => {
  const { page, size, sort, filter } = request.query;
  const whereConditions = {};
  const whereConditionsByGames = {};
  let totalCount = 0;
  let tableView = DAILY;   

  if (filter) {
    // Split the filter string by '&' to get individual filter conditions
    const filterConditions = filter.split("&");
   

    filterConditions.forEach((condition) => {
      const [columnFilter, valueFilter] = condition.split("=");
      const decodedValue = decodeURIComponent(valueFilter);
      if (columnFilter === "tableView") {
        tableView = decodedValue;
      }else if (columnFilter === "walletId") {
        whereConditions["wallet_id"] = decodedValue
      } else if (columnFilter === "game_id") {
        whereConditions["game_id"] = decodedValue;
      } else if (columnFilter === "createdAt") {
        const [startDateTime, endDateTime] = decodedValue.split(",");
        whereConditions["createdAt"] = {
          [Op.between]: [startDateTime, endDateTime],
        };
      } else if (columnFilter === "type") {
        whereConditions["type"] = { [Op.eq]: decodedValue };
      } else if (columnFilter === "amount") {
        whereConditions["amount"] = { [Op.like]: `%${decodedValue}%` };
      } else if (columnFilter === "betOn") {
        whereConditions[Op.or] = [
          Sequelize.literal(
            `(SELECT zodiac FROM bets AS Bets WHERE Bets.game_id = Transaction.game_id and Bets.transaction_id = Transaction.id) LIKE '%${decodedValue}%'`
          ),
        ];
      }else if (columnFilter === "game") {
          whereConditions[Op.or] = [
            Sequelize.literal(
              `(SELECT name FROM games AS Games WHERE Games.id = Transaction.game_id) LIKE '%${decodedValue}%'`
            ),
          ];
      }else if (columnFilter === "date") {
          // Filter by a specific date
          whereConditionsByGames[Op.and] = [
            Sequelize.where(Sequelize.fn('DATE', Sequelize.col('createdAt')), Op.eq, decodedValue)
          ];
      }
    });
  }

  const offset = page * size;

  let options: FindOptions = {};
  options = {
    attributes: [
      "game_id",
      [
        Sequelize.literal(
          `(SELECT zodiac FROM bets AS Bets WHERE Bets.game_id = Transaction.game_id and Bets.transaction_id = Transaction.id)`
        ),
        "betOn",
      ],
      [
        Sequelize.literal(
          `(SELECT name FROM games AS Games WHERE Games.id = Transaction.game_id)`
        ),
        "game",
      ],
      "amount",
      "type",
      "createdAt",
    ],
    where: whereConditions,
    offset,
    limit: size,
  };
  

  if (tableView === DAILY) {
    options.attributes = [
      'wallet_id',
      [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'],
      [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('game_id'))), 'unique_game_count'],
      [
        Sequelize.literal(`
          COALESCE((SELECT COUNT(*)
           FROM transactions AS sub
           WHERE sub.type = 'bet' 
           AND DATE(sub.createdAt) = DATE(Transaction.createdAt)
          ), 0)`), 
        'total_bet_count'
      ],
      [
        Sequelize.literal(`
          COALESCE((SELECT SUM(amount)
           FROM transactions AS sub
           WHERE sub.type = 'bet' 
           AND DATE(sub.createdAt) = DATE(Transaction.createdAt)
          ), 0)`), 
        'total_bet_amount'
      ],
      [
        Sequelize.literal(`
          COALESCE((SELECT COUNT(DISTINCT game_id) 
           FROM transactions AS sub
           WHERE sub.type = 'wonprize' 
           AND DATE(sub.createdAt) = DATE(Transaction.createdAt)
          ), 0)`), 
        'unique_wonprize_count'
      ],
      [
        Sequelize.literal(`
          COALESCE((SELECT SUM(amount)
           FROM transactions AS sub
           WHERE sub.type = 'wonprize' 
           AND DATE(sub.createdAt) = DATE(Transaction.createdAt)
          ), 0)`), 
        'total_wonprize_amount'
      ],
      [
        Sequelize.literal(`
          COALESCE((SELECT COUNT(*)
           FROM transactions AS sub
           WHERE sub.type = 'deposit' 
           AND DATE(sub.createdAt) = DATE(Transaction.createdAt)
          ), 0)`), 
        'total_deposit_count'
      ],
      [
        Sequelize.literal(`
          COALESCE((SELECT SUM(amount)
           FROM transactions AS sub
           WHERE sub.type = 'deposit' 
           AND DATE(sub.createdAt) = DATE(Transaction.createdAt)
          ), 0)`), 
        'total_deposit_amount'
      ],
      [
        Sequelize.literal(`
          COALESCE((SELECT COUNT(*)
           FROM transactions AS sub
           WHERE sub.type = 'withdrawal' 
           AND DATE(sub.createdAt) = DATE(Transaction.createdAt)
          ), 0)`), 
        'total_withdrawal_count'
      ],
      [
        Sequelize.literal(`
          COALESCE((SELECT SUM(amount)
           FROM transactions AS sub
           WHERE sub.type = 'withdrawal' 
           AND DATE(sub.createdAt) = DATE(Transaction.createdAt)
          ), 0)`), 
        'total_withdrawal_amount'
      ],
    ];
    options.group = ['date'];
    options.raw = true; // Ensures we get plain objects in the result

  }else if (tableView === BYGAMES) {
    options.attributes = [
      'wallet_id',
      [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'],
      'game_id',
      [
        Sequelize.literal(`
          COALESCE((SELECT COUNT(*)
          FROM transactions AS sub
          WHERE sub.type = 'bet' 
          AND DATE(sub.createdAt) = DATE(Transaction.createdAt)
          AND sub.game_id = Transaction.game_id
          ), 0)`),
        'total_bet_count'
      ],
      [
        Sequelize.literal(`
          COALESCE((SELECT SUM(amount)
          FROM transactions AS sub
          WHERE sub.type = 'bet' 
          AND DATE(sub.createdAt) = DATE(Transaction.createdAt)
          AND sub.game_id = Transaction.game_id
          ), 0)`),
        'total_bet_amount'
      ],
      [
        Sequelize.literal(`
          COALESCE((SELECT COUNT(*)
          FROM transactions AS sub
          WHERE sub.type = 'wonprize' 
          AND DATE(sub.createdAt) = DATE(Transaction.createdAt)
          AND sub.game_id = Transaction.game_id
          ), 0)`),
        'unique_wonprize_count'
      ],
      [
        Sequelize.literal(`
          COALESCE((SELECT SUM(amount)
          FROM transactions AS sub
          WHERE sub.type = 'wonprize' 
          AND DATE(sub.createdAt) = DATE(Transaction.createdAt)
          AND sub.game_id = Transaction.game_id
          ), 0)`),
        'total_wonprize_amount'
      ],
    ];
    options.group = ['date','game_id'];
    options.where = {
      whereConditionsByGames,
      type: { [Op.in]: ['bet', 'wonprize'] }  // Added filter for type
    }
    options.raw = true; // Ensures we get plain objects in the result

  }else if (tableView === BYBETS) {
    options.group = ['date'];
    options.where = whereConditionsByGames
    options.raw = true; // Ensures we get plain objects in the result
  }

  const transactions = await Transaction.findAll(options);
  if (tableView === DAILY || tableView === BYGAMES || tableView === BYBETS) {
    totalCount = transactions.length
  }else{
    totalCount = await Transaction.count({ where: whereConditions });
  }

  const payload = {
    content: transactions,
    totalCount,
  };

  if (transactions) {
    return successResponse(
      payload,
      "Get All Referral Player Activity is successfully fetched!",
      reply
    );
  } else {
    return errorResponse("Referral Player Activity not found", reply, "custom");
  }

}

const getYearCommission = async (request: any, reply: any) => {
  const userId = request.user.id;
  // Get the current date and the beginning of the current year
  const startDate = new Date(new Date().getFullYear(), 0, 1); // January 1st of the current year
  const endDate = new Date(new Date().getFullYear(), 11, 31);
  const whereConditions = {
    wallet_id: userId,
    createdAt: {
      [Op.between]: [startDate, endDate],
    },
  };
  let options: FindOptions = {};
  options = {
    attributes: [
      [fn('DATE_FORMAT', col('createdAt'), '%b') , 'month'], // Formats date to get month abbreviation
      [fn('DATE_FORMAT', col('createdAt'), '%Y-%m-%d'), 'date'], // Get the date in 'YYYY-MM-DD' format
      'amount',
      'franchiseTax'
      // [fn('SUM', col('amount')), 'sales'], // Sums the commission
    ],
    where: whereConditions,
    // group: [fn('DATE_FORMAT', col('createdAt'), '%b')], // Group by month
    // order: [fn('MONTH', col('createdAt'))], // Order by month number
  };

  try {
      const commissionTransactions = await CommissionTransaction.findAll(options);
      // Prepare the response data with a mapping for months
      const agentYearCommission = [
        { month: 'Jan', sales: "0.00", today: "0.00" },
        { month: 'Feb', sales: "0.00", today: "0.00" },
        { month: 'Mar', sales: "0.00", today: "0.00" },
        { month: 'Apr', sales: "0.00", today: "0.00" },
        { month: 'May', sales: "0.00", today: "0.00" },
        { month: 'Jun', sales: "0.00", today: "0.00" },
        { month: 'Jul', sales: "0.00", today: "0.00" },
        { month: 'Aug', sales: "0.00", today: "0.00" },
        { month: 'Sep', sales: "0.00", today: "0.00" },
        { month: 'Oct', sales: "0.00", today: "0.00" },
        { month: 'Nov', sales: "0.00", today: "0.00" },
        { month: 'Dec', sales: "0.00", today: "0.00" },
      ];
      // Create a month map for easier access
      const monthMap = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
      };

      const monthlySales = {};
      let todaySales = 0; // Variable to hold total sales for today

      commissionTransactions.forEach(transaction => {
        const month = transaction?.dataValues?.month;
        const date = transaction?.dataValues?.date;
        const amount = transaction?.dataValues?.amount;
        const franchiseTax = transaction?.dataValues?.franchiseTax;
        
        // Calculate the net commission for this transaction
        // let monthNetCom = toFixedTrunc(amount - franchiseTax, 4);
        let monthNetCom = amount - franchiseTax;
        monthNetCom = Number(monthNetCom); // Ensure it's a number
        
        // Sum the sales for the corresponding month
        if (monthMap[month] !== undefined) {
            if (!monthlySales[month]) {
              monthlySales[month] = 0;
            }
            monthlySales[month] += monthNetCom;

            // Check if this transaction is today and add to today's total sales
            const todayDate = moment().format('YYYY-MM-DD');
          
            if (date === todayDate) {
              todaySales += monthNetCom; // Add today's commission to the total sales for today
            }
        }
      });
    
  
      // Now update the agentYearCommission array with summed sales
      agentYearCommission.forEach((entry:any) => {
        const month = entry.month;
        if (monthlySales[month] !== undefined) {
          entry.sales = `${monthlySales[month]}`;
        }
         // Set today's sales for each month
  
        if (entry.month === new Date().toLocaleString('default', { month: 'short' })) {
          entry.today = `${todaySales}`;
        }
      });
      
      // Get Count of Referrals, The Agent and his players
      const oneMonthAgoNewAgent = moment().subtract(1, 'month').toDate();
      const startOf 
       = moment().startOf('month').toDate();
      const nowAgent = moment().toDate();
      const whereConditions = {
        inviterId: userId,
      };
      const whereConditionsLastMonth = {
        inviterId: userId,
        createdAt: {
          [Op.between]: [oneMonthAgoNewAgent, nowAgent],
        },
      };
      const whereConditionsThisMonthCount = { 
        inviterId: userId,
        createdAt: {
          [Op.between]: [startOf, nowAgent],
        },
      };
      let optionsRefsCount: FindOptions = {};
      let optionsRefsLastMonthCount: FindOptions = {};
      let optionsRefsThisMonthCount: FindOptions = {};
      optionsRefsCount = {
        attributes: [
          [Sequelize.fn("COUNT", Sequelize.col("Referral.id")), "referralCount"],
        ],
        include: [
          {
            model: User,
            attributes: [
              "id",
              "role",
              [
                Sequelize.fn(
                  "CONCAT",
                  Sequelize.col("firstName"),
                  " ",
                  Sequelize.col("lastName")
                ),
                "fullName",
              ],
            ],
            where: {
              role: {
                [Op.or]: ["agent", "player"], // Filter for agent and player roles
              },
            },
          },
        ],
        where: whereConditions,
        group: ["User.role"], // Group by user role
      };
      optionsRefsLastMonthCount = {
        attributes: [
          [Sequelize.fn("COUNT", Sequelize.col("Referral.id")), "referralCount"],
        ],
        include: [
          {
            model: User,
            attributes: [
              "id",
              "role",
              [
                Sequelize.fn(
                  "CONCAT",
                  Sequelize.col("firstName"),
                  " ",
                  Sequelize.col("lastName")
                ),
                "fullName",
              ],
            ],
            where: {
              role: {
                [Op.or]: ["agent", "player"], // Filter for agent and player roles
              },
            },
          },
        ],
        where: whereConditionsLastMonth,
        group: ["User.role"], // Group by user role
      };
      optionsRefsThisMonthCount = {
        attributes: [
          [Sequelize.fn("COUNT", Sequelize.col("Referral.id")), "referralCount"],
        ],
        include: [
          {
            model: User,
            attributes: [
              "id",
              "role",
              [
                Sequelize.fn(
                  "CONCAT",
                  Sequelize.col("firstName"),
                  " ",
                  Sequelize.col("lastName")
                ),
                "fullName",
              ],
            ],
            where: {
              role: {
                [Op.or]: ["agent", "player"], // Filter for agent and player roles
              },
            },
          },
        ],
        where: whereConditionsThisMonthCount,
        group: ["User.role"], // Group by user role
      };
      const referrals = await Referral.findAll(optionsRefsCount);
      const referralsLastMonth = await Referral.findAll(optionsRefsLastMonthCount);
      const referralsThisMonth = await Referral.findAll(optionsRefsThisMonthCount);
      const agentAndPlayerCountResult = {
        agentCount: 0,
        newAgentCount: 0,
        curMonthAgentCount: 0,
        playerCount: 0,
        newPlayerCount: 0,
        curMonthPlayerCount: 0,
      };

      referrals.forEach(referral => {
        if (referral.User.role === "agent") {
          agentAndPlayerCountResult.agentCount = referral.dataValues.referralCount;
        } else if (referral.User.role === "player") {
          agentAndPlayerCountResult.playerCount = referral.dataValues.referralCount;
        }
      });

      referralsLastMonth.forEach(referralLastMonth => {
        if (referralLastMonth.User.role === "agent") {
          agentAndPlayerCountResult.newAgentCount = referralLastMonth.dataValues.referralCount;
        } else if (referralLastMonth.User.role === "player") {
          agentAndPlayerCountResult.newPlayerCount = referralLastMonth.dataValues.referralCount;
        }
      });

      referralsThisMonth.forEach(referralThisMonth => {
        if (referralThisMonth.User.role === "agent") {
          agentAndPlayerCountResult.curMonthAgentCount = referralThisMonth.dataValues.referralCount;
        } else if (referralThisMonth.User.role === "player") {
          agentAndPlayerCountResult.curMonthPlayerCount = referralThisMonth.dataValues.referralCount;
        }
      });

    // Get Masteragent Active Player's Count and Percentage
    const currentDate = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(currentDate.getMonth() - 1);
    const referralsPlayer = await Referral.findAll({
      where: { inviterId: userId },
      include: [{
        model: User,
        where: { role: 'player' }, 
      }],
    });
    const playerIds = referralsPlayer.map(referral => referral.playerId); 
    const playerLogs = await PlayerLog.findAll({
      attributes: [
        'userId',
        [fn('MAX', col('PlayerLog.createdAt')), 'recentLog'], 
      ],
      where: {
        userId: { [Op.in]: playerIds },
        type: 'in',
      },
      order: [['createdAt', 'ASC']], 
      group: ['userId'],
    });
    const activePlayerIds = playerLogs
    .filter(log => {
        const recentDate = new Date(log.dataValues?.recentLog);
        return !isNaN(recentDate.getTime()) && recentDate >= oneMonthAgo;
    })
    .map(log => log.dataValues.userId);
    const inactivePlayerIds = playerLogs
    .filter(log => {
        const recentDate = new Date(log.dataValues?.recentLog);
        return !isNaN(recentDate.getTime()) && recentDate < oneMonthAgo;
    }) 
    .map(log => log.dataValues.userId);
    const totalPlayers = activePlayerIds.length + inactivePlayerIds.length;
    const activePercentage = totalPlayers > 0 ? (activePlayerIds.length / totalPlayers) * 100 : 0;
    const inactivePercentage = totalPlayers > 0 ? (inactivePlayerIds.length / totalPlayers) * 100 : 0;
    const roundedActivePercentage = Math.round(activePercentage * 100) / 100;
    const roundedInactivePercentage = Math.round(inactivePercentage * 100) / 100;
    const playerActiveOrInactiveCountResult = {
      activePlayerCounts: activePlayerIds.length,
      inactivePlayerCounts: inactivePlayerIds.length,
      activePercentage: roundedActivePercentage, // Optional: round to 2 decimal places
      inactivePercentage: roundedInactivePercentage, // Optional: round to 2 decimal places
    };

    // Get Masteragent Active Agent's Count and Percentage
    const referralsAgent = await Referral.findAll({
      where: { inviterId: userId },
      include: [{
        model: User,
        where: { role: 'agent' }, 
      }],
    });
    const agentIds = referralsAgent.map(referral => referral.playerId); 
    const agentLogs = await PlayerLog.findAll({
      attributes: [
        'userId',
        [fn('MAX', col('PlayerLog.createdAt')), 'recentLog'], 
      ],
      where: {
        userId: { [Op.in]: agentIds },
        type: 'in',
      },
      order: [['createdAt', 'ASC']], 
      group: ['userId'],
    });
    const activeAgentIds = agentLogs
    .filter(log => {
        const recentDate = new Date(log.dataValues?.recentLog);
        return !isNaN(recentDate.getTime()) && recentDate >= oneMonthAgo;
    })
    .map(log => log.dataValues.userId);
    const inactiveAgentIds = agentLogs
    .filter(log => {
        const recentDate = new Date(log.dataValues?.recentLog);
        return !isNaN(recentDate.getTime()) && recentDate < oneMonthAgo;
    }) 
    .map(log => log.dataValues.userId);
    const totalAgents = activeAgentIds.length + inactiveAgentIds.length;
    const activeAgentPercentage = totalAgents > 0 ? (activeAgentIds.length / totalAgents) * 100 : 0;
    const inactiveAgentPercentage = totalAgents > 0 ? (inactiveAgentIds.length / totalAgents) * 100 : 0;
    const roundedAgentActivePercentage = Math.round(activeAgentPercentage * 100) / 100;
    const roundedAgentInactivePercentage = Math.round(inactiveAgentPercentage * 100) / 100;
    const agentActiveOrInactiveCountResult = {
      activeAgentCounts: activeAgentIds.length,
      inactiveAgentCounts: inactiveAgentIds.length,
      activePercentage: roundedAgentActivePercentage, // Optional: round to 2 decimal places
      inactivePercentage: roundedAgentInactivePercentage, // Optional: round to 2 decimal places
    };

    const payload = {
      agentYearCommission,
      agentAndPlayerCountResult,
      playerActiveOrInactiveCountResult,
      agentActiveOrInactiveCountResult,
      date:{
        oneMonthAgoNewAgent,
        nowAgent
      }
    };

    return successResponse(
      payload,
      "Get All Commission Transaction is successfully fetched!",
      reply
    );
  } catch (e) {
    return errorResponse(`Commission Transaction encounter error:${e}`, reply, "custom");
  }
}

const getUpdatedBalance = async (request: any, reply: any) => {
  const userId = request.user.id;
 
  try {
    const wallet = await Wallet.findOne({ where: { user_id: userId } });
    return successResponse(
      wallet,
      "Updated Balance is successfully fetched!",
      reply
    );
  } catch (error) {
    return errorResponse(
      `Error on getting Wallet Balance: ${error}`,
      reply,
      "custom"
    );
  }
}

const updateCommission = async (request: any, reply: any) => {
  const refId = request.body.refId;
  const operatorCommission = request.body.operatorCommission;
  const representativeCommission = request.body.representativeCommission;
  const representativeOldCommission = request.body.representativeOldCommission;
  
  const inviterId = request.body.inviterId;
  const playerId = request.body.playerId;

  const reference = await Referral.findOne(
    { where: { id: refId }}
  );


  const AgentUser = await User.findOne({
    attributes: [
      "firstName",
      "lastName",
    ],
    where: { id:playerId },
  });

  const MasteragentUser = await User.findOne({
    attributes: [
      "firstName",
      "lastName",
    ],
    where: { id:inviterId },
  });

  const masteragentFirstName = MasteragentUser?.firstName
  const masteragentLastName = MasteragentUser?.lastName
  const referralSuggestedCommisionStatus = reference?.suggestedCommisionStatus
  const agentFirstName = AgentUser?.firstName
  const agentLastName = AgentUser?.lastName
  const fullnameMasteragent = `${masteragentFirstName} ${masteragentLastName}`
  const fullnameAgent  = `${agentFirstName} ${agentLastName}`


  try {
    // const commissionMasterAgentFloat = (Number(operatorCommission) / 100)
    // const commissionAgentFloat =  (Number(representativeCommission) / 100)
    const commissionMasterAgentFloat = operatorCommission
    const commissionAgentFloat =  representativeCommission
    
    if(referralSuggestedCommisionStatus === IDLE){
      await Referral.update(
        { 
          suggestedCommission:commissionMasterAgentFloat, 
          suggestedCommissionAgent:commissionAgentFloat, 
          suggestedCommisionStatus:"forapproval",
          suggestedCommissionUpdatedAt:new Date(),
        },
        { where: { playerId, inviterId }}
      );

      await Referral.update(
        { 
          suggestedCommission:commissionAgentFloat, 
          suggestedCommisionStatus:"forapproval",
          suggestedCommissionUpdatedAt:new Date(),
        },
        { where: { inviterId:playerId }}
      );

      await makeNotif(
        playerId,
        `Request to change Commission Percentage`,
        `Good day, ${capitalizeFirstLetter(agentFirstName)}! \n 
        Your Operator - ${fullnameMasteragent}
        <span>requested to change your commission 
        percentage from ${representativeOldCommission}% to ${representativeCommission}%.</span> \n
        This will affect your commission after approval.`,
        "referral",
        "info",
        refId,
        "forapproval"
      );

      await makeLog(
        `${fullnameMasteragent} (operator) is requesting to update the commission of ${fullnameAgent} 
        from ${representativeOldCommission}% to ${representativeCommission}%, now waiting for agent approval`,
        "referral",
        "pending",
        playerId,
        "referral"
      );

      return successResponse(
        {},
        "Updating Referral Commission is successfully updated!",
        reply
      );
    }else{
      return errorResponse(
        `Failed to approve referral commission, Try to refresh the page`,
        reply,
        "custom"
      );
    }
  } catch (error) {
    return errorResponse(
      `Error on updating referral commission: ${error}`,
      reply,
      "custom"
    );
  }

}

const cancelCommission = async (request: any, reply: any) => {
  const refId = request.body.refId;
  const inviterId = request.body.inviterId;
  const playerId = request.body.playerId;

  const reference = await Referral.findOne(
    { where: { id: refId }}
  );

  const AgentUser = await User.findOne({
    attributes: [
      "firstName",
      "lastName",
    ],
    where: { id:playerId },
  });

  const MasteragentUser = await User.findOne({
    attributes: [
      "firstName",
      "lastName",
    ],
    where: { id:inviterId },
  });
  
  const masteragentFirstName = MasteragentUser?.firstName
  const masteragentLastName = MasteragentUser?.lastName
  const referralSuggestedCommisionStatus = reference?.suggestedCommisionStatus
  const agentFirstName = AgentUser?.firstName
  const agentLastName = AgentUser?.lastName
  const fullnameMasteragent = `${masteragentFirstName} ${masteragentLastName}`
  const fullnameAgent  = `${agentFirstName} ${agentLastName}`

  try {
    if(referralSuggestedCommisionStatus === FOR_APPROVAL){
      await Referral.update(
        { 
          suggestedCommission:"0.00", 
          suggestedCommissionAgent:"0.00", 
          suggestedCommisionStatus:"idle",
          suggestedCommissionUpdatedAt:new Date(),
        },
        { where: { playerId, inviterId }}
      );

      await Referral.update(
        { 
          suggestedCommission:"0.00", 
          suggestedCommissionAgent:"0.00", 
          suggestedCommisionStatus:"idle",
          suggestedCommissionUpdatedAt:new Date(),
        },
        { where: { inviterId:playerId }}
      );

      await Notification.update(
        { referenceStatus: null },
        { where: { reference: refId, referenceStatus: FOR_APPROVAL } 
      })

      await makeNotif(
        playerId,
        `Request to change Commission Percentage was cancelled`,
        `Good day, ${capitalizeFirstLetter(agentFirstName)}!
        Your Operator - ${fullnameMasteragent} 
        was cancelled his change request commission`,
        "referral",
        "info",
        refId,
        null
      );

      await makeLog(
        `${fullnameMasteragent} (operator) was cancelled his request to update the commission of ${fullnameAgent}`,
        "referral",
        "cancelled",
        playerId,
        "referral"
      );

      return successResponse(
        {},
        "Cancelling Referral Commission is successfully updated!",
        reply
      );
    }else{
      return errorResponse(
        `Failed to cancel referral commission, Try to refresh the page`,
        reply,
        "custom"
      );
    }
  } catch (error) {
    return errorResponse(
      `Error on cancelling referral commission: ${error}`,
      reply,
      "custom"
    );
  }

}

export default { 
  getAllReferrals, 
  getAllReferralsPlayerActivity, 
  getYearCommission,
  getUpdatedBalance,
  updateCommission,
  cancelCommission
};
