import WebSocket from 'ws';
import { hasValue } from '../../../common/gameutils';
import User from '../../models/User';
import GoldenGoosePrize from '../../models/GoldenGoosePrize';
import GoldenGooseRound from '../../models/GoldenGooseRound';
import GoldenGooseJackpotLog from '../../models/GoldenGooseJackpotLog';
import { JACKPOT_CONFIG } from '../../config/goldenGoose/jackpot_config';
import sequelize from "../../config/database";
import GameList from '../../models/GameList';
import createEncryptor from '../../utils/createEncryptor';
import GoldenGooseTransaction from '../../models/GoldenGooseTransaction';
import { UUIDV4 } from 'sequelize';
import { randomBytes } from 'crypto';
import axios from 'axios';
const { Mutex } = require('async-mutex');
const mutex = new Mutex();

const fs = require('fs');
const path = require('path');

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


type ResponseData = {
  event: string;
  data: any[];
  id: any;
  luckyPlayer?: string;  // Optional property
  jackpotPrize?: number; // Optional property
  jackpotType?: string;  // Optional property
  currentPrizePool: any;
  updatedCredit: any;
};

const wss = new WebSocket.Server({ noServer: true });
const clients: Set<WebSocket> = new Set();
const encryptor = createEncryptor(process.env.ENCRYPTION_SECRET);

const PING_INTERVAL = 10000;
let pingIntervalId: NodeJS.Timeout | null = null;

function karakrusModerator(fastify) {
  fastify.register(require("@fastify/static"), {
    root: path.join(__dirname, "src/live_chat"), // Path to your chatImages folder
    prefix: `${process.env.PREFIX}/imgs`,  // The prefix for frontend access
  });
  
  fastify.server.on('upgrade', async (request, socket, head) => {
    const url = new URL(request.url, 'http://localhost');
    const path = url.pathname;
    
    if (path === '/api/karakrus-moderator') {
      try {
        const queryParams = url.searchParams;
        const encryptedUserInfo = queryParams.get('userInfo');
        if (hasValue(encryptedUserInfo)) {
          const decrypted = encryptor.decryptParams(encryptedUserInfo);
          const userData: UserInfo = decrypted;
          wss.handleUpgrade(request, socket, head, async (ws) => {
            wss.emit('connection', ws, userData);
          });
        }
        
      } catch (err) {
        console.error('JWT token verification failed:', err.message);
        socket.destroy();
      }
    }
  });
  
  wss.on('connection', async (socket: WebSocket, userData: UserInfo ) => {
    console.log(`User connected: ${JSON.stringify(userData.firstName)} with ID ${JSON.stringify(userData.id)}`);
    
    clients.add(socket);

    socket.on('message', async (message) => {
      
      const data = JSON.parse(message.toString());
      console.log(data)
      // if (data.event === 'sendKaraKrusCoinResult') {
      //   const coinResultData = data.data;
      //   console.log(coinResultData);
      //   const coinResultResponseData = {
      //     event: 'receiveCoinResult',
      //     data: coinResultData.karakrusResult
      //   };
  
      //   // Broadcast to all clients
      //   const response = JSON.stringify(coinResultResponseData);
      //   clients.forEach(client => {
      //       if (client.readyState === WebSocket.OPEN) {
      //           client.send(response);
      //       }
      //   });
      // }
    });

    socket.on('close', async (code, reason) => {
      console.log(`User disconnected with code: ${code} and reason: ${reason}`);
      clients.delete(socket);
    });
    
  });

  startPingInterval();

  



  
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


export default karakrusModerator;
