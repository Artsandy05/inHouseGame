import {
  API_SUCCESS,
  API_FAILURE,
  VALIDATION_ERROR,
  CUSTOM_ERROR,
} from "../constants/validation";
import User from "../models/User";
import ReferralPlayer from "../models/ReferralPlayer";

import Referral from "../models/Referral";
import Log from "../models/Log";
import Notification from "../models/Notification";
import axios from "axios";
import { Sequelize } from "sequelize";
import UserGroup from "../models/UserGroup";
import { existsSync, mkdirSync } from "fs";
const CryptoJS = require("crypto-js");

import utc from "dayjs/plugin/utc";
import dayjs from "dayjs";
import { ADMIN, AGENT, BET, BITHRDAY_BENTE_PROMO, DEPOSIT, DONE, FOR_APPROVAL, GAME, KRLFDRV01, MASTERAGENT, NOT_STARTED, PENDING, PROMO, REFER_EARN_PROMO, WELCOME_BONUS_PROMO } from "../constants";
import UserPromo from "../models/UserPromo";
import Promo from "../models/Promo";
import Wallet from "../models/Wallet";
import Transaction from "../models/Transaction";
const { ROLES } = require("../constants/permission");
dayjs.extend(utc);

const getZeroNineInPhoneNo = (phoneNumber) => {
  const countryCodeRegex = /^\+63/;

  // Remove the country code prefix from the phone number
  const cleanedPhoneNumber = phoneNumber.replace(countryCodeRegex, "");
  return `0${cleanedPhoneNumber}`;
};

// Function to compare two objects and find changed values
const findChangedValues = (current: any, previous: any) => {
  const messages = []; // Array to store the update messages

  if (current.nickName !== previous.nickName) {
    messages.push(`Nickname changed from ${previous.nickName} to ${current.nickName}`);
  }

  return messages.join(", ");
};

const errorResponse = (err: any, reply: any, type = "validation", name = null) => {
  if (type === "validation") {
    const errorMsg = {};
    if(name){
      errorMsg[name] = err;
    }else{
      if (err.errors) {
        err.errors.map((err) => {
          errorMsg[err.path] = err.message;
        });
      }
    }

    return reply.code(400).send({
      // @ts-ignore
      status: API_FAILURE,
      type: VALIDATION_ERROR,
      message: errorMsg,
    });
  } else if (type === "custom") {
    return reply.code(400).send({
      // @ts-ignore
      status: API_FAILURE,
      type: CUSTOM_ERROR,
      message: err,
    });
  }
};

const successResponse = (data: any, msg: any, reply: any) => {
  reply.code(201).send({
    status: API_SUCCESS,
    data,
    message: msg,
  });
};

const makeLog = async (
  message: any,
  functionality: any,
  level: any,
  associatedId: any,
  associatedType: any,
  description?: any
) => {
  await Log.create({
    message,
    functionality,
    level,
    associatedId,
    associatedType,
    description
  });
};
const makeNotif = async (
  id: any,
  title: any,
  mes: any,
  mod: any,
  types: any,
  ref: any,
  refStatus: any = null,
) => {
  await Notification.create({
    userId: id,
    title: title || "",
    message: mes,
    module: mod,
    type: types,
    reference: ref,
    referenceStatus: refStatus,
  });
};

//generateOtp(mobile, otp, reply);
const generateOtp = async (mobile: any, otp: any, reply: any) => {
  const trimMobile = getZeroNineInPhoneNo(mobile);
  await axios
    .post(process.env.ITEXTMO_URL, {
      Email: process.env.ITEXTMO_EMAIL,
      Password: process.env.ITEXTMO_PWD,
      Recipients: [trimMobile],
      Message: `Your verification code is ${otp}`,
      ApiCode: process.env.ITEXTMO_API_CODE,
      SenderId: process.env.ITEXTMO_SND_ID,
    })
    .then(function () {
      return successResponse(otp, "User registered successfully", reply);
    })
    .catch(function (error) {
      return errorResponse(error, reply);
    });
};

const createOrUpdateUserGroup = async (parentId: any, childId: any) => {
  // Check if the UserGroup entry already exists
  const existingUserGroup = await UserGroup.findOne({
    where: {
      parentId,
      childId,
      type: "notification",
    },
  });

  if (existingUserGroup) {
    // Entry already exists, no need to create a new one
    return existingUserGroup;
  }

  // Entry doesn't exist, create a new one
  return UserGroup.create({
    parentId,
    childId,
    type: "notification",
  });
};

