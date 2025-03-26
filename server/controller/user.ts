require("dotenv").config(); // Load dotenv
import {
  successResponse,
  errorResponse,
  executeVerifierActions,
  makeLog,
  findChangedValues,
  createOrUpdateUserGroup,
  generateReferralCode,
  makeNotif,
  numWithS,
  generateAccountId,
  mobilePH,
  getNickname,
  displayMoney,
} from "../utils/logic";
import { canViewTableUM } from "../utils/permissions/userManagement";
import User from "../models/User";
import Address from "../models/Address";
import Province from "../models/Province";
import City from "../models/City";
import Barangay from "../models/Barangay";
import { col, fn, OrderItem, Sequelize } from "sequelize";
import { Op, FindOptions } from "sequelize";
import fs from "fs";
import path from "path";
import { pipeline } from "stream";
import { promisify } from "util";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import UserGroup from "../models/UserGroup";
import LoadTransaction from "../models/LoadTransaction";
import Wallet from "../models/Wallet";
import Notification from "../models/Notification";
import Transaction from "../models/Transaction";
import Session from "../models/Session";
import stasherAPI from "../api/stasher";
import config from "../config/config";
import { FOR_APPROVAL, QRPH, KYC, LOCAL, USER_PROFILE, DEPOSIT, BET, PROMO, ZOLOZ_INITIALIZE_CALLBACK_BASEURL, H5_REALIDLITE_KYC, DONE, PRODUCTION, ADMIN, ALLOWED_MIME_TYPES, DEVELOPMENT, STAGING, DEDUCTCREDITS } from "../constants";
import Cards from "../models/Cards";
import PlayerLog from "../models/PlayerLog";
dayjs.extend(utc);
import argon2 from 'argon2';
import Referral from "../models/Referral";
import Site from "../models/Site";
import SourceOfIncome from "../models/SourceOfIncome";
import Game from "../models/Game";
import GameList from "../models/GameList";
import { canAccessAdmin, canAccessGame } from "../utils/permissions";
import ReferralPlayer from "../models/ReferralPlayer";
import UserPromo from "../models/UserPromo";
import Promo from "../models/Promo";
import zoloz from "../api/zoloz";
import ZolozTransaction from "../models/ZolozTransaction";
import OTP from "../api/otp";
import twillio from "../api/twillio";
import moment from "moment-timezone";
import { API_FAILURE, VALIDATION_ERROR } from "../constants/validation";
import WinningBets from "../models/WinningBets";
import LosingBets from "../models/LosingBets";
import Log from "../models/Log";
const crypto = require('crypto');

const environment = process.env.NODE_ENV || LOCAL;
const FRONTEND_URL = config[environment].frontend_url;
const BASE_URL = config[environment].base_url;

const storage = `${environment !== LOCAL ? "./dist/server" : "."}`;

const { ROLES } = require("../constants/permission");
const models = { User, Address, Province, City, Barangay };
// Load associations
// @ts-ignore
User.associate && User.associate(models);
// @ts-ignore
Address.associate && Address.associate(models);
// @ts-ignore
Province.associate && Province.associate(models);
// @ts-ignore
City.associate && City.associate(models);
// @ts-ignore
Barangay.associate && Barangay.associate(models);

const pump = promisify(pipeline);

const expireKYC = (createdAt:any, isKYC:string) => {
  const threeDaysAgo = moment().subtract(3, 'days');
  const userCreatedAt = moment(createdAt);
  return isKYC === "notstarted" && userCreatedAt.isBefore(threeDaysAgo)
}

const getUserSites = async (request, reply) => {
  try {
    const users = await User.findAll({
      attributes: [
        "site",
        "id"
      ],
      where: { 
        role: "superagent",
        site: { [Op.ne]: '' }  
       },
    });
    return successResponse(
      users,
      "Get All User Site is successfully fetched!",
      reply
    );
  } catch (error) {
    return errorResponse(
      `Error on getting Verifier Users: ${error}`,
      reply,
      "custom"
    );
  }
}

const getSourceOfIncome = async (request, reply) => {
  try {
    const sourceOfIncome = await SourceOfIncome.findAll({
      attributes: ["id", "name"],
      order: [["id", "ASC"]],
    });
    return successResponse(
      sourceOfIncome,
      "Get source Of income is successfully fetched!",
      reply
    );
  } catch (error) {
    return errorResponse(
      `Error on getting source Of income: ${error}`,
      reply,
      "custom"
    );
  }
}

const getUserSessions = async (request, reply) => {
  const { page, size, sort, filter, status } = request.query;
  let whereConditions = {} as any; // Define whereConditions as any type
  let whereConditionsPlayerLogs = {} as any; // Define whereConditions as any type

  if (filter) {
    // Split the filter string by '&' to get individual filter conditions
    const filterConditions = filter.split("&");

    // filterConditions.forEach((condition) => {
    for (const condition of filterConditions) {
      const [columnFilter, valueFilter] = condition.split("=");
      const decodedValue = decodeURIComponent(valueFilter);

      if (columnFilter === "userId") {
        whereConditions.id = decodedValue;
      }else if (columnFilter === "mode"){
        whereConditionsPlayerLogs["mode"] = decodedValue
      }else if (columnFilter === "type"){
        whereConditionsPlayerLogs["type"] = decodedValue
      } else if (columnFilter === "createdAt") {
        const [startDateTime, endDateTime] = decodedValue.split(",");
        whereConditionsPlayerLogs["createdAt"] = {
          [Op.between]: [startDateTime, endDateTime],
        };
      }
    };
  }

  const offset = page * size;

  let options: FindOptions = {};

  options = {
    attributes: [
      "id",
      "mode",
      "type",
      "createdAt",
    ],
    include: [
      {
        model: User,
        attributes: [
          ["id","userId"],  
            [
              Sequelize.fn(
                "CONCAT",
                Sequelize.col("firstName"),
                " ",
                Sequelize.col("lastName")
              ),
              "name",
          ],
        ],
        where: whereConditions 
      },
    ],
    where: whereConditionsPlayerLogs,
    offset,
    limit: size,
  };

  
  const playerLog = await PlayerLog.findAll(options);
  const totalCount = await PlayerLog.count(options);

  const payload = {
    content: playerLog,
    totalCount,
  };

  if (playerLog) {
    return successResponse(
      payload,
      "Get All Player Log is successfully fetched!",
      reply
    );
  } else {
    return errorResponse("User Player Log not found", reply, "custom");
  }
}

