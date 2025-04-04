import fastifyCors from "@fastify/cors";
import authRoutes from "./routes/auth";
import protectedRoutes from "./routes/protected";
import { options } from "./config/swagger-config";
import { Main } from "./src/main";
import auditRoutes from "./routes/auditRoutes";
import publicRoutes from "./routes/public";
import { startCronJob } from './utils/cronjobs'; // Import the cron job logic
import inHouseGames from "./routes/inHouseGames";
import { JWT } from "@fastify/jwt";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: any;
  }
  interface FastifyRequest {
    jwt: JWT;
    authenticate: any;
  }
}



const fastifySession = require("@fastify/session");
const fastifyCookie = require("@fastify/cookie");
const path = require("node:path");
const fastifyJwt = require("@fastify/jwt");
const fastifyAuth = require("@fastify/auth");
const fastifyUserAgent = require("fastify-user-agent");
const fastify = require("fastify")({
  logger: false,
  trustProxy: true  // Enable trust for proxy headers
});

fastify.register(fastifyCookie);
fastify.register(fastifySession, { secret: process.env.SECRET_SESSION_KEY });
fastify.register(fastifyUserAgent);
fastify.register(fastifyJwt, { secret: process.env.SECRET_KEY });
fastify.register(fastifyAuth);
fastify.register(require("@fastify/swagger"), {});
fastify.register(require("@fastify/swagger-ui"), options);
const multipart = require("@fastify/multipart");
fastify.register(multipart);

fastify.register(fastifyCors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-API-Key", "Referrer-Policy"],
  exposedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  preflightContinue: false, 
  optionsSuccessStatus: 204
});

fastify.addHook("onRequest", async (request, reply) => {
  reply.header('Referrer-Policy', 'no-referrer-when-downgrade');
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'DENY');
  request.session.ipAddress = request.headers['x-forwarded-for']?.split(',')[0].trim() || request.ip;
  request.session.userAgent = request.userAgent;
});

fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public/uploads/images"),
  prefix: `${process.env.PREFIX}/admin/images`, 
});

startCronJob()

fastify.register(authRoutes, {
  prefix: `${process.env.PREFIX}/auth`, 
});

fastify.post('/test-token', async (req, reply) => {
  const token = fastify.jwt.sign({ client: 'kingfisher' });
  return { token };
});

fastify.register(publicRoutes, {
  prefix: `${process.env.PREFIX}/`,
});

fastify.register(protectedRoutes, {
  prefix: `${process.env.PREFIX}/admin`, 
});

fastify.get(`${process.env.PREFIX}/test`, (req, res) => {
  res.send("test");
});

fastify.register(auditRoutes, {
  prefix: `${process.env.PREFIX}/audit`, 
});

fastify.register(inHouseGames, {
  prefix: `${process.env.PREFIX}/in-house-games` 
});

// FIXME: Have a way to disable when it is in production mode
fastify.get(`${process.env.PREFIX}/restart`, (req, res) => {
  res.send("Restart Game Successful");
  Main.getInstance().restart();
  console.log("Restart Game");
});

export default fastify;
