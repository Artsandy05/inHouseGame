import schema from "../schema/games";
import controllers from "../controller/games";
import schema2 from "../schema/chatSupport";
import controllers2 from "../controller/chatSupport";

async function gamesRoutes(fastify) {
  fastify.get("/games", {
    schema: schema.getGames,
    handler: controllers.getGames,
  });

  fastify.post("/transaction/callback", {
    handler: controllers.getTransactionCallback,
  });
  fastify.get("/get-game-history", {
    schema: schema2.getGameHistory,
    handler: controllers2.getGameHistory,
  });
}

export default gamesRoutes;