const getUsers = async (request, reply) => {
  canAccessAdmin(request.userRole, reply)

  const userRole = request.userRole;
  const uuid = request.user.uuid;
  let filterAddress = false;
  let filterGame = false;

  const { page, size, sort, filter, status } = request.query;

  const [columnName, direction] = sort.split(",");
  const order = [];

  let whereConditions = {} as any; // Define whereConditions as any type
  let whereConditionsTrans = {} as any; // Define whereConditionsTrans as any type
  const whereConditionsProvincePerma = {} as any; // Define whereConditions as any type
  const whereConditionsProvinceCur = {} as any; // Define whereConditions as any type

  // if (status === "inactive") {
  //   whereConditions.deletedAt = { [Op.not]: null };
  // } else {
  //   whereConditions.deletedAt = null;
  // }
        
  whereConditions[Op.and] = [
    {
      uuid: {
        [Op.ne]: uuid, // Op.ne means "not equal"
      },
      role: { [Op.notIn]: canViewTableUM(userRole) },
    },
  ];

  if (userRole === ROLES.SUPERVISOR.name || userRole === ROLES.VERIFIER.name) {
    // whereConditions.isKYC = 1;
    whereConditions.role = ROLES.PLAYER.name;
  }

    let provinceId = "";
    let cityId = "";
    let barangayId = "";
    let usePresent = "";

  if (filter) {
    // Split the filter string by '&' to get individual filter conditions
    const filterConditions = filter.split("&");

    for (const condition of filterConditions) {
      const [columnFilter, valueFilter] = condition.split("=");
      const decodedValue = decodeURIComponent(valueFilter);

      // return successResponse(
      //   {columnFilter, decodedValue},
      //   "test",
      //   reply
      // );

      if (columnFilter === "uuid") {
        const uuidConditions = {
          uuid: { [Op.substring]: decodedValue },
        };
        whereConditions[Op.or] = uuidConditions;
      } else if (columnFilter === "role") {
        const formattedRole = decodedValue.toLowerCase().replace(/\s/g, "");
        whereConditions[columnFilter] = {
          [Op.eq]: formattedRole,
        };
      } else if (columnFilter === "status") {
        if (decodedValue === "deactivated") {
          whereConditions.deactivatedAtByAdmin = { [Op.not]: null };
          whereConditions.status = "deactivated";
          // whereConditions[Op.or] = { deletedAt:{ [Op.not]: null } };
          // whereConditions.deletedAt = { [Op.not]: null };
        } else if(decodedValue === "active"){
          whereConditions.status = "active";
          // whereConditions = {};
        }else if(decodedValue === "all"){
          delete whereConditions.deactivatedAtByAdmin;
          delete whereConditions.status;
        }
      } else if (columnFilter === "name") {
        whereConditions[Op.or] = [
          Sequelize.literal(
            `CONCAT(User.firstName, ' ', User.lastName) LIKE '%${decodedValue}%'`
          ),
        ];
      }else if (columnFilter === "birthdate") {
        // Assuming birthdate filter is in format YYYY-MM-DD
        const startBirthdate = `${decodedValue} 00:00:00`;
        const endBirthdate = `${decodedValue} 23:59:59`;
        whereConditions["birthdate"] = {
          [Op.between]: [startBirthdate, endBirthdate],
        };
      }else if (columnFilter === "address") {
        const jsonParse = JSON.parse(decodedValue);
         const { province, city, barangay } = jsonParse
         provinceId = province?.id || "";
         cityId = city?.id || "";
         barangayId = barangay?.id || "";
         filterAddress = true
      }else if (columnFilter === "sourceOfIncome") {
        const jsonParse = JSON.parse(decodedValue);
        const { sourceOfIncomeId, sourceOfIncome, } = jsonParse
        whereConditions.sourceOfIncomeId = sourceOfIncomeId;
        if(sourceOfIncome !== ""){
          whereConditions.sourceOfIncome = sourceOfIncome;
        }
      } else if (columnFilter === "usePresentAddress"){
          const isPresent = JSON.parse(decodedValue);
          usePresent = isPresent
      } else if (columnFilter === "verifier") {
        whereConditions[Op.or] = [
          Sequelize.literal(
            `(SELECT CONCAT(firstName, ' ', lastName) FROM users AS Verifier WHERE Verifier.uuid = User.personWhoDeactivated) LIKE '%${decodedValue}%' OR 
            (SELECT CONCAT(firstName, ' ', lastName) FROM users AS Verifier WHERE Verifier.uuid = User.verifierWhoApprove) LIKE '%${decodedValue}%'`
          ),
        ];
      } else if (columnFilter === "supervisor") {
        whereConditions[Op.or] = [
          Sequelize.literal(
            `(SELECT CONCAT(firstName, ' ', lastName) FROM users AS SUPERVISOR WHERE SUPERVISOR.uuid = User.supervisorWhoApprove) LIKE '%${decodedValue}%' OR 
            (SELECT CONCAT(firstName, ' ', lastName) FROM users AS SUPERVISOR WHERE SUPERVISOR.uuid = User.personWhoDenied) LIKE '%${decodedValue}%' OR 
            (SELECT CONCAT(firstName, ' ', lastName) FROM users AS SUPERVISOR WHERE SUPERVISOR.uuid = User.personWhoDeactivated) LIKE '%${decodedValue}%'`
          ),
        ];
      } else if (columnFilter === "supervisorApprovedAt") {
      } else if (columnFilter === "verifierApprovedAt") {
      }else if (columnFilter === "isKYC") {
        whereConditions.isKYC = decodedValue;
      }else if (columnFilter === "createdAt") {
          const [startDateTime, endDateTime] = decodedValue.split(",");
          whereConditions["createdAt"] = {
            [Op.between]: [startDateTime, endDateTime],
          };
      } else if (columnFilter === "updatedAt") {
        const [startDateTime, endDateTime] = decodedValue.split(",");
        whereConditions["updatedAt"] = {
          [Op.between]: [startDateTime, endDateTime],
        };
      }else if (columnFilter === "site") {
        whereConditions.siteId = decodedValue;
      }else if (columnFilter === "game") {
        whereConditionsTrans.game_id  = decodedValue;
        filterGame = true
      }else if (columnFilter === "siteRefferal") {
        
        const referrals = await Referral.findAll({ where: { inviterId:decodedValue }, });

       // Extract all playerId values from the referrals
        const playerIds = referrals.map(referral => referral.playerId);

        // Find all users whose IDs are in the playerIds where role is masteragent array
        const masteragents = await User.findAll({
          attributes: ["id"], 
          where: {
            id: playerIds,
            role: "masteragent"
          }
        });
        const masteragentIds = masteragents.map(masteragent => masteragent.id);
        const playersOfMasteragents = await Referral.findAll({ attributes: ["playerId"], where: { inviterId:masteragentIds } });

         // Find all users whose IDs are in the playerIds where role is agents array
         const agents = await User.findAll({
          attributes: ["id"], 
          where: {
            id: playerIds,
            role: 'agent'  // Add the condition for role
          }
        });
        const agentIds = agents.map(agent => agent.id);
        const playersOfAgents = await Referral.findAll({ attributes: ["playerId"], where: { inviterId:agentIds } });

        const mergePlayersOfMasteragentAndAgents = [
          ...playersOfMasteragents,
          ...playersOfAgents
        ];

        whereConditions.id = mergePlayersOfMasteragentAndAgents.map(
          (player:any) => player.playerId
        );

      //return successResponse({masteragents,agents, mergePlayersOfMasteragentAndAgents}, "User added successfully!", reply);
      }else {
        whereConditions[columnFilter] = { [Op.like]: `%${decodedValue}%` };
        whereConditions.deletedAt = null;
     
      }

      if(provinceId !== ""){
        if(usePresent === "1"){
          whereConditionsProvinceCur[Op.or] = { provinceId };
        }else{
          whereConditionsProvincePerma[Op.or] = { provinceId };
        }
      }
      if(cityId !== ""){
        if(usePresent === "1"){
          whereConditionsProvinceCur[Op.or] = { cityId };
        }else{
          whereConditionsProvincePerma[Op.or] = { cityId };
        }
      }
      if(barangayId !== ""){
        if(usePresent === "1"){
          whereConditionsProvinceCur[Op.or] = { barangayId };
        }else{
          whereConditionsProvincePerma[Op.or] = { barangayId };
        }
      }
    };
  }

  const offset = page * size;
  const options: FindOptions = {
    attributes: [
      "id",
      "uuid",
      [
        Sequelize.fn(
          "CONCAT",
          Sequelize.col("User.firstName"),
          " ",
          Sequelize.col("User.lastName")
        ),
        "fullName",
      ],
      "firstName",
      "lastName",
      "nickName",
      "role",
      "email",
      "username",
      "accountId",
      "birthdate",
      "placeOfBirth",
      "nationalities",
      "natureOfWork",
      "sourceOfIncome",
      "sourceOfIncomeId",
      "gender",
      "address",
      "profilePicture",
      "mobile",
      "isMobileVerified",
      "actionStatus",
      [
        Sequelize.literal(
          `(SELECT CONCAT(firstName, ' ', lastName) FROM users AS Supervisor WHERE Supervisor.uuid = User.supervisorWhoApprove)`
        ),
        "supervisorWhoApproveName",
      ],
      [
        Sequelize.literal(
          `(SELECT CONCAT(firstName, ' ', lastName) FROM users AS Verifier WHERE Verifier.uuid = User.verifierWhoApprove)`
        ),
        "verifierWhoApproveName",
      ],
      [
        Sequelize.literal(
          `(SELECT CONCAT(firstName, ' ', lastName) FROM users AS Person WHERE Person.uuid = User.personWhoDeactivated)`
        ),
        "personWhoDeactivated",
      ],
      [
        Sequelize.literal(
          `(SELECT CONCAT(firstName, ' ', lastName) FROM users AS Person WHERE Person.uuid = User.personWhoDenied)`
        ),
        "personWhoDeniedName",
      ],
      [
        Sequelize.literal(
          `(SELECT CONCAT(firstName, ' ', lastName) FROM users AS Person WHERE Person.uuid = User.adminWhoDeactivated)`
        ),
        "adminWhoDeactivatedName",
      ],
      [
        Sequelize.literal(
          `(SELECT CONCAT(firstName, ' ', lastName) FROM users AS Person WHERE Person.uuid = User.adminWhoRestore)`
        ),
        "adminWhoRestoreName",
      ],
      [
        Sequelize.literal(
          `(SELECT role FROM users AS Person WHERE Person.uuid = User.personWhoDeactivated)`
        ),
        "personWhoDeactiveRole",
      ],
      [
        Sequelize.literal(
          `(SELECT role FROM users AS Person WHERE Person.uuid = User.personWhoDenied)`
        ),
        "personWhoDeniedRole",
      ],
      "isSupervisorApproved",
      "supervisorWhoApprove",
      "verifierApprovedAt",
      "supervisorApprovedAt",
      "isVerifierApproved",
      "isDeactivated",
      "isDenied",
      "actionStatus",
      "deactivatedReasonByAdmin",
      "restoreReasonByAdmin",
      "deactivatedReason",
      "deniedReason",
      "deactivatedAt",
      "deniedAt",
      "createdAt",
      "updatedAt",
      "deactivatedAtByAdmin",
      "restoreAtByAdmin",
      "commission",
      "govtType",
      "govtId",
      "siteId",
      "isKYC",
      "kycAt",
      "govtPicture",
      "govtIdPicture",
      "referralLinkForMA",
      "referralLinkForAgent",
      "status",
      "isOperatorWithSite",
    ],
    where: whereConditions,
    include: [
      {
        model: UserGroup,
        as: "child",
        attributes: [
          [
            Sequelize.literal(
              `(SELECT CONCAT(firstName, ' ', lastName) FROM users AS Users WHERE Users.id = child.childId)`
            ),
            "fullName",
          ],
          ["childId", "id"],
        ],
      },
      {
        model: UserGroup,
        as: "parent",
      },
      {
        model: Address,
        as: "currentAddress",
        attributes: ["barangayId","cityId","provinceId","street", "zipCode"],
        required: filterAddress, // Include users even if they don't have a current address
        where:whereConditionsProvinceCur,
        include: [
          { model: Province, as: "province", attributes: ["id", "name"] },
          { model: City, as: "city", attributes: ["id", "name"] },
          { model: Barangay, as: "barangay", attributes: ["id", "name"] },
        ],
      },
      {
        model: Address,
        as: "permanentAddress",
        attributes: ["barangayId","cityId","provinceId","street", "zipCode"],
        required: filterAddress, // Include users even if they don't have a current address
        where:whereConditionsProvincePerma,
        include: [
          { model: Province, as: "province", attributes: ["id", "name"] },
          { model: City, as: "city", attributes: ["id", "name"] },
          { model: Barangay, as: "barangay", attributes: ["id", "name"] },
        ],
      },
      {
        model: Wallet,
        attributes: ["balance"],
        include: [
          {
            model: Transaction,
            attributes: [], // No attributes needed from Transaction, just the filter
            required: filterGame,
            include: [
              {
                model: Game,
                attributes: [], // No attributes needed from Game
                where: filterGame ? whereConditionsTrans : {}, // Apply filter on game_id here
              }
            ],  
          }
        ],  
        required: filterGame,
      },
      {
        model: SourceOfIncome,
        attributes: ["id", "name"],
      },
      {
        model: Referral,
        as: "DirectPlayer",
        attributes: [
          "playerId",
        ],
        include: [
          {
            model:User,
            as: "sourceUser",
            attributes: [
              "id",
              "uuid",
              [
                Sequelize.fn(
                  "CONCAT",
                  Sequelize.col("DirectPlayer.sourceUser.firstName"),
                  " ",
                  Sequelize.col("DirectPlayer.sourceUser.lastName")
                ),
                "fullName",
              ],
              "isOperatorWithSite",
            ],
          }
        ]
      },
    ],
    offset,
    limit: size,
  };

  const optionsCount: FindOptions = {
    attributes: [],
    where: whereConditions,
    include: [
      {
        model: UserGroup,
        as: "child",
        attributes: [],
      },
      {
        model: UserGroup,
        as: "parent",
      },
      {
        model: Address,
        as: "currentAddress",
        attributes: [],
        required: filterAddress, // Include users even if they don't have a current address
        where:whereConditionsProvinceCur,
        include: [
          { model: Province, as: "province", attributes: ["id", "name"] },
          { model: City, as: "city", attributes: ["id", "name"] },
          { model: Barangay, as: "barangay", attributes: ["id", "name"] },
        ],
      },
      {
        model: Address,
        as: "permanentAddress",
        attributes: [],
        required: filterAddress, // Include users even if they don't have a current address
        where:whereConditionsProvincePerma,
        include: [
          { model: Province, as: "province", attributes: ["id", "name"] },
          { model: City, as: "city", attributes: ["id", "name"] },
          { model: Barangay, as: "barangay", attributes: ["id", "name"] },
        ],
      },
      {
        model: Wallet,
        attributes: ["balance"],
        include: [
          {
            model: Transaction,
            attributes: [], // No attributes needed from Transaction, just the filter
            required: filterGame,
            include: [
              {
                model: Game,
                attributes: [], // No attributes needed from Game
                where: filterGame ? whereConditionsTrans : {}, // Apply filter on game_id here
              }
            ],  
          }
        ],  
        required: filterGame,
      },
      {
        model: SourceOfIncome,
        attributes: ["id", "name"],
      },
      {
        model: Referral,
        as: "DirectPlayer",
        attributes: [
          "playerId",
        ],
        include: [
          {
            model:User,
            as: "sourceUser",
            attributes: [
              "id",
              "uuid",
              [
                Sequelize.fn(
                  "CONCAT",
                  Sequelize.col("DirectPlayer.sourceUser.firstName"),
                  " ",
                  Sequelize.col("DirectPlayer.sourceUser.lastName")
                ),
                "fullName",
              ],
              "isOperatorWithSite",
            ],
          }
        ]
      },
    ]
  };

  // Add conditional sorting based on userRole
  if (userRole === ROLES.SUPERVISOR.name || userRole === ROLES.VERIFIER.name) {
      order.push(['kycAt', 'DESC']);
      order.push(['firstName', 'ASC']);
  }else{ 
    if (columnName === "createdAt") {
      //order.push(["updatedAt", direction.toUpperCase()]);
      order.push(["createdAt", direction.toUpperCase()]); // Secondary sort by createdAt
      order.push(['firstName', 'ASC']);
    }
  }

  options.order = order;

  const users = await User.findAll(options);

  // Count the total records without pagination
  const totalCount = await User.findAll({ attributes:["id"] });

  const payload = {
    content: users,
    totalCount:totalCount.length,
  };

  if (users) {
    return successResponse(
      payload,
      "Get Users is successfully fetched!",
      reply
    );
  } else {
    return errorResponse("Users not found", reply, "custom");
  }
};

