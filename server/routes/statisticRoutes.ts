import schema from "../schema/chatSupport";
import controllers from "../controller/chatSupport";

function statisticRoutes(fastify) {
    fastify.get("/get-transaction-statistics", {
      schema: schema.getTransactionStatistics,
      handler: controllers.getTransactionStatistics2,
    });
    fastify.get("/transactions/statistics", {
      schema: schema.getTransactionStatistics,
      handler: controllers.getTransactionStatistics,
    });

    // fastify.get("/get-badge-by-user-id", {
    //   schema: schema.getBadgeByUserId,
    //   handler: controllers.getBadgeByUserId,
    // });
  }
  
  export default statisticRoutes;
  