const executeVerifierActions = async (
  userRole: any,
  id: any,
  authId: any,
  request: any,
  reply: any
) => {
  const { type, reason } = request.body;

  const user = await User.findOne({
    attributes: [
      "actionStatus",
      ["uuid", "userUUID"],
      ["id", "userId"],
      [
        Sequelize.fn(
          "CONCAT",
          Sequelize.col("firstName"),
          " ",
          Sequelize.col("lastName")
        ),
        "player", // Whether Supervisor or Verifier
      ],
      [
        Sequelize.literal(
          `(SELECT CONCAT(firstName, ' ', lastName) FROM users AS Supervisor WHERE Supervisor.uuid = User.personWhoDenied)`
        ),
        "personWhoDeniedName",
      ],
      [
        Sequelize.literal(
          `(SELECT id FROM users AS Supervisor WHERE Supervisor.uuid = User.personWhoDenied)`
        ),
        "personWhoDeniedId",
      ],
      [
        Sequelize.literal(
          `(SELECT CONCAT(firstName, ' ', lastName) FROM users AS Verifier WHERE Verifier.uuid = User.verifierWhoApprove)`
        ),
        "verifierWhoApprove",
      ],
      [
        Sequelize.literal(
          `(SELECT CONCAT(firstName, ' ', lastName) FROM users AS Verifier WHERE Verifier.uuid = User.personWhoDeactivated)`
        ),
        "personWhoDeactivated",
      ],
    ],
    where: { uuid: id },
  });

  const personWhoTakingActionQuery = await User.findOne({
    attributes: [
      "id",
      [
        Sequelize.fn(
          "CONCAT",
          Sequelize.col("firstName"),
          " ",
          Sequelize.col("lastName")
        ),
        "personWhoTakingAction", // Whether Supervisor or Verifier
      ],
    ],
    where: { uuid: authId },
  });

  const personWhoDeniedName = user.get("personWhoDeniedName");
  const personWhoDeniedId = user.get("personWhoDeniedId");
  const verifierWhoApproveName = user.get("verifierWhoApprove");
  const personWhoDeactivated = user.get("personWhoDeactivated");
  const playerName = user.get("player");
  const actionStatus = user.get("actionStatus");
  const userId = user.get("userId");
  const userUUID = user.get("userUUID");

  // const authUserJSON = authUser.toJSON();
  const personWhoTakingActionName = personWhoTakingActionQuery.get(
    "personWhoTakingAction"
  );
  const personWhoTakingActionId = personWhoTakingActionQuery.get("id");

  const supervisors = await UserGroup.findAll({
    attributes: ["parentId"],
    where: { childId: personWhoTakingActionId, type: "notification" },
  });

  const verifiers = await UserGroup.findAll({
    attributes: ["childId"],
    where: { parentId: personWhoTakingActionId, type: "notification" },
  });

  /*
    IMPORTANT NOTES:
    deactive status is equavalent to disapproved status in frontend sorry for not 
    changing because i use it in many condition, tired to changes all
  */

  //   return successResponse(
  //   {userRole, type, actionStatus},
  //   "User Player is successfully deactivate!",
  //   reply
  // );

  if (userRole === "verifier") {
    if (type === "approve") {
      if (actionStatus === "denied") {
        const payload = {
          actionStatus: "forapproval",
          isVerifierApproved: true,
          verifierWhoApprove: authId,
          verifierApprovedAt: new Date(),

          isDeactivated: false,
          personWhoDeactivated: null,
          deactivatedAt: null,
          deactivatedReason: null,

          kycAt: new Date(),
        };

        await User.update({ isKYC: FOR_APPROVAL },{ where: { id: userId }});

        supervisors?.map(async (obj: any) => {
          await makeNotif(
            obj.parentId,
            "",
            `For approval of player ${playerName} verified by ${personWhoTakingActionName}`,
            "user-management",
            "info",
            userUUID
          );
        });

        await makeLog(
          `${playerName} has been denied by ${personWhoDeniedName} as (supervisor) and now approved by ${personWhoTakingActionName} as (Verifier) the current status is now waiting for approval from the supervisor.`,
          "user-management",
          "info",
          userId,
          "user"
        );

        await User.update(payload, { where: { uuid: id } })
          .then(() => {
            return successResponse(
              {},
              "User Player is successfully approved!",
              reply
            );
          })
          .catch((err) => {
            return errorResponse(err, reply);
          });
      } else if (actionStatus === "new") {
        const payload = {
          actionStatus: "forapproval",
          isVerifierApproved: true,
          verifierWhoApprove: authId,
          verifierApprovedAt: new Date(),
          kycAt: new Date(),
        };

        await User.update({ isKYC: FOR_APPROVAL },{ where: { id: userId }});

        supervisors?.map(async (obj: any) => {
          await makeNotif(
            obj.parentId,
            "",
            `For approval of player ${playerName} verified by ${personWhoTakingActionName}`,
            "user-management",
            "info",
            userUUID
          );
        });

        await makeLog(
          `${playerName} has been approved by ${personWhoTakingActionName} as (Verifier) the current status is now waiting for approval from the supervisor.`,
          "user-management",
          "info",
          userId,
          "user"
        );

        await User.update(payload, { where: { uuid: id } })
          .then(() => {
            return successResponse(
              {},
              "User Player is successfully approved!",
              reply
            );
          })
          .catch((err) => {
            return errorResponse(err, reply);
          });
      }
    } else if (type === "deactive") {
      if (actionStatus === "denied") {
        const payload = {
          isDeactivated: true,
          personWhoDeactivated: authId,
          deactivatedAt: new Date(),
          actionStatus: "deactive",
          deactivatedReason: reason,

          isVerifierApproved: false,
          verifierWhoApprove: null,
          verifierApprovedAt: null,

          kycAt: new Date(),
        };

        await User.update({ isKYC: PENDING },{ where: { id: userId }});

        supervisors?.map(async (obj: any) => {
          await makeNotif(
            obj.parentId,
            "",
            `Player ${playerName} has been deactivated by ${personWhoTakingActionName}`,
            "user-management",
            "info",
            userUUID
          );
        });

        await makeNotif(
          userId,
          `KYC request has been denied!`,
          `${playerName} your KYC request has been denied, because ${reason}`,
          "kyc",
          "info",
          userUUID
        );

        await makeLog(
          `${playerName} (player) has been denied by ${personWhoDeniedName} as (supervisor) and now deactivated by ${personWhoTakingActionName} as (Verifier) the current status is now waiting for the player's kyc request`,
          "user-management",
          "info",
          userId,
          "user"
        );

        await User.update(payload, { where: { uuid: id } })
          .then(() => {
            return successResponse(
              {},
              "User Player is successfully deactivate!",
              reply
            );
          })
          .catch((err) => {
            return errorResponse(err, reply);
          });
      } else if(actionStatus === "new"){
        const payload = {
          isDeactivated: true,
          personWhoDeactivated: authId,
          deactivatedAt: new Date(),
          actionStatus: "deactive",
          deactivatedReason: reason,

          isDenied: false,
          personWhoDenied: null,
          deniedReason: null,
          deniedAt: null,

          kycAt: new Date(),
        };

        await User.update({ isKYC: PENDING },{ where: { id: userId }});

        await makeNotif(
          userId,
          `KYC request has been denied!`,
          `${playerName} your KYC request has been denied, because ${reason}`,
          "kyc",
          "info",
          userUUID
        );

        await makeLog(
          `${playerName} (player) has been deactivated by ${personWhoTakingActionName} as (verifier)`,
          "user-management",
          "info",
          userId,
          "user"
        );

        await User.update(payload, { where: { uuid: id } })
        .then(() => {
          return successResponse(
            {},
            "User Player is successfully deactivate!",
            reply
          );
        })
        .catch((err) => {
          return errorResponse(err, reply);
        });
      }
    }
  } else if (userRole === "supervisor") {
    if (type === "approve") {
      // Notification
      verifiers?.map(async (obj: any) => {
        await makeNotif(
          obj.childId,
          "",
          `${playerName} has been approved by ${personWhoTakingActionName}`,
          "user-management",
          "info",
          userUUID
        );
      });


      if (actionStatus === "new") {
        const payload = {
          status:"active",
          actionStatus: "approved",

          isSupervisorApproved: true,
          supervisorWhoApprove: authId,
          supervisorApprovedAt: new Date(),

          isVerifierApproved: true,
          verifierWhoApprove: authId,
          verifierApprovedAt: new Date(),

          kycAt: new Date(),
        };

        
        await User.update({ isKYC: DONE },{ where: { id: userId }});

        await makeNotif(
          userId,
          `KYC request has been approved!`,
          `${playerName} your KYC request has been fully verified!, You can now withdraw to your wallet account`,
          "kyc",
          "info",
          userUUID
        );

        await makeLog(
          `${playerName} (player) has been approved by ${personWhoTakingActionName} as (supervisor) and also verified the player, the current status is now fully for approved`,
          "user-management",
          "info",
          userId,
          "user"
        );

        await User.update(payload, { where: { uuid: id } })
          .then(() => {
            return successResponse(
              {},
              "User Player is successfully approved!",
              reply
            );
          })
          .catch((err) => {
            return errorResponse(err, reply);
          });
      } else if (actionStatus === "fordeactive") {
        const payload = {
          actionStatus: "deactive",
          isDeactivated: true,
          deactivatedAt: new Date(),

          isDenied: false,
          personWhoDenied: null,
          deniedReason: null,
          deniedAt: null,

          isSupervisorApproved: true,
          supervisorWhoApprove: authId,
          supervisorApprovedAt: new Date(),
          kycAt: new Date(),
        };

        await User.update({ isKYC: PENDING },{ where: { id: userId }});

        await makeNotif(
          userId,
          `KYC request has been denied!`,
          `${playerName} your KYC request has been denied`,
          "kyc",
          "info",
          userUUID
        );

        await makeLog(
          `${playerName} (player) has been deactivated by ${personWhoDeactivated} as (verifier) and now approved by ${personWhoTakingActionName} as (Supervisor) the current status is now fully for approved`,
          "user-management",
          "info",
          userId,
          "user"
        );

        await User.update(payload, { where: { uuid: id } })
          .then(() => {
            return successResponse(
              {},
              "User Player is successfully approved!",
              reply
            );
          })
          .catch((err) => {
            return errorResponse(err, reply);
          });
      } else if (actionStatus === "forapproval") {
        const payload = {
          status:"active",
          actionStatus: "approved",

          isSupervisorApproved: true,
          supervisorWhoApprove: authId,
          supervisorApprovedAt: new Date(),

          isDenied: false,
          personWhoDenied: null,
          deniedAt: null,
          deniedReason: null,

          kycAt: new Date(),
        };

        await User.update({ isKYC: DONE },{ where: { id: userId }});

        await makeNotif(
          userId,
          `KYC request has been approved!`,
          `${playerName} your KYC request has been fully verified!, You can now withdraw to your wallet account`,
          "kyc",
          "info",
          userUUID
        );

        await makeLog(
          `${playerName} (player) has been approved by ${verifierWhoApproveName} as (verifier) and now approved by ${personWhoTakingActionName} as (Supervisor) the current status is now fully for deactivated`,
          "user-management",
          "info",
          userId,
          "user"
        );

        await User.update(payload, { where: { uuid: id } })
          .then(() => {
            return successResponse(
              {},
              "User Player is successfully approved!",
              reply
            );
          })
          .catch((err) => {
            return errorResponse(err, reply);
          });
      } else if (actionStatus === "denied") {
        const payload = {
          status:"active",
          actionStatus: "approved",

          isSupervisorApproved: true,
          supervisorWhoApprove: authId,
          supervisorApprovedAt: new Date(),

          isVerifierApproved: true,
          verifierWhoApprove: authId,
          verifierApprovedAt: new Date(),

          isDenied: false,
          personWhoDenied: null,
          deniedAt: null,
          deniedReason: null,

          kycAt: new Date(),
        };

        await User.update({ isKYC: PENDING },{ where: { id: userId }});

        await makeNotif(
          userId,
          `KYC request has been approved!`,
          `${playerName} your KYC request has been fully verified!, You can now withdraw to your wallet account`,
          "kyc",
          "info",
          userUUID
        );

        await makeLog(
          `${playerName} (player) has been denied by ${personWhoDeniedName} as (verifier) and now approved by ${personWhoTakingActionName} as (Supervisor) the current status is now fully for approved`,
          "user-management",
          "info",
          userId,
          "user"
        );

        await User.update(payload, { where: { uuid: id } })
          .then(() => {
            return successResponse(
              {},
              "User Player is successfully approved!",
              reply
            );
          })
          .catch((err) => {
            return errorResponse(err, reply);
          });
      }
    } else if (type === "deactive") {
      // Notification
      verifiers?.map(async (obj: any) => {
        await makeNotif(
          obj.childId,
          `KYC request has been denied`,
          `${playerName} your KYC request has been denied, because ${reason}`,
          "user-management",
          "info",
          userUUID
        );
      });

      if (actionStatus === "forapproval") {
        const payload = {
          actionStatus: "deactive",

          isDeactivated: true,
          personWhoDeactivated: authId,
          deactivatedAt: new Date(),
          deactivatedReason: reason,

          isSupervisorApproved: true,
          supervisorWhoApprove: authId,
          supervisorApprovedAt: new Date(),

          isVerifierApproved: false,
          verifierWhoApprove: null,

          kycAt: new Date(),
        };

        await User.update({ isKYC: PENDING },{ where: { id: userId }});

        await makeNotif(
          userId,
          `KYC request has been denied!`,
          `${playerName} your KYC request has been denied, because ${reason}`,
          "kyc",
          "info",
          userUUID
        );

        await makeLog(
          `${playerName} (player) has been approved by ${verifierWhoApproveName} as (verifier) and now deactivated by ${personWhoTakingActionName} as (Supervisor) the current status is now fully for deactivated`,
          "user-management",
          "info",
          userId,
          "user"
        );

        await User.update(payload, { where: { uuid: id } })
          .then(() => {
            return successResponse(
              {},
              "User Player is successfully deactivate!",
              reply
            );
          })
          .catch((err) => {
            return errorResponse(err, reply);
          });
      } else if (actionStatus === "new") {
        const payload = {
          actionStatus: "deactive",

          isDeactivated: true,
          personWhoDeactivated: authId,
          deactivatedAt: new Date(),
          deactivatedReason: reason,

          isSupervisorApproved: true,
          supervisorWhoApprove: authId,
          supervisorApprovedAt: new Date(),

          kycAt: new Date(),
        };

        await User.update({ isKYC: PENDING },{ where: { id: userId }});

        await makeNotif(
          userId,
          `KYC request has been denied!`,
          `${playerName} your KYC request has been denied, because ${reason}`,
          "kyc",
          "info",
          userUUID
        );

        await makeLog(
          `${playerName} (player) has been deactived by ${personWhoTakingActionName} as (supervisor) and also verified the player, the current status is now fully for deactivated`,
          "user-management",
          "info",
          userId,
          "user"
        );

        await User.update(payload, { where: { uuid: id } })
          .then(() => {
            return successResponse(
              {},
              "User Player is successfully deactivate!",
              reply
            );
          })
          .catch((err) => {
            return errorResponse(err, reply);
          });
      } else if (actionStatus === "denied") {
        const payload = {
          actionStatus: "deactive",

          isDeactivated: true,
          personWhoDeactivated: authId,
          deactivatedAt: new Date(),
          deactivatedReason: reason,

          isSupervisorApproved: true,
          supervisorWhoApprove: authId,
          supervisorApprovedAt: new Date(),

          isVerifierApproved: false,
          verifierWhoApprove: null,

          isDenied: false,
          personWhoDenied: null,
          deniedReason: null,
          deniedAt: null,

          kycAt: new Date(),
        };

        await User.update({ isKYC: PENDING },{ where: { id: userId }});

        await makeNotif(
          userId,
          `KYC request has been denied!`,
          `${playerName} your KYC request has been denied, because ${reason}`,
          "kyc",
          "info",
          userUUID
        );

        await makeLog(
          `${playerName} (player) has been denied by ${personWhoDeniedName} as (verifier) and now deactivated by ${personWhoTakingActionName} as (Supervisor) the current status is now fully for deactivated`,
          "user-management",
          "info",
          userId,
          "user"
        );

        await User.update(payload, { where: { uuid: id } })
          .then(() => {
            return successResponse(
              {},
              "User Player is successfully deactivate!",
              reply
            );
          })
          .catch((err) => {
            return errorResponse(err, reply);
          });
      }
    } else if (type === "undo") {
      if (actionStatus === "approved") {
        const payload = {
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
        };

        await User.update({ isKYC: NOT_STARTED },{ where: { id: userId }});

        // Notification
        verifiers?.map(async (obj: any) => {
          await makeNotif(
            obj.childId,
            "",
            `${playerName} has been undo by ${personWhoTakingActionName} from approving`,
            "user-management",
            "info",
            userUUID
          );
        });

        await makeLog(
          `${playerName} (player) has been approved by ${personWhoTakingActionName} as the (supervisor) and is now undone by ${personWhoTakingActionName} as the (supervisor). The current status is now pending, waiting for the next action of the verifiers and supervisors.`,
          "user-management",
          "info",
          userId,
          "user"
        );

        await User.update(payload, { where: { uuid: id } })
          .then(() => {
            return successResponse(
              {},
              "User Player is successfully undo!",
              reply
            );
          })
          .catch((err) => {
            return errorResponse(err, reply);
          });
      } else if (actionStatus === "deactive") {
        const payload = {
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
        };

        await User.update({ isKYC: NOT_STARTED },{ where: { id: userId }});

        // Notification
        verifiers?.map(async (obj: any) => {
          await makeNotif(
            obj.childId,
            "",
            `${playerName} has been undo by ${personWhoTakingActionName} from deactivating`,
            "user-management",
            "info",
            userUUID
          );
        });

        await makeLog(
          `${playerName} (player) has been deactived by ${personWhoTakingActionName} as the (supervisor) and is now undone by ${personWhoTakingActionName} as the (supervisor). The current status is now pending, waiting for the next action of the verifiers and supervisors.`,
          "user-management",
          "info",
          userId,
          "user"
        );

        await User.update(payload, { where: { uuid: id } })
          .then(() => {
            return successResponse(
              {},
              "User Player is successfully undo!",
              reply
            );
          })
          .catch((err) => {
            return errorResponse(err, reply);
          });
      }
    } else if (type === "deny") {
      // Notification
      verifiers?.map(async (obj: any) => {
        await makeNotif(
          obj.childId,
          "",
          `${playerName} has been denied by ${personWhoTakingActionName}`,
          "user-management",
          "info",
          userUUID
        );
      });
      if (actionStatus === "forapproval") {
        const payload = {
          actionStatus: "denied",
          isDenied: true,
          personWhoDenied: authId,
          deniedAt: new Date(),
          deniedReason: reason,

          isDeactivated: false,
          personWhoDeactivated: null,
          deactivatedAt: null,
          deactivatedReason: null,

          kycAt: new Date(),
        };

        await User.update({ isKYC: FOR_APPROVAL },{ where: { id: userId }});

        await makeLog(
          `${playerName} (player) has been approved by ${verifierWhoApproveName} as the (verifier) and now denied by ${personWhoTakingActionName} as the (Supervisor). The current status is now waiting for the next action of the verifiers and supervisors.`,
          "user-management",
          "info",
          userId,
          "user"
        );

        await User.update(payload, { where: { uuid: id } })
          .then((res) => {
            return successResponse(
              {},
              "User Player is successfully denied!",
              reply
            );
          })
          .catch((err) => {
            return errorResponse(err, reply);
          });
      } else if (actionStatus === "fordeactive") {
        const payload = {
          actionStatus: "denied",
          isDenied: true,
          deniedAt: new Date(),
          deniedReason: reason,
          personWhoDenied: authId,

          kycAt: new Date(),
        };

        await User.update({ isKYC: FOR_APPROVAL },{ where: { id: userId }});

        await makeLog(
          `${playerName} (player) has been deactived by ${personWhoDeactivated} as the (verifier) and now denied by ${personWhoTakingActionName} as the (Supervisor). The current status is now waiting for the next action of the verifiers and supervisors.`,
          "user-management",
          "info",
          userId,
          "user"
        );

        await User.update(payload, { where: { uuid: id } })
          .then(() => {
            return successResponse(
              {},
              "User Player is successfully denied!",
              reply
            );
          })
          .catch((err) => {
            return errorResponse(err, reply);
          });
      }
    }
  }
};

