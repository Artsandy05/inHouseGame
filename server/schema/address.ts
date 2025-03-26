const getAllProvincesOptions = {
  response: {
    200: {
      type: "object",
      properties: {
        message: {
          type: "string",
          default: "Provinces options fetch successfully!",
        },
      },
    },
  },
};

const getAllCitiesOptions = {
  querystring: {
    type: "object",
    properties: {
      provinceId: {
        anyOf: [{ type: "integer" }, { type: "null" }, { type: undefined }],
      },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        message: {
          type: "string",
          default: "Cities options fetch successfully!",
        },
      },
    },
  },
};

const getAllBarangaysOptions = {
  querystring: {
    type: "object",
    properties: {
      provinceId: {
        anyOf: [{ type: "integer" }, { type: "null" }, { type: undefined }],
      },
      cityId: {
        anyOf: [{ type: "integer" }, { type: "null" }, { type: undefined }],
      },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        message: {
          type: "string",
          default: "Barangays options fetch successfully!",
        },
      },
    },
  },
};

export default {
  getAllProvincesOptions,
  getAllCitiesOptions,
  getAllBarangaysOptions,
};
