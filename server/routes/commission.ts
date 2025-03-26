import schema from "../schema/commission";
import controllers from "../controller/commission";

function commissionRoutes(fastify) {
  fastify.get("/commission/transactions", {
    schema: schema.getCommissionTransactions,
    handler: controllers.getCommissionTransactions,
  });
}

export default commissionRoutes;
