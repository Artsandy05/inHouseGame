const getGames = {
  querystring: {
    type: "object",
    properties: {},
    required: [],
  },
  response: {
    200: {
      type: "array",
      items: {
        type: "object",
        properties: {},
      },
    },
  },
};

const addGameDeposit = {
  body: {
    type: "object",
    properties: {
      creditType: { type: "string" },
      credit: { type: "number" },
      accountNumber: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: {
          type: "string",
          default: "Player attempting to deposit",
        },
      },
    },
  },
};

const getGameTransactionStatus = {
  body: {
    type: "object",
    properties: {
      operation_id: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: {
          type: "string",
          default: "Successfully fetch QRPH",
        },
      },
    },
  },
};

const addGameWithdraw = {
  body: {
    type: "object",
    properties: {
      creditType: { type: "string" },
      credit: { type: "number" },
      accountNumber : { type: "string" },
      accountId: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: {
          type: "string",
          default: "Player attempting to withdraw",
        },
      },
    },
  },
};

const sendCredits = {
  body: {
    type: "object",
    properties: {
      userId: { type: "string", format: "uuid" },
      credit: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: {
          type: "string",
          default: "User add credit to player/agent successfully!",
        },
      },
    },
  },
};

const deductCredits = {
  body: {
    type: "object",
    properties: {
      userId: { type: "string", format: "uuid" },
      credit: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: {
          type: "string",
          default: "User deduct credit to player/agent successfully!",
        },
      },
    },
  },
};

const getGameTransactions = {
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
        properties: {},
      },
    },
  },
};

const getGameOffering = {
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
          id: { type: "integer" },
          name: { type: "string" },
          label: { type: "string" },
          isActive: { type: "boolean" },
          banner: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};

const updateGameOffering = {
  params: {
    type: "object",
    properties: {
      id: { type: "integer" }, // Define id as a UUID string
    },
    required: ["id"],
  },
  body: {
    type: "object",
    properties: {
      label: { type: "string" },
      isActive: { type: "boolean" },
    },
    required: ["label","isActive"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: { type: "string", default: "User updated successfully!" },
      },
    },
  },
};

export default {
  getGames,
  addGameDeposit,
  getGameTransactionStatus,
  addGameWithdraw,
  sendCredits,
  deductCredits,
  getGameTransactions,
  getGameOffering,
  updateGameOffering
};