function generateRandomHexString(length: number) {
  const hexChars = "0123456789abcdef";
  let hexString = "";
  for (let i = 0; i < length; i++) {
    hexString += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
  }
  return hexString;
}

const generateReferralCode = () => {
  return generateRandomHexString(6); // Generate a 12-character hex code
};

const generateAccountId = (mobile: number) => {
  const hash = CryptoJS.SHA256(mobile);
  return parseInt(hash.toString(CryptoJS.enc.Hex).slice(0, 8), 16);
};

function calculateSHA256Hash(input) {
  const hash = CryptoJS.SHA256(input).toString();
  return hash;
}

const generateAccountId15Digit = (mobile: string) => {
  const hash = CryptoJS.SHA256(mobile.toString());
  const hexString = hash.toString(CryptoJS.enc.Hex);

  // Take the first 16 characters (64-bit) of the hexadecimal hash and parse it as an integer
  const part1 = parseInt(hexString.slice(0, 8), 16);
  const part2 = parseInt(hexString.slice(8, 16), 16);

  // Combine parts and ensure 15 digits by formatting the string
  const combined = (part1 * part2).toString().slice(0, 15);

  // Ensure the result is exactly 15 digits long
  return combined.padStart(15, "0");
};

const numWithS = (word, numbers) => {
  return numbers > 1 ? `${word}s` : word;
};

