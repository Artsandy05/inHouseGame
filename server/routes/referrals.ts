import schema from "../schema/referrals";
import controllers from "../controller/referrals";

function userRoutes(fastify) {
  fastify.get("/referrals", {
    schema: schema.getAllReferrals,
    handler: controllers.getAllReferrals,
  });
  fastify.get("/referrals/player/activity", {
    schema: schema.getReferralsPlayerActivity,
    handler: controllers.getAllReferralsPlayerActivity,
  });
  fastify.get("/referrals/year-commission", {
    schema: schema.getYearCommission,
    handler: controllers.getYearCommission,
  });
  fastify.get("/referrals/get-updated-balance", {
    schema: schema.getUpdatedBalance,
    handler: controllers.getUpdatedBalance,
  });
  fastify.post("/referrals/update-commission", {
    schema: schema.updateCommission,
    handler: controllers.updateCommission,
  });
  fastify.post("/referrals/cancel-commission", {
    schema: schema.cancelCommission,
    handler: controllers.cancelCommission,
  });
  
}

export default userRoutes;
