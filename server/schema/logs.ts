const getAllLogs = {
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
          functionality: { type: "string" },
          message: { type: "string" },
          level: { type: "string" },
          associatedId: { type: "integer" },
          associatedType: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};

export default {
  getAllLogs,
};
