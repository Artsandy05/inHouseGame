import axios from "axios";
import config from "../config/config";
const environment = process.env.NODE_ENV;
const STASHER_URL = config[environment].stasher_url;
const STASHER_TOKEN = config[environment].stasher_token;
const STASHER_SECRET = config[environment].stasher_secret;

async function initializeStasher(fastify) {
  fastify.decorateRequest("stasher", null);

  const isApiAvailable = await checkApiAvailability();
  if (isApiAvailable) {
    const authInfo = await loginStasherAccount();
    fastify.addHook("onRequest", async (request) => {
      request.stasher = { token: authInfo?.token || null };
    });
  }
}

async function checkApiAvailability() {
  try {
    const response = await axios.get(`${STASHER_URL}/api/availability`);
    return response.status === 200; // Check if the API returns a successful response
  } catch (error) {
    console.error("API is not accessible:", error.message);
    return false;
  }
}

async function loginStasherAccount() {
  try {
    const payload = {
      clientToken: STASHER_TOKEN,
      clientSecret: STASHER_SECRET,
    };
    const response = await axios.post(`${STASHER_URL}/api/auth`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error login account:", error.message);
    throw error;
  }
}

async function createStasherAccount(request, accountData: any) {
  const stasherToken = request.stasher.token;
  try {
    const response = await axios.post(
      `${STASHER_URL}/api/accounts`,
      accountData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${stasherToken}`, // Attach the token as a Bearer token
        },
      }
    );
    // console.log("Error creating account:", response.data);
    return response.data.data;
  } catch (error) {
    console.error("Error creating account:", error.message);
    throw error;
  }
}

async function depositStasherAccount(request, depositData: any) {
  const stasherToken = request.stasher.token;
  try {
    const response = await axios.post(
      `${STASHER_URL}/api/deposit`,
      depositData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${stasherToken}`, // Attach the token as a Bearer token
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("Error deposit account:", error.message);
    throw error;
  }
}

async function withdrawStasherAccount(request, depositData: any) {
  const stasherToken = request.stasher.token;
  try {
    const response = await axios.post(
      `${STASHER_URL}/api/withdraw`,
      depositData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${stasherToken}`, // Attach the token as a Bearer token
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("Error withdraw account:", error.message);
    throw error;
  }
}

async function getTransactionsStasherAccount(request, filter: any) {
  const stasherToken = request.stasher.token;
  const { id, ...rest } = filter;
  try {
    const response = await axios.get(
      `${STASHER_URL}/api/transactions/account/${id}`,
      {
        params: {
          page: rest.page,
          limit: rest.size,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${stasherToken}`, // Attach the token as a Bearer token
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error withdraw account:", error.message);
    throw error;
  }
}

export default {
  initializeStasher,
  checkApiAvailability,
  loginStasherAccount,
  createStasherAccount,
  depositStasherAccount,
  withdrawStasherAccount,
  getTransactionsStasherAccount,
};
