import { successResponse, errorResponse, makeNotif, capitalizeFirstLetter, makeLog } from "../utils/logic";
import Notification from "../models/Notification";
import User from "../models/User";
import { Op, FindOptions } from "sequelize";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { FOR_APPROVAL, GAME, IDLE, REFERRAL } from "../constants";
import { canAccessAdmin } from "../utils/permissions";
import Referral from "../models/Referral";
import commission from "./commission";
const { ROLES } = require("../constants/permission");
dayjs.extend(utc);

interface NotificationsModelAttributes {
  id: number;
  functionality: string;
  message: string;
  module: string;
  reference: string;
  level: string;
  associatedId: number;
  associatedType: string;
  updatedAt: Date;
  createdAt: Date;
}

type NotificationsAttributes = keyof NotificationsModelAttributes;

const getNotifications = async (request: any, reply: any) => {
  const id = request.user.id;
  //   const userRole = request.userRole;

  const { page, size, sort, type, filter, status } = request.query;

  const [columnName, direction] = sort && sort.split(",");
  const order = [[columnName, direction.toUpperCase()]] as [
    NotificationsAttributes,
    string
  ][];

  const whereConditions = {};
  const whereUserConditions = {};

  if (filter) {
    // Split the filter string by '&' to get individual filter conditions
    const filterConditions = filter.split("&");

    filterConditions.forEach((condition) => {
      const [columnFilter, valueFilter] = condition.split("=");
      const decodedValue = decodeURIComponent(valueFilter);

      if (columnFilter === "createdAt") {
        const dateConditions = {
          createdAt: { [Op.substring]: decodedValue },
        };
        whereConditions[Op.or] = dateConditions;
        whereConditions[Op.or] = dateConditions;
      } else if (columnFilter === "updatedAt") {
        const dateConditions = {
          updatedAt: { [Op.substring]: decodedValue },
        };
        whereConditions[Op.or] = dateConditions;
      } else {
        whereConditions[columnFilter] = { [Op.like]: `%${decodedValue}%` };
      }
    });
  }

  //  @ts-ignore
  whereUserConditions["id"] = id;

  let newPage = 0;
  if (type === GAME) {
    newPage = page === 1 ? 0 : page > 1 ? page - 1 : page;
  } else {
    newPage = page * size;
  }
  const offset = newPage * size;

  const options: FindOptions = {
    //  @ts-ignore
    attributes: [
      "id",
      "title",
      "message",
      "type",
      "module",
      "reference",
      "isRead",
      "referenceStatus",
      "createdAt",
      "updatedAt",
    ] as NotificationsModelAttributes[],
    include: [
      {
        model: User,
        as: "user",
        attributes: ["uuid"],
        where: whereUserConditions,
      },
    ],
    where: whereConditions,
    offset,
    limit: size,
  };

  // Now you can safely check if "updatedAt" is a valid attribute
  if (
    columnName === "updatedAt" &&
    ("updatedAt" as keyof NotificationsModelAttributes)
  ) {
    order.push(["updatedAt", direction.toUpperCase()]);
    order.push(["createdAt", direction.toUpperCase()]); // Secondary sort by createdAt
  }

  options.order = order;

  const notifications = await Notification.findAll(options);
  const totalCount = await Notification.count(options);
  const totalCountUnread = await Notification.count({
    include: [
      {
        model: User,
        as: "user",
        where: { id: id }, // Filter by userId in the User model
      },
    ],
    where: { isRead: false },
  });

  const payload = {
    content: notifications,
    totalCount,
    totalCountUnread,
  };

  if (notifications) {
    return successResponse(
      payload,
      "Get All Notification is successfully fetched!",
      reply
    );
  } else {
    return errorResponse("Notifications not found", reply, "custom");
  }
};

const getNotificationsCustom = async (request: any, reply: any) => {
  // canAccessAdmin(request.userRole, reply)

  const id = request.user.id;

  const whereUserConditions = {};
  whereUserConditions["id"] = id;

  const options: FindOptions = {
    //  @ts-ignore
    attributes: [
      "id",
      "message",
      "type",
      "module",
      "reference",
      "isRead",
      "createdAt",
      "updatedAt",
    ] as NotificationsModelAttributes[],
    include: [
      {
        model: User,
        as: "user",
        attributes: ["uuid"],
        where: { id }, // Filter by userId in the User model
      },
    ],
    limit: 5,
  };
  const order = [];
  order.push(["createdAt", "desc"]); // Secondary sort by createdAt
  options.order = order;

  const notifications = await Notification.findAll(options);

  const totalCount = await Notification.count({
    include: [
      {
        model: User,
        as: "user",
        where: { id: id }, // Filter by userId in the User model
      },
    ],
    where: { isRead: false },
  });

  const payload = {
    content: notifications,
    totalCount,
  };

  if (notifications) {
    return successResponse(
      payload,
      "Get All Notification Custom is successfully fetched!",
      reply
    );
  } else {
    return errorResponse("Notifications not found", reply, "custom");
  }
};

