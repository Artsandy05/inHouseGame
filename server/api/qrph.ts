import axios from "axios";
import config from "../config/config";
const environment = process.env.NODE_ENV;
const ICOREPAY_URL = config[environment].icorepay_url;
const ICOREPAY_SECRET_KEY = config[environment].icorepay_secret_key;
const CryptoJS = require('crypto-js');
import { ApiResponse, DepositPaymentRequest, StatusPaymentRequest, WithdrawPaymentRequest } from "../config/types";

import { PRODUCTION } from "../constants";

function convertEmptyToDashDeposit(obj:any) {
    if (Array.isArray(obj)) {
        return obj.map(item => convertEmptyToDashDeposit(item)); // Recursive for arrays
    } else if (typeof obj === 'object' && obj !== null) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        result[key] = convertEmptyToDashDeposit(value); // Recursive for objects
    }
    return result;
    } else {
    // If the value is an empty string, or if the value is the literal "-", keep it as "-"
    if (obj === "" || obj === null || obj === undefined) {
        return '-';
    }
    return obj;
    }
}

async function generateDepositSignature(params: WithdrawPaymentRequest | DepositPaymentRequest) {
    const updatedRequestData = convertEmptyToDashDeposit(params);

    const sortedKeys = Object.keys(updatedRequestData).sort();
  
    // Concatenate all values into a single string
    let concatenatedString = sortedKeys.map(key => {
        const value = params[key];

        if (key === 'merchant' && value.name) {
            // Use the merchant name directly
            return value.name;
        }

        if (key === 'customer' && value) {
            // Concatenate the individual customer fields
            return [
                value.account_number,
                value.address,
                value.email,
                value.name,
                value.phone_number,
                value.remark
            ].join('');
        }

        return value; 
    }).join('');
  
    // Generate HMAC-SHA256 hash using the secret key (with crypto-js)
    const signature = CryptoJS.HmacSHA256(concatenatedString, ICOREPAY_SECRET_KEY).toString(CryptoJS.enc.Hex).toLowerCase();
    return signature;
}

async function generateStatusSignature(params: StatusPaymentRequest) {
    let concatenatedString = Object.values(params).join('');

    // console.log("BEFORE SIGNATURE CREATED REQUEST PARAM CONCATENATED:", concatenatedString)
  
    // Generate HMAC-SHA256 hash using the secret key (with crypto-js)
    const signature = CryptoJS.HmacSHA256(concatenatedString, ICOREPAY_SECRET_KEY).toString(CryptoJS.enc.Hex).toLowerCase();
    return signature;
}

async function generateWithdrawSignature(params: WithdrawPaymentRequest) {
    const updatedRequestData = convertEmptyToDashDeposit(params);

    // Sort the parameters alphabetically (ensure the order is correct)
    const sortedKeys = Object.keys(updatedRequestData).sort();
  
    // Concatenate all values into a single string, replacing empty values with a hyphen
    let concatenatedString = sortedKeys.map(key => {
        const value = params[key];

        if (key === 'customer' && value) {
            // Conditionally select the property based on environment
            const customerNameField = environment === PRODUCTION ? 'name' : 'account_customer_name';

            // Concatenate the individual customer fields manually
            return [
                value.account_number,     // customer.account_number
                value.address,            // customer.address
                value.email,              // customer.email
                value[customerNameField], // customer.name or customer.account_customer_name
                value.phone_number,       // customer.phone_number
                value.remark              // customer.remark
            ].join(''); // Join all customer fields without spaces
        }

        // For fields like 'amount', 'by_method', 'callback_url', etc., just return their values
        return value;
    }).join('');

  
    // Generate HMAC-SHA256 hash using the secret key (with crypto-js)
    const signature = CryptoJS.HmacSHA256(concatenatedString, ICOREPAY_SECRET_KEY).toString(CryptoJS.enc.Hex).toLowerCase();
    return signature;
}


async function depositQRPHAccount(depositData: any) {
    //console.log("PURE REQUEST PARAM:", depositData)
    const signature = await generateDepositSignature(depositData);
    depositData.signature = signature;

    //console.log("WITH SIGNATURE REQUEST PARAM:", depositData)

    try {
        const apiResponse: ApiResponse = await axios.post(`${ICOREPAY_URL}/pay`, depositData);
        return apiResponse
    } catch (error) {
         // Check if the error has a response object
         if (error.response) {
            // The server responded with a status other than 2xx
            console.error("Error deposit account: Status Code:", error.response.status);
            console.error("Error response data:", error.response.data);  // Error details from the response
            console.error("Error headers:", error.response.headers);   // Response headers (if needed)

            if (error.response.status === 400) {
                // You can handle 400 specifically if needed
                console.error("Bad request - Error 400:", error.response.data);
            }

        } else if (error.request) {
            // The request was made but no response was received
            console.error("No response received:", error.request);
        } else {
            // Something happened while setting up the request
            console.error("Error message:", error.message);
        }

        // Rethrow the error if you want to propagate it further
        throw error;
    }
}

async function withdrawQRPHAccount(withdrawData: any) {
    //console.log("PURE REQUEST PARAM:", withdrawData)
    const signature = await generateWithdrawSignature(withdrawData);
    withdrawData.signature = signature;

    //console.log("WITH SIGNATURE REQUEST PARAM:", withdrawData)

    try {
        const apiResponse: ApiResponse = await axios.post(`${ICOREPAY_URL}/payout`, withdrawData);
        return apiResponse
    } catch (error) {
        // Check if the error has a response object
        if (error.response) {
            // The server responded with a status other than 2xx
            console.error("Error withdraw account: Status Code:", error.response.status);
            console.error("Error response data:", error.response.data);  // Error details from the response
            console.error("Error headers:", error.response.headers);   // Response headers (if needed)

            if (error.response.status === 400) {
                // You can handle 400 specifically if needed
                console.error("Bad request - Error 400:", error.response.data);
            }

        } else if (error.request) {
            // The request was made but no response was received
            console.error("No response received:", error.request);
        } else {
            // Something happened while setting up the request
            console.error("Error message:", error.message);
        }

        // Rethrow the error if you want to propagate it further
        throw error;
    }
}

async function statusQRPHAccount(statusData: any) {
// console.log("PURE REQUEST PARAM:", statusData)
  const signature = await generateStatusSignature(statusData);
  statusData.signature = signature;

// console.log("WITH SIGNATURE REQUEST PARAM:", statusData)
  
  try {
      const apiResponse: ApiResponse = await axios.post(`${ICOREPAY_URL}/status`, statusData);
      return apiResponse
  } catch (error) {
      console.error("Error get status:", error.message);
      throw error;
  }
}
  
export default {
    depositQRPHAccount,
    withdrawQRPHAccount,
    statusQRPHAccount
};
