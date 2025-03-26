import schema from "../schema/games";
import controllers from "../controller/games";

async function gamesAuthRoutes(fastify) {
  fastify.post("/game/deposit", {
    schema: schema.addGameDeposit,
    handler: controllers.addGameDeposit,
  });

  fastify.post("/game/transactions/status", {
    schema: schema.getGameTransactionStatus,
    handler: controllers.getGameTransactionStatus,
  });

  fastify.post("/game/withdraw", {
    schema: schema.addGameWithdraw,
    handler: controllers.addGameWithdraw,
  });

  fastify.post("/game/deductCredits", {
    schema: schema.deductCredits,
    handler: controllers.deductCredits,
  });

  fastify.post("/game/sendCredits", {
    schema: schema.sendCredits,
    handler: controllers.sendCredits,
  });

  fastify.get("/game/transactions", {
    schema: schema.getGameTransactions,
    handler: controllers.getGameTransactions,
  });

  fastify.get("/game/offering", {
    schema: schema.getGameOffering,
    handler: controllers.getGameOffering,
  });
  
  fastify.put("/game/offering/:id", {
    schema: schema.updateGameOffering,
    handler: controllers.updateGameOffering,
  });
}

export default gamesAuthRoutes;