const readNotification = async (request: any, reply: any) => {
  const notificationId = request.params.id; // Get user ID from URL params
  const { isRead } = request.body;

  const [updatedRows] = await Notification.update(
    { isRead }, 
    { where: { id: notificationId } }
  );

  if (updatedRows) {
    return successResponse(isRead, "Notification is successfully read!", reply);
  } else {
    return errorResponse("Notifications failed to read", reply, "custom");
  }
};

const approveNotificationCommission = async (request: any, reply: any) => {
  const refId = request.body.refId; // Get user ID from URL params

  try {
    const notification = await Notification.findOne(
      { where: { id: refId, referenceStatus: FOR_APPROVAL }}
    )
    const referenceStatus = notification?.referenceStatus
    const referenceId = notification?.reference

    if(referenceStatus === FOR_APPROVAL){
      const reference = await Referral.findOne(
        { where: { id: referenceId }}
      );

      const playerId = reference?.playerId
      const inviterId = reference?.inviterId
      const suggestedCommissionMasterAgent = reference?.suggestedCommission
      const suggestedCommissionAgent = reference?.suggestedCommissionAgent

      // let suggestedCommissionMasterAgentVar = (Number(reference?.suggestedCommission) * 100)
      // let commissionMasterAgentVar = (Number(reference.commission) * 100)  
      // let suggestedCommissionAgentVar = (Number(reference?.suggestedCommissionAgent) * 100) || 0
      // let commissionAgentVar = (Number(reference?.commissionAgent) * 100) || 0
      let suggestedCommissionMasterAgentVar = reference?.suggestedCommission
      let commissionMasterAgentVar = reference.commission
      let suggestedCommissionAgentVar = reference?.suggestedCommissionAgent || 0
      let commissionAgentVar = reference?.commissionAgent || 0

      /* Get only  referee */
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

        const agentFirstName = AgentUser?.firstName
        const agentLastName = AgentUser?.lastName

        const masteragentFirstName = MasteragentUser?.firstName
        const masteragentLastName = MasteragentUser?.lastName
      
        const fullnameMasteragent = `${masteragentFirstName} ${masteragentLastName}`
        const fullnameAgent  = `${agentFirstName} ${agentLastName}`

        await Referral.update(
          { 
            commission: suggestedCommissionMasterAgent, 
            commissionAgent: suggestedCommissionAgent,
            suggestedCommission: "0.00",
            suggestedCommissionAgent: "0.00",
            suggestedCommisionStatus:"idle",
            suggestedCommissionUpdatedAt:new Date(),
          },
          { where: { playerId, inviterId }}
        );

        const referenceAgents = await Referral.findAll(
          { where: { inviterId: playerId }}
        );

        if(referenceAgents.length === 0){
          await makeNotif(
            inviterId,
            `Approved change request commission percentage`,
            `Good day, ${capitalizeFirstLetter(masteragentFirstName)}!  
            Your Representative - ${fullnameAgent}
            has been approved the 
            percentage from ${commissionAgentVar}% to ${suggestedCommissionAgentVar}% 
            and your percentage commission changed from ${commissionMasterAgentVar}% to ${suggestedCommissionMasterAgentVar}%. \n`,
            "referral",
            "info",
            referenceId,
            null
          );
  
          await makeLog(
            `${fullnameAgent} (representative) has been approved the change commission request of ${fullnameMasteragent} 
            from ${commissionAgentVar}% to ${suggestedCommissionAgentVar}%, and the operator percentage commission changed from 
            ${commissionMasterAgentVar}% to ${suggestedCommissionMasterAgentVar}%. `,
            "referral",
            "success",
            playerId,
            "referral"
          );
  
          notification.update({
            referenceStatus: null
          })
        }

        if(referenceAgents.length > 0){
          referenceAgents.map(async (refAgent)=> {
            const commissionFloat = refAgent?.suggestedCommission
            const updatePromises = await Referral.update(
              { 
                commission:commissionFloat, 
                suggestedCommission: "0.00",
                suggestedCommisionStatus:"idle",
                suggestedCommissionUpdatedAt:new Date(),
              },
              { where: { inviterId: playerId }}
            );

            await Promise.all(updatePromises);
          })

          /*
          await makeNotif(
            inviterId,
            `Approved change request commission percentage`,
            `Good day, ${capitalizeFirstLetter(masteragentFirstName)}! 
            Your Representative - ${fullnameAgent}
            has been approved the 
            percentage from ${commissionAgentVar}% to ${suggestedCommissionAgentVar}% 
            and your percentage commission changed from ${commissionMasterAgentVar}% to ${suggestedCommissionMasterAgentVar}%. \n`,
            "referral",
            "info",
            refId,
            null
          );
  
          await makeLog(
            `${fullnameAgent} (representative) has been approved the change commission request of ${fullnameMasteragent} 
            from ${commissionAgentVar}% to ${suggestedCommissionAgentVar}%, and the operator percentage commission changed from 
            ${commissionMasterAgentVar}% to ${suggestedCommissionMasterAgentVar}%. `,
            "referral",
            "success",
            playerId,
            "referral"
          );
          */

          notification.update({
            referenceStatus: null
          })
        }
      
    return successResponse({}, "Approving change commission request is successfully exucuted!", reply);

    }else{
      return errorResponse(`Your request is already expired`, reply, "custom");
    }

  } catch (e){
    return errorResponse("Approving change commission request encounter error", reply, "custom");
  }
}

