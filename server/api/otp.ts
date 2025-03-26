import config from "../config/config";
import axios from "axios";
import { FastifyRequest, FastifyReply } from "fastify";
import moment from 'moment-timezone';
import { errorResponse } from "../utils/logic";

const environment = process.env.NODE_ENV;
const M360_APP_KEY = config[environment].m360_app_key;
const M360_SECRET = config[environment].m360_secret;
const M360_BASE_URL = config[environment].m360_base_url;

export default class OTP {

  async sendMsg(mobile:any, otp:any, reply:any) {
    try {
      // Set this msg on database
      const msg = `Ang iyong KARERA.LIVE OTP code ay ${otp}. This code will expire in 5 minutes. Please do not share it with anyone.`

      const payload = {
        app_key:  M360_APP_KEY, // save/get to env
        app_secret: M360_SECRET, // save/get to env
        msisdn: mobile,
        content: msg,
        shortcode_mask: "Karera.Live",
        is_intl: false,
      };

      const response = await axios.post(`${M360_BASE_URL}/v3/api/broadcast`, payload);

      if(!response.data){
        const msgErr =
        "Sending OTP Error!";
        return errorResponse(msgErr, reply, "custom");
      }else{
        return response.data
      }
  
    } catch (error) {
      const msgErr = `Error Twilio: ${error}`;
      console.error(msgErr)
      return errorResponse(msgErr, reply, "custom");
    }
  }

  // Now `generateRandomDigit` is inside the class
  
}

function generateRandomDigit(count: number) {  
  let randomString = '';
  for (let i = 0; i < count; i++) {
    randomString += Math.floor(Math.random() * 10).toString();
  }
  return randomString;
}
interface SendMsg {
  mobile_number?: any;
}
