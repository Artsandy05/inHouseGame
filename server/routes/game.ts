import { hasValue } from "../../common/gameutils";
import { Main } from "../src/main";

import WebSocket from 'ws';
const wss = new WebSocket.Server({ noServer: true });

const PING_INTERVAL = 10000;
let pingIntervalId: NodeJS.Timeout | null = null;
const clients: Set<WebSocket> = new Set();

let main = Main.getInstance();
main.game.run();

function gameRoutes(fastify) {
  
  fastify.server.on('upgrade', async (request, socket, head) => {
    const url = new URL(request.url, 'http://localhost');
    const path = url.pathname;
    
    
    if (path === '/api/websocket') {
      const token = extractTokenFromURL(request.url);
      let userData = null;

      try {
        const queryParams = url.searchParams;
        
        const userInfo = JSON.parse(queryParams.get('userInfo'))
        const uuid = userInfo?.uuid;

        if (hasValue(uuid)) {  // Test mode, bypassing validation to make it easier to test
          userData = { uuid: uuid, userInfo };
        } else {
          if (hasValue(token)) {
            userData = await fastify.jwt.verify(token);
          } else {
            console.log("No uuid nor token")
          }
        }
        
        wss.handleUpgrade(request, socket, head, async (ws) => {
          wss.emit('connection', ws, userData);
        });
      } catch (err) {
        console.error('JWT token verification failed:', err.message);
        socket.destroy();
      }
    }
  });
  
  wss.on('connection', async (socket, userData) => {
    clients.add(socket);

    await main.load(socket, userData);
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

export default gameRoutes;

