import schema from "../schema/address";
import controllers from "../controller/address";

function addressRoutes(fastify) {
  fastify.get("/address/provinces/options", {
    schema: schema.getAllProvincesOptions,
    handler: controllers.getAllProvincesOptions,
  });
  fastify.get("/address/cities/options", {
    schema: schema.getAllCitiesOptions,
    handler: controllers.getAllCitiesOptions,
  });
  fastify.get("/address/barangays/options", {
    schema: schema.getAllBarangaysOptions,
    handler: controllers.getAllBarangaysOptions,
  });
}

export default addressRoutes;
