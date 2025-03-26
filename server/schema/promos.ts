const getPromos = {
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
                default: "The promo is successfuly fetch!",
            },
            },
        },
    },
  }

  const getVouchers = {
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
                default: "The voucher is successfuly fetch!",
            },
            },
        },
    },
  }

  const claimPromo = {
    body: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" }, // Define id as a UUID string
        promoId: { type: "integer" },
      },
      required: ["id","promoId"],
    },
    response: {
      200: {
        type: "object",
        properties: {
          status: { type: "string", default: "API_SUCCESS" },
          data: { type: "object", default: {} },
          message: { type: "string", default: "Promo claimed successfully!" },
        },
      },
    },
  };

  const claimVoucher = {
    body: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" }, // Define id as a UUID string
        promoId: { type: "integer" },
      },
      required: ["id","promoId"],
    },
    response: {
      200: {
        type: "object",
        properties: {
          status: { type: "string", default: "API_SUCCESS" },
          data: { type: "object", default: {} },
          message: { type: "string", default: "Voucher claimed successfully!" },
        },
      },
    },
  }
  
  
  export default {
    getPromos,
    getVouchers,
    claimPromo,
    claimVoucher
  };
  