import { hasValue } from "../../common/gameutils";
import { Main } from "../src/inhouseWebsocketAPIMultiplayer/horse_race/horseRaceMain";

import WebSocket from 'ws';
import createEncryptor from "../utils/createEncryptor";
import User from "../models/User";
import Wallet from "../models/Wallet";
import axios from "axios";
const wss = new WebSocket.Server({ noServer: true });

const PING_INTERVAL = 10000;
let pingIntervalId: NodeJS.Timeout | null = null;
const clients: Set<WebSocket> = new Set();

interface UserInfo {
  id: number;                
  firstName: string; 
  lastName: string; 
  balance: number;
  mobile: any;
  uuid: string;
  email: string;
  role:string;
}

let main = Main.getInstance();
main.game.run();
const encryptor = createEncryptor(process.env.ENCRYPTION_SECRET);

function horseRaceRoutes(fastify) {
  
  fastify.server.on('upgrade', async (request, socket, head) => {
    const url = new URL(request.url, 'http://localhost');
    const path = url.pathname;
    
    if (path === '/api/horse-race') {
      try {
        const queryParams = url.searchParams;
        const encryptedUserInfo = queryParams.get('userInfo');

        if (hasValue(encryptedUserInfo)) {
          const decrypted = encryptor.decryptParams(encryptedUserInfo);
          const userData: UserInfo = decrypted;

          const userDataTransformed = {
            id: userData && userData.id,
            firstName: userData.firstName,
            lastName: userData.lastName,
            mobile: userData.mobile,
            email: userData.email,
            role: userData.role, 
            isActive: false,
            status: 'active',
            isMobileVerified: true,
            actionStatus: 'approved'
          };
      
          const [user, created] = await User.findOrCreate({
              where: { id: userDataTransformed.id },
              defaults: userDataTransformed
          });

          if (!created) {
              await user.update(userDataTransformed);
          }

          await Wallet.findOrCreateByUserId(user.id, Number(userData.balance));
          
          wss.handleUpgrade(request, socket, head, async (ws) => {
            (ws as any).userData = userData;
            wss.emit('connection', ws);
          });
        }
      } catch (err) {
        console.error('JWT token verification failed:', err.message);
        socket.destroy();
      }
    }
  });
  
  wss.on('connection', async (socket:WebSocket) => {
    const userData = (socket as any).userData;
    clients.add(socket);
    await main.load(socket, userData);
    const isTesting = process.env.IS_TESTING;
    if (isTesting === 'false'){
        try {
          const callbackData = {
              player_id: userData.id,
              action: 'get-balance',
          };

          const callbackResponse = await axios.post(process.env.KINGFISHER_API, callbackData);
          const reponseData = JSON.stringify({
            latestBalance: callbackResponse.data.credit,
          });
      
          socket.send(reponseData);

          console.log('Callback successful:', callbackResponse.data.credit);
      } catch (callbackError) {
          console.error('Error in API callback:', callbackError);
      }
    }
  });  

  startPingInterval();

  // Function to extract token from URL query parameters
  function extractTokenFromURL(url) {
      const urlParts = url.split('?');
      if (urlParts.length > 1) {
          const queryParams = new URLSearchParams(urlParts[1]);
          return queryParams.get('token');
      }
      return null;
  }

  const verifyToken = async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      console.error('Token verification failed:', err.message);
      reply.code(401).send({ error: 'Token is invalid' });
    }
  };

  function startPingInterval() {
    pingIntervalId = setInterval(() => {
      const pingMessage = JSON.stringify({
        event: 'websocketPinging',
        data: {
          message: 'Ping'
        }
      });
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) { 
          client.send(pingMessage);
        }
      });
    }, PING_INTERVAL);
  }
  
  function stopPingInterval() {
    if (pingIntervalId) {
      clearInterval(pingIntervalId);
      pingIntervalId = null;
      console.log('Stopped websocket pinging.');
    }
  }

  process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing WebSocket server.');
    stopPingInterval();
  });
  
  process.on('SIGTERM', async () => {
    console.log('SIGINT signal received: closing WebSocket server.');
    stopPingInterval();
  });
}

export default horseRaceRoutes;

