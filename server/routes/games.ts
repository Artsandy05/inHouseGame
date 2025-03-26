import schema from "../schema/games";
import controllers from "../controller/games";

async function gamesRoutes(fastify) {
  fastify.get("/games", {
    schema: schema.getGames,
    handler: controllers.getGames,
  });

  fastify.post("/transaction/callback", {
    handler: controllers.getTransactionCallback,
  });
}

export default gamesRoutes;
