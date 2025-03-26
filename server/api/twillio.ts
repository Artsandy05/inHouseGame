import config from "../config/config";
import { errorResponse } from "../utils/logic";

const environment = process.env.NODE_ENV;
const TWILIO_ACCOUNT_SID = config[environment].twilio_account_sid;
const TWILIO_AUTH_TOKEN = config[environment].twilio_auth_token;
const TWILIO_SERVICE_SID = config[environment].twilio_service_sid;


async function sendSMS(number:any, reply:any) {
    const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    try {
        const verification = await client.verify.v2
            .services(TWILIO_SERVICE_SID)
            .verifications.create({
                channel: "sms",
                to: number,
        });
      
      if(!verification){
        const msgErr = "Error on sending OTP";
        return errorResponse(msgErr, reply, "custom");
      }else{
        return verification;
      }
    } catch (error) {
      const msgErr = `Error Twilio: ${error.message}`;
      console.error(msgErr)
      return errorResponse(msgErr, reply, "custom");
    }
}

async function verificationCheck(otp:any, number:any, reply:any) {
    const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    try {
      const verification = await client.verify.v2
        .services(TWILIO_SERVICE_SID)
        .verificationChecks.create({
            code: otp,
            to: number,
      });
      
      if(verification){
          if(!verification.valid){
            const msgErr = "Invalid OTP";
            return errorResponse(msgErr, reply, "custom");
          }else{
            return verification;
          }
      }else{
          const msgErr = "OTP expired";
          return errorResponse(msgErr, reply, "custom");
      }

    } catch (error) {
      const msgErr = `Error Twilio: ${error.message}`;
      console.error(msgErr)
      return errorResponse(msgErr, reply, "custom");
    }
}

export default {
    sendSMS,
    verificationCheck
};
