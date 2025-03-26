import schema from "../schema/logs";
import controllers from "../controller/logs";

function userRoutes(fastify) {
  fastify.get("/logs", {
    schema: schema.getAllLogs,
    handler: controllers.getAllLogs,
  });
}

export default userRoutes;