const declineNotificationCommission = async (request: any, reply: any) => {
  const refId = request.body.refId; // Get user ID from URL params

  try {
    const notification = await Notification.findOne(
      { where: { id: refId, referenceStatus: FOR_APPROVAL }}
    )

    const referenceStatus = notification?.referenceStatus
    const referenceId = notification?.reference

    if(referenceStatus === FOR_APPROVAL){
      const reference = await Referral.findOne(
        { where: { id: referenceId }}
      );

      const playerId = reference?.playerId
      const inviterId = reference?.inviterId
      const suggestedCommissionMasterAgent = reference?.suggestedCommission
      const suggestedCommissionAgent = reference?.suggestedCommissionAgent

      let suggestedCommissionMasterAgentVar = (Number(reference?.suggestedCommission) * 100)
      let commissionMasterAgentVar = (Number(reference.commission) * 100)  
      let suggestedCommissionAgentVar = (Number(reference?.suggestedCommissionAgent) * 100) || 0
      let commissionAgentVar = (Number(reference?.commissionAgent) * 100) || 0


      /* Get only  referee */
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

      const agentFirstName = AgentUser?.firstName
      const agentLastName = AgentUser?.lastName

      const masteragentFirstName = MasteragentUser?.firstName
      const masteragentLastName = MasteragentUser?.lastName
    
      const fullnameMasteragent = `${masteragentFirstName} ${masteragentLastName}`
      const fullnameAgent  = `${agentFirstName} ${agentLastName}`

      await Referral.update(
        { 
          suggestedCommission: "0.00",
          suggestedCommissionAgent: "0.00",
          suggestedCommisionStatus:"idle",
          suggestedCommissionUpdatedAt:new Date(),
        },
        { where: { playerId, inviterId }}
      );

 
      const referenceAgents = await Referral.findAll(
        { where: { inviterId: playerId }}
      );

      if(referenceAgents.length === 0){
        await makeNotif(
          inviterId,
          `Request to change commission percentage was declined`,
          `Good day, ${capitalizeFirstLetter(masteragentFirstName)}! \n 
          Your Representative - ${fullnameAgent}
          was declined your change request of his commission \n`,
          "referral",
          "info",
          referenceId,
          null
        );
  
        await makeLog(
        `${fullnameAgent} (representative) was declined ${fullnameMasteragent} (operator) change commission request`,
          "referral",
          "cancelled",
          playerId,
          "referral"
        );

        notification.update({
          referenceStatus: null
        })
      }

      if(referenceAgents.length > 0){
        referenceAgents.map(async (refAgent)=> {
          const updatePromises = await Referral.update(
            { 
              suggestedCommission: "0.00",
              suggestedCommissionAgent: "0.00",
              suggestedCommisionStatus:"idle",
              suggestedCommissionUpdatedAt:new Date(),
            },
            { where: { inviterId: playerId }}
          );

          await Promise.all(updatePromises);
        })
      }
 
      /*
      await makeNotif(
        inviterId,
        `Request to change commission percentage was declined`,
        `Good day, ${capitalizeFirstLetter(masteragentFirstName)}! \n 
        Your Representative - ${fullnameAgent}
        was declined your change request of his commission \n`,
        "referral",
        "info",
        refId,
        null
      );

      await makeLog(
      `${fullnameAgent} (representative) was declined ${fullnameMasteragent} (operator) change commission request`,
        "referral",
        "cancelled",
        playerId,
        "referral"
      );
      */

      return successResponse({}, "Declining change commission request is successfully exucuted!", reply);

    }else{
      return errorResponse(`Your request is already expired`, reply, "custom");
    }

  } catch (e){
    return errorResponse("Declining change commission request encounter error", reply, "custom");
  }
}


export default { 
  getNotifications, 
  readNotification, 
  getNotificationsCustom, 
  approveNotificationCommission,
  declineNotificationCommission
};
