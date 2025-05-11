import User from "../models/User";
import Session from "../models/Session";
import userRoutes from "./user";
import logsRoutes from "./logs";
import batobatopikRoutes from "./batobatopikRoutes";
import karakrusRoutes from "./karakrusRoutes";
import horseRaceRoutes from "./horseRaceRoutes";
import boatRaceRoutes from "./boatRaceRoutes";
import notificationRoutes from "./notifications";
import addressRoutes from "./address";
import referralsRoutes from "./referrals";
import transactionsRoutes from "./transactions";
import gamesAuthRoutes from "./gamesAuth";
import goldenGoose from "../src/inhouseWebsocketAPISinglePlayer/goldenGoose";
import chatSupportRoutes from "./chatSupport";
import commissionRoutes from "./commission";
import promosRoutes from "./promos";
import Setting from "../models/Setting";

async function protectedRoutes(fastify: any) {
  fastify.decorateRequest("token", null);
  fastify.decorateRequest('clientIP', null);
  fastify.addHook("onRequest", async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });
  // Error handler (optional)
  // fastify.setErrorHandler((error, request, reply) => {
  //   fastify.log.error(error);
  //   reply.status(500).send({ message: 'Internal Server Error' });
  // });

  fastify.addHook("onRequest", async (request: any, reply: any) => {
    const uuid = request.user.uuid;

    // Get the client IP from the X-Forwarded-For header or fallback to the default IP
    request.clientIP = request.headers['x-forwarded-for']?.split(',')[0].trim() || request.ip;

    const authHeader = request.headers['authorization'];
    const token = authHeader.split(' ')[1];
   
    try {
      const user = await User.findOne({
        where: { uuid },
      });

      const settings = await Setting.findOne({ where:{ id:1 }});
  
      if (settings.isMaintenance) {
        if(!user?.isTester){
          reply.code(401).send({ message: 'Unauthorized' });
        }
      }
      
      const session = await Session.findOne({
        where: { userId:user.id },
        order: [['createdAt', 'DESC']],
      });
      
      if(session.token !== token){
        reply.code(401).send({ message: 'Unauthorized' });
      }

      const { role, id } = user;
      request.token = token
      request.user.id = id;
      request.userRole = role;


    } catch (err) {
      reply.code(401).send({ message: 'Unauthorized' });
    }
  });

  userRoutes(fastify);
  logsRoutes(fastify);
  notificationRoutes(fastify);
  addressRoutes(fastify);
  batobatopikRoutes(fastify);
  karakrusRoutes(fastify);
  horseRaceRoutes(fastify);
  boatRaceRoutes(fastify);
  goldenGoose(fastify);
  chatSupportRoutes(fastify);
  gamesAuthRoutes(fastify);
  referralsRoutes(fastify);
  commissionRoutes(fastify)
  transactionsRoutes(fastify);
  promosRoutes(fastify)
}

export default protectedRoutes;