const getAllUsers = async (request, reply) => {
  const { filter } = request.query;

  let filterAddress = false;
  let filterGame = false;
  let provinceId = "";
  let cityId = "";
  let barangayId = "";
  let usePresent = "";
  let whereConditions = {} as any; 
  let whereConditionsTrans = {} as any; // Define whereConditionsTrans as any type
  const whereConditionsProvincePerma = {} as any; 
  const whereConditionsProvinceCur = {} as any; 

 
  if (filter) {
    const filterConditions = filter.split("&");

    for (const condition of filterConditions) {
      const [columnFilter, valueFilter] = condition.split("=");
      const decodedValue = decodeURIComponent(valueFilter);

      if (columnFilter === "uuid") {
        const uuidConditions = {
          uuid: { [Op.substring]: decodedValue },
        };
        whereConditions[Op.or] = uuidConditions;
      } else if (columnFilter === "role") {
        const formattedRole = decodedValue.toLowerCase().replace(/\s/g, "");
        whereConditions[columnFilter] = {
          [Op.like]: `%${formattedRole}%`,
        };
      } else if (columnFilter === "status") {
        if (decodedValue === "deactivated") {
          whereConditions.deactivatedAtByAdmin = { [Op.not]: null };
          whereConditions.status = "deactivated";
        } else if(decodedValue === "active"){
          whereConditions.status = "active";
          // whereConditions = {};
        }else if(decodedValue === "all"){
          delete whereConditions.deactivatedAtByAdmin;
          delete whereConditions.status;
        }
      } else if (columnFilter === "name") {
        whereConditions[Op.or] = [
          Sequelize.literal(
            `CONCAT(firstName, ' ', lastName) LIKE '%${decodedValue}%'`
          ),
        ];
      }else if (columnFilter === "birthdate") {
        const startBirthdate = `${decodedValue} 00:00:00`;
        const endBirthdate = `${decodedValue} 23:59:59`;
        whereConditions["birthdate"] = {
          [Op.between]: [startBirthdate, endBirthdate],
        };
      }else if (columnFilter === "address") {
        const jsonParse = JSON.parse(decodedValue);
         const { province, city, barangay } = jsonParse
         provinceId = province?.id || "";
         cityId = city?.id || "";
         barangayId = barangay?.id || "";
         filterAddress = true
      }else if (columnFilter === "sourceOfIncome") {
        const jsonParse = JSON.parse(decodedValue);
        const { sourceOfIncomeId, sourceOfIncome, } = jsonParse
        whereConditions.sourceOfIncomeId = sourceOfIncomeId;
        if(sourceOfIncome !== ""){
          whereConditions.sourceOfIncome = sourceOfIncome;
        }
      } else if (columnFilter === "usePresentAddress"){
          const isPresent = JSON.parse(decodedValue);
          usePresent = isPresent
      } else if (columnFilter === "verifier") {
        whereConditions[Op.or] = [
          Sequelize.literal(
            `(SELECT CONCAT(firstName, ' ', lastName) FROM users AS Verifier WHERE Verifier.uuid = User.personWhoDeactivated) LIKE '%${decodedValue}%' OR 
            (SELECT CONCAT(firstName, ' ', lastName) FROM users AS Verifier WHERE Verifier.uuid = User.verifierWhoApprove) LIKE '%${decodedValue}%'`
          ),
        ];
      } else if (columnFilter === "supervisor") {
        whereConditions[Op.or] = [
          Sequelize.literal(
            `(SELECT CONCAT(firstName, ' ', lastName) FROM users AS SUPERVISOR WHERE SUPERVISOR.uuid = User.supervisorWhoApprove) LIKE '%${decodedValue}%' OR 
            (SELECT CONCAT(firstName, ' ', lastName) FROM users AS SUPERVISOR WHERE SUPERVISOR.uuid = User.personWhoDenied) LIKE '%${decodedValue}%' OR 
            (SELECT CONCAT(firstName, ' ', lastName) FROM users AS SUPERVISOR WHERE SUPERVISOR.uuid = User.personWhoDeactivated) LIKE '%${decodedValue}%'`
          ),
        ];
      } else if (columnFilter === "supervisorApprovedAt") {
      } else if (columnFilter === "verifierApprovedAt") {
      } else if (columnFilter === "createdAt") {
          const [startDateTime, endDateTime] = decodedValue.split(",");
          whereConditions["createdAt"] = {
            [Op.between]: [startDateTime, endDateTime],
          };
      } else if (columnFilter === "updatedAt") {
        const [startDateTime, endDateTime] = decodedValue.split(",");
        whereConditions["updatedAt"] = {
          [Op.between]: [startDateTime, endDateTime],
        };
      }else if (columnFilter === "site") {
        whereConditions.siteId = decodedValue;
      }else if (columnFilter === "game") {
        whereConditionsTrans.game_id = decodedValue;
        filterGame = true
      }else if (columnFilter === "siteRefferal") {
        
        const referrals = await Referral.findAll({ where: { inviterId:decodedValue }, });

       // Extract all playerId values from the referrals
        const playerIds = referrals.map(referral => referral.playerId);

        // Find all users whose IDs are in the playerIds where role is masteragent array
        const masteragents = await User.findAll({
          attributes: ["id"], 
          where: {
            id: playerIds,
            role: "masteragent"
          }
        });
        const masteragentIds = masteragents.map(masteragent => masteragent.id);
        const playersOfMasteragents = await Referral.findAll({ attributes: ["playerId"], where: { inviterId:masteragentIds } });
        

         // Find all users whose IDs are in the playerIds where role is agents array
         const agents = await User.findAll({
          attributes: ["id"], 
          where: {
            id: playerIds,
            role: 'agent'  // Add the condition for role
          }
        });
        const agentIds = agents.map(agent => agent.id);
        const playersOfAgents = await Referral.findAll({ attributes: ["playerId"], where: { inviterId:agentIds } });

        const mergePlayersOfMasteragentAndAgents = [
          ...playersOfMasteragents,
          ...playersOfAgents
        ];

        whereConditions.id = mergePlayersOfMasteragentAndAgents.map(
          (player:any) => player.playerId
        );

      } else {
        whereConditions[columnFilter] = { [Op.like]: `%${decodedValue}%` };
        whereConditions.deletedAt = null;
      }

      if(provinceId !== ""){
        if(usePresent === "1"){
          whereConditionsProvinceCur[Op.or] = { provinceId };
        }else{
          whereConditionsProvincePerma[Op.or] = { provinceId };
        }
      }
      if(cityId !== ""){
        if(usePresent === "1"){
          whereConditionsProvinceCur[Op.or] = { cityId };
        }else{
          whereConditionsProvincePerma[Op.or] = { cityId };
        }
      }
      if(barangayId !== ""){
        if(usePresent === "1"){
          whereConditionsProvinceCur[Op.or] = { barangayId };
        }else{
          whereConditionsProvincePerma[Op.or] = { barangayId };
        }
      }
    };
  }


  const options: FindOptions = {
    attributes: [
      "id",
      "uuid",
      [
        Sequelize.fn(
          "CONCAT",
          Sequelize.col("firstName"),
          " ",
          Sequelize.col("lastName")
        ),
        "fullName",
      ],
      "firstName",
      "lastName",
      "nickName",
      "role",
      "email",
      "accountId",
      "birthdate",
      "placeOfBirth",
      "nationalities",
      "natureOfWork",
      "sourceOfIncome",
      "sourceOfIncomeId",
      "gender",
      "address",
      "profilePicture",
      "mobile",
      "isMobileVerified",
      "actionStatus",
      [
        Sequelize.literal(
          `(SELECT CONCAT(firstName, ' ', lastName) FROM users AS Supervisor WHERE Supervisor.uuid = User.supervisorWhoApprove)`
        ),
        "supervisorWhoApproveName",
      ],
      [
        Sequelize.literal(
          `(SELECT CONCAT(firstName, ' ', lastName) FROM users AS Verifier WHERE Verifier.uuid = User.verifierWhoApprove)`
        ),
        "verifierWhoApproveName",
      ],
      [
        Sequelize.literal(
          `(SELECT CONCAT(firstName, ' ', lastName) FROM users AS Person WHERE Person.uuid = User.personWhoDeactivated)`
        ),
        "personWhoDeactivated",
      ],
      [
        Sequelize.literal(
          `(SELECT CONCAT(firstName, ' ', lastName) FROM users AS Person WHERE Person.uuid = User.personWhoDenied)`
        ),
        "personWhoDeniedName",
      ],
      [
        Sequelize.literal(
          `(SELECT CONCAT(firstName, ' ', lastName) FROM users AS Person WHERE Person.uuid = User.adminWhoDeactivated)`
        ),
        "adminWhoDeactivatedName",
      ],
      [
        Sequelize.literal(
          `(SELECT CONCAT(firstName, ' ', lastName) FROM users AS Person WHERE Person.uuid = User.adminWhoRestore)`
        ),
        "adminWhoRestoreName",
      ],
      [
        Sequelize.literal(
          `(SELECT role FROM users AS Person WHERE Person.uuid = User.personWhoDeactivated)`
        ),
        "personWhoDeactiveRole",
      ],
      [
        Sequelize.literal(
          `(SELECT role FROM users AS Person WHERE Person.uuid = User.personWhoDenied)`
        ),
        "personWhoDeniedRole",
      ],
      "isSupervisorApproved",
      "supervisorWhoApprove",
      "verifierApprovedAt",
      "supervisorApprovedAt",
      "isVerifierApproved",
      "isDeactivated",
      "isDenied",
      "actionStatus",
      "deactivatedReasonByAdmin",
      "restoreReasonByAdmin",
      "deactivatedReason",
      "deniedReason",
      "deactivatedAt",
      "deniedAt",
      "createdAt",
      "updatedAt",
      "deactivatedAtByAdmin",
      "restoreAtByAdmin",
      "commission",
      "govtType",
      "govtId",
      "govtPicture",
      "govtIdPicture",
      "referralLinkForMA",
      "referralLinkForAgent",
      "status",
    ],
    where: whereConditions,
    include: [
      {
        model: UserGroup,
        as: "child",
        attributes: [
          [
            Sequelize.literal(
              `(SELECT CONCAT(firstName, ' ', lastName) FROM users AS Users WHERE Users.id = child.childId)`
            ),
            "fullName",
          ],
          ["childId", "id"],
        ],
      },
      {
        model: UserGroup,
        as: "parent",
      },
      {
        model: Address,
        as: "currentAddress",
        attributes: ["barangayId","cityId","provinceId","street", "zipCode"],
        required: filterAddress, // Include users even if they don't have a current address
        where:whereConditionsProvinceCur,
        include: [
          { model: Province, as: "province", attributes: ["id", "name"] },
          { model: City, as: "city", attributes: ["id", "name"] },
          { model: Barangay, as: "barangay", attributes: ["id", "name"] },
        ],
      },
      {
        model: Address,
        as: "permanentAddress",
        attributes: ["barangayId","cityId","provinceId","street", "zipCode"],
        required: filterAddress, // Include users even if they don't have a current address
        where:whereConditionsProvincePerma,
        include: [
          { model: Province, as: "province", attributes: ["id", "name"] },
          { model: City, as: "city", attributes: ["id", "name"] },
          { model: Barangay, as: "barangay", attributes: ["id", "name"] },
        ],
      },
      {
        model: Wallet,
        attributes: ["balance"],
        include: [
          {
            model: Transaction,
            attributes: [], // No attributes needed from Transaction, just the filter
            required: filterGame,
            include: [
              {
                model: Game,
                attributes: [], // No attributes needed from Game
                where: filterGame ? whereConditionsTrans : {}, // Apply filter on game_id here
              }
            ],  
          }
        ],  
        required: filterGame,
      },
      {
        model: SourceOfIncome,
        attributes: ["id", "name"],
      },
      {
        model: Site,
        attributes: ["id", "label"],
      },
    ],
    order: [["createdAt", "DESC"]],
  };

  const users = await User.findAll(options);

  const payload = {
    content: users,
  };

  if (users) {
    return successResponse(
      payload,
      "Get All users is successfully fetched!",
      reply
    );
  } else {
    return errorResponse("All users not found", reply, "custom");
  }
}

const addUser = async (request, reply) => {
  const authId = request.user.id;
  const { 
    mobile, 
    firstName, 
    lastName, 
    gender, 
    username, 
    password, 
    role, 
    site,
    siteId, 
    isOperatorWithSite, 
    operatorsWithSite 
  } = request.body;

  let hashedPassword = null
  if(password){
    hashedPassword = await argon2.hash(password);
  }

  const payload = {
    mobile,
    username: username === "" ? null : username,
    firstName,
    lastName,
    password: hashedPassword,
    email: null,
    gender,
    siteId,
    role,
    isOperatorWithSite
  };

   let user = await User.findOne({
    where: { mobile },
  });

  if (user) {
    const msgErr = "Your mobile no. is already registered";
    return errorResponse(msgErr, reply, "custom");
  }

  await User.create(payload)
    .then(async (user) => {
      await Wallet.create({
        user_id: user.id,
      });

      if(operatorsWithSite){
        const { id:operatorId } = operatorsWithSite

        const operatorModel = await User.findOne({ where: { uuid:operatorId }})
          const userNameVal = `${user.firstName} ${user.lastName}`
          const operatorNameVal = `${operatorModel.firstName} ${operatorModel.lastName}`
          let titleMes = ""
          let logBodyMes = ""
          let logDescMes = ""
          let commission = 0
        
          if(user.role === ROLES.CASHIER.name){
            titleMes = "A new cashier has been added to your users list"
            logBodyMes =  `${userNameVal} (cashier) has been added to ${operatorNameVal} users list.`,
            logDescMes = 'Cashier Added on Masteragent'
            commission = 0
          }else if(user.role === ROLES.PLAYER.name){
            titleMes = "A new player has been added to your users list"
            logBodyMes =  `${userNameVal} (player) has been added to ${operatorNameVal} users list.`,
            logDescMes = 'Player Added on Masteragent'
            commission = 3 
          }

          Referral.create({
            inviterId: operatorModel?.id,
            playerId: user.id,
            commission,
            userType: "site"
          })
          .then(async () => {
            await makeNotif(
              operatorModel?.id,
              titleMes,
              `${userNameVal} has been added to your users list.`,
              "referral",
              "info",
              operatorId
            );

            await makeLog(
              logBodyMes,
              "create",
              "info",
              user.id,
              "referral",
              logDescMes
            );
          })
          .catch((error) => {
            return errorResponse(error, reply, "custom");
          });
      }

      const birthdate = dayjs().subtract(21, "day").format("YYYY-MM-DD");

      const nicknameUserId = user.id;
      const nickName = getNickname(
        firstName,
        lastName,
        birthdate,
        mobile,
        nicknameUserId
      );

      await User.update({
          nickName,
          createdBy: authId,
        },{ where: { id: user.id }}
      );


      await makeLog(
        `A new user has been added. Details ${JSON.stringify(payload)}`,
        "profile",
        "info",
        user.id,
        "user"
      );

      return successResponse({}, "User added successfully!", reply);
    })
    .catch((err) => {
      return errorResponse(err, reply);
    });
};

const updateUser = async (request, reply) => {
  const uuid = request.params.id; // Get user ID from URL params
  const { 
    mobile, 
    firstName, 
    lastName, 
    username, 
    password, 
    gender, 
    siteId, 
    role, 
    userGroups, 
    commission, 
    isOperatorWithSite, 
    //operatorsWithSite 
  } =
    request.body;

  const hashedPassword = await argon2.hash(password);

  const user = await User.findOne({
    attributes: [
      "id",
      "mobile",
      "firstName",
      "lastName",
      "email",
      "username",
      "siteId",
      "role",
      "commission",
    ],
    where: { uuid },
  });
  //  @ts-ignore
  const { id, ...rest } = user.toJSON();

  let isMobileVerified = user.isMobileVerified;
  if (mobile !== user.mobile) {
    isMobileVerified = 0;
  }

  const payload = {
    mobile,
    firstName,
    lastName,
    email:null,
    username,
    password: password === "" ? null : hashedPassword,
    siteId,
    gender,
    role,
    commission,
    isMobileVerified,
    isOperatorWithSite
  };

  // For Receiving Notification from supervisor
  const userGroupsIds = userGroups.map(group => group.id);
  const existingUserGroups = await UserGroup.findAll({
    where: {
      childId: userGroupsIds 
    }
  });
  const existingIds = existingUserGroups.map((group:any) => group.childId);
  const parentChilds = await UserGroup.findAll({
    where: {
      parentId: id 
    }
  });

  const groupsToAdd = userGroups.filter(group => !existingIds.includes(group.id));

  const groupsToDelete = parentChilds.filter((group:any) => !existingIds.includes(group.childId));

  if (groupsToDelete.length > 0) {
    const groupsToDeleteData = groupsToDelete?.map(async (group:any) => {
      return UserGroup.destroy({
        where: {
          parentId: id,
          childId: group.childId,
          type: "notification" 
        }
      });
    });
    await Promise.all(groupsToDeleteData);
  }

  if (groupsToAdd.length > 0) {
    const groupsToAddData = groupsToAdd.map((group:any) => {
      return UserGroup.create({
        parentId: id,
        childId: group.id,
        type: "notification"
      });
    });
    await Promise.all(groupsToAddData);
  }
  // End of For Receiving Notification from supervisor

  const logs = findChangedValues(payload, rest);
  if (logs.length > 0) {
    await makeLog(
      `The user has been updated. Details ${logs}`,
      "profile",
      "info",
      id,
      "user"
    );
  }

  // if(operatorsWithSite){
  //   const { id:operatorId } = operatorsWithSite

  //   const operatorModel = await User.findOne({ where: { uuid:operatorId }})
  //     const userNameVal = `${user.firstName} ${user.lastName}`
  //     const operatorNameVal = `${operatorModel.firstName} ${operatorModel.lastName}`
  //     let titleMes = ""
  //     let logBodyMes = ""
  //     let logDescMes = ""
  //     let commission = 0
    
  //     if(user.role === ROLES.CASHIER.name){
  //       titleMes = "A new cashier has been added to your users list"
  //       logBodyMes =  `${userNameVal} (cashier) has been added to ${operatorNameVal} users list.`,
  //       logDescMes = 'Cashier Added on Masteragent'
  //       commission = 0
  //     }else if(user.role === ROLES.PLAYER.name){
  //       titleMes = "A new player has been added to your users list"
  //       logBodyMes =  `${userNameVal} (player) has been added to ${operatorNameVal} users list.`,
  //       logDescMes = 'Player Added on Masteragent'
  //       commission = 3 
  //     }

  //     Referral.create({
  //       inviterId: operatorModel?.id,
  //       playerId: user.id,
  //       commission,
  //       userType: "site"
  //     })
  //     .then(async () => {
  //       await makeNotif(
  //         operatorModel?.id,
  //         titleMes,
  //         `${userNameVal} has been added to your users list.`,
  //         "referral",
  //         "info",
  //         operatorId
  //       );

  //       await makeLog(
  //         logBodyMes,
  //         "create",
  //         "info",
  //         user.id,
  //         "referral",
  //         logDescMes
  //       );
  //     })
  //     .catch((error) => {
  //       return errorResponse(error, reply, "custom");
  //     });
  // }

  await User.update(payload, {
    // @ts-ignore
    attributes: [
      "id",
      "mobile",
      "firstName",
      "lastName",
      "email",
      "username",
      "siteId",
      "role",
      "commission",
    ],
    where: { uuid },
    returning: true,
  })
    .then(async () => {
      return successResponse({}, "User updated successfully!", reply);
    })
    .catch((err) => {
      return errorResponse(err, reply);
    });
};

