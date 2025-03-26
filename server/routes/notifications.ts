import schema from "../schema/notifications";
import controllers from "../controller/notifications";

function notificationRoutes(fastify) {
  fastify.get("/notifications", {
    schema: schema.getNotifications,
    handler: controllers.getNotifications,
  });
  fastify.get("/notifications/custom", {
    schema: schema.getNotificationsCustom,
    handler: controllers.getNotificationsCustom,
  });
  fastify.put("/notifications/read/:id", {
    schema: schema.readNotification,
    handler: controllers.readNotification,
  });
  fastify.post("/notifications/commission/approve", {
    schema: schema.approveNotificationCommission,
    handler: controllers.approveNotificationCommission,
  });
  fastify.post("/notifications/commission/decline", {
    schema: schema.declineNotificationCommission,
    handler: controllers.declineNotificationCommission,
  });
}

export default notificationRoutes;
