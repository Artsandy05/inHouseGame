import schema from "../schema/promos";
import controllers from "../controller/promos";

function promosRoutes(fastify) {
  fastify.get("/promos", {
    schema: schema.getPromos,
    handler: controllers.getPromos,
  });

  fastify.get("/promos/vouchers", {
    schema: schema.getVouchers,
    handler: controllers.getVouchers,
  });
  
  fastify.post("/promos/claimPromo", {
    schema: schema.claimPromo,
    handler: controllers.claimPromo,
  });

  fastify.post("/promos/claimVoucher", {
    schema: schema.claimVoucher,
    handler: controllers.claimVoucher,
  });
}

export default promosRoutes;
