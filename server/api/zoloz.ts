import config from "../config/config";
const moment = require('moment');
const crypto = require('crypto');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const LOCAL = "local";


const aes_encrypt = (plain_text, aes_key) => {
    const cipher = crypto.createCipheriv('aes-128-ecb', Buffer.from(aes_key), null);
    const encrypted = Buffer.concat([cipher.update(plain_text), cipher.final()]);

    return encrypted.toString('base64');
}

const aes_decrypt = (cipher_text, aes_key) => {
    const decipher = crypto.createDecipheriv('aes-128-ecb', Buffer.from(aes_key), null);
    const decrpyted = Buffer.concat([decipher.update(cipher_text, 'base64'), decipher.final()]);
    return decrpyted.toString();
}

const rsa_encrypt = (plain_text, rsa_pub_key) => {
    return crypto.publicEncrypt(
        {
            key: rsa_pub_key,
            padding: crypto.constants.RSA_PKCS1_PADDING
        },
        Buffer.from(plain_text)
    ).toString('base64');
}

/**
 * 
 * @param {string} api - Api name, e.g. v1.zoloz.realid.initialize
 * @param {string} payload - JSON String of request data
 * @param {function} callback - 
 */
async function post(api:string, payload:any) {
    const environment = process.env.NODE_ENV || LOCAL;

    // Define the directory where the key files are stored
    const storage = `${environment !== LOCAL ? "./dist/server" : "."}`;

    // ZOLOZ configuration
    const zolozBaseUrl = config[environment].zoloz_base_url;
    const zolozClientId = config[environment].zoloz_client_id;

    // Use the 'storage' path to read the .pem files
    const merchantPrivateKey = fs.readFileSync(path.resolve(storage, 'merchant_private_key.pem'), 'utf8');
    const zolozPublicKey = fs.readFileSync(path.resolve(storage, 'zoloz_public_key.pem'), 'utf8');


    // Optionally, check if the files exist before reading them (for better error handling)
    if (!fs.existsSync(path.resolve(storage, 'merchant_private_key.pem')) || !fs.existsSync(path.resolve(storage, 'zoloz_public_key.pem'))) {
        throw new Error("Private or public key files are missing!");
    }

    let request_time = moment().format('yyyy-MM-DDTHH:mm:ssZ');
    
    if (request_time.charAt(request_time.length - 3) == ":") {
        request_time = request_time.replace(/:([^:]*)$/, '$1');
    }

    let aes_key = crypto.randomBytes(16);
    let encrypted_aes_key = rsa_encrypt(aes_key, zolozPublicKey);
    let encrypted_payload = aes_encrypt(payload, aes_key);

    let message = 'POST /api/' + api.replace(/\./g, '/') + '\n' + zolozClientId + '.' + request_time + '.' + encrypted_payload;
    let signature = crypto.sign('sha256WithRSAEncryption', Buffer.from(message), merchantPrivateKey).toString('base64');
    
    try {
        const res = await axios({
            method: 'post',
            url: zolozBaseUrl + '/api/' + api.replace(/\./g, '/'),
            data: encrypted_payload,
            timeout: 2000,
            responseType: 'text',
            headers: {
                'Content-Type': 'text/plain; charset=UTF-8',
                'Client-Id': zolozClientId,
                'Request-Time': request_time,
                'Signature': 'algorithm=RSA256, signature=' + encodeURIComponent(signature) + ', keyVersion=',
                'Encrypt': 'algorithm=RSA_AES, symmetricKey=' + encodeURIComponent(encrypted_aes_key) + ', keyVersion='
            }
        })

        // Validate the response signature
        const response_signature = res.headers['signature']?.replace(/ /g, '').split("nature=")[1];
        if (!response_signature) {
            throw new Error('Missing signature in response headers');
        }

        const data_message = "POST /api/" + api.replace(/\./g, '/') + "\n" + zolozClientId + "." + res.headers['response-time'] + "." + res.data;
        const valid = crypto.verify('sha256WithRSAEncryption', Buffer.from(data_message), zolozPublicKey, Buffer.from(decodeURIComponent(response_signature), 'base64'));

        if (valid) {
            return JSON.parse(aes_decrypt(res.data, aes_key));
        } else {
            throw new Error("Response signature is invalid");
        }
    } catch (error) {
        console.error("Error during API request:", error.message);
        return { error: error.message };
    }
}

async function initialize(request) {
    try {
        const result = await post("v1.zoloz.realid.initialize", JSON.stringify(request));
        // console.log("API Response:", result);
        return result;
    } catch (error) {
        console.error("Error in initialization:", error.message);
        return { error: error.message };
    }
}

async function checkResult(request) {
    try {
        const result = await post("v1.zoloz.realid.checkresult", JSON.stringify(request));
        // console.log("API Response:", result);
        return result;
    } catch (error) {
        console.error("Error in initialization:", error.message);
        return { error: error.message };
    }
}

export default {
    initialize,
    checkResult
};