const uploadUserImage = async (request, reply) => {
  const id = request.user.id;
  const uuid = request.params.id;
  const type = request.params.type;
  const parts = request.files();
  const kycImageType = type === "user" ? "profile-pictures" : "govt-pictures"
  const uploadDir = path.join(storage, 'public', 'uploads', 'images', kycImageType, uuid);

  // Ensure the directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const user = await User.findOne({
    attributes: ["profilePicture", "mobile", "govtPicture", "govtIdPicture"],
    where: { uuid },
  });

  if (!user) {
    return errorResponse("User not found", reply, "custom");
  }

  const { govtIdPicture, govtPicture, profilePicture, mobile } = user;

  if (type === "user") {
    if (profilePicture) {
      const existingFilePath = path.join(uploadDir, profilePicture);

      if (fs.existsSync(existingFilePath)) {
        try {
          fs.unlinkSync(existingFilePath);
        } catch (err) {
          console.error('Error deleting file:', err);
          reply.status(500).send('Failed to delete old image');
          return;
        }
      }
    }

    for await (const part of parts) {
      if (part.file) {
        const fileExtension = part.filename.split(".").pop();

        if (fileExtension !== "jpg" && fileExtension !== "png") {
          return errorResponse("Accept only image", reply, "custom");
        }

        const uniqueFilename = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 15)}.${fileExtension}`;
      
        const filePath = path.join(uploadDir, uniqueFilename);

        try {
          await pump(
            part.file,
            fs.createWriteStream(filePath)
          );
        } catch (err) {
          console.error('Error writing file:', err);
          reply.status(500).send('Failed to upload image');
          return;
        }
       
        const payload = { profilePicture: uniqueFilename };
        const logs = findChangedValues({ profilePicture }, payload);

        await makeLog(
          `The user picture id with selfie of ${mobile} has been uploaded. ${logs}`,
          "profile",
          "info",
          id,
          "user"
        );

        await User.update(payload, { where: { uuid } });

        return successResponse(
          uniqueFilename,
          "User user picture uploaded successfully!",
          reply
        );
      }
    }
  } else if (type === "govt") {
    if (govtPicture) {
      const existingFilePath = path.join(uploadDir, govtPicture);

      if (fs.existsSync(existingFilePath)) {
        try {
          fs.unlinkSync(existingFilePath);
        } catch (err) {
          console.error('Error deleting file:', err);
          reply.status(500).send('Failed to delete old image');
          return;
        }
      }
    }

    for await (const part of parts) {
      if (part.file) {
        const fileExtension = part.filename.split(".").pop();
        const uniqueFilename = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 15)}.${fileExtension}`;
      
        const filePath = path.join(uploadDir, uniqueFilename);

        try {
          await pump(
            part.file,
            fs.createWriteStream(filePath)
          );
        } catch (err) {
          console.error('Error writing file:', err);
          reply.status(500).send('Failed to upload image');
          return;
        }
       
        const payload = { govtPicture: uniqueFilename };
        const logs = findChangedValues({ govtPicture }, payload);

        await makeLog(
          `The user government id with selfie of ${mobile} has been uploaded. ${logs}`,
          "profile",
          "info",
          id,
          "user"
        );

        await User.update(payload, { where: { uuid } });

        return successResponse(
          uniqueFilename,
          "User government id with selfie uploaded successfully!",
          reply
        );
      }
    }
  } else if (type === "govtIdPic") {
    if (govtIdPicture) {
      const existingFilePath = path.join(uploadDir, govtIdPicture);

      if (fs.existsSync(existingFilePath)) {
        try {
          fs.unlinkSync(existingFilePath);
        } catch (err) {
          console.error('Error deleting file:', err);
          reply.status(500).send('Failed to delete old image');
          return;
        }
      }
    }
 
    for await (const part of parts) {
      // Check if the part is a file
      if (part.file) {
        const fileExtension = part.filename.split(".").pop();
        const uniqueFilename = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 15)}.${fileExtension}`;
      
        const filePath = path.join(uploadDir, uniqueFilename);

        try {
          await pump(
            part.file,
            fs.createWriteStream(filePath)
          );
        } catch (err) {
          console.error('Error writing file:', err);
          reply.status(500).send('Failed to upload image');
          return;
        }
       
        const payload = { govtIdPicture: uniqueFilename };
        const logs = findChangedValues({ govtIdPicture }, payload);

        await makeLog(
          `The user government id of ${mobile} has been uploaded. ${logs}`,
          "profile",
          "info",
          id,
          "user"
        );

        await User.update(payload, { where: { uuid } });

        return successResponse(
          uniqueFilename,
          "User Gov't. id is now uploaded successfully!",
          reply
        );
      }
    }
  }
};

const deactivateUser = async (request, reply) => {
  const { id: uuid, adminId, reason, type } = request.body;
  const user = await User.findOne({
    attributes: ["id", "mobile"],
    where: { uuid },
  });

  if (!user) {
    return errorResponse("User not found", reply, "custom");
  }
  const { id, mobile } = user;

  await User.update({ 
    status:'deactivated', 
    adminWhoDeactivated: adminId,
    deactivatedReasonByAdmin: reason,
    deactivatedAtByAdmin: new Date(),
    adminWhoRestore: null,
    restoreReasonByAdmin: null,
    restoreAtByAdmin: null
  }, 
  { where: { uuid } 
  }).then(async () => {
      await makeLog(
        `The user of ${mobile} has been deactivated`,
        "user-management",
        "info",
        id,
        "user",
        reason
      );
      return successResponse({}, "User deactivated successfully!", reply);
  })
  .catch((err) => {
    return errorResponse(err, reply);
  });
};

const restoreUser = async (request, reply) => {
  const { id: uuid, adminId, reason, type } = request.body;
  const user = await User.findOne({
    attributes: ["id", "mobile"],
    where: { uuid },
  });

  if (!user) {
    return errorResponse("User not found", reply, "custom");
  }
  const { id, mobile } = user;

  await User.update({
    status:'active', 
    adminWhoRestore: adminId,
    restoreReasonByAdmin: reason,
    restoreAtByAdmin: new Date(),
    adminWhoDeactivated: null,
    deactivatedReasonByAdmin: null,
    deactivatedAtByAdmin: null,
   }, { where: { uuid } })
    .then(async () => {
      await makeLog(
        `The user of ${mobile} has been restore`,
        "user-management",
        "info",
        id,
        "user",
        reason
      );
      return successResponse({}, "User restore successfully!", reply);
    })
    .catch((err) => {
      return errorResponse(err, reply);
    });
};

const getUserProfile = async (request, reply) => {
  canAccessGame(request.userRole, reply)
  const uuid = request.user.uuid;


  const user = await User.findOne({
    attributes: [
      "id",
      "firstName",
      "lastName",
      "status",
      "nickName",
      "birthdate",
      "gender",
      "role",
      "address",
      "email",
      "profilePicture",
      "mobile",
      "accountId",
      "govtType",
      "govtId",
      "govtPicture",
      "govtIdPicture",
      // added
      "referralCodeForSA",
      "referralLinkForSA",
      "referralCodeForMA",
      "referralLinkForMA",
      "referralCodeForAgent",
      "referralLinkForAgent",
      "referralCodeForPlayer",
      "referralLinkForPlayer",
      "isSupervisorApproved",
      "isVerifierApproved",
      "isDeactivated",
      "isDenied",
      "actionStatus",
      "isKYC",
      "passcode",
      "createdAt",
    ],
    include: [
      {
        model: Wallet,
        attributes: ["balance"],
      },
      { // Use to enable Agent and Masteragent Referral QR Code
        model: Referral,
        as: "DirectPlayer"
      },
    ],
    where: { uuid },
  });

  const isKYCExpire = expireKYC(user?.createdAt, user?.isKYC)

  const totalCount = await Notification.count({
    include: [
      {
        model: User,
        as: "user",
        where: { uuid }, // Filter by userId in the User model
      },
    ],
    where: { isRead: false },
  });

  // Check if user is found
  if (user) {
    const userData = { ...user.toJSON(),  notification: { totalCount } };
    const { Wallet } = user

    const transaction = await Transaction.findOne({ 
      attributes:["amount","type"],
      where:{ wallet_id: user?.id, type: DEPOSIT }, 
      limit:1, 
      order: [['createdAt', 'ASC']] 
    })

    const userPromosModel = await UserPromo.findAll({
      where: { userId: user?.id },
      include: [{
        model: Promo,
        where: { type: PROMO }
      }],
    })

    const transactions = await Transaction.findAll({
      include:[
        { model: WinningBets },
        { model: LosingBets },
      ],
      where: {
        wallet_id: user?.id,
        type: {
          [Op.in]: ["wonprize", "losebet"],
        },
      }
    })

    let transactionSum = 0
    for (const transaction of transactions){
      if(transaction.type === "losebet"){
        transactionSum += transaction.LosingBet?.betAmount || 0
      }
      if(transaction.type === "wonprize"){
        transactionSum += transaction.WinningBet?.betAmount || 0
      } 
    }

    let getTotalAmount = 0; 
    let userPromoUnclaim = []
    for (const userPromo of userPromosModel) {
      const amount = userPromo?.Promo?.amount;
      const turnOverMultiplyier = userPromo?.Promo?.turnOverMultiplyier;
      const turnOverAmount = (Number(amount) * turnOverMultiplyier)

      // this is for getting if there is promo turnover not yet finish
      if(Number(transactionSum) < Number(turnOverAmount)){
        if(userPromo?.isDeposited){
          getTotalAmount += Number(amount); // Shortened syntax
        }
      }

      // this is for getting unclaim promo use in popup in frontend
      if(!userPromo?.isDeposited){
        userPromoUnclaim.push({
          id:userPromo?.Promo?.id,
          name:userPromo?.Promo?.name
        })
      }
    }

    const balanceVar = Wallet?.balance || 0.00

    userData.Wallet = {
      balance:balanceVar,
      Transaction:transaction
    }

    const userPromos = {
      totalAmount:getTotalAmount
    }

    userData.UserPromos = userPromosModel.length > 0 ? userPromos : null
    userData.UserPromosUnclaim = userPromosModel.length > 0 ? userPromoUnclaim : null
    userData.userPromoClaimed = userPromosModel
    userData.id = uuid
    userData.isKYCExpire = isKYCExpire

    return successResponse(
      userData,
      "The User Profile Successfully Fetch!",
      reply
    );
  } else {
    // Handle case where user is not found
    return errorResponse("User not found", reply, "custom");
  }
};

// Helper function to safely parse JSON
const parseJSON = (data: any) => {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(`Error parsing JSON: ${e}`);
      return null; // Return null or handle accordingly if JSON parsing fails
    }
  } else {
    return data; // Return as is if it's already an object
  }
};

const getKYCAttempts = async (request, reply) => {
  const { page, size, sort, filter, status } = request.query;
  let whereConditions = {} as any; // Define whereConditions as any type
  
  whereConditions.userId = {}

  if (filter) {
    // Split the filter string by '&' to get individual filter conditions
    const filterConditions = filter.split("&");

    for (const condition of filterConditions) {
      const [columnFilter, valueFilter] = condition.split("=");
      const decodedValue = decodeURIComponent(valueFilter);

      if (columnFilter === "userId") {
        if (!decodedValue) {
          return errorResponse("User ID cannot be null or empty", reply, "custom");
        }
        whereConditions.userId = decodedValue;
      }
    }
  }

  const offset = page * size;

  let options: FindOptions = {
    attributes: ["transactionId","isInitialize", "isCheckResult", "ekycResult", "extBasicInfo", "extFaceInfo", "extIdInfo", "createdAt"],
    where: whereConditions,
    offset,
    limit: size,
    order: [["createdAt", "DESC"]],
  };

  try {
    const zolozTransaction = await ZolozTransaction.findAll(options);
    const totalCount = await ZolozTransaction.count(options);

    // Map over the transactions to parse the JSON fields
    const content = zolozTransaction.map((transaction: any) => {
      const extBasicInfo = parseJSON(transaction?.extBasicInfo);
      const extFaceInfo = parseJSON(transaction?.extFaceInfo);
      const extIdInfo = parseJSON(transaction?.extIdInfo);

      return {
        transactionId: transaction?.transactionId,
        isInitialize: transaction?.isInitialize,
        isCheckResult: transaction?.isCheckResult,
        ekycResult: transaction?.ekycResult,
        extBasicInfo,
        extFaceInfo,
        extIdInfo,
      };
    });

    const payload = {
      content,
      totalCount,
    };

      return successResponse(
        payload,
        "Get All KYC Attempts is successfully fetched!",
        reply
      );
  
  } catch (error) {
    return errorResponse(
      `Error on getting KYC Attempts: ${error}`,
      reply,
      "custom"
    );
  }
};

const getUserAdminProfile = async (request, reply) => {
  canAccessAdmin(request.userRole, reply)
  const uuid = request.user.uuid;

  const user = await User.findOne({
    attributes: [
      "id",
      "firstName",
      "lastName",
      "nickName",
      "birthdate",
      "gender",
      "role",
      "address",
      "email",
      "profilePicture",
      "mobile",
      "accountId",
      "govtType",
      "govtId",
      "govtPicture",
      "govtIdPicture",
      // added
      "referralCodeForSA",
      "referralLinkForSA",
      "referralCodeForMA",
      "referralLinkForMA",
      "referralCodeForAgent",
      "referralLinkForAgent",
      "referralCodeForPlayer",
      "referralLinkForPlayer",
      "isSupervisorApproved",
      "isVerifierApproved",
      "isDeactivated",
      "isDenied",
      "actionStatus",
      "isKYC",
      "passcode",
      "createdAt"
    ],
    include: [
      {
        model: Wallet,
        attributes: ["balance"],
      },
      { // Use to enable Agent and Masteragent Referral QR Code
        model: Referral,
        as: "DirectPlayer"
      },
    ],
    where: { uuid },
  });

  const isKYCExpire = expireKYC(user?.createdAt, user?.isKYC)

  const totalCount = await Notification.count({
    include: [
      {
        model: User,
        as: "user",
        where: { uuid }, // Filter by userId in the User model
      },
    ],
    where: { isRead: false },
  });

  // Check if user is found
  if (user) {
    const userData = { ...user.toJSON(),  notification: { totalCount } };
    const { Wallet } = user

    const transaction = await Transaction.findOne({ 
      attributes:["amount","type"],
      where:{ wallet_id: user?.id, type: DEPOSIT }, 
      limit:1, 
      order: [['createdAt', 'ASC']] 
    })

    const userPromosModel = await UserPromo.findAll({
      where: { userId: user?.id },
      include: [{
        model: Promo,
        where: { type: PROMO }
      }],
    })

    const transactions = await Transaction.findAll({
      include:[
        { model: WinningBets },
        { model: LosingBets },
      ],
      where: {
        wallet_id: user?.id,
        type: {
          [Op.in]: ["wonprize", "losebet"],
        },
      }
    })

    let transactionSum = 0
    for (const transaction of transactions){
      if(transaction.type === "losebet"){
        transactionSum += transaction.LosingBet?.betAmount || 0
      }
      if(transaction.type === "wonprize"){
        transactionSum += transaction.WinningBet?.betAmount || 0
      } 
    }

    let getTotalAmount = 0; 
    let userPromoUnclaim = []
    for (const userPromo of userPromosModel) {
      const amount = userPromo?.Promo?.amount;
      const turnOverMultiplyier = userPromo?.Promo?.turnOverMultiplyier;
      const turnOverAmount = (Number(amount) * turnOverMultiplyier)

      // this is for getting if there is promo turnover not yet finish
      if(Number(transactionSum) < Number(turnOverAmount)){
        if(userPromo?.isDeposited){
          getTotalAmount += Number(amount); // Shortened syntax
        }
      }

      // this is for getting unclaim promo use in popup in frontend
      if(!userPromo?.isDeposited){
        userPromoUnclaim.push({
          id:userPromo?.Promo?.id,
          name:userPromo?.Promo?.name
        })
      }
    }

    const balanceVar = Wallet?.balance || 0.00

    userData.Wallet = {
      balance:balanceVar,
      Transaction:transaction
    }

    const userPromos = {
      totalAmount:getTotalAmount
    }

    userData.UserPromos = userPromosModel.length > 0 ? userPromos : null
    userData.UserPromosUnclaim = userPromosModel.length > 0 ? userPromoUnclaim : null
    userData.userPromoClaimed = userPromosModel
    userData.id = uuid
    userData.isKYCExpire = isKYCExpire

    return successResponse(
      userData,
      "The User Profile Successfully Fetch!",
      reply
    );
  } else {
    // Handle case where user is not found
    return errorResponse("User not found", reply, "custom");
  }
}

const updateUserProfile = async (request, reply) => {
  const id = request.user.id;
  const uuid = request.user.uuid;
  const oldUser = await User.findOne({
    where: { uuid },
    attributes: ["currentAddressId", "permanentAddressId", "nickNameExpiration", "nickName"],
  });

  const { currentAddressId, permanentAddressId, nickNameExpiration } = oldUser;
  const {
    mobile,
    firstName,
    lastName,
    email,
    gender,
    birthdate,
    placeOfBirth,
    nationalities,
    natureOfWork,
    sourceOfIncome,
    sourceOfIncomeId,
    address,
    govtId,
    govtType,
    permanentAddresses,
    currentAddresses,
    usePresentAddress,
    nickName,
    module
  } = request.body;



  const userExist = await User.findOne({
    where: { nickName }
  });

  if(userExist?.nickName === nickName && userExist?.uuid !== uuid){
    return errorResponse(`Oops! This nickname is already taken. Please choose a different one.`, reply, "validation", "nickName");
  }

  if (new Date() < new Date(nickNameExpiration) && nickNameExpiration !== null) {
    return errorResponse(`You can only change your nickname once every 30 days.`, reply, "validation", "nickName");
  }

  const otpMaxEntriesExpiration = moment().add(1, 'month').toISOString();
  
  if(module === USER_PROFILE){
    const payloadBody = {
      firstName,
      lastName,
      nickName,
      nickNameExpiration: userExist?.uuid !== uuid ? otpMaxEntriesExpiration : null,
      birthdate,
    };

    try{
      await User.update(payloadBody, {
        where: { uuid },
      });

      await makeLog(
        `The profile of ${mobile} has been updated`,
        "profile",
        "info",
        id,
        "user"
      );

      const updatedUser = await User.findOne({
        attributes: [
          "firstName",
          "lastName",
          "nickName",
          "birthdate",
        ],
        where: { uuid },
      });

      const logs = findChangedValues(updatedUser, oldUser);
      if (logs.length > 0) {
      await makeLog(
        `The profile of ${mobile} has been updated. ${logs}`,
        "profile",
        "info",
        id,
        "user"
      );
      }
  
      return successResponse(
        updatedUser,
        "Your Profile updated successfully!",
        reply
      );
    } catch (err) {
      return errorResponse(err, reply);
    }
  }else if (module === KYC){
      const {
        street: perStreet,
        provinceId: perProvinceId,
        cityId: perCityId,
        barangayId: perBarangayId,
        zipCode: perZipCode,
      } = permanentAddresses;
      const {
        street: curStreet,
        provinceId: curProvinceId,
        cityId: curCityId,
        barangayId: curBarangayId,
        zipCode: curZipCode,
      } = currentAddresses;

      const addressPerma = await User.count({
        include: [
          {
            model: Address,
            as: "permanentAddress",
            attributes: [],
            where: { id: permanentAddressId },
          },
        ],
      });
      let permanentAddress: any = null;
      if (addressPerma === 0) {
        permanentAddress = await Address.create({
          street: perStreet,
          provinceId: perProvinceId,
          cityId: perCityId,
          barangayId: perBarangayId,
          zipCode: perZipCode,
        });
      } else {
        permanentAddress = await Address.update(
          {
            street: perStreet,
            provinceId: perProvinceId,
            cityId: perCityId,
            barangayId: perBarangayId,
            zipCode: perZipCode,
          },
          { where: { id: permanentAddressId } }
        );
      }

      const addressCur = await User.count({
        include: [
          {
            model: Address,
            as: "currentAddress",
            attributes: [],
            where: { id: currentAddressId },
          },
        ],
      });
      let currentAddress: any = null;
      if (addressCur === 0) {
        currentAddress = await Address.create({
          street: curStreet,
          provinceId: curProvinceId,
          cityId: curCityId,
          barangayId: curBarangayId,
          zipCode: curZipCode,
        });
      } else {
        currentAddress = await Address.update(
          {
            street: curStreet,
            provinceId: curProvinceId,
            cityId: curCityId,
            barangayId: curBarangayId,
            zipCode: curZipCode,
          },
          { where: { id: currentAddressId } }
        );
      }

      const payloadBody = {
        firstName,
        lastName,
        mobile,
        email,
        gender: parseInt(gender),
        birthdate,
        placeOfBirth,
        nationalities,
        natureOfWork,
        sourceOfIncome,
        sourceOfIncomeId,
        address,
        govtId,
        govtType,
        currentAddressId: currentAddress?.id,
        permanentAddressId: permanentAddress?.id,
        usePresentAddress,
      };

      try {
        await User.update(payloadBody, {
          //  @ts-ignore
          where: { uuid },
        });

        const uuid2 = request.user.uuid;
        const updatedUser = await User.findOne({
          attributes: [
            ["uuid", "id"],
            "firstName",
            "lastName",
            "mobile",
            "email",
            "gender",
            "birthdate",
            "placeOfBirth",
            "nationalities",
            "natureOfWork",
            "sourceOfIncome",
            "sourceOfIncomeId",
            "address",
            "role",
            "govtId",
            "govtType",
            "usePresentAddress",
          ],
          where: { uuid: uuid2 },
          include: [
            {
              model: Address,
              as: "currentAddress",
              attributes: ["street", "zipCode"],
              include: [
                { model: Province, as: "province", attributes: ["id", "name"] },
                { model: City, as: "city", attributes: ["id", "name"] },
                { model: Barangay, as: "barangay", attributes: ["id", "name"] },
              ],
            },
            {
              model: Address,
              as: "permanentAddress",
              attributes: ["street", "zipCode"],
              include: [
                { model: Province, as: "province", attributes: ["id", "name"] },
                { model: City, as: "city", attributes: ["id", "name"] },
                { model: Barangay, as: "barangay", attributes: ["id", "name"] },
              ],
            },
          ],
        });

        // const logs = findChangedValues({}, oldUser);
        // if (logs.length > 0) {
        await makeLog(
          `The profile of ${mobile} has been updated`,
          "profile",
          "info",
          id,
          "user"
        );
        // }

        return successResponse(
          updatedUser,
          "Your Profile updated successfully!",
          reply
        );
      } catch (err) {
        return errorResponse(`Error updating profile: ${err}`, reply, "custom");
      }
  }
};

const generateReferral = async (request, reply) => {
  const id = request.user.id;
  const base_url = `${FRONTEND_URL}/register`;
  const referralCode = generateReferralCode();
  const user = await User.findOne({
    where: { id },
  });
  const { role } = user;
  let link = "";
  let code = "";
  let payload = {};
  if (role === ROLES.SUPERAGENT.name) {
    payload = {
      referralLinkForSA: `${base_url}?ref=SA-${referralCode}-${id}`,
      referralCodeForSA: `SA-${referralCode}-${id}`,
      referralLinkForAgent: `${base_url}?ref=A-${referralCode}-${id}`,
      referralCodeForAgent: `A-${referralCode}-${id}`,
    };
  } else if (role === ROLES.MASTERAGENT.name) {
    payload = {
      referralLinkForMA: `${base_url}?ref=MA-${referralCode}-${id}`,
      referralCodeForMA: `MA-${referralCode}-${id}`,
      referralLinkForAgent: `${base_url}?ref=A-${referralCode}-${id}`,
      referralCodeForAgent: `A-${referralCode}-${id}`,
    };
  } else if (role === ROLES.AGENT.name) {
    payload = {
      referralLinkForAgent: `${base_url}?ref=A-${referralCode}-${id}`,
      referralCodeForAgent: `A-${referralCode}-${id}`,
    };
  } else if (role === ROLES.PLAYER.name) {
    payload = {
      referralLinkForPlayer: `${base_url}?ref=P-${referralCode}-${id}`,
      referralCodeForPlayer: `P-${referralCode}-${id}`,
    };
  }
  try {
    await User.update(payload, {
      where: { id },
    });

    const updatedUser = await User.findOne({
      attributes: [
        ["uuid", "id"],
        "referralCodeForSA",
        "referralLinkForSA",
        "referralCodeForMA",
        "referralLinkForMA",
        "referralCodeForAgent",
        "referralLinkForAgent",
        "referralCodeForPlayer",
        "referralLinkForPlayer",
      ],
      where: { id },
    });

    return successResponse(
      updatedUser,
      `Referral Code and Link has been generated`,
      reply
    );
  } catch (error) {
    return errorResponse(
      `Error generating code and link: ${error}`,
      reply,
      "custom"
    );
  }
};

const kycFinish = async (request, reply) => {
  const id = request.user.id;
  try {
    await User.update(
      {
        isKYC: FOR_APPROVAL,
        actionStatus: "new",
        isSupervisorApproved: false,
        supervisorWhoApprove: null,
        supervisorApprovedAt: null,

        isVerifierApproved: false,
        verifierWhoApprove: null,
        verifierApprovedAt: null,

        isDenied: false,
        personWhoDenied: null,
        deniedAt: null,
        deniedReason: null,

        isDeactivated: false,
        personWhoDeactivated: null,
        deactivatedAt: null,
        deactivatedReason: null,

        kycAt: new Date(),
      },
      {
        where: { id },
      }
    );
    const updatedUser = await User.findOne({
      where: { id },
    });

    return successResponse(updatedUser, `Finish KYC`, reply);
  } catch (error) {
    return errorResponse(
      `Error generating code and link: ${error}`,
      reply,
      "custom"
    );
  }
};

const kycInitialize = async (request, reply) => {
  const id = request.user.id;
  const uuid = request.user.uuid;
  const docId = request.body.docId
  const docType = request.body.docType

  const baseUrl = config[environment].base_url;

  const zolozTransaction = await ZolozTransaction.create({
    userId:id,
  })
  const bizId = zolozTransaction?.id

  let operationMode;
  if (environment === PRODUCTION) {
      operationMode = "STANDARD"; // do not allow duplication of SIMILAR_NAME, SAME_CERT_NO
  } else if (environment === DEVELOPMENT) {
      operationMode = "STANDARD_VC_CLOSED"; // allow duplication of SIMILAR_NAME, SAME_CERT_NO
  } else if (environment === STAGING) {
      operationMode = "STANDARD";  // production
  } else {
      operationMode = "STANDARD_VC_IDN_CLOSED";   // STANDARD_VC_IDN_CLOSED allow duplication of SIMILAR_NAME, SAME_CERT_NO
  }
  const payload = {
    "bizId": bizId,
    "flowType": H5_REALIDLITE_KYC,
    "userId": uuid,
    "docType": docType,
    "serviceLevel": "REALID0001",
    // "pages":"1,2",
    "operationMode": operationMode, // production
    "metaInfo": "MOB_H5",
    "h5ModeConfig": {
      "completeCallbackUrl": `${BASE_URL}/game/kyc?transId=${bizId}`,
      "interruptCallbackUrl": `${BASE_URL}/game/kyc`,
      "docFrontPageGuideUrl":`${BASE_URL}/game/kyc`,
      "docBackPageGuideUrl": `${BASE_URL}/game/kyc`,
      "facePageGuideUrl": `${BASE_URL}/game/kyc`,
    }
  }
  const initialize = await zoloz.initialize(payload)

  const clientCfg = initialize?.clientCfg
  const transactionId = initialize?.transactionId
  const result = initialize?.result

  const zolozurl = `${ZOLOZ_INITIALIZE_CALLBACK_BASEURL}?clientcfg=${clientCfg}`;

  await zolozTransaction.update({
    transactionId,
    result,
    clientCfg
  });

  return successResponse(
    { zolozurl, zolozTransaction },
    `Zoloc Initialize been successfull`,
    reply
  );
}

const checkResult = async (request, reply) => {
  const bizId = request.body.bizId
  const zolozTransaction = await ZolozTransaction.findOne({ where:{id:bizId} })
  const transactionId = zolozTransaction?.transactionId
  const userID = zolozTransaction?.userId

  const payload = {
    "bizId": bizId,
    "transactionId": transactionId,
    "isReturnImage": "Y",
    "extraImageControlList":["DOC_FRONT_FLASH"]
  }

  const checkResult = await zoloz.checkResult(payload)

  await zolozTransaction.update({
    isCheckResult: true,
    ekycResult: checkResult?.ekycResult,
    extBasicInfo: checkResult?.extBasicInfo,
    extCancelInfo: checkResult?.extCancelInfo,
    extCustomInfo: checkResult?.extCustomInfo,
    extFaceInfo: checkResult?.extFaceInfo,
    extIdInfo: checkResult?.extIdInfo,
  });

  if(checkResult?.ekycResult === "Pending"){
    User.update({ isKYC:"forapproval" },{ where:{ id:userID }})
  }

  const userInfo = await User.findOne({
    attributes: [
      "birthdate",
    ],
    where: { id: userID },
  });

  return successResponse(
    { checkResult, userInfo },
    `Zoloc Check Result Pending`,
    reply
  );

}

const removeUserProfilePicture = async (request, reply) => {
  const id = request.user.id;
  const uuid = request.user.uuid;

  // const path = require("node:path");
  // const fs = require("fs");

  let isDeleted = "not deleted";
  try {
    const user = await User.findOne({
      where: { uuid },
    });
    const { mobile } = user;
    if (!user) {
      return errorResponse("User not found", reply, "custom");
    }

    let imagePath = "";
    // Check if the user has a profile picture
    if (user.profilePicture) {
        // Construct the path to the user's image file
         imagePath = path.join(
          storage,
          "public",
          "uploads",
          "images",
          "profile-pictures",
          uuid,
          user.profilePicture
        );
  
        // Check if the image file exists
        if (fs.existsSync(imagePath)) {
          // Delete the image file
          fs.unlinkSync(imagePath);
          isDeleted = "deleted";
        }
    }

    await makeLog(
      `The profile picture of ${mobile} has been deleted. ${user.profilePicture} has been removed`,
      "profile",
      "info",
      id,
      "user"
    );

    // Update the user's profilePicture column to null or an empty string if needed
    user.profilePicture = null; // Set to null or '' as per your requirement
    await user.save();


    const payload = {
      profilePicture: user.profilePicture,
    };
    return successResponse(
      payload,
      `User image ${isDeleted} successfully`,
      reply
    );
  } catch (error) {
    return errorResponse(`Error deleting image: ${error}`, reply, "custom");
  }
};

const approveOrDeactiveVerifier = async (request, reply) => {
  const id = request.params.id; // Get user ID from URL params
  const uuid = request.user.uuid;
  const userRole = request.userRole;
  return executeVerifierActions(userRole, id, uuid, request, reply);
};

const checkUser = async (request, reply) => {
  const id = request.params.id;
  const exist = await User.count({ where: { uuid: id } });

  return successResponse(
    exist,
    "Get All Users is successfully fetched!",
    reply
  );
};

const getAllUserGroups = async (request, reply) => {
  const { supervisorId } = request.body; // Get user ID from URL params

  try {
    if(supervisorId){
    const user = await User.findOne({
      where: { uuid:supervisorId },
    });
    const { id } = user
    
    const userGroupsAssigned = await UserGroup.findAll({where:{ 
      parentId:id
    }});
    const childIdsAssigned = userGroupsAssigned.map((group:any) => group.childId);

    const userGroupsNotAssigned  =await UserGroup.findAll({where:{ 
      childId:{
        [Op.not]: childIdsAssigned
      }
    }});
    const childIds = userGroupsNotAssigned.map((group:any) => group.childId);
    const users = await User.findAll({
      attributes: [
        [
          Sequelize.fn(
            "CONCAT",
            Sequelize.col("firstName"),
            " ",
            Sequelize.col("lastName")
          ),
          "fullName",
        ],
        "id",
      ],
      where: { 
        role: "verifier",  
        id: {
          [Op.not]: childIds
        }
      },
    });
    return successResponse(
      users,
      "Get All Verifier Users is successfully fetched!",
      reply
    );
  }
  } catch (error) {
    return errorResponse(
      `Error on getting Verifier Users: ${error}`,
      reply,
      "custom"
    );
  }
};

const getBalance = async (request, reply) => {
  const uuid = request.user.uuid;
  const user = await User.findOne({
    where: { uuid },
  });

  const id = user.id;
  const wallet = await Wallet.findOne({
    where: { id },
  });

  if (user) {
    const walletData = wallet.toJSON();

    return successResponse(
      walletData,
      "The User Profile Successfully Fetch!",
      reply
    );
  } else {
    return errorResponse("User not found", reply, "custom");
  }
};

const addBalance = async (request, reply) => {
  const user_id = request.user.id;
  const uuid = request.user.uuid;
  const wallet = await Wallet.findOne({
    where: { user_id },
  });

  const { load } = request.body;
  let balance = Number(wallet.balance) + Number(load);
  const payloadBody = { balance };

  try {
    const res = await Wallet.update(payloadBody, {
      //  @ts-ignore
      where: { user_id },
    });

    if (res.length > 0) {
      return successResponse(payloadBody, "Balance Updated", reply);
    }
    return errorResponse("No updated balance", reply);
  } catch (err) {
    return errorResponse(`Error updating profile: ${err}`, reply, "custom");
  }
};

const addOrDeductCredits = async (formFields:any, authid:any, reply:any) => {
  const { id:uuid, reason, govtPicture, type, credits:credit } = formFields

  try {
    const authUser = await User.findOne({
      attributes: [
        "id",
        "uuid",
        [
          Sequelize.fn(
            "CONCAT",
            Sequelize.col("firstName"),
            " ",
            Sequelize.col("lastName")
          ),
          "loaderName",
        ],
      ],
      include: [
        {
          model: Wallet,
          attributes: ["id", "balance"],
        },
      ],
      where: { uuid: authid },
    });

    const user = await User.findOne({
      attributes: [
        "id",
        "uuid",
        "mobile",
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
      include: [
        {
          model: Wallet,
          attributes: ["id", "balance"],
        },
      ],
      where: { uuid },
    });
    // @ts-ignore
  
 
   
    const playerMobile = user?.mobile;

    const playerName = user.get("playerName") === " " ? playerMobile : user.get("playerName");
    
    if(type === "load"){
      const balance:any = Number(user?.Wallet?.balance) + Number(credit);
      await Wallet.update(
        { balance },
        {
          where: { id: user?.Wallet?.id },
        }
      );
    }else if(type === "deduct"){
      const balance:any = Number(user?.Wallet?.balance) - Number(credit);

      if(Number(credit) > Number(user?.Wallet?.balance)){
        return errorResponse(`Match the deduction amount to the user's balance`, reply, "custom");
      }

      await Wallet.update(
        { balance },
        {
          where: { id: user?.Wallet?.id },
        }
      );
    }
  
    await LoadTransaction.create({
      transactionType: type,
      personType: ADMIN,
      targetUserId: user.id,
      sourceUserId: authUser.id,
      reason: reason || null,
      attachmentImg: govtPicture || null
    }).then(async ({ id }) => {
      await Transaction.create({
        wallet_id: user?.Wallet?.id,
        amount: credit,
        previousBalance: user?.Wallet?.balance,
        type: type,
        loadTransactionId:id
      });
    })
 
    const creditsText = displayMoney(credit);

    let titleSender = ""; let bodySender = "";
    let titleReceiver = ""; let bodyReceiver = "";
    let logsMes = "";
    if(type === "load"){
      titleSender = `You have successfully sent ${creditsText}`
      bodySender = `You have successfully credited ${playerName} with ${creditsText}`
      titleReceiver = `You have successfully received ${creditsText}`
      bodyReceiver = `GlobalX has credited your account with ${creditsText}`
      logsMes = `GlobalX has successfully sent ${playerName} with ${creditsText}`
    }else if(type === "deduct"){
      titleSender = `You have successfully deducted ${creditsText}`
      bodySender = `You have successfully deducted ${playerName} with ${creditsText}`
      titleReceiver = `You have been deducted ${creditsText}`
      bodyReceiver = `GlobalX has deducted your account with ${creditsText}`
      logsMes = `GlobalX has deducted ${playerName} with ${creditsText}`
    }

    await makeNotif(
      user.id,
      titleReceiver,
      bodyReceiver,
      "transactions",
      "info",
      user.uuid
    );

    await makeNotif(
      authUser.id,
      titleSender,
      bodySender,
      "transactions",
      "info",
      authUser.uuid
    );

    await makeLog(
      logsMes,
      "user-management",
      "info",
      user.id,
      "user"
    );

  } catch (err) {
    return errorResponse(`Error updating balance: ${err}`, reply, "custom");
  }
};