const getNickname = (firstName, lastName, birthdate, mobile, id = 0) => {
  const f2 = firstName.toLowerCase().substring(0, 2);
  const l2 = lastName.toLowerCase().substring(0, 2);
  const [year, month, day] = birthdate.split("-");
  const monthAndDay = `${month}${day}`;

  const mob3 = mobile.slice(-3);

  return `${f2}${l2}${monthAndDay}${mob3}${id}`;
};

const mobilePH = (mobile: any) => {
  if (!mobile) {
    return;
  }
  let phoneNumber = mobile.replace(/^\+63/, "");
  // Check if the number starts with zero
  if (!phoneNumber.startsWith("0")) {
    phoneNumber = "0" + phoneNumber; // Add zero at the beginning if it's missing
  }

  return phoneNumber;
};

const convertUTCToPhilippineTime = (utcDateTime: any) => {
  const utcDate = new Date(utcDateTime);
  utcDate.setHours(utcDate.getHours() + 8); // Add 8 hours for Philippine time
  return utcDate;
};

// Function to create directory if it doesn't exist
const createDirectoryIfNotExists = (directoryPath) => {
  if (!existsSync(directoryPath)) {
    try {
      mkdirSync(directoryPath, { recursive: true });
      console.log(`Directory created: ${directoryPath}`);
    } catch (error) {
      console.error(`Error creating directory ${directoryPath}:`, error);
    }
  } else {
    console.log(`Directory already exists: ${directoryPath}`);
  }
};

