import schema from "../schema/transactions";
import controllers from "../controller/transactions";

function transactionsRoutes(fastify) {
  fastify.get("/transactions", {
    schema: schema.getTransactions,
    handler: controllers.getTransactions,
  });
  fastify.get("/transactions/all", {
    schema: schema.getAllTransactions,
    handler: controllers.getAllTransactions ,
  });
  fastify.get("/transactions/merchant-transactions", {
    schema: schema.getMerchantTransactions,
    handler: controllers.getMerchantTransactions,
  });
  fastify.get("/transactions/merchant-transactions/all", {
    schema: schema.getAllMerchantTransactions,
    handler: controllers.getAllMerchantTransactions ,
  });
  fastify.get("/transactions/gross-gaming-revenues", {
    schema: schema.getGrossGamingRevenues,
    handler: controllers.getGrossGamingRevenues,
  });
  fastify.get("/transactions/gross-gaming-revenues/v1", {
    schema: schema.getGrossGamingRevenuesV1,
    handler: controllers.getGrossGamingRevenuesV1,
  });
  
}

export default transactionsRoutes;
