const getAllReferrals = {
  querystring: {
    type: "object",
    properties: {
      filter: { type: "string" },
      page: { type: "integer" },
      size: { type: "integer", minimum: 1 },
      sort: { type: "string" }, // Define 'sort' as a string parameter
    },
    required: ["page", "size"],
  },
  response: {
    200: {
      type: "array",
      items: {
        type: "object",
        properties: {
          inviterId: { type: "integer" },
          playerId: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};

const getReferralsPlayerActivity = {
  querystring: {
    type: "object",
    properties: {
      filter: { type: "string" },
      page: { type: "integer" },
      size: { type: "integer", minimum: 1 },
      sort: { type: "string" }, 
      userId: {
        type: 'integer',
        nullable: true,  // Allow null values
      },
    },
    required: ["page", "size"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: {
          type: "string",
          default: "The player activity is successfuly fetch!",
        },
      },
    },
  },
};

const getYearCommission = {
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: {
          type: "string",
          default: "Year Commission is successfuly fetch!",
        },
      },
    },
  },
}

const getUpdatedBalance = {
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: {
          type: "string",
          default: "Updated Balance is successfuly fetch!",
        },
      },
    },
  },
}

const updateCommission = {
  body: {
    type: "object",
    properties: {
      refId: { type: "integer" },
      operatorCommission: { type: "number", format: "float" },
      representativeCommission: { type: "number", format: "float" },
      representativeOldCommission: { type: "number", format: "float" },
      inviterId: { type: "integer" },
      playerId: { type: "integer" },
    },
    required: [
      "refId",
      "operatorCommission",
      "representativeCommission",
      "representativeOldCommission",
      "inviterId",
      "playerId"
    ],
  },
}

const cancelCommission = {
  body: {
    type: "object",
    properties: {
      refId: { type: "integer" },
      inviterId: { type: "integer" },
      playerId: { type: "integer" },
    },
    required: [
      "refId",
      "inviterId",
      "playerId"
    ],
  },
}



export default {
  getAllReferrals,
  getReferralsPlayerActivity,
  getYearCommission,
  getUpdatedBalance,
  updateCommission,
  cancelCommission
};