const invalidRoleAuth = (role:string, mode:string) => {
  if (role === ROLES.PLAYER.name && mode === ADMIN) {
    return true
  }else if(role === ROLES.MODERATOR.name && mode === ADMIN){
    return true
  }else if(role === ROLES.HOST.name && mode === ADMIN){
    return true
  }else if(role === ROLES.CSR.name && mode === ADMIN){
    return true
  }else if(role === ROLES.AUDITOR.name && mode === GAME){
    return true
  }else if(role === ROLES.ADMINISTRATOR.name && mode === GAME){
    return true
  }else if(role === ROLES.SUPERADMIN.name && mode === GAME){
    return true
  }else if(role === ROLES.SUPERAGENT.name && mode === GAME){
    return true
  }else if(role === ROLES.MASTERAGENT.name && mode === GAME){
    return true
  }else if(role === ROLES.AGENT.name && mode === GAME){
    return true
  }else if(role === ROLES.OPERATOR.name && mode === GAME){
    return true
  }else if(role === ROLES.VERIFIER.name && mode === GAME){
    return true
  }else if(role === ROLES.SUPERVISOR.name && mode === GAME){
    return true
  }else if(role === ROLES.ACCOUNTING.name && mode === GAME){
    return true
  }else if(role === ROLES.TREASURY.name && mode === GAME){
    return true
  }else if(role === ROLES.HOST_MONITORING.name && mode === GAME || role === ROLES.HOST_MONITORING.name && mode === ADMIN){
    return true
  }else if(role === ROLES.CASHIER.name && mode === GAME){
    return true
  }else{
    return false
  }
}

