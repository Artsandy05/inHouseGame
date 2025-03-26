const options = {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "full",
    deepLinking: false,
  },
  uiHooks: {
    // @ts-ignore
    onRequest: function (request, reply, next) {
      next();
    },
    // @ts-ignore
    preHandler: function (request, reply, next) {
      next();
    },
  },
  staticCSP: true,
  // @ts-ignore
  transformStaticCSP: (header) => header,
  // @ts-ignore
  transformSpecification: (swaggerObject, request, reply) => {
    return swaggerObject;
  },
  transformSpecificationClone: true,
};

export { options };
