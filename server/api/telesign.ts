import config from "../config/config";
const TeleSignSDK = require('telesignsdk');

const environment = process.env.NODE_ENV;
const TELESIGN_CUSTOMER_ID = config[environment].telesign_customer_id;
const TELESIGN_KEY_ID = config[environment].telesign_key_id;
const TELESIGN_API_KEY = config[environment].telesign_api_key;

async function sendSMS(number:any, otp) {
    const client = new TeleSignSDK(TELESIGN_CUSTOMER_ID, TELESIGN_API_KEY);
    const messageType = "ARN";
    const msg = `Ang iyong KARERA.LIVE OTP code ay ${otp}. This code will expire in 5 minutes. Please do not share it with anyone.`
    try {
        client.sms.message(smsCallback, number, msg, messageType);
    } catch (error) {
      console.error("Error Telesign:",error.message)
    }
}

function smsCallback(error, responseBody) {
    if (error === null) {
        console.log("\nResponse body:\n" + JSON.stringify(responseBody));
    } else {
        console.error("Unable to send SMS. Error:\n\n" + error);
    }
}

export default {
    sendSMS,
};