const capitalizeFirstLetter = (string: any) => {
  if (string) {
    const allLowChars = string.toLowerCase();
    return allLowChars[0].toUpperCase() + allLowChars.slice(1);
  }
  return "";
};

const activatePromo = async (userId:number, promotype:string) => {
    const userPromo = await UserPromo.findOne({ 
      include: [
        {
          model:Promo,
          where: { name: promotype }
        },
        {
          model:User,
          attributes:["uuid"],
          include: [
            {
              model:Wallet,
            },
          ]
        }
      ],
      where: { userId }
    });

    if(!userPromo){
        const promoModel = await Promo.findOne({ where: { name: promotype } })
    
        await UserPromo.create({
          userId,
          promoId: promoModel?.id,
          isDeposited: 0
        })

        if(promotype === WELCOME_BONUS_PROMO){
          await makeNotif(
            userId,
            "₱20 Welcome Bonus! Lets Play & Win!",
            `Welcome to Karera.Live! \n 
            As a gift to our new players, receive this ₱20 Welcome Bonus! This is automatically added to your Karera.Live wallet balance. \n
            `,
            "promo",
            "info",
            userPromo?.User?.uuid
          );

          await makeLog(
            `Player Id ${userId} receive a ₱20 Welcome Bonus Promo and now ready to claim`,
            "create",
            "info",
            userId,
            "promo",
            'Player Receive ₱20 Welcome Bonus Promo'
          );

        }else if(promotype === REFER_EARN_PROMO){
          await makeNotif(
            userId,
            "₱20 Referral Bonus! Thank you for the referral!",
            `Yay! Salamat sa pag-refer! Mas maraming players, mas maraming pwedeng manalo! \n 
             As an appreciation gift, tanggapin mo ang ₱20 Referral Bonus na ito! This is automatically added to your Karera. Live wallet balance. \n
            `,
            "promo",
            "info",
            userPromo?.User?.uuid
          );

          await makeLog(
            `Player Id ${userId} receive a ₱20 Referral Bonus Promo and now ready to claim`,
            "create",
            "info",
            userId,
            "promo",
            'Player Receive ₱20 Referral Bonus Promo'
          );
        }else if(promotype === BITHRDAY_BENTE_PROMO){
          await makeNotif(
            userId,
            `Happy Birthday! May Birthday Gift kami sa’yo!`,
            `Uy! Birthday mo ngayon? Bigyan ng Benta yan! \n 
             At dahil birthday mo, may P20 bonus gift kami para sa’yo! This is automatically added to your Karera.Live wallet balance.`,
            "promo",
            "info",
            userPromo?.User?.uuid
          );

          await makeLog(
            `Player Id ${userId} receive a Happy Birthday Bonus Promo and now ready to claim`,
            "create",
            "info",
            userId,
            "promo",
            'Player Receive Happy Birthday Bonus Promo'
          );
        }else if(promotype === KRLFDRV01){
          await makeNotif(
            userId,
            `KRLFDRV01 claimed succesfully`,
            `KRLFDRV01 voucher was claimed succesfully \n 
            Go check your wallet balance if 300 pesos was loaded to your balance`,
            "promo",
            "info",
            userPromo?.User?.uuid
          );

          await makeLog(
            `Player Id ${userId} was claimed a voucher KRLFDRV01 worth 300`,
            "create",
            "info",
            userId,
            "promo",
            'Player Claimed KRLFDRV01 Voucher Promo'
          );
        }
    }

}

const capitalizeAll = (string: any) => {
  if (string) {
    return string.toUpperCase();
  }
  return "";
};