const sendCreditsWithFile = async (request, reply) => {
  const uuid = request.user.uuid
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB in bytes
  // Allowed MIME types for Microsoft Word files

  // Check if the request is multipart/form-data
  if (!request.isMultipart()) {
    return errorResponse("Request is not multipart", reply, "custom");
  }

  // Define storage location based on environment
  const storage = `${environment !== LOCAL ? "./dist/server" : "."}`;

  // Initialize variables to store form fields and file info
  let formFields:any = {}; // Store form fields like credit, reason, id
  let fileToUpload = null; // Store file-related information


  // Iterate over the form parts (files and fields)
  for await (const part of request.parts()) {
    if (part.file) {
      // Check file size before proceeding
      if (part.file.length > MAX_FILE_SIZE) {
        return errorResponse("File size exceeds the recommended limit of 10 MB", reply, "custom");
      }

      if (!ALLOWED_MIME_TYPES.includes(part.mimetype)) {
        return errorResponse("Invalid file type. Only images, pdf and .doc/.docx files are allowed", reply, "custom");
      }

      // Handle file part
      fileToUpload = "govt-pictures"; // Folder for uploaded images
      const uploadDir = path.join(storage, 'public', 'uploads', 'images', fileToUpload, uuid);

      // Ensure the upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Generate unique filename based on current timestamp and random string
      const fileExtension = part.filename.split(".").pop();
      const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
      const filePath = path.join(uploadDir, uniqueFilename);

      try {
        // Write the file to the server
        await pump(part.file, fs.createWriteStream(filePath));
        fileToUpload = uniqueFilename; // Store the filename for later use
      } catch (err) {
        console.error('Error writing file:', err);
        return errorResponse("Failed to upload image", reply, "custom");
      }
    } else {
      // Handle non-file parts (fields like credit, reason, id)
      formFields[part.fieldname] = part.value;
    }
  }

  // Respond with the fields and file info
  const responsePayload = {
    ...formFields, // Include form fields like credit, reason, id
    govtPicture: fileToUpload, // Include the uploaded file's name if it exists
  };

  await addOrDeductCredits(responsePayload, uuid, reply)


  return successResponse(responsePayload, "Balance Updated", reply);
};

