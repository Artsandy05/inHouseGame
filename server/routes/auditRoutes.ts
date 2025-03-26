
import schema from "../schema/audit";
import controllers from "../controller/audit";

async function auditRoutes(fastify: any) {
    fastify.get("/", {
        schema: schema.getAuditLogsSchema,
        handler: controllers.getAuditLogsController,
      });
  }
  
  export default auditRoutes;
  