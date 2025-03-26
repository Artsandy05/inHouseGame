
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import CommissionTransaction from "../models/CommissionTransaction";
import { errorResponse, successResponse } from "../utils/logic";
import User from "../models/User";
import { FindOptions, Sequelize } from "sequelize";
import Wallet from "../models/Wallet";
import Bet from "../models/Bet";
import Transaction from "../models/Transaction";
import WinningBets from "../models/WinningBets";
import LosingBets from "../models/LosingBets";

const moment = require('moment');
dayjs.extend(utc);

interface CommissionTransactionsModelAttributes {
    id: number;
    wallet_id: number;
    playerOrAgentId: number;
    agentPlayerId: number;
    game_id: number;
    amount: string;
    commission: string;
    // Include other attributes, including "updatedAt"
    updatedAt: Date; // Assuming updatedAt is of type Date
    createdAt: Date; // Assuming createdAt is of type Date
}
type CommissionTransactionsAttributes = keyof CommissionTransactionsModelAttributes;

const getCommissionTransactions = async (request: any, reply: any) => {
  const userId = request.user.id;
  const { page, size, sort, filter } = request.query;

  const [columnName, direction] = sort.split(",");
  const order = [];

  const whereConditions = {};
  whereConditions["wallet_id"] = userId;

  if (filter) {
    // Split the filter string by '&' to get individual filter conditions
    const filterConditions = filter.split("&");

    filterConditions.forEach((condition) => {
      const [columnFilter, valueFilter] = condition.split("=");
      const decodedValue = decodeURIComponent(valueFilter);

      if (columnFilter === "playerOrAgentId") {
        whereConditions["playerOrAgentId"] = decodedValue
      }
      if(columnFilter === "inviterId"){
        if(parseInt(decodedValue) === 0){
            whereConditions["wallet_id"] = userId
        }else{
            whereConditions["wallet_id"] = decodedValue
        }
      }
      if(columnFilter === "agentPlayerId"){
        whereConditions["agentPlayerId"] = decodedValue
      }
      
      
    });
  }

  const offset = page * size;

  let options: FindOptions = {};
  options = {
    attributes: [
        "id",
        "wallet_id",
        "playerOrAgentId",
        "agentPlayerId",
        "game_id",
        "amount",
        "commission",
        "franchiseTax",
        "createdAt",
        [
            Sequelize.literal(
                `(SELECT commissionAgent FROM referrals AS ReferralAgent WHERE ReferralAgent.inviterId = CommissionTransaction.playerOrAgentId AND
                ReferralAgent.playerId = CommissionTransaction.agentPlayerId LIMIT 1)`
            ),
            "commissionAgent",
        ],
        [
          Sequelize.literal(
              `(SELECT amount FROM \`commission-transactions\` AS ComTrans WHERE ComTrans.wallet_id = CommissionTransaction.playerOrAgentId AND
              ComTrans.playerOrAgentId = CommissionTransaction.agentPlayerId AND ComTrans.game_id = CommissionTransaction.game_id LIMIT 1)`
          ),
          "commissionAmountAgent",
        ],
        [
          Sequelize.literal(
              `(SELECT franchiseTax FROM \`commission-transactions\` AS ComTrans WHERE ComTrans.wallet_id = CommissionTransaction.playerOrAgentId AND
              ComTrans.playerOrAgentId = CommissionTransaction.agentPlayerId AND ComTrans.game_id = CommissionTransaction.game_id LIMIT 1)`
          ),
          "commissionFranchiseTaxAgent",
        ],
        [
          Sequelize.literal(
              `(SELECT createdAt FROM \`commission-transactions\` AS ComTrans WHERE ComTrans.wallet_id = CommissionTransaction.playerOrAgentId AND
              ComTrans.playerOrAgentId = CommissionTransaction.agentPlayerId AND ComTrans.game_id = CommissionTransaction.game_id LIMIT 1)`
          ),
          "commissionCreatedAtAgent",
        ],
    ],
    include: [
        {
            model: User,
            as: "PlayerOrAgent",
            attributes: [
                'id',
                [
                    Sequelize.fn(
                        'CONCAT',
                        Sequelize.col('PlayerOrAgent.firstName'), // Qualify with alias
                        ' ',
                        Sequelize.col('PlayerOrAgent.lastName') // Qualify with alias
                    ),
                    'fullName',
                ],
                'role',
                [
                  Sequelize.literal(
                      `(SELECT userType FROM referrals AS PlayerOrAgentReferral WHERE PlayerOrAgentReferral.playerId = PlayerOrAgent.id)`
                  ),
                  "userType",
                ],
            ] 
        },
        {
            model: User,
            as: "AgentPlayer", 
            attributes: [
                'id',
                [
                    Sequelize.fn(
                        'CONCAT',
                        Sequelize.col('AgentPlayer.firstName'), // Qualify with alias
                        ' ',
                        Sequelize.col('AgentPlayer.lastName') // Qualify with alias
                    ),
                    'fullName',
                ],
                'role'
            ],
            required: false,
        },
        {
            model: User,
            as: "InviterPlayer", 
            attributes: [
                'id',
                [
                    Sequelize.fn(
                        'CONCAT',
                        Sequelize.col('InviterPlayer.firstName'), // Qualify with alias
                        ' ',
                        Sequelize.col('InviterPlayer.lastName') // Qualify with alias
                    ),
                    'fullName',
                ],
                'role'
            ],
            required: false,
        },
        {
            model: Bet,
            as: "Bet",
            attributes: ['zodiac'],
            include: [
                {
                    model: Transaction,
                    attributes: ['amount'], 
                    include: [
                      {
                          model: WinningBets,
                          attributes: ['betAmount'], 
                      },
                      {
                        model: LosingBets,
                        attributes: ['betAmount'], 
                    },
                    ]
                },
            ]
        },
    ],
    where: whereConditions,
    offset,
    limit: size,
  };

    if (
    columnName === "createdAt" &&
    ("createdAt" as keyof CommissionTransactionsAttributes)
    ) {
        order.push(["createdAt", direction.toUpperCase()]);
    }

    options.order = order;


  const commissionTransactions = await CommissionTransaction.findAll(options);
  delete options?.offset;
  delete options?.limit;
  const totalCount = await CommissionTransaction.count(options);

  const payload = {
    content: commissionTransactions,
    totalCount,
  };

  if (commissionTransactions) {
    return successResponse(
      payload,
      "Get All Referral Transaction is successfully fetched!",
      reply
    );
  } else {
    return errorResponse("Referrals not found", reply, "custom");
  }
};


export default { 
    getCommissionTransactions
};