const getPaymentCards = async (request, reply) => {
  const user_id = request.user.id;
  const { transactionMethod } = request.query;
  let whereConditions = {} as any; // Define whereConditions as any type
  let whereUserConditions = {} as any; // Define whereConditions as any type
  whereConditions["inviterId"] = user_id
  whereUserConditions["role"] = { [Op.ne]: "cashier" };

  if(transactionMethod === DEDUCTCREDITS){
    whereConditions["userType"] = { [Op.eq]: "online" };
  }

  try {
    const playerAndAgents = await Referral.findAll({
      attributes:["inviterId","playerId","userType"],
      where: whereConditions,
      include:[
        {
          model: User,
          attributes:["isOperatorWithSite"],
          as: "sourceUser",
        },
        {
          model: User,
          attributes:["uuid","mobile","firstName","lastName", "role"],
          as: "targetUser",
          where: whereUserConditions,
          include:[
            {
              model:Wallet,
            }
          ]
        }
      ]
    });

    // Map over the playerAndAgents to find the user data for each playerId
    const playersWithDetails = await Promise.all(playerAndAgents.map(async (referral:any) => {
      const mobileTrim = mobilePH(referral?.targetUser?.mobile);

      const playerDetails = referral?.targetUser ? {
        id: referral?.targetUser?.uuid,
        name: mobileTrim,
        fullname: `${referral?.targetUser?.firstName} ${referral?.targetUser?.lastName}`,
        userType: referral?.userType,
        role: referral?.targetUser?.role,
        balance: referral?.targetUser?.Wallet?.balance,
      } : null;
      return {
        ...playerDetails  // Including user data for playerId
      };
    }));

    return successResponse(playersWithDetails, "The agents and player is successfuly fetched!", reply);
  } catch (error) {
    return errorResponse("agents and player not found", reply, "custom");
  }
};

const getOperatorsWithSite = async (request, reply) => {
  try {
    const operatorsWithSite = await User.findAll({
      where: { role:"masteragent", isOperatorWithSite:true },
    });

    // Map over the playerAndAgents to find the user data for each playerId
    const operatorsWithSiteQuery = await Promise.all(operatorsWithSite.map(async (users) => {
    const operators =  {
      id: users.uuid,
      label: `${users.firstName} ${users.lastName}`,
    };
      return {
        ...operators  // Including user data for playerId
      };
    }));

    return successResponse(operatorsWithSiteQuery, "The operators with site is successfuly fetched!", reply);
  } catch (error) {
    return errorResponse("Operators with site not found", reply, "custom");
  }
};


const getIntialTransaction = async (request, reply) => {
  const user_id = request.user.id;

  try {
    const initialTransaction = await Transaction.findOne({
      attributes: ["id","amount"],
      order: [["id", "ASC"]],
      where: { wallet_id: user_id, status: "SUCCESS", type: "deposit" },
    });

    return successResponse(initialTransaction, "The initial transaction is successfuly fetched!", reply);
  } catch (error) {
    return errorResponse("Initial transaction not found", reply, "custom");
  }
};

const addPaymentCard = async (request, reply) => {
  const userId = request.user.id;
  const { paymentType, mobile } = request.body;
  let response = null;
  const mobileTrim = mobilePH(mobile);
  const card = await Cards.findOne({ where: { userId, mobile: mobileTrim } });

  if (card) {
    return errorResponse(
      `The acount number is already registered!`,
      reply,
      "custom"
    );
  }

  const user = await User.findOne({ where: { id: userId } });

  const payloadStasher = {
    name: `${user.firstName} ${user.lastName}`,
    mobileNumber: mobileTrim,
  };

  try {
    if (paymentType === QRPH) {
    
        const createStasherAccount = await stasherAPI.createStasherAccount(
          request,
          payloadStasher
        );

        if(!createStasherAccount){
          return errorResponse(
            `Error on adding cards`,
            reply,
            "custom"
          );
        }

        const { id: accountId } = createStasherAccount
      // const accountId = "1111111"

        const payload = {
          userId,
          mobile: mobileTrim,
          accountId,
        };
      
        await Cards.create(payload);

        user.update({
          accountId,
        });
      
    }
  } catch (error) {
    return errorResponse(
      `Failed to add payment card: ${error}`,
      reply,
      "custom"
    );
  }

  return successResponse(response, "The cards is successfuly added!", reply);
};

