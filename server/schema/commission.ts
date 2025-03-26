const getCommissionTransactions = {
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
                default: "The commission transaction is successfuly fetch!",
            },
            },
        },
    },
  };
  
  
  export default {
    getCommissionTransactions,
  };
  