const registrationViaQR = async (referralCode:any, user:any, reply:any) => {
  const {  id: userId, mobile, uuid } = user
  const playerName = user.get("playerName");
  let typeRedirect = ""
  if (referralCode !== null) {
    const userSA = await User.findOne({
      attributes: [
        "id",
        "mobile",
        "role",
        [
          Sequelize.fn(
            "CONCAT",
            Sequelize.col("firstName"),
            " ",
            Sequelize.col("lastName")
          ),
          "inviterName",
        ],
      ],
      where: { referralCodeForSA: referralCode },
    });

    const userMA = await User.findOne({
      attributes: [
        "id",
        "mobile",
        "role",
        [
          Sequelize.fn(
            "CONCAT",
            Sequelize.col("firstName"),
            " ",
            Sequelize.col("lastName")
          ),
          "inviterName",
        ],
      ],
      where: { referralCodeForMA: referralCode },
    });

    const userAgent = await User.findOne({
      attributes: [
        "id",
        "mobile",
        "role",
        [
          Sequelize.fn(
            "CONCAT",
            Sequelize.col("firstName"),
            " ",
            Sequelize.col("lastName")
          ),
          "inviterName",
        ],
      ],
      where: { referralCodeForAgent: referralCode },
    });

    const userPlayer = await User.findOne({
      attributes: [
        "id",
        "role",
        "mobile",
        "role",
        [
          Sequelize.fn(
            "CONCAT",
            Sequelize.col("firstName"),
            " ",
            Sequelize.col("lastName")
          ),
          "inviterName",
        ],
      ],
      where: { referralCodeForPlayer: referralCode },
    });

    let parts = referralCode.split("-");
    let roleInitial = parts[0];

    const playerMobile = mobile;
    const playerNameVal = playerName === " " ? playerMobile : playerName;

    if (roleInitial === "SA") {
      if (userSA === null) {
        const msgErr =
          "Your referral link is invalid, Please register the right referral link";

        return errorResponse(msgErr, reply, "custom");
      } else {
        const inviterName = userSA.get("inviterName");
        const inviterMobile = userSA.mobile;
        const inviterNameVal =
          // @ts-ignore
          inviterName === " " ? inviterMobile : inviterName;
        const referralSA = await User.count({
          include: [
            {
              model: Referral,
              as: "inviter",
              attributes: [],
              where: { inviterId: userSA.id, playerId: userId },
            },
          ],
        });

        if (referralSA === 0) {
          if (user) {
            user.update({
              role: "masteragent",
            });
          }
          Referral.create({
            inviterId: userSA.id,
            playerId: userId,
            commission: "3",
            userType: "online"
          })
            .then(async () => {
                await makeNotif(
                userSA.id,
                "A new masteragent has been registered to your referral link",
                `${playerNameVal} has been registered to your referral link.`,
                "referral",
                "info",
                uuid
              );
              await makeLog(
                `${playerNameVal} (masteragent) has been registered to ${inviterNameVal} referral's link.`,
                "create",
                "info",
                userId,
                "referral",
                'Masteragent registered on superagent'
              );
            })
            .catch((error) => {
              return errorResponse(error, reply, "custom");
            });
        } 
        // else {
        //   const msgErr =
        //     "You account has been already registered, create a new account";

        //   return errorResponse(msgErr, reply, "custom");
        // }
      }
      typeRedirect = "admin"
    } else if (roleInitial === "MA") {
      if (userMA === null) {
        const msgErr =
          "Your referral link is invalid, Please register the right referral link";

        return errorResponse(msgErr, reply, "custom");
      } else {
        const inviterName = userMA.get("inviterName");
        const inviterMobile = userMA.mobile;
        const inviterNameVal =
          // @ts-ignore
          inviterName === " " ? inviterMobile : inviterName;
        const referralMA = await User.count({
          include: [
            {
              model: Referral,
              as: "inviter",
              attributes: [],
              where: { inviterId: userMA.id, playerId: userId },
            },
          ],
        });

        if (referralMA === 0) {
          if (user) {
            user.update({
              role: "agent",
            });
          }
          Referral.create({
            inviterId: userMA.id,
            playerId: userId,
            userType: "online"
          })
            .then(async () => {
              await makeNotif(
                userMA.id,
                "A new agent has been registered to your referral link",
                `${playerNameVal} has been registered to your referral link.`,
                "referral",
                "info",
                uuid
              );
              await makeLog(
                `${playerNameVal} (agent) has been registered to ${inviterNameVal} referral's link.`,
                "create",
                "info",
                userId,
                "referral",
                'Agent registered on Masteragent'
              );
            })
            .catch((error) => {
              return errorResponse(error, reply, "custom");
            });
        } 
        // else {
        //   const msgErr =
        //     "You account has been already registered, create a new account";

        //   return errorResponse(msgErr, reply, "custom");
        // }
      }
      typeRedirect = "admin"
    } else if (roleInitial === "A") {
      if (userAgent === null) {
        const msgErr =
          "Your referral link is invalid, Please register the right referral link";

        return errorResponse(msgErr, reply, "custom");
      } else {
        const inviterName = userAgent.get("inviterName");
        const inviterMobile = userAgent.mobile;
        const inviterNameVal =
          // @ts-ignore
          inviterName === " " ? inviterMobile : inviterName;

        let AgentCommissionFloat:any = "0.00"
        if(userAgent.role === AGENT){
          const referralModel = await Referral.findOne({ attributes:["commission"], where: { playerId: userAgent.id }})
          AgentCommissionFloat =  (3 - Number(referralModel?.commission)) 
        }else  if(userAgent.role === MASTERAGENT){
          AgentCommissionFloat = "3"
        }

        const referralAgent = await User.count({
          include: [
            {
              model: Referral,
              as: "inviter",
              attributes: [],
              where: { inviterId: userAgent.id, playerId: userId },
            },
          ],
        });

        if (referralAgent === 0) {
          if (user) {
            user.update({
              role: "player",
            });
          }
          Referral.create({
            inviterId: userAgent.id,
            playerId: userId,
            commission:AgentCommissionFloat,
            userType: "online"
          })
            .then(async () => {
              await makeNotif(
                userAgent.id,
                "A new player has been registered to your referral link",
                `${playerNameVal} has been registered to your referral link.`,
                "referral",
                "info",
                uuid
              );
              await makeLog(
                `${playerNameVal} (player) has been registered to ${inviterNameVal} referral's link.`,
                "create",
                "info",
                userId,
                "referral",
                'Player registered on Agent'
              );
            })
            .catch((error) => {
              return errorResponse(error, reply, "custom");
            });
        } 
        // else {
        //   const msgErr =
        //     "You account has been already registered, create a new account";

        //   return errorResponse(msgErr, reply, "custom");
        // }
      }
      typeRedirect = "game"
    }else if (roleInitial === "P") { 
      if (userPlayer === null) {
            const msgErr =
              "Your referral link is invalid, Please register the right referral link";

            return errorResponse(msgErr, reply, "custom");
      } else {
        const inviterName = userPlayer.get("inviterName");
        const inviterMobile = userPlayer.mobile;
        const inviterNameVal =
          // @ts-ignore
        inviterName === " " ? inviterMobile : inviterName;

        const referralPlayer = await User.count({
          include: [
            {
              model: ReferralPlayer,
              as: "referralPlayerInviter",
              attributes: [],
              where: { inviterId: userPlayer.id, playerId: userId },
            },
          ],
        });

        if (referralPlayer === 0) {
          if (user) {
            user.update({
              role: "player",
            });
          }
          ReferralPlayer.create({
            inviterId: userPlayer.id,
            playerId: userId,
          })
            .then(async () => {
              await makeNotif(
                userPlayer.id,
                "A referee has been registered to your referral link",
                `${playerNameVal} has been registered to your referral link.`,
                "referral",
                "info",
                uuid
              );
              await makeLog(
                `${playerNameVal} (referee) has been registered to ${inviterNameVal} referral's link.`,
                "create",
                "info",
                userId,
                "referral",
                'Referee registered on Player'
              );
              
              const transactionModel = await Transaction.findOne({
                where: { wallet_id: userPlayer.id, type: DEPOSIT }, 
                order: [['createdAt', 'ASC']] 
              });
              const referralPlayerCount = await ReferralPlayer.count({ where:{ inviterId:userPlayer.id } })

              const transFirst = transactionModel?.amount
              const isTransFirst500 = Number(transFirst) >= 500
              const isHaveReferralPlayer = Number(referralPlayerCount) > 0
             
              if(isTransFirst500 && isHaveReferralPlayer){
                  await activatePromo(userPlayer.id, REFER_EARN_PROMO)
              }
              
            })
            .catch((error) => {
              return errorResponse(error, reply, "custom");
            });
        } 
      }
      typeRedirect = "game"
    } else {
      const msgErr =
        "Your referral link is invalid, Please register the right referral link";

      return errorResponse(msgErr, reply, "custom");
      
    }
  }
  return typeRedirect;
}