const authPincode = async (request, reply) => {
  const { userId, passcode } = request.body;

  let authenticated = false

  const authUser = await User.findOne({
    attributes: ["passcode","id"],
    where: { uuid: userId },
  });

  if(authUser.passcode === null){
    return errorResponse(
      `No Pincode has been created!`,
      reply,
      "custom"
    );
  }

  if (await argon2.verify(authUser.passcode, passcode)) {
    authenticated = true
  }else{
    return errorResponse(
      `Invalid Pincode!`,
      reply,
      "custom"
    );
  }

  const card = await User.findOne({ attributes: ["id","accountId", "mobile"], where: { uuid:userId } });

  return successResponse(
    { card },
    "The pincode is successfuly authenticated!",
    reply
  );
}

const createPasscode = async (request, reply) => {
  const userId = request.user.id;
  const passcodeReq = request.body.passcode;

  const hashedPasscode = await argon2.hash(passcodeReq);

  try {
    await User.update(
      {
        passcode:hashedPasscode,
      },
      {
        where: { id: userId },
      }
    );
    const user = await User.findOne({ attributes:["passcode"], where: { id: userId } });
    const { passcode } = user
    return successResponse({ passcode }, "Creating Passcode Successfully", reply);
  } catch (error) {
    return errorResponse(`Failed to creating passcode: ${error}`, reply, "custom");
  }
}


const currentPasscode = async (request, reply) => {
  const userId = request.user.id;
  const passcodeReq = request.body.passcode;

  let user = await User.findOne({ where: { id:userId } });

  const isPasscodeValid = await argon2.verify(user.passcode, passcodeReq);
      
  if(!isPasscodeValid){
    return errorResponse(`Invalid Passcode`, reply, "custom");
  }

  return successResponse({ passcode:user.passcode }, "Current Passcode Successfully", reply);
}

const changePasscode = async (request, reply) => {
  const userId = request.user.id;
  const passcodeReq = request.body.passcode;

  const hashedPasscode = await argon2.hash(passcodeReq);

  const authUser = await User.findOne({
    attributes: ["passcode"],
    where: { id: userId },
  });

  if (!authUser) {
    return errorResponse("User not found", reply, "custom");
  }

  const isPasscodeCurrentValid = await argon2.verify(authUser.passcode, passcodeReq);

  if(isPasscodeCurrentValid){
    return errorResponse(`You cannot use old passcode`, reply, "custom");
  }

  try {
    await User.update(
      {
        passcode:hashedPasscode,
      },
      {
        where: { id: userId },
      }
    );
    const user = await User.findOne({ attributes:["passcode"], where: { id: userId } });
    const { passcode } = user
    return successResponse({ passcode }, "Updating Passcode Successfully", reply);
  } catch (error) {
    return errorResponse(`Failed to updating passcode: ${error}`, reply, "custom");
  }
}

const resetPasscode = async (request, reply) => {
  const userId = request.user.id;
  const mobile = request.body.mobile;
  const otp = environment === PRODUCTION ? (crypto.randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, '0') : 
  environment === STAGING ? (crypto.randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, '0') : "111111";
  const otpExpiration = new Date(Date.now() + 5 * 68000); // OTP valid for 5 minute
  const otpMaxEntriesExpiration = new Date(Date.now() + 2 * 60 * 60000); // OTP valid for 2 hours

  let user = await User.findOne({ where: { mobile } });

  let authUser = await User.findOne({ where: { id:userId } });

  if (!user) {
    return errorResponse("Your mobile no. is not registered", reply, "custom");
  }

  if (mobile !== authUser.mobile) {
    return errorResponse("Enter your registered Mobile No.", reply, "custom");
  }

  const { id, uuid } = user;

  if (environment === PRODUCTION || environment === STAGING) {
    const otpInstance = new OTP();
    await otpInstance.sendMsg(mobile, otp, reply);
  }

  // await twillio.sendSMS(mobile, reply);

  user.otp = otp;
  user.otpExpiration = otpExpiration;
  user.otpMaxEntriesExpiration = otpMaxEntriesExpiration;
  user = await user.save();

  await makeLog(
    `The passcode ${mobile} was requesting for reset and an OTP No. ${otp} is sent`,
    "authentication",
    "info",
    id,
    "user"
  );

  const payload = {
      id: uuid,
      mobile,
      countdownSeconds: 300,
  };

  return successResponse(
    payload,
    "Passcode is now reset, and here's the 1-minute OTP.",
    reply
  );
}

const validateOTPPasscode = async (request, reply) => {
  const userId = request.user.id;
  const otp = request.body.otp;
  
  let user = await User.findOne({ where: { id:userId } });
  const { otp: userOtp, otpExpiration } = user

  // await twillio.verificationCheck(userOtp, user?.mobile, reply)

  if (new Date() > new Date(otpExpiration)) {
    return errorResponse("OTP expired", reply, "custom");
  }

  if (!user || userOtp !== otp) {
    return errorResponse("Invalid OTP", reply, "custom");
  }

  return successResponse(
    {},
    "Your OTP is Valid, You can reset your password",
    reply
  );
}

const newResetPasscode = async (request, reply) => {
  const userId = request.user.id;
  const passcodeReq = request.body.passcode;

  const hashedPasscode = await argon2.hash(passcodeReq);

  try {
    await User.update(
      {
        passcode:hashedPasscode,
      },
      {
        where: { id: userId },
      }
    );
    const user = await User.findOne({ attributes:["passcode"], where: { id: userId } });
    const { passcode } = user
    return successResponse({ passcode }, "New Passcode Successfully", reply);
  } catch (error) {
    return errorResponse(`Failed to create new passcode: ${error}`, reply, "custom");
  }
}

const resendResetPasscodeOtp = async (request, reply) => {
  const userIdReq = request.user.id;

  const otp = environment === PRODUCTION ? (crypto.randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, '0') : 
  environment === STAGING ? (crypto.randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, '0') : "111111";
  const otpExpiration = new Date(Date.now() + 5 * 65000); // OTP valid for 5 minute

  let user = await User.findOne({ where: { id: userIdReq } });

  if (new Date() > new Date(user.otpMaxEntriesExpiration)) {
    const otpMaxEntriesExpiration = new Date(Date.now() + 2 * 60 * 60000); // OTP valid for 2 hours
    user.otpMaxEntries = process.env.MAX_OTP_REQUEST;
    user.otpMaxEntriesExpiration = otpMaxEntriesExpiration;
  }

  const { id: userId, mobile } = user;
  if (!user || user.otpMaxEntries === 0) {
    const msgErr = "You reach the maximum otp request, kindly wait for 2 hours to request new otp";

    await makeLog(
      `The OTP No. ${otp} is successfully re-sent`,
      "authentication",
      "info",
      userId,
      "user"
    );

    return errorResponse(msgErr, reply, "custom");
  }


  const otpMaxEntriesNew = user.otpMaxEntries - 1;

  if (environment === PRODUCTION || environment === STAGING) {
    const otpInstance = new OTP();
    await otpInstance.sendMsg(mobile, otp, reply);
  }

  // await twillio.sendSMS(mobile, reply);

  user.otp = otp;
  user.otpExpiration = otpExpiration;
  // user.otpMaxEntries = otpMaxEntriesNew;
  user = await user.save();

  const payload = {
      id: user.uuid,
      mobile,
      countdownSeconds: 300,
  };

  await makeLog(
    `The OTP No. ${otp} is successfully re-sent`,
    "authentication",
    "info",
    userId,
    "user"
  );

  return successResponse(payload, "Resending OTP success", reply);
}


const createOrUpdatePassword = async (request, reply) => {
  const userId = request.user.id;
  const passwordReq = request.body.password;
  const currentPasswordReq = request.body.currentPassword;
  const isCurrentPasswordNull = currentPasswordReq === null || currentPasswordReq === 'null' || currentPasswordReq === '';

  if(isCurrentPasswordNull){
    const hashedPassword = await argon2.hash(passwordReq);
    try {
      await User.update(
        { password:hashedPassword },
        { where: { id: userId }, }
      );
      const user = await User.findOne({ attributes:["password"], where: { id: userId } });
        const { password } = user
      return successResponse({ password },`Creating Password Successfully`, reply);
    } catch (error) {
      return errorResponse(`Failed to creating password: ${error}`, reply, "custom");
    }
  }else{
      const authUser = await User.findOne({
        attributes: ["password"],
        where: { id: userId },
      });

      if (!authUser) {
        return errorResponse("User not found", reply, "custom");
      }

      const isPasswordCurrentValid = await argon2.verify(authUser.password, currentPasswordReq);

      if(!isPasswordCurrentValid){
        return errorResponse({currentPassword:`You have entered an incorrect password`}, reply, "custom");
      }

      const isPasswordValid = await argon2.verify(authUser.password, passwordReq);
      
      if(isPasswordValid){
        return errorResponse({password:`You cannot use old password`}, reply, "custom");
      }

      const hashedPassword = await argon2.hash(passwordReq);
      try {
        await User.update(
          { password:hashedPassword },
          { where: { id: userId }, }
        );
        const user = await User.findOne({ attributes:["password"], where: { id: userId } });
          const { password } = user
        return successResponse({ password },`Updating Password Successfully`, reply);
      } catch (error) {
        return errorResponse(`Failed to creating password: ${error}`, reply, "custom");
      }
  }
}

const resetPassword = async (request, reply) => {
  const userId = request.user.id;
  const mobile = request.body.mobile;
  const otp = environment === PRODUCTION ? (crypto.randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, '0') : 
  environment === STAGING ? (crypto.randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, '0') : "111111";
  const otpExpiration = new Date(Date.now() + 5 * 68000); // OTP valid for 5 minute
  const otpMaxEntriesExpiration = new Date(Date.now() + 2 * 60 * 60000); // OTP valid for 2 hours

  let user = await User.findOne({ where: { mobile } });

  let authUser = await User.findOne({ where: { id:userId } });

  if (!user) {
    return errorResponse("Your mobile no. is not registered", reply, "custom");
  }

  if (mobile !== authUser.mobile) {
    return errorResponse("Enter your registered Mobile No.", reply, "custom");
  }

  const { id, uuid } = user;

  if (environment === PRODUCTION || environment === STAGING) {
    const otpInstance = new OTP();
    await otpInstance.sendMsg(mobile, otp, reply);
  }

  // await twillio.sendSMS(mobile, reply);

  user.otp = otp;
  user.otpExpiration = otpExpiration;
  user.otpMaxEntriesExpiration = otpMaxEntriesExpiration;
  user = await user.save();

  await makeLog(
    `The password ${mobile} was requesting for reset and an OTP No. ${otp} is sent`,
    "authentication",
    "info",
    id,
    "user"
  );

  const payload = {
      id: uuid,
      mobile,
      countdownSeconds: 300,
  };

  return successResponse(
    payload,
    "Password is now reset, and here's the 1-minute OTP.",
    reply
  );
}

const validateOTP = async (request, reply) => {
  const userId = request.user.id;
  const otp = request.body.otp;

  if (otp === "") {
    return errorResponse("The OTP Field is required!", reply, "custom");
  }
  
  let user = await User.findOne({ where: { id:userId } });
  const { otp: userOtp, otpExpiration } = user

  // await twillio.verificationCheck(userOtp, user?.mobile, reply)

  if (new Date() > new Date(otpExpiration)) {
    return errorResponse("OTP expired", reply, "custom");
  }

  if (!user || userOtp !== otp) {
    return errorResponse("Invalid OTP", reply, "custom");
  }

  return successResponse(
    {},
    "Your OTP is Valid, You can reset your password",
    reply
  );
}

const resendResetPasswordOtp = async (request, reply) => {
  const userIdReq = request.user.id;

  const otp = environment === PRODUCTION ? (crypto.randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, '0') : 
  environment === STAGING ? (crypto.randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, '0') : "111111";
  const otpExpiration = new Date(Date.now() + 5 * 65000); // OTP valid for 5 minute

  let user = await User.findOne({ where: { id: userIdReq } });

  if (new Date() > new Date(user.otpMaxEntriesExpiration)) {
    const otpMaxEntriesExpiration = new Date(Date.now() + 2 * 60 * 60000); // OTP valid for 2 hours
    user.otpMaxEntries = process.env.MAX_OTP_REQUEST;
    user.otpMaxEntriesExpiration = otpMaxEntriesExpiration;
  }

  const { id: userId, mobile } = user;
  if (!user || user.otpMaxEntries === 0) {
    const msgErr = "You reach the maximum otp request, kindly wait for 2 hours to request new otp";

    await makeLog(
      `The OTP No. ${otp} is successfully re-sent`,
      "authentication",
      "info",
      userId,
      "user"
    );

    return errorResponse(msgErr, reply, "custom");
  }

  
  const otpMaxEntriesNew = user.otpMaxEntries - 1;

  if (environment === PRODUCTION || environment === STAGING) {
    const otpInstance = new OTP();
    await otpInstance.sendMsg(mobile, otp, reply);
  }

  // await twillio.sendSMS(mobile, reply);

  user.otp = otp;
  user.otpExpiration = otpExpiration;
  // user.otpMaxEntries = otpMaxEntriesNew;
  user = await user.save();

  const payload = {
      id: user.uuid,
      mobile,
      countdownSeconds: 300,
  };

  await makeLog(
    `The OTP No. ${otp} is successfully re-sent`,
    "authentication",
    "info",
    userId,
    "user"
  );

  return successResponse(payload, "Resending OTP success", reply);
}

const newResetPassword = async (request, reply) => {
  const userId = request.user.id;
  const passwordReq = request.body.password;

  const hashedPassword = await argon2.hash(passwordReq);

  try {
    await User.update(
      { password:hashedPassword },
      { where: { id: userId }, }
    )

    const user = await User.findOne({ attributes:["id", "mobile", "password"], where: { id: userId } });

    const { id, mobile, password } = user

    await makeLog(
      `The password of ${mobile} was been successfully changed`,
      "authentication",
      "info",
      id,
      "user"
    );

    return successResponse({ password },`Reset Password Successfully`, reply);
  } catch (error) {
    return errorResponse(`Failed to creating password: ${error}`, reply, "custom");
  }
}


