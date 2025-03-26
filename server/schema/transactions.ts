const getAllTransactions = {
  querystring: {
    type: "object",
    properties: {
      filter: { type: "string" },
    },
  },
  response: {
    200: {
      type: "array",
      items: {
        type: "object",
        properties: {
          wallet_id: { type: "integer" },
          amount: { type: "integer" },
          type: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};

const getAllMerchantTransactions = {
  querystring: {
    type: "object",
    properties: {
      filter: { type: "string" },
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
          default: "The all merchant transaction is successfuly fetch!",
        },
      },
    },
  },
};


const getMerchantTransactions = {
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
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: {
          type: "string",
          default: "The merchant transaction is successfuly fetch!",
        },
      },
    },
  },
};

const getTransactions = {
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
          wallet_id: { type: "integer" },
          amount: { type: "integer" },
          type: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};

const getGrossGamingRevenues = {
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
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: {
          type: "string",
          default: "The Gross Gaming Revenues is successfuly fetch!",
        },
      },
    },
  },
};


const getGrossGamingRevenuesV1 = {
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
      type: "object",
      properties: {
        status: { type: "string", default: "API_SUCCESS" },
        data: { type: "object", default: {} },
        message: {
          type: "string",
          default: "The Gross Gaming Revenues Version 1 is successfuly fetch!",
        },
      },
    },
  },
};


export default {
  getTransactions,
  getGrossGamingRevenues,
  getGrossGamingRevenuesV1,
  getMerchantTransactions,
  getAllTransactions,
  getAllMerchantTransactions
};