const getRedirectByRole = (role:any) => {
  let redirectTo = ""
  if(role === ROLES.SUPERADMIN.name){
    redirectTo = "admin"
  }else if (role === ROLES.ADMINISTRATOR.name){
    redirectTo = "admin"
  }else if (role === ROLES.SUPERAGENT.name){
    redirectTo = "admin"
  }else if (role === ROLES.MASTERAGENT.name){
    redirectTo = "admin"
  }else if (role === ROLES.AGENT.name){
    redirectTo = "admin"
  }else if (role === ROLES.OPERATOR.name){
    redirectTo = "admin"
  }else if (role === ROLES.VERIFIER.name){
    redirectTo = "admin"
  }else if (role === ROLES.SUPERVISOR.name){
    redirectTo = "admin"
  }else if (role === ROLES.SUPERAGENT.name){
    redirectTo = "admin"
  }else if (role === ROLES.MODERATOR.name){
    redirectTo = "operator"
  }else if (role === ROLES.PLAYER.name){
    redirectTo = "game"
  }else if (role === ROLES.HOST.name){
    redirectTo = "game"
  }else if (role === ROLES.CSR.name){
    redirectTo = "operator"
  }else if (role === ROLES.AUDITOR.name){
    redirectTo = "admin"
  }else if (role === ROLES.CASHIER.name){
    redirectTo = "admin"
  }else if (role === ROLES.TREASURY.name){
    redirectTo = "admin"
  }else if (role === ROLES.HOST_MONITORING.name){
    redirectTo = "operator"
  }
  return redirectTo;
}

function toFixedTrunc(x:any, n:any) {
  const v = (typeof x === 'string' ? x : x.toString()).split('.');
  if (n <= 0) return v[0];
  let f = v[1] || '';
  if (f.length > n) return `${v[0]}.${f.substr(0,n)}`;
  while (f.length < n) f += '0';
  return `${v[0]}.${f}`
}

const contructMoney = (amount:any) => {
  // Convert the number to a string
  let numericAmount  = parseFloat(amount);
  let amountStr = numericAmount.toString();

  // Split at the decimal point
  let parts = amountStr.split(".");

  // Get the whole part (before the decimal)
  let wholePart = parts[0];

  // Get the fractional part (after the decimal), and take the first 2 digits
  let fractionalPart = parts[1] ? parts[1].slice(0, 2) : '00';

  // Combine the whole part and the formatted fractional part
  return `${wholePart}.${fractionalPart}`;
}

const displayMoney = (amount:any) => {
  // Ensure amount is not undefined, null, or NaN
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "₱0.00"; // Return a default value if invalid
  }

  const trimmedAmount = contructMoney(amount);
  
  // Format and return as a string with the peso symbol
  return `₱${parseFloat(trimmedAmount).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const displayNumber = (amount:any) => {
  // Ensure amount is not undefined, null, or NaN
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "0.00"; // Return a default value if invalid
  }

  const trimmedAmount = contructMoney(amount);
  
  // Format and return as a string with the peso symbol
  return trimmedAmount;
}


export {
  getZeroNineInPhoneNo,
  successResponse,
  errorResponse,
  generateOtp,
  executeVerifierActions,
  makeLog,
  makeNotif,
  findChangedValues,
  createOrUpdateUserGroup,
  generateReferralCode,
  numWithS,
  generateAccountId,
  getNickname,
  generateAccountId15Digit,
  mobilePH,
  convertUTCToPhilippineTime,
  createDirectoryIfNotExists,
  invalidRoleAuth,
  calculateSHA256Hash,
  capitalizeFirstLetter,
  capitalizeAll,
  activatePromo,
  registrationViaQR,
  getRedirectByRole,
  displayMoney,
  toFixedTrunc,
  displayNumber,
  contructMoney
};