const resetMobile = async (request, reply) => {
  const userId = request.user.id;
  const mobile = request.body.mobile;
  const otp = environment === PRODUCTION ? (crypto.randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, '0') : 
  environment === STAGING ? (crypto.randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, '0') : "111111";
  const otpExpiration = new Date(Date.now() + 5 * 68000); // OTP valid for 5 minute
  const otpMaxEntriesExpiration = new Date(Date.now() + 2 * 60 * 60000); // OTP valid for 2 hours

  let user = await User.findOne({ where: { mobile } });

  let authUser = await User.findOne({ where: { id:userId } });

  if (!user) {
    return errorResponse("Your mobile no. is not registered", reply, "custom");
  }

  if (mobile !== authUser.mobile) {
    return errorResponse("Enter your registered Mobile No.", reply, "custom");
  }

  const { id, uuid } = user;

  if (environment === PRODUCTION || environment === STAGING) {
    const otpInstance = new OTP();  // Create an instance of the OTP class
    await otpInstance.sendMsg(mobile, otp, reply);
  }

  // await twillio.sendSMS(mobile, reply); 

  user.otp = otp;
  user.otpExpiration = otpExpiration;
  user.otpMaxEntriesExpiration = otpMaxEntriesExpiration;
  user = await user.save();

  await makeLog(
    `The user ${uuid} was requesting for change mobile and an OTP No. ${otp} is sent`,
    "authentication",
    "info",
    id,
    "user"
  );

  const payload = {
      id: uuid,
      mobile,
      countdownSeconds: 300,
  };

  return successResponse(
    payload,
    "Mobile No. is requesting for change mobile, and here's the 1-minute OTP.",
    reply
  );
}

const validateMobileOTP = async (request, reply) => {
  const userId = request.user.id;
  const otp = request.body.otp;
  
  let user = await User.findOne({ where: { id:userId } });
  const { otp: userOtp, otpExpiration } = user

  // await twillio.verificationCheck(userOtp, user?.mobile, reply)


  if (new Date() > new Date(otpExpiration)) {
    return errorResponse("OTP expired", reply, "custom");
  }

  if (!user || userOtp !== otp) {
    return errorResponse("Invalid OTP", reply, "custom");
  }

  return successResponse(
    {},
    "Your OTP is Valid, You can reset your mobile no.",
    reply
  );
}

const resendNewMobileOTP = async (request, reply) => {
  const userIdReq = request.user.id;

  const otp = environment === PRODUCTION ? (crypto.randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, '0') : 
  environment === STAGING ? (crypto.randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, '0') : "111111";
  const otpExpiration = new Date(Date.now() + 5 * 65000); // OTP valid for 5 minute

  let user = await User.findOne({ where: { id: userIdReq } });

  if (new Date() > new Date(user.otpMaxEntriesExpiration)) {
    const otpMaxEntriesExpiration = new Date(Date.now() + 2 * 60 * 60000); // OTP valid for 2 hours
    user.otpMaxEntries = process.env.MAX_OTP_REQUEST;
    user.otpMaxEntriesExpiration = otpMaxEntriesExpiration;
  }

  const { id: userId, mobile } = user;
  if (!user || user.otpMaxEntries === 0) {
    const msgErr = "You reach the maximum otp request, kindly wait for 2 hours to request new otp";

    await makeLog(
      `The OTP No. ${otp} is successfully re-sent`,
      "authentication",
      "info",
      userId,
      "user"
    );

    return errorResponse(msgErr, reply, "custom");
  }

  
  const otpMaxEntriesNew = user.otpMaxEntries - 1;

  if (environment === PRODUCTION || environment === STAGING) {
    const otpInstance = new OTP();
    await otpInstance.sendMsg(mobile, otp, reply);
  }

  // await twillio.sendSMS(mobile, reply);

  user.otp = otp;
  user.otpExpiration = otpExpiration;
  // user.otpMaxEntries = otpMaxEntriesNew;
  user = await user.save();

  const payload = {
      id: user.uuid,
      mobile,
      countdownSeconds: 300,
  };

  await makeLog(
    `The OTP No. ${otp} is successfully re-sent`,
    "authentication",
    "info",
    userId,
    "user"
  );

  return successResponse(payload, "Resending OTP success", reply);
}

const newResetMobile = async (request, reply) => {
  const userId = request.user.id;
  const mobile = request.body.mobile;
  const otp = environment === PRODUCTION ? (crypto.randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, '0') : 
  environment === STAGING ? (crypto.randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, '0') : "111111";
  const otpExpiration = new Date(Date.now() + 5 * 68000); // OTP valid for 5 minute
  const otpMaxEntriesExpiration = new Date(Date.now() + 2 * 60 * 60000); // OTP valid for 2 hours

  let user = await User.findOne({ where: { mobile } });
  let authUser = await User.findOne({ where: { id:userId } });

  if (user) {
    return errorResponse("The mobile no. is already registered", reply, "custom");
  }

  const { id, uuid } = authUser;

  if (environment === PRODUCTION || environment === STAGING) {
    const otpInstance = new OTP();  
    await otpInstance.sendMsg(mobile, otp, reply);
  }

  // await twillio.sendSMS(mobile, reply);

  authUser.otp = otp;
  authUser.otpExpiration = otpExpiration;
  authUser.otpMaxEntriesExpiration = otpMaxEntriesExpiration;
  authUser = await authUser.save();

  await makeLog(
    `The mobile no. ${mobile} was requesting for change mobile and an OTP No. ${otp} is sent`,
    "authentication",
    "info",
    id,
    "user"
  );

  const payload = {
      id: uuid,
      mobile,
      countdownSeconds: 300,
  };

  return successResponse(
    payload,
    "Mobile No. is requesting for change mobile, and here's the 1-minute OTP.",
    reply
  );
}

const newMobile = async (request, reply) => {
  const userId = request.user.id;
  const mobile = request.body.mobile;
  const otpReq = request.body.otp;


  let user = await User.findOne({ where: { id:userId } });
  const { id, otp: userOtp, otpExpiration } = user

  if (new Date() > new Date(otpExpiration)) {
    return errorResponse("OTP expired", reply, "custom");
  }

  if (otpReq !== userOtp) {
    return errorResponse("Invalid OTP", reply, "custom");
  }

  try {
    await User.update(
      { mobile },
      { where: { id: userId }}
    );

    await makeLog(
      `The mobile no. ${mobile} was been successfully changed`,
      "user",
      "info",
      id,
      "user"
    );

    return successResponse({ mobile },`Mobile Successfully Changed`, reply);
  } catch (error) {
    return errorResponse(`Failed to change mobile: ${error}`, reply, "custom");
  }
}

const getAllActiveCsr = async (request, reply) => {
  try {
    let user = null;

    // First, try to find an active logged-in CSR (isActive: true)
    user = await User.findOne({
      attributes: ["isActive", "uuid", 'id', 'nickName', 'firstName', 'lastName', 'profilePicture', 'gender'],
      where: { isActive: true, role: "csr", status: 'active' },
      order: Sequelize.literal('RAND()')
    });

    // If no active logged-in CSR is found, select a CSR regardless of their login status
    if (!user) {
      user = await User.findOne({
        attributes: ["isActive", "uuid", 'id', 'nickName', 'firstName', 'lastName', 'profilePicture', 'gender'],
        where: { role: "csr", status: 'active' },
        order: Sequelize.literal('RAND()')
      });
    }

    // Return the found user (either logged-in CSR or any random CSR)
    return successResponse(
      { user },
      "This is the designated active CSR user",
      reply
    );
  } catch (error) {
    return errorResponse(`Failed to find CSR: ${error}`, reply, "custom");
  }
};

const getCSRMonitoring = async (request, reply) => {
  const { page, size, sort, filter } = request.query;
  let whereConditions = {};

  whereConditions["role"] = { [Op.eq]: 'csr' };

  if (filter) {
    // Split the filter string by '&' to get individual filter conditions
    const filterConditions = filter.split("&");
    filterConditions.forEach((condition) => {
      const [columnFilter, valueFilter] = condition.split("=");
      const decodedValue = decodeURIComponent(valueFilter);
      if (columnFilter === "fullName") {
        whereConditions[Op.or] = [
          Sequelize.literal(
            `CONCAT(firstName, ' ', lastName) LIKE '%${decodedValue}%'`
          ),
        ];
      } else if (columnFilter === "isActive") {
        if(decodedValue === "active"){
          whereConditions["isActive"] = true
        }else if(decodedValue === "inactive"){
          whereConditions["isActive"] = false
        }
      }
    });
  }

  const offset = page * size;
  const options: FindOptions = {
    attributes: [
      [
        Sequelize.fn(
          "CONCAT",
          Sequelize.col("User.firstName"),
          " ",
          Sequelize.col("User.lastName")
        ),
        "fullName",
      ],
      "isActive"
    ],
    where: whereConditions,
    offset,
    limit: size,
  };

  const order: OrderItem[] = [];
  order.push([Sequelize.col('createdAt'), 'desc']);
  options.order = order;

   // First, count the total records without pagination
   const totalCountOptions = {
    where: whereConditions,
  };
  
  const csrModel = await User.findAll(options);
  const csrModelCount = await User.count(totalCountOptions);

  const payload = {
    content: csrModel,
    totalCount: csrModelCount,
  };

  return successResponse(
    payload,
    "Get CSR List is successfully fetched!",
    reply
  );
}



const getCSRMonitoringLogs = async (request, reply) => {
  const { page, size, sort, filter } = request.query;
  let whereConditions = {
    functionality: "CSRActiveStatus", // Filter by functionality "CSRActiveStatus"
  };

  let userWhereConditions = {}; 
  userWhereConditions = {
    role: {
      [Op.eq]: "csr", 
    }
  }
  
  
  // Determine the conditions based on the 'type' filter (either 'in' or 'out')
  if (filter) {
    const filterConditions = filter.split("&");
    filterConditions.forEach((condition) => {
      const [columnFilter, valueFilter] = condition.split("=");
      const decodedValue = decodeURIComponent(valueFilter);

      // Handle 'type' filter for 'in' or 'out'
      if (columnFilter === "type") {
        if (decodedValue === "login") {
          whereConditions["description"] = {
            [Op.or]: ["CSR Login"],
          };
        } else if (decodedValue === "logout") {
          whereConditions["description"] = {
            [Op.or]: ["CSR Logout"],
          };
        } else if (decodedValue === "active") {
          whereConditions["description"] = {
            [Op.or]: ["CSR Active"],
          };
        } else if (decodedValue === "inactive") {
          whereConditions["description"] = {
            [Op.or]: ["CSR Inactive"],
          };
        }
      }

      // Handle 'fullName' filter
      if (columnFilter === "fullName") {
        userWhereConditions[Op.or] = [
          Sequelize.literal(
            `CONCAT(User.firstName, ' ', User.lastName) LIKE '%${decodedValue}%'`
          ),
        ];
      }
      
      
    });
  }

  const offset = page * size;
  const options: FindOptions = {
    attributes: ["id", "functionality", "message", "description", "level", "associatedId", "associatedType", "createdAt"],
    include: [
      {
        model: User,
        as: 'user',  // Use the alias specified in the association
        attributes: [
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
        where: userWhereConditions,  // Add the filtering condition for User
      },
    ],
    where: whereConditions,
    offset,
    limit: size,
  };

  const order: OrderItem[] = [];
  order.push([Sequelize.col('createdAt'), 'desc']);
  options.order = order;

  // First, count the total records without pagination
  const totalCountOptions: FindOptions = {
    include: [
      {
        model: User,
        as: 'user',  // Use the alias specified in the association
        attributes: [
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
        where: userWhereConditions,  // Add the filtering condition for User
      },
    ],
    where: whereConditions,
  };

  const csrModelLogs = await Log.findAll(options); // Change to Log model
  const csrModelLogsCount = await Log.count(totalCountOptions); // Change to Log model
  const userIds = [...new Set(csrModelLogs.map(log => log.associatedId))];
  const users = await User.findAll({ where: { id: userIds } });

  // Map the users to a lookup object for fast access
  const userLookup = users.reduce((acc, user) => {
    acc[user.id] = `${user.firstName} ${user.lastName}`;
    return acc;
  }, {});

  const formattedLogs = csrModelLogs.map(log => {
    let type;

    // Determine the type based on the description
    if (log.description === "CSR Login") {
      type = "Login";
    } else if (log.description === "CSR Logout") {
      type = "Logout";
    } else if (log.description === "CSR Active") {
      type = "Active";
    } else if (log.description === "CSR Inactive") {
      type = "Inactive";
    }
    
    return {
      type: type, // Assigning the determined type
      createdAt: log.createdAt,
      User: {
        fullName: userLookup[log.associatedId] || null,  // Access the fullName from userLookup
      },
    };
  });

  const payload = {
    content: formattedLogs,
    totalCount: csrModelLogsCount,
  };

  return successResponse(
    payload,
    "Get CSR Logs is successfully fetched!",
    reply
  );
};








export default {
  getUsers,
  getAllUsers,
  addUser,
  updateUser,
  uploadUserImage,
  deactivateUser,
  restoreUser,
  getUserProfile,
  getKYCAttempts,
  getUserAdminProfile,
  updateUserProfile,
  generateReferral,
  kycInitialize,
  checkResult,
  kycFinish,
  removeUserProfilePicture,
  approveOrDeactiveVerifier,
  checkUser,
  getAllUserGroups,
  getBalance,
  addBalance,
  sendCreditsWithFile,
  getPaymentCards,
  getOperatorsWithSite,
  getIntialTransaction,
  addPaymentCard,
  authPincode,
  createPasscode,
  currentPasscode,
  changePasscode,
  resetPasscode,
  validateOTPPasscode,
  newResetPasscode,
  resendResetPasscodeOtp,

  createOrUpdatePassword,
  resetPassword,
  validateOTP,
  resendResetPasswordOtp,
  newResetPassword,
  resetMobile,
  resendNewMobileOTP,
  validateMobileOTP,
  newResetMobile,
  newMobile,
  getUserSessions,
  getUserSites,
  getSourceOfIncome,
  getAllActiveCsr,
  getCSRMonitoring,
  getCSRMonitoringLogs
};
